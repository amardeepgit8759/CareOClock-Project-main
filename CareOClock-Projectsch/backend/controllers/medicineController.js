// controllers/medicineController.js
const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
const { catchAsync, sendSuccess } = require('../middleware/errorMiddleware');

const getMedicines = catchAsync(async (req, res) => {
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid userId' });
    }

    const medicines = await Medicine.find({ userId, isActive: true })
        .populate('prescribedBy', 'name professionalInfo.specialty')
        .sort({ createdAt: -1 });

    sendSuccess(res, 200, 'Medicines retrieved successfully', medicines);
});

const createMedicine = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const medicineData = { ...req.body, userId };

    const medicine = await Medicine.create(medicineData);
    sendSuccess(res, 201, 'Medicine added successfully', medicine);
});

const updateMedicine = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const medicine = await Medicine.findOneAndUpdate(
        { _id: req.params.id, userId },
        req.body,
        { new: true, runValidators: true }
    );

    if (!medicine) {
        return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    sendSuccess(res, 200, 'Medicine updated successfully', medicine);
});

const deleteMedicine = catchAsync(async (req, res) => {
    const userId = req.user._id;
    const medicine = await Medicine.findOneAndDelete({ _id: req.params.id, userId });

    if (!medicine) {
        return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    sendSuccess(res, 200, 'Medicine deleted successfully');
});

const getLowStockMedicines = catchAsync(async (req, res) => {
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: 'Invalid userId' });
    }

    // Define your low stock threshold, e.g., 10 units
    const threshold = 10;

    // Find medicines for this user which have quantity less than threshold and are active
    const lowStockMedicines = await Medicine.find({
        userId,
        isActive: true,
        quantity: { $lt: threshold }
    }).populate('prescribedBy', 'name professionalInfo.specialty')
        .sort({ quantity: 1, createdAt: -1 }); // sort by smallest quantity first

    sendSuccess(res, 200, 'Low stock medicines retrieved successfully', lowStockMedicines);
});

module.exports = {
    getMedicines,
    createMedicine,
    updateMedicine,
    deleteMedicine,
    getLowStockMedicines
};
