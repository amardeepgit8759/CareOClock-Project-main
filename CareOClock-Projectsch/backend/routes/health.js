const express = require('express');
const { createHealthRecord, getHealthRecords, getHealthTrends } = require('../controllers/healthController');
const { protect, checkResourceAccess } = require('../middleware/authMiddleware');
const validateHealthData = require('../middleware/validateHealthData');

const router = express.Router();
router.use(protect);

// Routes without userId
router.post('/', (req, res, next) => {
    // console.log('POST /api/health route hit');
    next();
}, checkResourceAccess(), validateHealthData, createHealthRecord);
router.get('/', checkResourceAccess(), getHealthRecords);
router.get('/trends', checkResourceAccess(), getHealthTrends);

// Routes with userId
router.post('/:userId', checkResourceAccess(), validateHealthData, createHealthRecord);
router.get('/:userId', checkResourceAccess(), getHealthRecords);
router.get('/trends/:userId', checkResourceAccess(), getHealthTrends);

module.exports = router;
