const mongoose = require('mongoose');
const HealthRecord = require('../models/HealthRecord');
const { catchAsync, sendSuccess } = require('../middleware/errorMiddleware');

// Helper: detect abnormal readings and gather alert flags
const checkAbnormal = (data) => {
    const alerts = [];
    if (data.bloodPressure?.systolic && data.bloodPressure?.diastolic) {
        if (data.bloodPressure.systolic > 140) alerts.push('high_systolic_bp');
        if (data.bloodPressure.diastolic > 90) alerts.push('high_diastolic_bp');
        if (data.bloodPressure.systolic < 90) alerts.push('low_systolic_bp');
        if (data.bloodPressure.diastolic < 60) alerts.push('low_diastolic_bp');
    }
    if (data.bloodSugar?.value) {
        if (data.bloodSugar.value > 200) alerts.push('high_blood_sugar');
        if (data.bloodSugar.value < 70) alerts.push('low_blood_sugar');
    }
    if (data.heartRate?.value) {
        if (data.heartRate.value > 100) alerts.push('high_heart_rate');
        if (data.heartRate.value < 60) alerts.push('low_heart_rate');
    }
    if (data.oxygenLevel?.value && data.oxygenLevel.value < 95) alerts.push('low_oxygen_level');
    if (data.temperature?.value) {
        if (data.temperature.value > 100.4) alerts.push('fever');
        if (data.temperature.value < 97) alerts.push('hypothermia');
    }
    if (data.sleepHours?.value && data.sleepHours.value < 6) alerts.push('insufficient_sleep');
    return alerts;
};

const createHealthRecord = catchAsync(async (req, res) => {
    const userId = req.params.userId || req.user.id;
    // console.log('Received request body:', JSON.stringify(req.body, null, 2));

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid userId' });
    }

    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const healthData = {
        ...req.body,
        userId: new mongoose.Types.ObjectId(userId),
        submittedBy: userId,
        clientInfo: { userAgent, ipAddress: clientIp },
    };

    const alertFlags = checkAbnormal(healthData);
    healthData.alertFlags = alertFlags;
    healthData.hasAbnormalReading = alertFlags.length > 0;
    // console.log("I am inside the health controller her is tha id", userAgent , "this is data",healthData);
    
    const record = await HealthRecord.create(healthData);

    // Audit log
    // console.log(`reading_received: userId=${userId}, recordId=${record._id}, timestamp=${new Date().toISOString()}`);

    sendSuccess(res, 201, 'Health record created successfully', record);
});

const getHealthRecords = catchAsync(async (req, res) => {
    const userId = req.params.userId || req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid userId' });
    }

    const objUserId = new mongoose.Types.ObjectId(userId);
    const days = parseInt(req.query.days) || 30;
    const records = await HealthRecord.getHealthTrends(objUserId, days);

    const mappedRecords = records.map(record => ({
        ...record.toObject(),
        dateString: record.date.toISOString().split('T')[0],
    }));

    sendSuccess(res, 200, 'Health records retrieved successfully', { records: mappedRecords });
});

const getHealthTrends = catchAsync(async (req, res) => {
    const userId = req.params.userId || req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid userId' });
    }

    const objUserId = new mongoose.Types.ObjectId(userId);
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await HealthRecord.find({
        userId: objUserId,
        date: { $gte: startDate }
    }).sort({ date: 1 });

    const trends = records.map(record => ({
        date: record.dateString,
        bloodPressure: record.bloodPressure,
        bloodSugar: record.bloodSugar,
        heartRate: record.heartRate,
        sleepHours: record.sleepHours,
        temperature: record.temperature,
        oxygenLevel: record.oxygenLevel
    }));

    sendSuccess(res, 200, 'Health trends retrieved', { trends });
});

module.exports = { createHealthRecord, getHealthRecords, getHealthTrends };
