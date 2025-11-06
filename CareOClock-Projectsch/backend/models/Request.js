// backend/models/Request.js
const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    requestorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    roleRequested: {
        type: String,
        enum: ['Caregiver', 'Doctor'],
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
    },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Request', requestSchema);
