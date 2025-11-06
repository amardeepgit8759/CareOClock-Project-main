// backend/controllers/requestController.js
const Request = require('../models/Request');
const User = require('../models/User');
const { catchAsync, sendSuccess, AppError } = require('../middleware/errorMiddleware');

exports.createRequest = catchAsync(async (req, res, next) => {
    const { recipientId, roleRequested } = req.body;
    const requestorId = req.user._id;

    if (!['Caregiver', 'Doctor'].includes(roleRequested)) {
        return next(new AppError('Invalid roleRequested', 400));
    }

    // Check if request already exists and is pending
    const exists = await Request.findOne({
        requestorId,
        recipientId,
        roleRequested,
        status: 'pending',
    });
    if (exists) {
        return next(new AppError('Request already pending', 400));
    }

    const request = await Request.create({ requestorId, recipientId, roleRequested });
    sendSuccess(res, 201, 'Request sent successfully', request);
});

exports.getRequestsForUser = catchAsync(async (req, res, next) => {
    const userId = req.user._id;
    const requests = await Request.find({ recipientId: userId, status: 'pending' })
        .populate('requestorId', 'name email role');
    sendSuccess(res, 200, 'Requests fetched', requests);
});

exports.respondToRequest = catchAsync(async (req, res, next) => {
    const { id } = req.params; // request ID
    const { status } = req.body; // 'accepted' or 'rejected'

    if (!['accepted', 'rejected'].includes(status)) {
        return next(new AppError('Invalid status', 400));
    }

    const request = await Request.findById(id);
    if (!request) return next(new AppError('Request not found', 404));
    if (!request.recipientId.equals(req.user._id)) {
        return next(new AppError('Not authorized', 403));
    }
    if (request.status !== 'pending') {
        return next(new AppError('Request already responded', 400));
    }

    request.status = status;
    await request.save();

    // On acceptance, update User assignments to link caregiver/doctor and patient
    if (status === 'accepted') {
        console.log('Accepting request:', {
  requestorId: request.requestorId.toString(),
  recipientId: request.recipientId.toString(),
  roleRequested: request.roleRequested
});
        if (request.roleRequested === 'Caregiver') {
            // Add caregiver to elderly's assignedCaregivers array
            await User.findByIdAndUpdate(request.requestorId, {
                $addToSet: { assignedCaregivers: request.recipientId }
            });
            // Add elderly to caregiver's assignedPatients array
            await User.findByIdAndUpdate(request.recipientId, {
                $addToSet: { assignedPatients: request.requestorId }
            });
        } else if (request.roleRequested === 'Doctor') {
            // Add doctor to elderly's assignedDoctors array
            await User.findByIdAndUpdate(request.requestorId, {
                $addToSet: { assignedDoctors: request.recipientId }
            });
            // Add elderly to doctor's assignedPatients array
            await User.findByIdAndUpdate(request.recipientId, {
                $addToSet: { assignedPatients: request.requestorId }
            });
        }

    }

    sendSuccess(res, 200, `Request ${status}`, request);
});
