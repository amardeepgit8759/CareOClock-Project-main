const mongoose = require('mongoose');
const MedicineIntake = require('../models/MedicineIntake');
const Medicine = require('../models/Medicine');
const PredictiveAnalytics = require('../utils/predictiveAnalytics');
const { catchAsync, sendSuccess } = require('../middleware/errorMiddleware');

const logIntake = catchAsync(async (req, res) => {
    const { medicineId, status, scheduledTime, notes } = req.body;
    let userId = req.params.userId || req.user._id;

    if (userId === 'current-user') {
        userId = req.user._id;
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid userId' });
    }

    if (!mongoose.Types.ObjectId.isValid(medicineId)) {
        return res.status(400).json({ success: false, message: 'Invalid medicineId' });
    }

    const intakeData = {
        userId: new mongoose.Types.ObjectId(userId),
        medicineId: new mongoose.Types.ObjectId(medicineId),
        status,
        scheduledTime,
        notes,
        actualTime: status === 'taken' ? new Date() : null,
    };

    const intake = await MedicineIntake.create(intakeData);

    if (status === 'taken') {
        const medicine = await Medicine.findById(medicineId);
        if (medicine && medicine.stock > 0) {
            medicine.consume(1);
            await medicine.save();
        }
    }

    try {
        await PredictiveAnalytics.checkAlertConditions(userId);
    } catch (error) {
        console.error('Error checking alert conditions:', error.message);
    }

    sendSuccess(res, 201, 'Intake logged successfully', { intake });
});

const getTodaySchedule = catchAsync(async (req, res) => {
    const userId = req.params.userId || req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid userId' });
    }

    const today = new Date().toISOString().split('T')[0];

    const medicines = await Medicine.find({ userId: new mongoose.Types.ObjectId(userId), isActive: true });

    const todayIntakes = await MedicineIntake.find({
        userId: new mongoose.Types.ObjectId(userId),
        date: {
            $gte: new Date(today + 'T00:00:00.000Z'),
            $lte: new Date(today + 'T23:59:59.999Z'),
        },
    });

    const schedule = [];

    medicines.forEach(medicine => {
        const scheduledTimes = medicine.reminderTimes.length > 0 ? medicine.reminderTimes : ['09:00', '21:00'];
        scheduledTimes.forEach(time => {
            const existingIntake = todayIntakes.find(intake =>
                intake.medicineId.toString() === medicine._id.toString() && intake.scheduledTime === time
            );
            schedule.push({
                medicineId: medicine._id,
                medicineName: medicine.name,
                dosage: medicine.dosage,
                scheduledTime: time,
                status: existingIntake ? existingIntake.status : 'pending',
                intakeId: existingIntake ? existingIntake._id : null,
            });
        });
    });

    sendSuccess(res, 200, "Today's schedule retrieved", { schedule, date: today });
});

const getAdherenceStats = catchAsync(async (req, res) => {
    const userId = req.params.userId || req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid userId' });
    }

    const days = parseInt(req.query.days) || 30;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const adherenceData = await MedicineIntake.getAdherenceRate(new mongoose.Types.ObjectId(userId), startDate, endDate);
    const streakData = await MedicineIntake.getStreak(new mongoose.Types.ObjectId(userId));

    sendSuccess(res, 200, 'Adherence stats retrieved', {
        overall: adherenceData,
        streak: streakData,
        period: { days, startDate, endDate },
    });
});

module.exports = { logIntake, getTodaySchedule, getAdherenceStats };
