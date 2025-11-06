/**
 * Alert Model - UPDATED for ML Predictions
 * Database schema for managing alerts, notifications, and predictive warnings
 */

const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    // Target User (who the alert is about)
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },

    // Alert Classification
    type: {
        type: String,
        enum: {
            values: [
                'medication-adherence',
                'medication-stock',
                'health-reading',
                'appointment-reminder',
                'system-notification',
                'emergency',
                'predictive-warning',
                'ml-health-risk'  // 🆕 NEW TYPE FOR ML ALERTS
            ],
            message: 'Please provide a valid alert type'
        },
        required: [true, 'Alert type is required']
    },

    severity: {
        type: String,
        enum: {
            values: ['low', 'medium', 'high', 'critical'],
            message: 'Severity must be low, medium, high, or critical'
        },
        required: [true, 'Severity is required'],
        default: 'medium'
    },

    // Alert Content
    title: {
        type: String,
        required: [true, 'Alert title is required'],
        maxLength: [100, 'Title cannot exceed 100 characters']
    },
    message: {
        type: String,
        required: [true, 'Alert message is required'],
        maxLength: [500, 'Message cannot exceed 500 characters']
    },

    // Related Data
    relatedMedicine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine'
    },
    relatedHealthRecord: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HealthRecord'
    },
    relatedAppointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },

    // 🆕 NEW ML-RELATED REFERENCE
    relatedPrediction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prediction'
    },

    // Alert Status and Management
    status: {
        type: String,
        enum: {
            values: ['pending', 'sent', 'acknowledged', 'resolved', 'dismissed'],
            message: 'Status must be pending, sent, acknowledged, resolved, or dismissed'
        },
        default: 'pending'
    },

    // Recipients (who should receive this alert)
    recipients: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['Elderly', 'Caregiver', 'Doctor'],
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
            default: 'pending'
        },
        sentAt: Date,
        readAt: Date
    }],

    // Timing and Scheduling
    scheduledFor: {
        type: Date,
        default: Date.now
    },
    expiresAt: Date,

    // 🔧 ENHANCED Predictive Analytics Data
    predictiveData: {
        riskScore: {
            type: Number,
            min: [0, 'Risk score must be between 0-100'],
            max: [100, 'Risk score must be between 0-100']
        },
        confidenceLevel: {
            type: Number,
            min: [0, 'Confidence level must be between 0-100'],
            max: [100, 'Confidence level must be between 0-100']
        },
        basedOn: [String], // e.g., ['missed-doses', 'health-trends']
        recommendation: String,

        // 🆕 NEW ML-SPECIFIC FIELDS
        riskLevel: {
            type: String,
            enum: ['Low', 'Medium', 'High']
        },
        riskFactors: [String],  // Specific health risk factors identified by ML
        modelVersion: String,   // ML model version used
        modelType: {
            type: String,
            enum: ['RandomForest', 'XGBoost', 'Manual']
        }
    },

    // Action Items
    actionRequired: {
        type: Boolean,
        default: false
    },
    suggestedActions: [String],

    // Metadata
    source: {
        type: String,
        enum: ['system', 'user', 'predictive-analytics', 'device', 'manual', 'ml-prediction'], // 🆕 Added ml-prediction
        default: 'system'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Auto-resolution
    autoResolve: {
        type: Boolean,
        default: false
    },
    resolvedAt: Date,
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolutionNotes: String
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
alertSchema.index({ userId: 1, status: 1, createdAt: -1 });
alertSchema.index({ type: 1, severity: 1 });
alertSchema.index({ scheduledFor: 1, status: 1 });
alertSchema.index({ 'recipients.userId': 1, 'recipients.status': 1 });
// 🆕 NEW INDEXES FOR ML ALERTS
alertSchema.index({ relatedPrediction: 1 });
alertSchema.index({ 'predictiveData.riskLevel': 1, createdAt: -1 });

// 🆕 NEW STATIC METHOD: Create ML Health Risk Alert
alertSchema.statics.createMLHealthRiskAlert = async function (userId, predictionId, predictionResult, healthRecordId = null) {
    const User = mongoose.model('User');

    try {
        const user = await User.findById(userId).populate('assignedCaregivers assignedDoctors');
        if (!user) throw new Error('User not found');

        // Determine severity based on ML prediction
        let severity = 'medium';
        let actionRequired = false;
        let suggestedActions = [];

        if (predictionResult.risk_level === 'High') {
            severity = 'critical';
            actionRequired = true;
            suggestedActions = [
                'Contact patient immediately',
                'Schedule urgent medical consultation',
                'Monitor vital signs closely',
                'Review medication compliance',
                'Assess need for emergency intervention'
            ];
        } else if (predictionResult.risk_level === 'Medium') {
            severity = 'high';
            actionRequired = true;
            suggestedActions = [
                'Schedule check-up within 24-48 hours',
                'Monitor health parameters',
                'Review lifestyle factors',
                'Consider preventive measures'
            ];
        } else {
            suggestedActions = [
                'Continue current health routine',
                'Maintain regular monitoring',
                'Keep up healthy lifestyle practices'
            ];
        }

        // Create recipients list
        const recipients = [];

        // Always include the patient
        recipients.push({
            userId: new mongoose.Types.ObjectId(userId),
            role: 'Elderly'
        });

        // Add caregivers for medium/high risk
        if (predictionResult.risk_level !== 'Low') {
            user.assignedCaregivers?.forEach(caregiver => {
                recipients.push({
                    userId: new mongoose.Types.ObjectId(caregiver._id),
                    role: 'Caregiver'
                });
            });

            // Add doctors for high risk
            if (predictionResult.risk_level === 'High') {
                user.assignedDoctors?.forEach(doctor => {
                    recipients.push({
                        userId: new mongoose.Types.ObjectId(doctor._id),
                        role: 'Doctor'
                    });
                });
            }
        }

        // Generate appropriate title and message
        const riskEmojis = { Low: '✅', Medium: '⚠️', High: '🚨' };
        const title = `${riskEmojis[predictionResult.risk_level]} ${predictionResult.risk_level} Health Risk Alert`;

        let message = `AI analysis indicates ${predictionResult.risk_level.toLowerCase()} health risk for ${user.name}.`;
        if (predictionResult.risk_factors && predictionResult.risk_factors.length > 0) {
            message += ` Key concerns: ${predictionResult.risk_factors.slice(0, 2).join(', ')}.`;
        }
        if (predictionResult.explanation) {
            message += ` ${predictionResult.explanation.substring(0, 200)}`;
        }

        return await this.create({
            userId: new mongoose.Types.ObjectId(userId),
            type: 'ml-health-risk',
            severity,
            title,
            message,
            relatedHealthRecord: healthRecordId ? new mongoose.Types.ObjectId(healthRecordId) : null,
            relatedPrediction: new mongoose.Types.ObjectId(predictionId),
            recipients,
            actionRequired,
            suggestedActions,
            source: 'ml-prediction',
            predictiveData: {
                riskScore: Math.round(predictionResult.confidence * 100),
                confidenceLevel: Math.round(predictionResult.confidence * 100),
                riskLevel: predictionResult.risk_level,
                riskFactors: predictionResult.risk_factors || [],
                basedOn: ['health-vitals', 'ml-analysis'],
                recommendation: predictionResult.explanation,
                modelVersion: '1.0',
                modelType: 'XGBoost'
            },
            autoResolve: predictionResult.risk_level === 'Low',
            expiresAt: predictionResult.risk_level === 'Low' ?
                new Date(Date.now() + 24 * 60 * 60 * 1000) : null // Low risk expires in 24h
        });

    } catch (error) {
        console.error('Error creating ML health risk alert:', error);
        throw error;
    }
};

// Static method to create medication adherence alert (UNCHANGED)
alertSchema.statics.createAdherenceAlert = async function (userId, medicineId, consecutiveMissed) {
    const Medicine = mongoose.model('Medicine');
    const User = mongoose.model('User');

    const [medicine, user] = await Promise.all([
        Medicine.findById(new mongoose.Types.ObjectId(medicineId)),
        User.findById(new mongoose.Types.ObjectId(userId)).populate('assignedCaregivers assignedDoctors')
    ]);

    if (!medicine || !user) throw new Error('Medicine or User not found');

    // Create recipients list
    const recipients = [];

    // Add caregivers
    user.assignedCaregivers.forEach(caregiver => {
        recipients.push({
            userId: new mongoose.Types.ObjectId(caregiver._id),
            role: 'Caregiver'
        });
    });

    // Add doctors
    user.assignedDoctors.forEach(doctor => {
        recipients.push({
            userId: new mongoose.Types.ObjectId(doctor._id),
            role: 'Doctor'
        });
    });

    return this.create({
        userId: new mongoose.Types.ObjectId(userId),
        type: 'medication-adherence',
        severity: consecutiveMissed >= 3 ? 'high' : 'medium',
        title: `Medication Adherence Alert - ${medicine.name}`,
        message: `${user.name} has missed ${consecutiveMissed} consecutive doses of ${medicine.name}. Immediate intervention may be required.`,
        relatedMedicine: new mongoose.Types.ObjectId(medicineId),
        recipients,
        actionRequired: true,
        suggestedActions: [
            'Contact patient immediately',
            'Verify medication availability',
            'Assess patient wellbeing',
            'Consider medication adjustment'
        ],
        predictiveData: {
            riskScore: Math.min(consecutiveMissed * 25, 100),
            basedOn: ['missed-doses', 'adherence-pattern'],
            recommendation: 'Immediate patient contact recommended'
        }
    });
};

// Static method to get active alerts for user/role (UNCHANGED)
alertSchema.statics.getActiveAlerts = function (userId, role = null) {
    const query = {
        $or: [
            { userId: new mongoose.Types.ObjectId(userId) },
            { 'recipients.userId': new mongoose.Types.ObjectId(userId) }
        ],
        status: { $in: ['pending', 'sent', 'acknowledged'] },
        $or: [
            { expiresAt: { $gt: new Date() } },
            { expiresAt: null }
        ]
    };

    return this.find(query)
        .populate('userId', 'name email role')
        .populate('relatedMedicine', 'name dosage')
        .populate('relatedHealthRecord')
        .populate('relatedPrediction') // 🆕 Added prediction population
        .sort({ severity: 1, createdAt: -1 });
};

// 🆕 NEW METHOD: Get ML-specific alerts
alertSchema.statics.getMLAlerts = function (userId, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.find({
        userId: new mongoose.Types.ObjectId(userId),
        type: 'ml-health-risk',
        createdAt: { $gte: startDate }
    })
        .populate('relatedPrediction')
        .populate('relatedHealthRecord')
        .sort({ createdAt: -1 });
};

// 🆕 NEW METHOD: Get high-risk alerts for dashboards
alertSchema.statics.getHighRiskAlerts = function (timeframe = 24) {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - timeframe);

    return this.find({
        'predictiveData.riskLevel': 'High',
        type: 'ml-health-risk',
        status: { $in: ['pending', 'sent', 'acknowledged'] },
        createdAt: { $gte: startTime }
    })
        .populate('userId', 'name email age')
        .populate('relatedPrediction')
        .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Alert', alertSchema);
