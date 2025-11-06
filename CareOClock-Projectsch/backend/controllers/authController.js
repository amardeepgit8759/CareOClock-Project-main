// backend/controllers/authController.js
/**
 * Authentication Controller
 * Handles user registration, login, password reset, and profile management
 */

const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { AppError, catchAsync, sendSuccess } = require('../middleware/errorMiddleware');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

const createSendToken = (user, statusCode, res, message = 'Success') => {
    const token = signToken(user._id);
    user.password = undefined;

    res.status(statusCode).json({
        success: true,
        message,
        token,
        data: {
            user: user.getSummary()
        },
        timestamp: new Date().toISOString()
    });
};

const register = catchAsync(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);
        return next(new AppError(`Validation failed: ${errorMessages.join(', ')}`, 400));
    }

    const { name, email, password, role, age, phone, medicalInfo, professionalInfo } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        return next(new AppError('User with this email already exists', 409));
    }

    if (role === 'Elderly' && (!age || age < 18)) {
        return next(new AppError('Age is required for elderly users and must be at least 18', 400));
    }

    const userData = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        role,
        age,
        phone
    };

    if (role === 'Elderly' && medicalInfo) {
        userData.medicalInfo = medicalInfo;
    }

    if (role === 'Doctor' && professionalInfo) {
        userData.professionalInfo = professionalInfo;
    }

    const newUser = await User.create(userData);
    console.log(`New user registered: ${newUser.email} (${newUser.role})`);

    createSendToken(newUser, 201, res, 'User registered successfully');
});

const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({
        email: email.toLowerCase()
    }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
        return next(new AppError('Invalid email or password', 401));
    }

    if (!user.isActive) {
        return next(new AppError('Your account has been deactivated. Please contact support.', 401));
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    console.log(`User logged in: ${user.email} (${user.role})`);
    createSendToken(user, 200, res, 'Login successful');
});

const getProfile = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user._id)
        .populate('assignedCaregivers', 'name email phone')
        .populate('assignedDoctors', 'name email professionalInfo.specialty')
        .populate('assignedPatients', 'name email age role');

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    sendSuccess(res, 200, 'Profile retrieved successfully', { user });
});

const updateProfile = catchAsync(async (req, res, next) => {
    const { name, phone, age, preferences, medicalInfo, professionalInfo } = req.body;

    const updates = {};

    if (name) updates.name = name.trim();
    if (phone) updates.phone = phone;
    if (age) updates.age = age;
    if (preferences) updates.preferences = { ...req.user.preferences, ...preferences };

    if (req.user.role === 'Elderly' && medicalInfo) {
        updates.medicalInfo = { ...req.user.medicalInfo, ...medicalInfo };
    }

    if (req.user.role === 'Doctor' && professionalInfo) {
        updates.professionalInfo = { ...req.user.professionalInfo, ...professionalInfo };
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
        new: true,
        runValidators: true
    });

    sendSuccess(res, 200, 'Profile updated successfully', { user: user.getSummary() });
});

const assignCaregiver = catchAsync(async (req, res, next) => {
    const { patientId, caregiverId } = req.body;

    if (!patientId || !caregiverId) {
        return next(new AppError('Patient ID and Caregiver ID are required', 400));
    }

    const [patient, caregiver] = await Promise.all([
        User.findById(patientId),
        User.findById(caregiverId)
    ]);

    if (!patient || !caregiver) {
        return next(new AppError('Patient or caregiver not found', 404));
    }

    if (patient.role !== 'Elderly') {
        return next(new AppError('Patient must have Elderly role', 400));
    }

    if (caregiver.role !== 'Caregiver') {
        return next(new AppError('Caregiver must have Caregiver role', 400));
    }

    if (patient.assignedCaregivers.includes(caregiverId)) {
        return next(new AppError('Caregiver is already assigned to this patient', 400));
    }

    patient.assignedCaregivers.push(caregiverId);
    caregiver.assignedPatients.push(patientId);

    await Promise.all([patient.save(), caregiver.save()]);

    console.log(`Caregiver assigned: ${caregiver.email} -> ${patient.email}`);
    sendSuccess(res, 200, 'Caregiver assigned successfully');
});

const assignDoctor = catchAsync(async (req, res, next) => {
    const { patientId, doctorId } = req.body;

    if (!patientId || !doctorId) {
        return next(new AppError('Patient ID and Doctor ID are required', 400));
    }

    const [patient, doctor] = await Promise.all([
        User.findById(patientId),
        User.findById(doctorId)
    ]);

    if (!patient || !doctor) {
        return next(new AppError('Patient or doctor not found', 404));
    }

    if (patient.role !== 'Elderly') {
        return next(new AppError('Patient must have Elderly role', 400));
    }

    if (doctor.role !== 'Doctor') {
        return next(new AppError('Doctor must have Doctor role', 400));
    }

    if (patient.assignedDoctors.includes(doctorId)) {
        return next(new AppError('Doctor is already assigned to this patient', 400));
    }

    patient.assignedDoctors.push(doctorId);
    doctor.assignedPatients.push(patientId);

    await Promise.all([patient.save(), doctor.save()]);

    console.log(`Doctor assigned: ${doctor.email} -> ${patient.email}`);
    sendSuccess(res, 200, 'Doctor assigned successfully');
});

const getUsersByRole = catchAsync(async (req, res, next) => {
    const { role } = req.params;

    if (!['Elderly', 'Caregiver', 'Doctor'].includes(role)) {
        return next(new AppError('Invalid role specified', 400));
    }

    if (req.user.role !== 'Doctor') {
        return next(new AppError('Access denied. Only doctors can view user lists.', 403));
    }

    const users = await User.find({
        role,
        isActive: true
    }).select('name email role age professionalInfo.specialty createdAt');

    sendSuccess(res, 200, `${role} users retrieved successfully`, { users, count: users.length });
});

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    assignCaregiver,
    assignDoctor,
    getUsersByRole
};
