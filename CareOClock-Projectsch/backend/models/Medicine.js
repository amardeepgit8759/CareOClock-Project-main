// backend/models/Medicine.js
/**
 * Medicine Model
 * Database schema for medicine information, dosage, frequency, stock, and alerts
 */

const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
    // User Association
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Medicine must be associated with a user'],
    },

    // Basic Medicine Information
    name: {
        type: String,
        required: [true, 'Medicine name is required'],
        trim: true,
        maxLength: [100, 'Medicine name cannot exceed 100 characters'],
    },
    genericName: {
        type: String,
        trim: true,
    },
    dosage: {
        type: String,
        required: [true, 'Dosage is required'],
        trim: true,
    },
    frequency: {
        type: String,
        required: [true, 'Frequency is required'],
        enum: {
            values: [
                'Once daily',
                'Twice daily',
                'Three times daily',
                'Four times daily',
                'Every 8 hours',
                'Every 12 hours',
                'As needed',
                'Custom'
            ],
            message: 'Please select a valid frequency',
        },
    },
    customFrequency: {
        timesPerDay: {
            type: Number,
            min: [1, 'Times per day must be at least 1'],
        },
        specificTimes: {
            type: [String],
            validate: {
                validator: function (arr) {
                    return arr.every(time => /^\d{2}:\d{2}$/.test(time));
                },
                message: 'Specific times must be in HH:MM format',
            },
        },
        intervalHours: {
            type: Number,
            min: [1, 'Interval hours must be at least 1'],
        },
    },

    // Stock Management
    stock: {
        type: Number,
        required: [true, 'Stock count is required'],
        min: [0, 'Stock cannot be negative'],
        default: 0,
    },
    lowStockAlert: {
        type: Number,
        default: 7, // alert when 7 days remaining
        min: [1, 'Low stock alert threshold must be at least 1'],
    },
    unit: {
        type: String,
        default: 'tablets',
        enum: ['tablets', 'capsules', 'ml', 'drops', 'puffs', 'units', 'other'],
    },

    // Medical Information
    condition: {
        type: String,
        trim: true,
    },
    instructions: {
        type: String,
        maxLength: [500, 'Instructions cannot exceed 500 characters'],
    },
    sideEffects: [String], // optional

    // Prescription Info
    prescribedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    prescriptionDate: {
        type: Date,
        default: Date.now,
    },

    // Additional Details
    color: {
        type: String,
        trim: true,
    },
    shape: {
        type: String,
        trim: true,
    },
    manufacturer: {
        type: String,
        trim: true,
    },

    // Status & Alerts
    isActive: {
        type: Boolean,
        default: true,
    },
    requiresRefill: {
        type: Boolean,
        default: false,
    },
    lastRefillDate: {
        type: Date,
        validate: {
            validator: function (d) {
                // lastRefillDate should be a valid date or null
                return !d || d instanceof Date;
            },
            message: 'Invalid date for lastRefillDate',
        },
    },

    // Reminder Settings
    reminderEnabled: {
        type: Boolean,
        default: true,
    },
    reminderTimes: {
        type: [String],
        validate: {
            validator: function (arr) {
                return arr.every(time => /^\d{2}:\d{2}$/.test(time));
            },
            message: 'Reminder times must be in HH:MM format',
        },
    },

    // Notes
    notes: {
        type: String,
        maxLength: [1000, 'Notes cannot exceed 1000 characters'],
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Indexes for performance
medicineSchema.index({ userId: 1 });
medicineSchema.index({ name: 1 });
medicineSchema.index({ isActive: 1 });
medicineSchema.index({ stock: 1 });

// Virtual: Days remaining calculation
medicineSchema.virtual('daysRemaining').get(function () {
    if (!this.stock || !this.frequency) return 0;

    let dailyConsumption = 1; // default

    switch (this.frequency) {
        case 'Once daily':
            dailyConsumption = 1;
            break;
        case 'Twice daily':
            dailyConsumption = 2;
            break;
        case 'Three times daily':
            dailyConsumption = 3;
            break;
        case 'Four times daily':
            dailyConsumption = 4;
            break;
        case 'Every 8 hours':
            dailyConsumption = 3;
            break;
        case 'Every 12 hours':
            dailyConsumption = 2;
            break;
        case 'Custom':
            dailyConsumption = this.customFrequency?.timesPerDay || 1;
            break;
        default:
            dailyConsumption = 1;
    }
    return Math.floor(this.stock / dailyConsumption);
});

// Virtual: Low stock status
medicineSchema.virtual('isLowStock').get(function () {
    return this.daysRemaining <= this.lowStockAlert;
});

// Middleware to update refill requirement
medicineSchema.pre('save', function (next) {
    this.requiresRefill = this.isLowStock;
    next();
});

// Method to consume medicine
medicineSchema.methods.consume = function (quantity = 1) {
    if (this.stock >= quantity) {
        this.stock -= quantity;
        return true;
    }
    return false;
};

module.exports = mongoose.model('Medicine', medicineSchema);
