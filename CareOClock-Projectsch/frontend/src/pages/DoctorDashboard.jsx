import React, { useState, useEffect } from 'react';
// --- Adjusting import paths ---
import { useAuth } from '../context/AuthContext';
import { alertApi } from '../api/alertApi';
import { userApi } from '../api/userApi';
import { intakeApi } from '../api/intakeApi'; // Added for adherence
import SkeletonLoader from '../components/SkeletonLoader';
import ChartComponent from '../components/ChartComponent';
import { useNavigate } from 'react-router-dom';

const DoctorDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [alerts, setAlerts] = useState([]);
    const [patientOverview, setPatientOverview] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch data only when user is available
        if (user?.id) {
            fetchDashboardData();
        }
    }, [user]); // Re-run if user changes

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // 1. Get Doctor's profile to find assigned patients
            const profileResponse = await userApi.getUserProfile(user.id);
            const assignedPatientsRaw = profileResponse?.data?.user?.assignedPatients || [];

            // Ensure we have a clean list of patient IDs (assuming they are strings)
            const patientIds = assignedPatientsRaw
                .map(p => (typeof p === 'object' ? p._id : p))
                .filter(id => typeof id === 'string');

            if (!patientIds.length) {
                console.warn('No assigned patients found for this doctor.');
                setLoading(false);
                return;
            }

            // 2. Create promises to fetch details for EACH patient
            const patientDetailsPromises = patientIds.map(id =>
                userApi.getPatientById(id).catch(() => null)
            );
            const adherencePromises = patientIds.map(id =>
                intakeApi.getAdherenceStats(id, 30).catch(() => null)
            );
            const alertPromises = patientIds.map(id =>
                alertApi.getAlertsForPatient(id).catch(() => [])
            );

            // 3. Wait for all data to return
            const patientDetailsResults = await Promise.all(patientDetailsPromises);
            const adherenceResults = await Promise.all(adherencePromises);
            const alertResults = await Promise.all(alertPromises);

            // 4. Combine the data into the 'patientOverview' structure
            
            const combinedPatientOverview = patientDetailsResults
            .map((patientRes, index) => {
                if (!patientRes?.data?.user) return null; // Skip if patient fetch failed

                    const patient = patientRes.data.user;   
                    const adherenceData = adherenceResults[index]?.data;

                    const adherence = adherenceData?.overall?.adherenceRate ?? 0;

                    // Map adherence to the risk level used by the UI
                    const riskLevel = adherence >= 90 ? 'low' :
                        adherence >= 70 ? 'medium' :
                            'high';

                    return {
                        id: patient._id,
                        name: patient.name || 'Unnamed Patient',
                        age: patient.age || 'N/A',
                        adherence: Math.round(adherence),
                        lastVisit: patient.lastVisit || 'N/A', // Assuming 'lastVisit' is on the user model
                        conditions: patient.conditions || [], // Assuming 'conditions' is on the user model
                        riskLevel: riskLevel
                    };
                })
                .filter(Boolean); // Remove any null entries

            // 5. Set all states with real data
            setPatientOverview(combinedPatientOverview);
            setAlerts(alertResults.flat()); // Combine all alerts from all patients

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
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

    // Calculations are now based on live data
    const highRiskPatients = patientOverview.filter(p => p.riskLevel === 'high' || p.adherence < 80);
    const totalPatients = patientOverview.length;
    const avgAdherence = totalPatients > 0
        ? Math.round(patientOverview.reduce((sum, p) => sum + p.adherence, 0) / totalPatients)
        : 0;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-elderly-3xl font-bold text-gray-900 mb-2">
                    Doctor Dashboard
                </h1>
                <p className="text-elderly-lg text-gray-600">
                    Clinical overview and patient management
                </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="card-elderly bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
                    <div className="text-center">
                        <div className="text-elderly-3xl font-bold text-blue-700 mb-2">
                            {totalPatients}
                        </div>
                        <div className="text-elderly-base text-blue-600">
                            Total Patients
                        </div>
                    </div>
                </div>

                <div className="card-elderly bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
                    <div className="text-center">
                        <div className="text-elderly-3xl font-bold text-green-700 mb-2">
                            {avgAdherence}%
                        </div>
                        <div className="text-elderly-base text-green-600">
                            Avg Adherence
                        </div>
                    </div>
                </div>

                <div className="card-elderly bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-red-500">
                    <div className="text-center">
                        <div className="text-elderly-3xl font-bold text-red-700 mb-2">
                            {highRiskPatients.length}
                        </div>
                        <div className="text-elderly-base text-red-600">
                            High Risk
                        </div>
                    </div>
                </div>

                <div className="card-elderly bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
                    <div className="text-center">
                        <div className="text-elderly-3xl font-bold text-purple-700 mb-2">
                            {alerts.length}
                        </div>
                        <div className="text-elderly-base text-purple-600">
                            Active Alerts
                        </div>
                    </div>
                </div>
            </div>

            {/* High Risk Patients Alert */}
            {highRiskPatients.length > 0 && (
                <div className="mb-8">
                    <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-lg">
                        <h3 className="text-elderly-lg font-medium text-red-800 mb-4">
                            ⚠️ Patients Requiring Attention ({highRiskPatients.length})
                        </h3>
                        <div className="space-y-2">
                            {highRiskPatients.map((patient, index) => (
                                <p key={patient.id || index} className="text-elderly-base text-red-700">
                                    {/* --- TEXT UPDATED HERE --- */}
                                    • {patient.name} - {patient.adherence}% adherence rate
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Patient Overview */}
                <div className="card-elderly">
                    <h2 className="text-elderly-2xl font-bold text-gray-800 mb-6">
                        Patient Overview
                    </h2>

                    <div className="space-y-4">
                        {patientOverview.map((patient, index) => (
                            <div key={patient.id || index} className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="text-elderly-lg font-semibold text-gray-800">
                                            {patient.name}
                                        </h4>
                                        <p className="text-elderly-base text-gray-600">
                                            {/* Handle N/A values for age and last visit */}
                                            Age {patient.age} • Last visit: {patient.lastVisit !== 'N/A' ? new Date(patient.lastVisit).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>

                                    <div className={`px-2 py-1 rounded text-sm font-medium ${patient.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                                        patient.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                        {patient.riskLevel} risk
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-elderly-base text-gray-600">Adherence:</span>
                                    <span className={`text-elderly-base font-medium ${patient.adherence >= 90 ? 'text-green-600' :
                                        patient.adherence >= 70 ? 'text-yellow-600' : 'text-red-600'
                                        }`}>
                                        {patient.adherence}%
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-2 mt-3">
                                    {patient.conditions.map((condition, idx) => (
                                        <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                            {condition}
                                        </span>
                                    ))}
                                </div>

                                <button onClick={() => navigate(`/patients/${patient.id}`)}
                                    className="btn-primary w-full mt-4">
                                    View Patient Details
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Alerts */}
                <div className="card-elderly">
                    <h2 className="text-elderly-2xl font-bold text-gray-800 mb-6">
                        Clinical Alerts
                    </h2>

                    {alerts.length > 0 ? (
                        <div className="space-y-4">
                            {alerts.slice(0, 5).map((alert, index) => (
                                <div key={alert._id || index} className={`p-4 rounded-lg border-l-4 ${alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                                    alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                                        'border-yellow-500 bg-yellow-50'
                                    }`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-elderly-base font-medium text-gray-800">
                                            {alert.title}
                                        </h4>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                            alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {alert.severity}
                                        </span>
                                    </div>

                                    <p className="text-elderly-base text-gray-600 mb-2">
                                        {alert.message}
                                    </p>

                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">
                                            {new Date(alert.createdAt).toLocaleString()}
                                        </span>
                                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                            Review →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-4">🩺</div>
                            <p className="text-elderly-lg text-gray-600">
                                No clinical alerts
                            </p>
                            <p className="text-elderly-base text-gray-500 mt-2">
                                All patients are stable
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;