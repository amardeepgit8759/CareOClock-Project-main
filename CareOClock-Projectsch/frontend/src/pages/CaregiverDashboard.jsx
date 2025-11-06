import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/userApi';
import { alertApi } from '../api/alertApi';
import { intakeApi } from '../api/intakeApi';
import { appointmentApi } from '../api/appointmentApi';
import SkeletonLoader from '../components/SkeletonLoader';

const CaregiverDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [alerts, setAlerts] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [patientStats, setPatientStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user?.id) {
            fetchDashboardData();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Fetch caregiver profile and assigned patients
            const profileResponse = await userApi.getUserProfile(user.id);
            if (!profileResponse?.data?.user) {
                throw new Error('User data missing in profile response');
            }
            const assignedPatientsRaw = profileResponse.data.user.assignedPatients || [];

            let assignedPatients = [];
            if (assignedPatientsRaw.length) {
                if (typeof assignedPatientsRaw[0] === 'string') {
                    const patientsResults = await Promise.all(
                        assignedPatientsRaw.map(id => userApi.getPatientById(id).catch(() => null))
                    );
                    assignedPatients = patientsResults
                        .filter(p => p?.data?.user)
                        .map(p => {
                            const patient = p.data.user;
                            return {
                                _id: patient._id || patient.id,
                                name: patient.name || 'Unnamed Patient',
                            };
                        });
                } else if (typeof assignedPatientsRaw[0] === 'object') {
                    assignedPatients = assignedPatientsRaw
                        .filter(p => p && (p._id || p.id))
                        .map(p => ({
                            _id: p._id || p.id,
                            name: p.name || 'Unnamed Patient',
                        }));
                }
            }

            assignedPatients = assignedPatients.filter(p => p._id);

            if (!assignedPatients.length) {
                console.warn('No valid assigned patients found');
            }

            // 2. Fetch adherence stats per patient with error catch
            const adherencePromises = assignedPatients.map(patient =>
                intakeApi.getAdherenceStats(patient._id, 30).catch(() => null)
            );
            const adherenceResults = await Promise.all(adherencePromises);

            // 3. Fetch alerts per patient with error catch
            const alertPromises = assignedPatients.map(patient =>
                alertApi.getAlertsForPatient(patient._id).catch(() => [])
            );
            const alertResults = await Promise.all(alertPromises);
            const allAlerts = alertResults.flat();

            // 4. Fetch appointments per patient with error catch
            const appointmentPromises = assignedPatients.map(patient =>
                appointmentApi.getAppointmentsByPatientId(patient._id).catch(() => ({ data: { appointments: [] } }))
            );
            const appointmentResults = await Promise.all(appointmentPromises);

            // Flatten nested appointment arrays from each response
            const allAppointments = appointmentResults.flatMap(res =>
                res?.data?.appointments || []
            );

            // 5. Enrich appointments with patient details and fallbacks
            const enrichedAppointments = allAppointments.map(appt => {
                // Handle if patientId is an object { _id: '...' } or just a string '...'
                const patientIdStr = typeof appt.patientId === 'object'
                    ? appt.patientId?._id
                    : appt.patientId;

                // Find the patient from the list you already fetched
                const patient = assignedPatients.find(p => p._id === patientIdStr);

                return {
                    ...appt,
                    // Use the name from your list, or a fallback
                    patientName: patient ? patient.name : 'Unknown Patient',
                    title: appt.title || 'Appointment',
                    description: appt.description || 'No description',
                    date: appt.appointmentDate ? new Date(appt.appointmentDate) : null,
                    time: appt.appointmentTime || 'Time not specified',
                    location: appt.location || 'Location not specified',
                    status: appt.status || 'Unknown',
                };
            });

            // Sort the final combined list (Promise.all doesn't guarantee order)
            const sortedAppointments = enrichedAppointments.sort((a, b) =>
                a.date - b.date // Sort by date object (earliest first)
            );

            // 6. Compose patient stats including adherence, streaks, alerts counts
            const patientStats = assignedPatients.map((patient, i) => {
                const adherenceData = adherenceResults[i]?.data || {};
                const overall = adherenceData.overall || {};
                const streak = adherenceData.streak || {};

                const adherence = overall.adherenceRate ?? 0;
                const totalIntakes = overall.totalIntakes ?? 0;
                const takenIntakes = overall.takenIntakes ?? 0;
                const currentStreak = streak.currentStreak ?? 0;
                const longestStreak = streak.longestStreak ?? 0;

                const alertsCount = alertResults[i]?.length ?? 0;

                const status = adherence >= 90 ? 'good' : adherence >= 70 ? 'needs-attention' : 'critical';

                return {
                    id: patient._id,
                    name: patient.name,
                    adherence,
                    totalIntakes,
                    takenIntakes,
                    currentStreak,
                    longestStreak,
                    alerts: alertsCount,
                    status,
                };
            });

            // 7. Update component state
            setPatientStats(patientStats);
            setAlerts(allAlerts);
            setAppointments(sortedAppointments); // Use the sorted list
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <SkeletonLoader lines={6} height="h-32" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8 text-red-600">
                {error}
            </div>
        );
    }

    const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high');

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Caregiver Dashboard</h1>
                <p className="text-lg text-gray-600">Monitor your patients and manage their care</p>
            </div>

            {/* Critical Alerts */}
            {criticalAlerts.length > 0 && (
                <div className="mb-8 bg-red-50 border-l-4 border-red-400 p-6 rounded-r-lg">
                    <h3 className="text-lg font-medium text-red-800 mb-4">
                        🚨 Critical Alerts ({criticalAlerts.length})
                    </h3>
                    <div className="space-y-2">
                        {criticalAlerts.map((alert , index) => (
                            <p key={alert._id || index} className="text-red-700">• {alert.message}</p>
                        ))}
                    </div>
                </div>
            )}

            {/* Patient Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {patientStats.map((patient, index) => {
                    // Define colors based on adherence
                    const adherenceColor = patient.adherence >= 90 ? 'text-green-600' :
                                         patient.adherence >= 70 ? 'text-yellow-600' :
                                         'text-red-600';
                    const adherenceBg = patient.adherence >= 90 ? 'bg-green-500' :
                                        patient.adherence >= 70 ? 'bg-yellow-500' :
                                        'bg-red-500';
                    
                    // Define colors for the status dot and text
                    const statusColor = patient.status === 'good' ? 'bg-green-500' :
                                        patient.status === 'needs-attention' ? 'bg-yellow-500' :
                                        'bg-red-500';
                    const statusTextColor = patient.status === 'good' ? 'text-green-700' :
                                            patient.status === 'needs-attention' ? 'text-yellow-700' :
                                            'text-red-700';

                    return (
                        <div key={patient.id || patient._id || index} className="card-elderly p-5 rounded-lg shadow-lg bg-white flex flex-col h-full justify-between transition-all duration-300 hover:shadow-xl">
                            
                            {/* Card Content */}
                            <div className="flex-grow">
                                {/* Header: Name and Status */}
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-gray-800">{patient.name}</h3>
                                    <div className="flex items-center space-x-2">
                                        <span className={`text-xs font-medium capitalize ${statusTextColor}`}>
                                            {patient.status.replace('-', ' ')}
                                        </span>
                                        <div className={`w-3 h-3 rounded-full ${statusColor}`} />
                                    </div>
                                </div>

                                {/* Primary Stat: Adherence */}
                                <div className="text-center my-4">
                                    <span className={`text-6xl font-bold ${adherenceColor}`}>
                                        {Math.round(patient.adherence)}%
                                    </span>
                                    <p className="text-lg font-medium text-gray-600">Adherence</p>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                                    <div
                                        className={`h-2.5 rounded-full ${adherenceBg} transition-all duration-500`}
                                        style={{ width: `${patient.adherence}%` }}
                                    />
                                </div>

                                {/* Secondary Stats Grid */}
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <span className={`text-3xl font-bold ${patient.alerts === 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {patient.alerts}
                                        </span>
                                        <p className="text-sm text-gray-500">Alerts</p>
                                    </div>
                                    <div>
                                        <span className="text-3xl font-bold text-blue-600">
                                            {patient.currentStreak}
                                            <span className="text-lg"> days</span>
                                        </span>
                                        <p className="text-sm text-gray-500">Streak</p>
                                    </div>
                                    <div>
                                        <span className="text-3xl font-bold text-gray-700">
                                            {patient.takenIntakes}/{patient.totalIntakes}
                                        </span>
                                        <p className="text-sm text-gray-500">Intakes</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Button */}
                            <div className="mt-6">
                                <button
                                    onClick={() => navigate(`/patients/${patient.id}`)}
                                    className="btn-primary w-full"
                                >
                                    View Patient Details
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Alerts List */}
            <div className="card-elderly p-6 rounded shadow-sm bg-white">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Alerts</h2>

                {alerts.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {alerts.slice(0, 10).map((alert , index) => (
                            <div
                                key={alert._id || index}
                                className={`p-4 rounded-lg border-l-4 ${alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                                    alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                                        alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                                            'border-blue-500 bg-blue-50'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-medium text-gray-800">{alert.title || 'Alert'}</h4>
                                        <p className="text-gray-600 mt-1">{alert.message}</p>
                                        <p className="text-sm text-gray-500 mt-2">{new Date(alert.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-600">
                        <div className="text-4xl mb-4">✅</div>
                        <p>No alerts at this time</p>
                        <p className="mt-2 text-gray-500">All patients are doing well!</p>
                    </div>
                )}
            </div>

            {/* Appointments List - ENHANCED UI */}
            <div className="card-elderly p-6 rounded shadow-sm bg-white mt-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Upcoming Patient Appointments</h2>

                {appointments.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {appointments.map(appointment => (
                            <div key={appointment._id} className="flex items-center p-4 rounded-lg bg-blue-50 border border-blue-200">
                                {/* Date Block */}
                                <div className="flex flex-col items-center justify-center w-20 bg-white rounded-lg p-2 shadow-sm border border-blue-300">
                                    <span className="text-sm font-semibold uppercase text-blue-600">
                                        {appointment.date ? appointment.date.toLocaleDateString('en-US', { month: 'short' }) : '---'}
                                    </span>
                                    <span className="text-3xl font-bold text-gray-800">
                                        {appointment.date ? appointment.date.getDate() : '??'}
                                    </span>
                                </div>

                                {/* Details Block */}
                                <div className="flex-1 ml-5">
                                    <h4 className="text-lg font-bold text-gray-900">{appointment.title}</h4>
                                    <p className="text-base font-semibold text-blue-800">{appointment.patientName}</p>

                                    <div className="flex space-x-4 mt-2 text-sm text-gray-600">
                                        <span>
                                            <strong>Time:</strong> {appointment.time}
                                        </span>
                                        <span>
                                            <strong>Location:</strong> {appointment.location}
                                        </span>
                                        <span>
                                            <strong>Status:</strong> <span className="capitalize font-medium text-gray-800">{appointment.status}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-600">
                        <div className="text-4xl mb-4">📅</div>
                        <p>No upcoming appointments</p>
                        <p className="mt-2 text-gray-500">All patient schedules are clear!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CaregiverDashboard;