// src/api/predictiveApi.js
import axios from 'axios';

// Replace 'http://localhost:5001' with your Flask backend URL and port if different
const API_BASE = 'http://localhost:5001';

export const predictiveApi = {
    // POST /predict endpoint for health risk prediction
    predictRisk: (healthData) =>
        axios.post(`${API_BASE}/predict`, healthData),

    // Additional endpoints (optional)
    getPredictionHistory: (userId) =>
        axios.get(`${API_BASE}/history/${userId}`),

    getHighRiskPatients: (doctorId) =>
        axios.get(`${API_BASE}/high-risk/${doctorId}`),

    getModelStatus: () =>
        axios.get(`${API_BASE}/model-status`)
};
