// backend/routes/auth.js
const express = require('express');
const { body } = require('express-validator');
const {
    register, login, getProfile, updateProfile,
    assignCaregiver, assignDoctor, getUsersByRole
} = require('../controllers/authController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

const registerValidation = [
    body('name').trim().isLength({ min: 2, max: 50 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['Elderly', 'Caregiver', 'Doctor'])
];

router.post('/register', registerValidation, register);
router.post('/login', login);

router.use(protect);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.get('/users/:role', restrictTo('Doctor'), getUsersByRole);
router.post('/assign-caregiver', restrictTo('Doctor'), assignCaregiver);
router.post('/assign-doctor', restrictTo('Doctor'), assignDoctor);

module.exports = router;
