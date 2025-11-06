// frontend/src/api/alertApi.js
import axios from 'axios';

const API_BASE_URL = '/api/alerts';

export const alertApi = {
    // Existing general fetch with optional params
    getAlerts: async (params = {}) => {
        const response = await axios.get(API_BASE_URL, { params });
        return response.data;
    },

    // Fetch alerts for a specific patient by patientId
    getAlertsForPatient: async (patientId) => {
        if (!patientId) throw new Error('Patient ID is required');
        // Filter alerts by patientId using query params
        const response = await axios.get(API_BASE_URL, { params: { patientId } });
        return response.data;
    },

    createAlert: async (alertData) => {
        const response = await axios.post(API_BASE_URL, alertData);
        return response.data;
    }
};
