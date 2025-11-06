// backend/models/User.js
/**
 * User Model
 * Database schema for users with role-based access (Elderly, Caregiver, Doctor)
 * Includes password hashing and user relationship management
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true,
        maxLength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email address'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minLength: [6, 'Password must be at least 6 characters'],
        select: false // Don't include password in queries by default
    },
    role: {
        type: String,
        enum: {
            values: ['Elderly', 'Caregiver', 'Doctor'],
            message: 'Role must be either Elderly, Caregiver, or Doctor'
        },
        required: [true, 'Please specify a role']
    },

    // Profile Information
    age: {
        type: Number,
        min: [18, 'Age must be at least 18'],
        max: [120, 'Age cannot exceed 120']
    },
    phone: {
        type: String,
        match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please provide a valid phone number']
    },
    profilePicture: {
        type: String,
        default: '/avatars/default.jpg'
    },

    // Relationship Management
    assignedCaregivers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    assignedDoctors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    assignedPatients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    // Medical Information (for Elderly users)
    medicalInfo: {
        conditions: [String],
        allergies: [String],
        emergencyContact: {
            name: String,
            phone: String,
            relationship: String
        }
    },

    // Professional Information (for Doctors)
    professionalInfo: {
        specialty: String,
        licenseNumber: String,
        hospitalAffiliation: String
    },

    // Settings and Preferences
    preferences: {
        reminderTime: {
            type: String,
            default: '09:00'
        },
        notificationEnabled: {
            type: Boolean,
            default: true
        },
        language: {
            type: String,
            default: 'en'
        }
    },

    // Account Status
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ assignedPatients: 1 });

// Virtual for full name
userSchema.virtual('initials').get(function () {
    return this.name.split(' ').map(n => n[0]).join('').toUpperCase();
});

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
    // Only hash password if it's modified
    if (!this.isModified('password')) {
        return next();
    }

    try {
        // Hash password with salt rounds of 12
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method to check password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Instance method to get user summary for responses
userSchema.methods.getSummary = function () {
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        role: this.role,
        profilePicture: this.profilePicture,
        isActive: this.isActive,
        createdAt: this.createdAt
    };
};

// Static method to find users by role
userSchema.statics.findByRole = function (role) {
    return this.find({ role, isActive: true });
};

module.exports = mongoose.model('User', userSchema);
