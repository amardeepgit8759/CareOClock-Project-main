// frontend/src/api/healthApi.js
import axios from 'axios';

const API_BASE_URL = '/api/health';

export const healthApi = {
    createHealthRecord: async (healthData, userId = null) => {
        const url = userId ? `${API_BASE_URL}/${userId}` : API_BASE_URL;
        const response = await axios.post(url, healthData);
        return response.data;
    },

    getHealthRecords: async (userId = null, days = 30) => {
        const url = userId ? `${API_BASE_URL}/${userId}` : API_BASE_URL;
        const response = await axios.get(url, { params: { days } });
        console.log("this is response of getHealthRecords:", response);
        return response.data; // Ensure your backend returns data in this structure
    },

    getHealthTrends: async (userId = null, days = 30) => {
        const url = userId ? `${API_BASE_URL}/trends/${userId}` : `${API_BASE_URL}/trends`;
        const response = await axios.get(url, { params: { days } });
        return response.data;
    }
};
