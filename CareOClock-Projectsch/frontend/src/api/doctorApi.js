// frontend/src/api/doctorApi.js
import axios from 'axios';

const API_BASE_URL = '/api/doctor-notes'; // Adjust if your backend uses a different path

export const doctorApi = {
    // Get doctor notes for a specific user (patient)
    getDoctorNotes: async (userId = null) => {
        const url = userId ? `${API_BASE_URL}/${userId}` : API_BASE_URL;
        const response = await axios.get(url);
        return response.data;
    },

    // Add a new doctor note for a user
    createDoctorNote: async (userId, noteData) => {
        const url = `${API_BASE_URL}/${userId}`;
        const response = await axios.post(url, noteData);
        return response.data;
    },

    // Update an existing doctor note by note ID
    updateDoctorNote: async (noteId, noteData) => {
        const url = `${API_BASE_URL}/note/${noteId}`;
        const response = await axios.patch(url, noteData);
        return response.data;
    },

    // Delete a doctor note by note ID
    deleteDoctorNote: async (noteId) => {
        const url = `${API_BASE_URL}/note/${noteId}`;
        const response = await axios.delete(url);
        return response.data;
    }
};
