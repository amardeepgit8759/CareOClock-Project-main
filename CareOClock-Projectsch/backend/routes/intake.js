const express = require('express');
const { logIntake, getTodaySchedule, getAdherenceStats } = require('../controllers/intakeController');
const { protect, checkResourceAccess } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

// For logIntake route
router.post('/', checkResourceAccess(), logIntake);
router.post('/:userId', checkResourceAccess(), logIntake);

// For today schedule route
router.get('/today', checkResourceAccess(), getTodaySchedule);
router.get('/today/:userId', checkResourceAccess(), getTodaySchedule);

// For adherence stats route
router.get('/adherence', checkResourceAccess(), getAdherenceStats);
router.get('/adherence/:userId', checkResourceAccess(), getAdherenceStats);

module.exports = router;
