import axios from 'axios';

const API_BASE_URL = '/api/appointments';

export const appointmentApi = {
    // Fetch upcoming appointments with optional date range
    getAppointments: async (upcoming = true, days = 30) => {
        const response = await axios.get(API_BASE_URL, { params: { upcoming, days } });
        return response.data;
    },

    // Fetch appointments filtered by patientId
    getAppointmentsByPatientId: async (patientId) => {
        if (!patientId) throw new Error('Patient ID is required');
        const response = await axios.get(API_BASE_URL, { params: { patientId } });
        return response.data;
    },

    createAppointment: async (appointmentData) => {
        const response = await axios.post(API_BASE_URL, appointmentData);
        return response.data;
    },

    updateAppointment: async (appointmentId, appointmentData) => {
        const response = await axios.patch(`${API_BASE_URL}/${appointmentId}`, appointmentData);
        return response.data;
    },

    deleteAppointment: async (appointmentId) => {
        const response = await axios.delete(`${API_BASE_URL}/${appointmentId}`);
        return response.data;
    }
};
