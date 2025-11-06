// backend/controllers/doctorNotesController.js
const DoctorNote = require('../models/DoctorNote'); // Define DoctorNote Mongoose model accordingly

// Fetch all doctor notes for a user
exports.getDoctorNotesByUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const notes = await DoctorNote.find({ userId }).sort({ createdAt: -1 });
        res.json({ success: true, data: notes });
    } catch (error) {
        console.error('Error fetching doctor notes:', error);
        res.status(500).json({ success: false, message: 'Server error fetching doctor notes' });
    }
};

// Create a new doctor note for a user
exports.createDoctorNote = async (req, res) => {
    try {
        const userId = req.params.userId;
        const noteData = req.body;
        const newNote = new DoctorNote({ userId, ...noteData });
        const savedNote = await newNote.save();
        res.status(201).json({ success: true, data: savedNote });
    } catch (error) {
        console.error('Error creating doctor note:', error);
        res.status(500).json({ success: false, message: 'Server error creating doctor note' });
    }
};

// Update an existing note by ID
exports.updateDoctorNote = async (req, res) => {
    try {
        const noteId = req.params.noteId;
        const updates = req.body;
        const updatedNote = await DoctorNote.findByIdAndUpdate(noteId, updates, { new: true });
        if (!updatedNote) return res.status(404).json({ success: false, message: 'Note not found' });
        res.json({ success: true, data: updatedNote });
    } catch (error) {
        console.error('Error updating doctor note:', error);
        res.status(500).json({ success: false, message: 'Server error updating doctor note' });
    }
};

// Delete a note by ID
exports.deleteDoctorNote = async (req, res) => {
    try {
        const noteId = req.params.noteId;
        const deletedNote = await DoctorNote.findByIdAndDelete(noteId);
        if (!deletedNote) return res.status(404).json({ success: false, message: 'Note not found' });
        res.json({ success: true, message: 'Note deleted' });
    } catch (error) {
        console.error('Error deleting doctor note:', error);
        res.status(500).json({ success: false, message: 'Server error deleting doctor note' });
    }
};
