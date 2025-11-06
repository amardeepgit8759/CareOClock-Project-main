import axios from 'axios';

const INTAKE_API_BASE_URL = '/api/intake';
const USER_API_BASE_URL = '/api/users';
const MEDICINE_API_BASE_URL = '/api/medicines';

export const intakeApi = {
    logIntake: async (intakeData, userId = null) => {
        const url = userId ? `${INTAKE_API_BASE_URL}/${userId}` : INTAKE_API_BASE_URL;
        const response = await axios.post(url, intakeData);
        return response.data;
    },

    getTodaySchedule: async (userId = null) => {
        const url = userId ? `${INTAKE_API_BASE_URL}/today/${userId}` : `${INTAKE_API_BASE_URL}/today`;
        const response = await axios.get(url);
        return response.data;
    },

    getAdherenceStats: async (userId = null, days = 30) => {
        const url = userId ? `${INTAKE_API_BASE_URL}/adherence/${userId}` : `${INTAKE_API_BASE_URL}/adherence`;
        const response = await axios.get(url, { params: { days } });
        return response.data;
    },

    // Updated to correct backend user route prefix
    getUserProfile: async (userId = null) => {
        const url = userId ? `${USER_API_BASE_URL}/user-profile/${userId}` : `${USER_API_BASE_URL}/user-profile`;
        const response = await axios.get(url);
        return response.data;
    },

    // Updated to correct backend medicine route prefix
    getMedicineData: async (userId = null) => {
        const url = userId ? `${MEDICINE_API_BASE_URL}/${userId}` : MEDICINE_API_BASE_URL;
        const response = await axios.get(url);
        return response.data;
    },

    getDailyAdherenceStats: (userId, startDate, endDate) =>
        axios.get('/api/adherence-stats/daily', {
            params: { userId, startDate, endDate }
        }),
};
