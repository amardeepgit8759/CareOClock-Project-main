// backend/routes/alerts.js
const express = require('express');
const { getAlerts, createAlert } = require('../controllers/alertController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

router.get('/', getAlerts);
router.post('/', restrictTo('Doctor', 'Caregiver'), createAlert);

module.exports = router;
