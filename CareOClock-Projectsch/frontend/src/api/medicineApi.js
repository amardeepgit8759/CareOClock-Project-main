// frontend/src/api/medicineApi.js
import axios from 'axios';

const API_BASE_URL = '/api/medicines';

export const medicineApi = {
    getMedicines: async () => {
        const response = await axios.get(API_BASE_URL);
        return response.data;
    },

    createMedicine: async (medicineData) => {
        const response = await axios.post(API_BASE_URL, medicineData);
        return response.data;
    },

    updateMedicine: async (medicineId, medicineData) => {
        const response = await axios.patch(`${API_BASE_URL}/${medicineId}`, medicineData);
        return response.data;
    },

    deleteMedicine: async (medicineId) => {
        const response = await axios.delete(`${API_BASE_URL}/${medicineId}`);
        return response.data;
    },
};
