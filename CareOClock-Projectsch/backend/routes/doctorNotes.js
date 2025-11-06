// backend/routes/doctorNotes.js
const express = require('express');
const {
    getDoctorNotesByUser,
    createDoctorNote,
    updateDoctorNote,
    deleteDoctorNote,
} = require('../controllers/doctorNotesController');
const { protect, checkResourceAccess } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// Get all notes for a user
router.get('/:userId', checkResourceAccess(), getDoctorNotesByUser);

// Create new note for user
router.post('/:userId', checkResourceAccess(), createDoctorNote);

// Update note by noteId
router.patch('/note/:noteId', checkResourceAccess(), updateDoctorNote);

// Delete note by noteId
router.delete('/note/:noteId', checkResourceAccess(), deleteDoctorNote);

module.exports = router;
