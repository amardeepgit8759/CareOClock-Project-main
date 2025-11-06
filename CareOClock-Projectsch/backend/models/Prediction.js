/**
 * CareOClock - Prediction Schema (NEW MODEL)
 * Description: Stores ML prediction results
 */

const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    healthRecordId: {  // Reference to your existing HealthRecord
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HealthRecord',
        required: true
    },
    riskLevel: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        required: true,
        index: true
    },
    confidence: {
        type: Number,
        min: 0,
        max: 1,
        required: true
    },
    probabilities: {
        Low: { type: Number, min: 0, max: 1, default: 0 },
        Medium: { type: Number, min: 0, max: 1, default: 0 },
        High: { type: Number, min: 0, max: 1, default: 0 }
    },
    riskFactors: [{
        type: String,
        maxlength: 200
    }],
    explanation: {
        type: String,
        required: true,
        maxlength: 1000
    },
    modelVersion: {
        type: String,
        required: true,
        default: '1.0'
    },
    modelType: {
        type: String,
        enum: ['RandomForest', 'XGBoost'],
        default: 'XGBoost'
    },
    alertGenerated: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for risk score (0-100 scale)
predictionSchema.virtual('riskScore').get(function () {
    switch (this.riskLevel) {
        case 'Low': return Math.round(this.confidence * 33);
        case 'Medium': return Math.round(33 + (this.confidence * 34));
        case 'High': return Math.round(67 + (this.confidence * 33));
        default: return 0;
    }
});

// Indexes for efficient queries
predictionSchema.index({ userId: 1, createdAt: -1 });
predictionSchema.index({ riskLevel: 1, createdAt: -1 });

module.exports = mongoose.model('Prediction', predictionSchema);
