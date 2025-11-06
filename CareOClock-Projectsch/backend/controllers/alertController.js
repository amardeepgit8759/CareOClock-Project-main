const mongoose = require('mongoose');
const Alert = require('../models/Alert');
const { catchAsync, sendSuccess } = require('../middleware/errorMiddleware');

const getAlerts = catchAsync(async (req, res) => {
    let userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid userId' });
    }

    userId = new mongoose.Types.ObjectId(userId);
    const role = req.user.role;

    const alerts = await Alert.getActiveAlerts(userId, role);
    sendSuccess(res, 200, 'Alerts retrieved successfully', alerts);
});

const createAlert = catchAsync(async (req, res) => {
    const alert = await Alert.create(req.body);
    sendSuccess(res, 201, 'Alert created successfully', alert);
});

module.exports = { getAlerts, createAlert };
