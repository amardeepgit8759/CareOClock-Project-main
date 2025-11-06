// backend/routes/appointments.js
const express = require('express');
const { createAppointment, getAppointments, updateAppointment, deleteAppointment } = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

router.get('/', getAppointments);
router.post('/', createAppointment);
router.patch('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

module.exports = router;
