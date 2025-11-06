const axios = require('axios');
const HealthRecord = require('../models/HealthRecord');
const Prediction = require('../models/Prediction');
const Alert = require('../models/Alert');
const User = require('../models/User');

class PredictController {
    constructor() {
        this.getPrediction = this.getPrediction.bind(this);
        this.getPredictionHistory = this.getPredictionHistory.bind(this);
        this.getHighRiskPatients = this.getHighRiskPatients.bind(this);
        this.getModelStatus = this.getModelStatus.bind(this);
    }

    generateAlertMessage(userName, predictionResult) {
        return `High risk alert for ${userName}: ${predictionResult.explanation}`;
    }

    async getPrediction(req, res) {
        try {
            const { userId } = req.params;
            const healthData = req.body;

            // Replace with actual predictive model logic or call to ML service
            const predictionResult = {
                risk_level: 'High',
                confidence: 0.87,
                risk_factors: ['High blood pressure', 'Elevated glucose'],
                explanation: 'Patient exhibits multiple risk factors. Immediate action recommended.',
                probabilities: { Low: 0.05, Medium: 0.08, High: 0.87 },
            };

            const healthRecord = new HealthRecord({
                userId,
                heartRate: { value: healthData.heart_rate },
                bloodPressure: {
                    systolic: healthData.bp_systolic,
                    diastolic: healthData.bp_diastolic,
                    unit: 'mmHg',
                },
                bloodSugar: {
                    value: healthData.glucose,
                    unit: 'mg/dL',
                    testType: 'random',
                },
                sleepHours: { value: healthData.sleep_hours, unit: 'hours' },
                temperature: { value: healthData.temperature || 98.6, unit: 'F' },
                oxygenLevel: { value: healthData.oxygen_level || 98, unit: '%' },
            });

            const savedHealthRecord = await healthRecord.save();

            const predictionRecord = new Prediction({
                userId,
                healthRecordId: savedHealthRecord._id,
                riskLevel: predictionResult.risk_level,
                confidence: predictionResult.confidence,
                riskFactors: predictionResult.risk_factors,
                explanation: predictionResult.explanation,
                probabilities: predictionResult.probabilities,
                modelVersion: '1.0',
            });

            const savedPrediction = await predictionRecord.save();

            if (predictionResult.risk_level === 'High') {
                const user = await User.findById(userId);

                const alert = new Alert({
                    userId,
                    predictionId: savedPrediction._id,
                    alertSource: 'ML_PREDICTION',
                    message: this.generateAlertMessage(user?.name || 'User', predictionResult),
                    riskFactors: predictionResult.risk_factors,
                    confidence: predictionResult.confidence,
                    priority: 5,
                });

                await alert.save();
            }

            return res.json({
                success: true,
                data: {
                    prediction: predictionResult,
                    healthRecordId: savedHealthRecord._id,
                    predictionId: savedPrediction._id,
                },
            });
        } catch (error) {
            console.error('Prediction error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    async getPredictionHistory(req, res) {
        try {
            const { userId } = req.params;
            const history = await Prediction.find({ userId }).sort({ createdAt: -1 }).limit(50);
            return res.json({ success: true, data: history });
        } catch (error) {
            console.error('Prediction history error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    async getHighRiskPatients(req, res) {
        try {
            // You may want to filter by doctorId or other params in real implementation
            const highRiskPatients = await Prediction.find({ riskLevel: 'High' }).limit(100);
            return res.json({ success: true, data: highRiskPatients });
        } catch (error) {
            console.error('High risk patients error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    async getModelStatus(req, res) {
        try {
            return res.json({
                success: true,
                data: {
                    version: '1.0',
                    modelType: 'XGBoost',
                    lastTrained: '2025-10-01T12:00:00Z',
                    status: 'ready',
                },
            });
        } catch (error) {
            console.error('Model status error:', error);
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}

module.exports = new PredictController();
