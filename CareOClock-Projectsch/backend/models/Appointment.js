// backend/models/Appointment.js
/**
 * Appointment Model
 * Database schema for managing doctor appointments, calendar events, and scheduling
 */

const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    // Patient Information
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Patient ID is required'],
    },

    // Doctor Information
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Doctor ID is required'],
    },

    // Appointment Scheduling
    appointmentDate: {
        type: Date,
        required: [true, 'Appointment date is required'],
    },
    appointmentTime: {
        type: String, // Format: 'HH:MM'
        required: [true, 'Appointment time is required'],
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please provide time in HH:MM format'],
    },
    duration: {
        type: Number, // Duration in minutes
        default: 30,
        min: [15, 'Appointment duration must be at least 15 minutes'],
        max: [240, 'Appointment duration cannot exceed 4 hours'],
    },

    // Appointment Details
    type: {
        type: String,
        enum: {
            values: [
                'routine-checkup',
                'follow-up',
                'consultation',
                'medication-review',
                'lab-results',
                'urgent-care',
                'telehealth',
                'specialist-referral',
                'other',
            ],
            message: 'Please provide a valid appointment type',
        },
        required: [true, 'Appointment type is required'],
    },

    title: {
        type: String,
        required: [true, 'Appointment title is required'],
        maxLength: [100, 'Title cannot exceed 100 characters'],
    },

    description: {
        type: String,
        maxLength: [500, 'Description cannot exceed 500 characters'],
    },

    // Location and Method
    location: {
        type: String,
        enum: {
            values: ['clinic', 'hospital', 'home-visit', 'telehealth', 'other'],
            message: 'Please provide a valid location type',
        },
        default: 'clinic',
    },

    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: { type: String, default: 'USA' },
    },

    // Status Management
    status: {
        type: String,
        enum: {
            values: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show', 'rescheduled'],
            message: 'Please provide a valid status',
        },
        default: 'scheduled',
    },

    // Confirmation and Communication
    patientConfirmed: {
        type: Boolean,
        default: false,
    },
    doctorConfirmed: {
        type: Boolean,
        default: false,
    },

    reminderSent: {
        type: Boolean,
        default: false,
    },
    reminderSentAt: Date,

    // Medical Context
    reasonForVisit: {
        type: String,
        maxLength: [200, 'Reason cannot exceed 200 characters'],
    },

    symptoms: [String],

    relatedMedicines: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine',
        },
    ],

    // Appointment Results
    completed: {
        actualStartTime: Date,
        actualEndTime: Date,
        diagnosis: String,
        prescriptions: [String],
        recommendations: [String],
        nextAppointmentNeeded: Boolean,
        followUpInstructions: String,
        notes: {
            type: String,
            maxLength: [1000, 'Notes cannot exceed 1000 characters'],
        },
    },

    // Caregiver Information
    caregiverAttending: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Indexes for performance
appointmentSchema.index({ patientId: 1, appointmentDate: 1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ appointmentDate: 1, status: 1 });
appointmentSchema.index({ status: 1 });

// Virtual for date-time string
appointmentSchema.virtual('dateTimeString').get(function () {
    const date = this.appointmentDate.toISOString().split('T')[0];
    return `${date} ${this.appointmentTime}`;
});

// Virtual to check if appointment is upcoming
appointmentSchema.virtual('isUpcoming').get(function () {
    const now = new Date();
    const appointmentDateTime = new Date(`${this.appointmentDate.toISOString().split('T')[0]}T${this.appointmentTime}:00`);
    return appointmentDateTime > now && ['scheduled', 'confirmed'].includes(this.status);
});

// Static method to get upcoming appointments
appointmentSchema.statics.getUpcoming = function (userId, role, days = 30) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid userId');
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const query = {
        appointmentDate: { $gte: startDate, $lte: endDate },
        status: { $in: ['scheduled', 'confirmed'] },
    };

    if (role === 'Elderly') {
        query.patientId = new mongoose.Types.ObjectId(userId);
    } else if (role === 'Doctor') {
        query.doctorId = new mongoose.Types.ObjectId(userId);
    } else if (role === 'Caregiver') {
        query.caregiverAttending = new mongoose.Types.ObjectId(userId);
    }

    return this.find(query)
        .populate('patientId', 'name email age')
        .populate('doctorId', 'name email professionalInfo.specialty')
        .populate('caregiverAttending', 'name email')
        .sort({ appointmentDate: 1, appointmentTime: 1 });
};

module.exports = mongoose.model('Appointment', appointmentSchema);
