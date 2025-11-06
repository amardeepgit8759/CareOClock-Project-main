import axios from 'axios';

const API_BASE_URL = '/api/users';

export const userApi = {
    // Fetch user profile by valid user ID only
    getUserProfile: async (userId) => {
        if (!userId) throw new Error('User ID is required');
        const url = `${API_BASE_URL}/user-profile/${userId}`;
        const response = await axios.get(url);
        return response.data;
    },

    // Search users by email or name + role
    searchUsers: async (query, role) => {
        if (!query || !role) throw new Error('Query and role are required');
        const response = await axios.get(`${API_BASE_URL}/search`, {
            params: { query, role },
        });
        return response.data;
    },

    // Fetch full patient details by patient ID (matches backend route)
    getPatientById: async (patientId) => {
        if (!patientId) throw new Error('Patient ID is required');
        const url = `${API_BASE_URL}/user-profile/${patientId}`;
        const response = await axios.get(url);
        return response.data;
    },
    updateUser: async (userId, updateData) => {
        if (!userId) throw new Error('User ID is required');
        if (!updateData) throw new Error('Update data is required');
        
        const url = `${API_BASE_URL}/update/${userId}`; // Assuming a route like /api/users/update/:id
        const response = await axios.patch(url, updateData); // Using PATCH is standard for updates
        return response.data;
    },
};
