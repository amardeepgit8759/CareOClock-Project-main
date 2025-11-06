// frontend/src/api/requestApi.js
import axios from 'axios';

const API_BASE_URL = '/api/requests';

export const requestApi = {
    sendRequest: async (recipientId, roleRequested) => {
        const response = await axios.post(API_BASE_URL, { recipientId, roleRequested });
        return response.data;
    },

    fetchPendingRequests: async () => {
        const response = await axios.get(API_BASE_URL);
        return response.data;
    },

    respondToRequest: async (requestId, status) => {
        const response = await axios.patch(`${API_BASE_URL}/${requestId}`, { status });
        return response.data;
    },
};
