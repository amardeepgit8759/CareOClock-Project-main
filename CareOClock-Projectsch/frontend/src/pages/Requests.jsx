import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/userApi';
import { requestApi } from '../api/requestApi';

const Requests = () => {
    const { user } = useAuth();

    const [currentCaregiver, setCurrentCaregiver] = useState(null);
    const [currentDoctor, setCurrentDoctor] = useState(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchRole, setSearchRole] = useState('Caregiver');
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [errorSearch, setErrorSearch] = useState(null);

    const [requests, setRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [errorRequests, setErrorRequests] = useState(null);

    const [sendingRequestToId, setSendingRequestToId] = useState(null);

    useEffect(() => {
        fetchUserConnections();
        fetchPendingRequests();
    }, []);

    const fetchUserConnections = async () => {
        try {
            const res = await userApi.getUserProfile(user.id);
            const userData = res.data.user;
            // Only show caregiver and doctor info if user is Elderly
            if (user.role === 'Elderly') {
                setCurrentCaregiver(userData.assignedCaregivers?.[0] || null);
                setCurrentDoctor(userData.assignedDoctors?.[0] || null);
            }
        } catch (err) {
            console.error('Failed to fetch user connections:', err);
        }
    };

    const fetchPendingRequests = async () => {
        setLoadingRequests(true);
        setErrorRequests(null);
        try {
            const res = await requestApi.fetchPendingRequests();
            setRequests(res.data || []);
        } catch (err) {
            setErrorRequests(err.response?.data?.message || 'Failed to load requests');
        }
        setLoadingRequests(false);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setLoadingSearch(true);
        setErrorSearch(null);
        setSearchResults([]);
        try {
            const res = await userApi.searchUsers(searchQuery, searchRole);
            setSearchResults(res.users || []);
        } catch (err) {
            setErrorSearch(err.response?.data?.message || 'Search failed');
        }
        setLoadingSearch(false);
    };

    const sendRequest = async (recipientId) => {
        setSendingRequestToId(recipientId);
        try {
            await requestApi.sendRequest(recipientId, searchRole);
            alert('Request sent successfully');
            setSearchResults(prev => prev.filter(u => u._id !== recipientId));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to send request');
        }
        setSendingRequestToId(null);
    };

    const handleResponse = async (id, status) => {
        try {
            await requestApi.respondToRequest(id, status);
            fetchPendingRequests();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to respond to request');
        }
    };

    const removeConnection = async (connectionId, roleType) => {
        try {
            await userApi.removeConnection(user.id, connectionId, roleType);
            if (roleType === 'caregiver') setCurrentCaregiver(null);
            if (roleType === 'doctor') setCurrentDoctor(null);
        } catch (err) {
            alert('Failed to remove connection');
            console.error(err);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Assignment Requests</h1>

            {/* Show caregiver/doctor details ONLY for elderly users */}
            {user.role === 'Elderly' && (
                <>
                    {currentCaregiver ? (
                        <div className="mb-4 p-4 bg-gray-100 rounded flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-semibold">Current Caregiver</h2>
                                <p>Name: {currentCaregiver.name}</p>
                                <p>Email: {currentCaregiver.email}</p>
                            </div>
                            <button
                                onClick={() => removeConnection(currentCaregiver._id, 'caregiver')}
                                className="bg-red-500 text-white px-3 py-1 rounded"
                            >
                                Remove
                            </button>
                        </div>
                    ) : (
                        <p className="mb-4">No caregiver assigned.</p>
                    )}

                    {currentDoctor ? (
                        <div className="mb-6 p-4 bg-gray-100 rounded flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-semibold">Current Doctor</h2>
                                <p>Name: {currentDoctor.name}</p>
                                <p>Email: {currentDoctor.email}</p>
                            </div>
                            <button
                                onClick={() => removeConnection(currentDoctor._id, 'doctor')}
                                className="bg-red-500 text-white px-3 py-1 rounded"
                            >
                                Remove
                            </button>
                        </div>
                    ) : (
                        <p className="mb-6">No doctor assigned.</p>
                    )}
                </>
            )}

            {/* Search Section */}
            <div className="mb-6 border p-4 rounded">
                <h2 className="text-xl mb-2">Search and Send Requests</h2>

                <div className="flex items-center space-x-2 mb-4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Enter name or email to search"
                        className="flex-grow p-2 border rounded"
                    />
                    <select
                        className="border p-2 rounded"
                        value={searchRole}
                        onChange={e => setSearchRole(e.target.value)}
                    >
                        <option value="Caregiver">Caregiver</option>
                        <option value="Doctor">Doctor</option>
                    </select>
                    <button
                        onClick={handleSearch}
                        className="btn-primary px-4 py-2 rounded"
                        disabled={loadingSearch}
                    >
                        {loadingSearch ? 'Searching...' : 'Search'}
                    </button>
                </div>

                {errorSearch && <p className="text-red-500 mb-2">{errorSearch}</p>}

                <div>
                    {searchResults.length === 0 && !loadingSearch && <p>No results found.</p>}
                    {searchResults.map(user => (
                        <div key={user._id} className="p-3 border rounded mb-2 flex justify-between items-center">
                            <div>
                                <div className="font-semibold">{user.name}</div>
                                <div className="text-gray-600 text-sm">{user.email}</div>
                            </div>
                            <button
                                onClick={() => sendRequest(user._id)}
                                disabled={sendingRequestToId === user._id}
                                className="btn-secondary px-4 py-1 rounded"
                            >
                                {sendingRequestToId === user._id ? 'Sending...' : 'Send Request'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Incoming Requests */}
            <div className="border p-4 rounded">
                <h2 className="text-xl mb-2">Incoming Requests</h2>

                {loadingRequests && <p>Loading requests...</p>}
                {errorRequests && <p className="text-red-500">{errorRequests}</p>}
                {!loadingRequests && !errorRequests && requests.length === 0 && <p>No pending requests</p>}

                {requests.length > 0 && (
                    <ul className="space-y-4">
                        {requests.map(req => (
                            <li key={req._id} className="p-4 border rounded shadow-sm flex flex-col md:flex-row md:justify-between items-start md:items-center">
                                <div>
                                    <p>
                                        <strong>{req.requestorId.name}</strong> wants to be your{' '}
                                        <strong>{req.roleRequested}</strong>.
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Requested on: {new Date(req.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div className="mt-2 md:mt-0 space-x-2">
                                    <button
                                        onClick={() => handleResponse(req._id, 'accepted')}
                                        className="btn-primary px-4 py-1 rounded"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => handleResponse(req._id, 'rejected')}
                                        className="btn-secondary px-4 py-1 rounded"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Requests;
