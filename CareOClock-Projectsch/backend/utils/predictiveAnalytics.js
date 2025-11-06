// backend/utils/PredictiveAnalytics.js

/**
 * Predictive Analytics Utility
 * Combines rule-based and statistical analytics for medication adherence
 */
const mongoose = require('mongoose');
const moment = require('moment');
const User = require('../models/User');
const Medicine = require('../models/Medicine');
const MedicineIntake = require('../models/MedicineIntake');
const Alert = require('../models/Alert');

class PredictiveAnalytics {
    /**
     * Rule-based: Check for consecutive missed doses
     */
    static async checkConsecutiveMisses(userId) {
        const alertConditions = [];

        const recentIntakes = await MedicineIntake.find({
            userId: new mongoose.Types.ObjectId(userId),
            date: { $gte: moment().subtract(3, 'days').toDate() }
        }).populate('medicineId', 'name').sort({ date: -1 });

        const medicineGroups = {};
        recentIntakes.forEach(intake => {
            const medicineId = intake.medicineId._id.toString();
            if (!medicineGroups[medicineId]) {
                medicineGroups[medicineId] = {
                    name: intake.medicineId.name,
                    intakes: []
                };
            }
            medicineGroups[medicineId].intakes.push(intake);
        });

        for (const [medicineId, data] of Object.entries(medicineGroups)) {
            const sortedIntakes = data.intakes.sort((a, b) => new Date(b.date) - new Date(a.date));
            let consecutiveMissed = 0;
            for (const intake of sortedIntakes) {
                if (intake.status === 'missed') {
                    consecutiveMissed++;
                } else {
                    break;
                }
            }
            if (consecutiveMissed >= 2) {
                alertConditions.push({
                    type: 'consecutive-missed',
                    medicineId,
                    medicineName: data.name,
                    consecutiveDays: consecutiveMissed,
                    severity: consecutiveMissed >= 3 ? 'high' : 'medium'
                });
            }
        }
        return alertConditions;
    }

    /**
     * Statistical: Detect rising trend of missed doses (Weekly trend)
     */
    static async checkAdherenceTrend(userId) {
        // Two 7-day windows: Current week & previous week
        const today = moment();
        const startPrevWeek = moment().subtract(14, 'days').startOf('day');
        const endPrevWeek = moment().subtract(7, 'days').endOf('day');
        const startCurrWeek = moment().subtract(7, 'days').startOf('day');
        const endCurrWeek = today;

        // Group missed doses in both periods by medicine
        const [prevAgg, currAgg] = await Promise.all([
            MedicineIntake.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId), date: { $gte: startPrevWeek.toDate(), $lt: endPrevWeek.toDate() }, status: 'missed' } },
                { $group: { _id: "$medicineId", missedPrev: { $sum: 1 } } }
            ]),
            MedicineIntake.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId), date: { $gte: startCurrWeek.toDate(), $lt: endCurrWeek.toDate() }, status: 'missed' } },
                { $group: { _id: "$medicineId", missedCurr: { $sum: 1 } } }
            ]),
        ]);

        // Convert to lookup maps
        const prevMap = prevAgg.reduce((a, c) => { a[c._id.toString()] = c.missedPrev; return a; }, {});
        const currMap = currAgg.reduce((a, c) => { a[c._id.toString()] = c.missedCurr; return a; }, {});

        // Analyze trend: Alert if missed doses increase by >50% and at least 2 in this week
        const trendAlerts = [];
        for (const [medicineId, currMissed] of Object.entries(currMap)) {
            const prevMissed = prevMap[medicineId] || 0;
            if (currMissed >= 2 && prevMissed > 0 && currMissed / prevMissed > 1.5) {
                const medicine = await Medicine.findById(medicineId);
                trendAlerts.push({
                    type: 'rising-missed-trend',
                    medicineId,
                    medicineName: medicine.name,
                    missedLastWeek: currMissed,
                    missedPrevWeek: prevMissed,
                    severity: 'medium'
                });
            }
        }
        return trendAlerts;
    }

    /**
     * Unified: Check all alert conditions (rule-based + statistical)
     */
    static async checkAlertConditions(userId) {
        try {
            const consecutiveAlerts = await PredictiveAnalytics.checkConsecutiveMisses(userId);
            const trendAlerts = await PredictiveAnalytics.checkAdherenceTrend(userId);

            // No duplicates: combine all alert types
            return [...consecutiveAlerts, ...trendAlerts];
        } catch (error) {
            console.error('Alert condition check error:', error);
            throw new Error('Failed to check alert conditions');
        }
    }

    /**
     * Generate predictive alerts for all users
     */
    static async generatePredictiveAlerts() {
        try {
            console.log('Starting predictive analytics alert generation...');

            const elderlyUsers = await User.find({
                role: 'Elderly',
                isActive: true
            }).populate('assignedCaregivers assignedDoctors');

            const alertsGenerated = [];

            for (const user of elderlyUsers) {
                try {
                    const alertConditions = await PredictiveAnalytics.checkAlertConditions(user._id);

                    for (const condition of alertConditions) {
                        // Deduplication logic can be added here as needed
                        let alert;
                        if (condition.type === 'consecutive-missed') {
                            alert = await Alert.createAdherenceAlert(
                                user._id,
                                condition.medicineId,
                                condition.consecutiveDays
                            );
                        }
                        else if (condition.type === 'rising-missed-trend') {
                            alert = await Alert.create({
                                userId: user._id,
                                medicineId: condition.medicineId,
                                type: 'adherence-trend',
                                message: `Rising missed doses for ${condition.medicineName}: ${condition.missedLastWeek} this week (${condition.missedPrevWeek} last week)`,
                                severity: condition.severity,
                                date: new Date()
                            });
                        }
                        if (alert) {
                            alertsGenerated.push({
                                userId: user._id,
                                userName: user.name,
                                alertId: alert._id,
                                type: condition.type,
                                severity: condition.severity
                            });
                        }
                    }
                } catch (userError) {
                    console.error(`Error processing user ${user._id}:`, userError.message);
                }
            }
            console.log(`Generated ${alertsGenerated.length} alerts.`);
            return alertsGenerated;
        } catch (error) {
            console.error('Predictive analytics error:', error);
            throw new Error('Failed to generate predictive alerts');
        }
    }
}

module.exports = PredictiveAnalytics;
