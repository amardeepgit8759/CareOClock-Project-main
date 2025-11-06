// frontend/src/api/authApi.js
import axios from 'axios';

const API_BASE_URL = '/api/auth';

export const authApi = {
    login: async (email, password) => {
        const response = await axios.post(`${API_BASE_URL}/login`, { email, password });
        return response.data;
    },

    register: async (userData) => {
        const response = await axios.post(`${API_BASE_URL}/register`, userData);
        return response.data;
    },

    getProfile: async () => {
        const response = await axios.get(`${API_BASE_URL}/profile`);
        return response.data;
    },

    updateProfile: async (profileData) => {
        const response = await axios.patch(`${API_BASE_URL}/profile`, profileData);
        return response.data;
    },

    getUsersByRole: async (role) => {
        const response = await axios.get(`${API_BASE_URL}/users/${role}`);
        return response.data;
    },

    assignCaregiver: async (patientId, caregiverId) => {
        const response = await axios.post(`${API_BASE_URL}/assign-caregiver`, {
            patientId,
            caregiverId
        });
        return response.data;
    },

    assignDoctor: async (patientId, doctorId) => {
        const response = await axios.post(`${API_BASE_URL}/assign-doctor`, {
            patientId,
            doctorId
        });
        return response.data;
    }
};
