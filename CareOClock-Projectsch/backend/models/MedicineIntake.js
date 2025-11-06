// backend/models/MedicineIntake.js
/**
 * MedicineIntake Model
 * Database schema for tracking daily medicine intake, adherence, and streak calculation
 */

const mongoose = require('mongoose');

const medicineIntakeSchema = new mongoose.Schema({
    // User and Medicine Association
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine',
        required: [true, 'Medicine ID is required']
    },

    // Intake Information
    date: {
        type: Date,
        required: [true, 'Date is required'],
        default: Date.now
    },
    scheduledTime: {
        type: String, // Format: 'HH:MM'
        required: [true, 'Scheduled time is required']
    },
    actualTime: {
        type: Date // When actually taken
    },

    // Status Tracking
    status: {
        type: String,
        enum: {
            values: ['taken', 'missed', 'skipped', 'pending'],
            message: 'Status must be taken, missed, skipped, or pending'
        },
        required: [true, 'Status is required'],
        default: 'pending'
    },

    // Additional Details
    dosageTaken: {
        type: String, // In case different from prescribed
    },
    notes: {
        type: String,
        maxLength: [200, 'Notes cannot exceed 200 characters']
    },

    // Tracking Information
    reminderSent: {
        type: Boolean,
        default: false
    },
    reminderSentAt: Date,

    // Location and Context (optional)
    takenWith: {
        type: String,
        enum: ['food', 'water', 'empty stomach', 'other'],
        default: 'water'
    },

    // Side Effects or Reactions
    sideEffects: [String],
    reaction: {
        type: String,
        enum: ['none', 'mild', 'moderate', 'severe']
    },

    // Adherence Metrics
    isOnTime: {
        type: Boolean,
        default: true
    },
    delayMinutes: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Compound indexes for better performance
medicineIntakeSchema.index({ userId: 1, date: -1 });
medicineIntakeSchema.index({ userId: 1, medicineId: 1, date: -1 });
medicineIntakeSchema.index({ medicineId: 1, date: -1 });
medicineIntakeSchema.index({ status: 1, date: -1 });

// Virtual for date string (YYYY-MM-DD format)
medicineIntakeSchema.virtual('dateString').get(function () {
    return this.date.toISOString().split('T')[0];
});

// Static method to get adherence rate for a user
medicineIntakeSchema.statics.getAdherenceRate = async function (userId, startDate, endDate) {
    const pipeline = [
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                date: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }
        },
        {
            $group: {
                _id: null,
                totalIntakes: { $sum: 1 },
                takenIntakes: {
                    $sum: { $cond: [{ $eq: ['$status', 'taken'] }, 1, 0] }
                }
            }
        },
        {
            $project: {
                adherenceRate: {
                    $multiply: [
                        { $divide: ['$takenIntakes', '$totalIntakes'] },
                        100
                    ]
                },
                totalIntakes: 1,
                takenIntakes: 1
            }
        }
    ];

    const result = await this.aggregate(pipeline);
    return result[0] || { adherenceRate: 0, totalIntakes: 0, takenIntakes: 0 };
};

medicineIntakeSchema.statics.getDailyAdherence = async function (userId, startDate, endDate) {
    const pipeline = [
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                // Match by date within range
                date: { $gte: new Date(startDate), $lte: new Date(endDate) }
            }
        },
        {
            // Group by date string
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                totalCount: { $sum: 1 },
                takenCount: { $sum: { $cond: [{ $eq: ["$status", "taken"] }, 1, 0] } }
            }
        },
        {
            // Project date and adherence percentage
            $project: {
                date: "$_id",
                adherenceRate: { $multiply: [{ $divide: ["$takenCount", "$totalCount"] }, 100] },
                _id: 0
            }
        },
        {
            $sort: { date: 1 }
        }
    ];

    const result = await this.aggregate(pipeline);
    return result;
};

medicineIntakeSchema.statics.getDailyAdherence = async function (userId, startDate, endDate) {
    const pipeline = [
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                date: { $gte: new Date(startDate), $lte: new Date(endDate) }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                totalIntakes: { $sum: 1 },
                takenIntakes: { $sum: { $cond: [{ $eq: ['$status', 'taken'] }, 1, 0] } }
            }
        },
        {
            $project: {
                date: '$_id',
                adherenceRate: { $multiply: [{ $divide: ['$takenIntakes', '$totalIntakes'] }, 100] },
                _id: 0
            }
        },
        { $sort: { date: 1 } }
    ];

    const results = await this.aggregate(pipeline);
    return results;
};


// Static method to get streak information
medicineIntakeSchema.statics.getStreak = async function (userId, medicineId = null) {
    const matchCondition = { userId: new mongoose.Types.ObjectId(userId) };
    if (medicineId) {
        matchCondition.medicineId = new mongoose.Types.ObjectId(medicineId);
    }

    const intakes = await this.find(matchCondition)
        .sort({ date: -1 })
        .limit(100) // Last 100 days
        .select('date status');

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Group by date and check if all medicines were taken each day
    const dailyStatus = {};

    intakes.forEach(intake => {
        const dateStr = intake.date.toISOString().split('T')[0];
        if (!dailyStatus[dateStr]) {
            dailyStatus[dateStr] = { total: 0, taken: 0 };
        }
        dailyStatus[dateStr].total += 1;
        if (intake.status === 'taken') {
            dailyStatus[dateStr].taken += 1;
        }
    });

    // Calculate streaks
    const sortedDates = Object.keys(dailyStatus).sort().reverse();

    for (let i = 0; i < sortedDates.length; i++) {
        const date = sortedDates[i];
        const dayData = dailyStatus[date];

        if (dayData.taken === dayData.total && dayData.total > 0) {
            tempStreak += 1;
            if (i === 0 || currentStreak === tempStreak - 1) {
                currentStreak = tempStreak;
            }
        } else {
            tempStreak = 0;
        }

        longestStreak = Math.max(longestStreak, tempStreak);
    }

    return { currentStreak, longestStreak };
};

module.exports = mongoose.model('MedicineIntake', medicineIntakeSchema);
