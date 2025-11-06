const express = require('express');
// --- IMPORT 'updateUser' ---
const { getUserById, updateUser } = require('../controllers/userController');
const User = require('../models/User');
const { protect, checkResourceAccess } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // Authentication for all routes

// Get user profile by ID or logged in user
router.get('/user-profile/:id', checkResourceAccess(), getUserById);

// --- ADD THIS ROUTE ---
// Update user profile
router.patch('/update/:id', checkResourceAccess(), updateUser);

// Search users by role and query matching name or email
router.get('/search', async (req, res) => {
    const { query, role } = req.query;

    if (!query || !role) {
        return res.status(400).json({
            success: false,
            message: 'Both query and role parameters are required'
        });
    }

    try {
        const users = await User.find({
            role,
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ],
            isActive: true
        }).select('name email role');

        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
