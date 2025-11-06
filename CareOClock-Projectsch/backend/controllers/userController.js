const User = require('../models/User');
const { catchAsync, AppError } = require('../middleware/errorMiddleware');
const mongoose = require('mongoose'); // --- ADDED THIS LINE ---

exports.getUserById = catchAsync(async (req, res, next) => {
    const userId = req.params.id;

    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new AppError('Invalid user ID', 400));
    }

    // Populate assignedCaregivers and assignedDoctors with selected fields
    const user = await User.findById(userId)
        .select('-password -__v')
        .populate('assignedCaregivers', 'name email')  // Add fields you want
        .populate('assignedDoctors', 'name email');

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: { user },
        timestamp: new Date().toISOString(),
    });
});

// --- ADDED THIS NEW FUNCTION ---
exports.updateUser = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    // This payload comes from your React app's handleSubmit
    const updateData = req.body;

    // Find the user by ID and update them
    // { new: true } returns the *updated* document
    // { runValidators: true } ensures your model's rules (e.g., email format) are checked
    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
    }).select('-password -__v'); // Also remove password from the response

    if (!updatedUser) {
        return next(new AppError('User not found', 404));
    }

    // Using your existing response format
    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updatedUser },
        timestamp: new Date().toISOString(),
    });
});

