// backend/routes/predict.js
const express = require('express');
const router = express.Router();
const predictController = require('../controllers/predictController');

// POST /api/predict/:userId
// Get health risk prediction for a user
router.post('/:userId', predictController.getPrediction);

// GET /api/predict/history/:userId
// Get prediction history for a user
router.get('/history/:userId', predictController.getPredictionHistory);

// GET /api/predict/high-risk/:doctorId
// Get high risk patients for doctors/caregivers
router.get('/high-risk/:doctorId', predictController.getHighRiskPatients);

// GET /api/predict/model-status
// Get ML model status
router.get('/model-status', predictController.getModelStatus);

module.exports = router;
