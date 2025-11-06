/**
 * HealthRecord Model - UPDATED for ML Predictions with Audit Fields
 * Database schema for tracking vital signs, health metrics, and medical readings
 */

const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
    // User Association
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },

    // Record Date and Time
    date: {
        type: Date,
        required: [true, 'Date is required'],
        default: Date.now
    },
    recordTime: {
        type: String, // Format: 'HH:MM'
        default: function () {
            return new Date().toTimeString().slice(0, 5);
        }
    },

    // Vital Signs
    bloodPressure: {
        systolic: {
            type: Number,
            min: [50, 'Systolic pressure must be at least 50 mmHg'],
            max: [300, 'Systolic pressure cannot exceed 300 mmHg']
        },
        diastolic: {
            type: Number,
            min: [30, 'Diastolic pressure must be at least 30 mmHg'],
            max: [200, 'Diastolic pressure cannot exceed 200 mmHg']
        },
        unit: {
            type: String,
            default: 'mmHg'
        }
    },

    bloodSugar: {
        value: {
            type: Number,
            min: [20, 'Blood sugar must be at least 20 mg/dL'],
            max: [600, 'Blood sugar cannot exceed 600 mg/dL']
        },
        unit: {
            type: String,
            enum: ['mg/dL', 'mmol/L'],
            default: 'mg/dL'
        },
        testType: {
            type: String,
            enum: ['fasting', 'random', 'post-meal', 'bedtime', 'other'],
            default: 'random'
        }
    },

    heartRate: {
        value: {
            type: Number,
            min: [30, 'Heart rate must be at least 30 bpm'],
            max: [250, 'Heart rate cannot exceed 250 bpm']
        },
        unit: {
            type: String,
            default: 'bpm'
        }
    },

    // Additional Measurements
    weight: {
        value: {
            type: Number,
            min: [20, 'Weight must be at least 20'],
            max: [500, 'Weight cannot exceed 500']
        },
        unit: {
            type: String,
            enum: ['kg', 'lbs'],
            default: 'kg'
        }
    },

    temperature: {
        value: {
            type: Number,
            min: [90, 'Temperature must be at least 90°F'],
            max: [110, 'Temperature cannot exceed 110°F']
        },
        unit: {
            type: String,
            enum: ['F', 'C'],
            default: 'F'
        }
    },

    // NEW FIELDS FOR ML PREDICTIONS
    sleepHours: {
        value: {
            type: Number,
            min: [0, 'Sleep hours must be at least 0'],
            max: [24, 'Sleep hours cannot exceed 24']
        },
        unit: {
            type: String,
            default: 'hours'
        },
        quality: {
            type: String,
            enum: ['poor', 'fair', 'good', 'excellent'],
            default: 'fair'
        }
    },

    oxygenLevel: {
        value: {
            type: Number,
            min: [70, 'Oxygen level must be at least 70%'],
            max: [100, 'Oxygen level cannot exceed 100%']
        },
        unit: {
            type: String,
            default: '%'
        }
    },

    // ADDITIONAL ML FEATURES
    activityLevel: {
        type: Number,
        min: [1, 'Activity level must be between 1-10'],
        max: [10, 'Activity level must be between 1-10']
    },

    stressLevel: {
        type: Number,
        min: [1, 'Stress level must be between 1-10'],
        max: [10, 'Stress level must be between 1-10']
    },

    // Symptoms and Feelings
    symptoms: [String],
    moodRating: {
        type: Number,
        min: [1, 'Mood rating must be between 1-10'],
        max: [10, 'Mood rating must be between 1-10']
    },
    energyLevel: {
        type: Number,
        min: [1, 'Energy level must be between 1-10'],
        max: [10, 'Energy level must be between 1-10']
    },
    painLevel: {
        type: Number,
        min: [0, 'Pain level must be between 0-10'],
        max: [10, 'Pain level must be between 0-10']
    },

    // Notes and Comments
    notes: {
        type: String,
        maxLength: [500, 'Notes cannot exceed 500 characters']
    },

    // Data Source
    source: {
        type: String,
        enum: ['manual', 'device', 'imported', 'ml_prediction'], // Added ml_prediction
        default: 'manual'
    },

    // Alerts and Flags
    hasAbnormalReading: {
        type: Boolean,
        default: false
    },
    alertFlags: [String], // e.g., ['high-bp', 'low-sugar']

    // ML PREDICTION FIELDS
    riskAssessment: {
        level: {
            type: String,
            enum: ['Low', 'Medium', 'High']
        },
        confidence: {
            type: Number,
            min: 0,
            max: 1
        },
        factors: [String],
        lastUpdated: Date
    },

    // Medical Context
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Could be self, caregiver, or doctor
    },

    // Audit Fields for Storage & Audit
    submittedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    clientInfo: {
        userAgent: String,
        ipAddress: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
healthRecordSchema.index({ userId: 1, date: -1 });
healthRecordSchema.index({ date: -1 });
healthRecordSchema.index({ hasAbnormalReading: 1, date: -1 });
// NEW INDEXES FOR ML
healthRecordSchema.index({ userId: 1, 'riskAssessment.level': 1 });
healthRecordSchema.index({ 'riskAssessment.level': 1, date: -1 });

// Virtual for date string
healthRecordSchema.virtual('dateString').get(function () {
    return this.date.toISOString().split('T')[0];
});

// VIRTUAL FOR ML COMPATIBILITY
healthRecordSchema.virtual('mlFeatures').get(function () {
    return {
        heart_rate: this.heartRate?.value || null,
        bp_systolic: this.bloodPressure?.systolic || null,
        bp_diastolic: this.bloodPressure?.diastolic || null,
        glucose: this.bloodSugar?.value || null,
        sleep_hours: this.sleepHours?.value || null,
        temperature: this.temperature?.value || null,
        oxygen_level: this.oxygenLevel?.value || null,
        weight: this.weight?.value || null,
        activity_level: this.activityLevel || null,
        stress_level: this.stressLevel || null,
        mood_rating: this.moodRating || null,
        energy_level: this.energyLevel || null,
        pain_level: this.painLevel || null
    };
});

// VIRTUAL FOR BLOOD PRESSURE CATEGORY
healthRecordSchema.virtual('bloodPressureCategory').get(function () {
    if (!this.bloodPressure?.systolic || !this.bloodPressure?.diastolic) return 'Unknown';

    const systolic = this.bloodPressure.systolic;
    const diastolic = this.bloodPressure.diastolic;

    if (systolic >= 180 || diastolic >= 120) {
        return 'Hypertensive Crisis';
    } else if (systolic >= 140 || diastolic >= 90) {
        return 'High Blood Pressure (Stage 2)';
    } else if (systolic >= 130 || diastolic >= 80) {
        return 'High Blood Pressure (Stage 1)';
    } else if (systolic >= 120 && diastolic < 80) {
        return 'Elevated';
    } else {
        return 'Normal';
    }
});

// PRE-SAVE MIDDLEWARE TO SET ALERTS AND FLAGS
healthRecordSchema.pre('save', function (next) {
    const alerts = [];

    // Check blood pressure
    if (this.bloodPressure?.systolic && this.bloodPressure?.diastolic) {
        const systolic = this.bloodPressure.systolic;
        const diastolic = this.bloodPressure.diastolic;

        if (systolic >= 140 || diastolic >= 90) alerts.push('bp-high');
        if (systolic < 90 || diastolic < 60) alerts.push('bp-low');
    }

    // Check blood sugar
    if (this.bloodSugar?.value) {
        const value = this.bloodSugar.value;
        if (value >= 200) alerts.push('sugar-high');
        if (value < 70) alerts.push('sugar-low');
    }

    // Check heart rate
    if (this.heartRate?.value) {
        const hr = this.heartRate.value;
        if (hr > 100) alerts.push('hr-high');
        if (hr < 60) alerts.push('hr-low');
    }

    // Check oxygen level
    if (this.oxygenLevel?.value && this.oxygenLevel.value < 95) {
        alerts.push('oxygen-low');
    }

    // Check temperature
    if (this.temperature?.value) {
        const temp = this.temperature.value;
        if (temp > 100.4) alerts.push('fever');
        if (temp < 97) alerts.push('hypothermia');
    }

    // Check sleep hours
    if (this.sleepHours?.value && this.sleepHours.value < 6) {
        alerts.push('sleep-insufficient');
    }

    this.alertFlags = alerts;
    this.hasAbnormalReading = alerts.length > 0;

    next();
});

// STATIC METHOD FOR ML DATA EXTRACTION
healthRecordSchema.statics.getMLReadyData = async function (userId, limit = 100) {
    const records = await this.find({ userId })
        .sort({ date: -1 })
        .limit(limit)
        .lean();

    return records.map(record => ({
        _id: record._id,
        userId: record.userId,
        date: record.date,
        heart_rate: record.heartRate?.value,
        bp_systolic: record.bloodPressure?.systolic,
        bp_diastolic: record.bloodPressure?.diastolic,
        glucose: record.bloodSugar?.value,
        sleep_hours: record.sleepHours?.value,
        temperature: record.temperature?.value,
        oxygen_level: record.oxygenLevel?.value,
        weight: record.weight?.value,
        activity_level: record.activityLevel,
        stress_level: record.stressLevel,
        mood_rating: record.moodRating,
        energy_level: record.energyLevel,
        pain_level: record.painLevel,
        symptoms: record.symptoms,
        alertFlags: record.alertFlags
    }));
};

// STATIC METHOD FOR HEALTH TRENDS QUERY
healthRecordSchema.statics.getHealthTrends = async function (userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.find({
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate }
    }).sort({ date: 1 });
};

module.exports = mongoose.model('HealthRecord', healthRecordSchema);
