// frontend/src/pages/PatientDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { intakeApi } from '../api/intakeApi';
import { healthApi } from '../api/healthApi';
import { medicineApi } from '../api/medicineApi';
import { alertApi } from '../api/alertApi';
import ChartComponent from '../components/ChartComponent';
import SkeletonLoader from '../components/SkeletonLoader';
import axios from 'axios';

const PatientDetailsPage = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // State management
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState(null);
    const [patientMedicines, setPatientMedicines] = useState([]);
    const [adherenceData, setAdherenceData] = useState(null);
    const [healthRecords, setHealthRecords] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [todaySchedule, setTodaySchedule] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    console.log("fetching id ", patientId);

    useEffect(() => {
        if (patientId) {
            fetchPatientDetails();
        }
    }, [patientId]);

    const fetchUserById = async (id) => {
        try {
            const response = await axios.get(`/api/users/${id}`);
            console.log('User API response:', response.data);
            return response.data.user;
        } catch (error) {
            console.error('Error fetching user:', error);
            return null;
        }
    };


    const fetchPatientDetails = async () => {
        try {
            setLoading(true);

            const [
                medicinesRes,
                adherenceRes,
                healthRes,
                alertsRes,
                scheduleRes
            ] = await Promise.all([
                medicineApi.getMedicines(patientId),
                intakeApi.getAdherenceStats(patientId, 30),
                healthApi.getHealthRecords(patientId, 30),
                alertApi.getAlerts(),
                intakeApi.getTodaySchedule(patientId)
            ]);

            setPatientMedicines(medicinesRes.data.medicines || []);
            setAdherenceData(adherenceRes.data || {});
            setHealthRecords(healthRes.data.records || []);
            setAlerts(alertsRes.data.alerts?.filter(alert => alert.userId === patientId) || []);
            setTodaySchedule(scheduleRes.data.schedule || []);

            // Real patient info fetch
            const user = await fetchUserById(patientId);
            console.log('Setting patient to:', user);
            setPatient(user);

        } catch (error) {
            console.error('Error fetching patient details:', error);
        } finally {
            setLoading(false);
        }
    };

    // Prepare chart data
    const adherenceChartData = healthRecords.map(record => ({
        date: new Date(record.date).toLocaleDateString(),
        adherence: Math.random() * 100 // Mock data - replace with actual adherence calculation
    })).slice(-14);

    const bpChartData = healthRecords
        .filter(record => record.bloodPressure?.systolic)
        .map(record => ({
            date: new Date(record.date).toLocaleDateString(),
            systolic: record.bloodPressure.systolic,
            diastolic: record.bloodPressure.diastolic
        }))
        .slice(-14);

    const sugarChartData = healthRecords
        .filter(record => record.bloodSugar?.value)
        .map(record => ({
            date: new Date(record.date).toLocaleDateString(),
            value: record.bloodSugar.value
        }))
        .slice(-14);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <SkeletonLoader lines={8} height="h-32" />
            </div>
        );
    }

    if (!patient) {
        console.log("This is patiend", patient);

        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center">
                    <h2 className="text-elderly-2xl font-bold text-gray-800 mb-4">Patient Not Found</h2>
                    <button onClick={() => navigate(-1)} className="btn-primary">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const pendingMedicines = todaySchedule.filter(item => item.status === 'pending').length;
    const completedMedicines = todaySchedule.filter(item => item.status === 'taken').length;
    const adherenceRate = adherenceData.overall?.adherenceRate || 0;
    const criticalAlerts = alerts.filter(alert => alert.severity === 'critical' || alert.severity === 'high').length;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate(-1)} className="btn-secondary">
                        ← Back
                    </button>
                    <div>
                        <h1 className="text-elderly-3xl font-bold text-gray-900">{patient.name}</h1>
                        <p className="text-elderly-lg text-gray-600">Patient Details & Care Management</p>
                    </div>
                </div>

                {criticalAlerts > 0 && (
                    <div className="bg-red-100 border border-red-300 rounded-lg px-4 py-2">
                        <span className="text-red-800 font-medium">
                            🚨 {criticalAlerts} Critical Alert{criticalAlerts > 1 ? 's' : ''}
                        </span>
                    </div>
                )}
            </div>

            {/* Patient Info Card */}
            <div className="card-elderly mb-8 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <h3 className="text-elderly-lg font-semibold text-gray-800 mb-3">Personal Information</h3>
                        <div className="space-y-2">
                            <p><span className="font-medium">Age:</span> {patient.age} years</p>
                            <p><span className="font-medium">Email:</span> {patient.email}</p>
                            <p><span className="font-medium">Phone:</span> {patient.phone}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-elderly-lg font-semibold text-gray-800 mb-3">Medical Conditions</h3>
                        <div className="flex flex-wrap gap-2">
                            {patient.conditions.map((condition, index) => (
                                <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                    {condition}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-elderly-lg font-semibold text-gray-800 mb-3">Emergency Contact</h3>
                        <div className="space-y-2">
                            <p><span className="font-medium">Name:</span> {patient.emergencyContact.name}</p>
                            <p><span className="font-medium">Phone:</span> {patient.emergencyContact.phone}</p>
                            <p><span className="font-medium">Relation:</span> {patient.emergencyContact.relationship}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <MetricCard
                    title="Adherence Rate"
                    value={`${Math.round(adherenceRate)}%`}
                    color={adherenceRate >= 90 ? 'green' : adherenceRate >= 70 ? 'yellow' : 'red'}
                    icon="📊"
                />
                <MetricCard
                    title="Today's Medicines"
                    value={todaySchedule.length}
                    color="blue"
                    icon="💊"
                />
                <MetricCard
                    title="Completed Today"
                    value={completedMedicines}
                    color="green"
                    icon="✅"
                />
                <MetricCard
                    title="Active Alerts"
                    value={alerts.length}
                    color={alerts.length > 0 ? 'red' : 'gray'}
                    icon="🚨"
                />
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200 mb-8">
                <nav className="-mb-px flex space-x-8">
                    {['overview', 'medicines', 'health', 'schedule', 'alerts'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ChartComponent
                            type="line"
                            data={adherenceChartData}
                            title="Adherence Trends (Last 14 Days)"
                            xAxisKey="date"
                            yAxisKey="adherence"
                            color="#3B82F6"
                            height={300}
                        />
                        <ChartComponent
                            type="line"
                            data={bpChartData}
                            title="Blood Pressure Trends"
                            xAxisKey="date"
                            yAxisKey="systolic"
                            color="#EF4444"
                            height={300}
                        />
                    </div>
                )}

                {activeTab === 'medicines' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {patientMedicines.map((medicine) => (
                            <MedicineCard key={medicine._id} medicine={medicine} />
                        ))}
                        {patientMedicines.length === 0 && (
                            <p className="col-span-full text-center text-gray-500 py-8">No medicines found for this patient.</p>
                        )}
                    </div>
                )}

                {activeTab === 'health' && (
                    <div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <ChartComponent
                                type="line"
                                data={bpChartData}
                                title="Blood Pressure History"
                                xAxisKey="date"
                                yAxisKey="systolic"
                                color="#EF4444"
                                height={300}
                            />
                            <ChartComponent
                                type="bar"
                                data={sugarChartData}
                                title="Blood Sugar History"
                                xAxisKey="date"
                                yAxisKey="value"
                                color="#10B981"
                                height={300}
                            />
                        </div>

                        <div className="card-elderly">
                            <h3 className="text-elderly-lg font-semibold text-gray-800 mb-4">Recent Health Records</h3>
                            {healthRecords.length > 0 ? (
                                <div className="space-y-3">
                                    {healthRecords.slice(0, 5).map((record, index) => (
                                        <HealthRecordRow key={index} record={record} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-4">No health records available.</p>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'schedule' && (
                    <div className="card-elderly">
                        <h3 className="text-elderly-lg font-semibold text-gray-800 mb-4">Today's Medicine Schedule</h3>
                        {todaySchedule.length > 0 ? (
                            <div className="space-y-4">
                                {todaySchedule.map((item, index) => (
                                    <ScheduleItem key={index} item={item} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-4">No medicines scheduled for today.</p>
                        )}
                    </div>
                )}

                {activeTab === 'alerts' && (
                    <div className="space-y-4">
                        {alerts.length > 0 ? (
                            alerts.map((alert, index) => (
                                <AlertCard key={index} alert={alert} />
                            ))
                        ) : (
                            <div className="card-elderly text-center py-8">
                                <div className="text-4xl mb-4">✅</div>
                                <p className="text-elderly-lg text-gray-600">No active alerts</p>
                                <p className="text-elderly-base text-gray-500">This patient is doing well!</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper Components
const MetricCard = ({ title, value, color, icon }) => {
    const colorClasses = {
        green: 'from-green-50 to-green-100 border-green-500 text-green-700 text-green-600',
        yellow: 'from-yellow-50 to-yellow-100 border-yellow-500 text-yellow-700 text-yellow-600',
        red: 'from-red-50 to-red-100 border-red-500 text-red-700 text-red-600',
        blue: 'from-blue-50 to-blue-100 border-blue-500 text-blue-700 text-blue-600',
        gray: 'from-gray-50 to-gray-100 border-gray-500 text-gray-700 text-gray-600'
    };

    const classes = colorClasses[color] || colorClasses.gray;
    const [bg, border, titleColor, valueColor] = classes.split(' ');

    return (
        <div className={`card-elderly bg-gradient-to-br ${bg} border-l-4 ${border}`}>
            <div className="flex items-center justify-between">
                <div>
                    <div className={`text-elderly-2xl font-bold ${titleColor} mb-1`}>{value}</div>
                    <div className={`text-elderly-base ${valueColor}`}>{title}</div>
                </div>
                <div className="text-2xl">{icon}</div>
            </div>
        </div>
    );
};

const MedicineCard = ({ medicine }) => (
    <div className="card-elderly">
        <h4 className="text-elderly-lg font-semibold text-gray-800 mb-2">{medicine.name}</h4>
        <div className="space-y-2">
            <p><span className="font-medium">Dosage:</span> {medicine.dosage}</p>
            <p><span className="font-medium">Frequency:</span> {medicine.frequency}</p>
            <p><span className="font-medium">Stock:</span> {medicine.stock} {medicine.unit}</p>
            {medicine.condition && (
                <p><span className="font-medium">For:</span> {medicine.condition}</p>
            )}
        </div>
        {medicine.stock <= medicine.lowStockAlert && (
            <div className="mt-3 bg-red-100 border border-red-300 rounded px-3 py-2">
                <span className="text-red-800 text-sm font-medium">⚠️ Low Stock Alert</span>
            </div>
        )}
    </div>
);

const HealthRecordRow = ({ record }) => (
    <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-start mb-2">
            <span className="font-medium text-gray-800">
                {new Date(record.date).toLocaleDateString()}
            </span>
            {record.hasAbnormalReading && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Alert</span>
            )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {record.bloodPressure?.systolic && (
                <div>
                    <span className="text-gray-600">BP:</span>
                    <span className="ml-1 font-medium">
                        {record.bloodPressure.systolic}/{record.bloodPressure.diastolic}
                    </span>
                </div>
            )}
            {record.bloodSugar?.value && (
                <div>
                    <span className="text-gray-600">Sugar:</span>
                    <span className="ml-1 font-medium">{record.bloodSugar.value}</span>
                </div>
            )}
            {record.heartRate?.value && (
                <div>
                    <span className="text-gray-600">HR:</span>
                    <span className="ml-1 font-medium">{record.heartRate.value}</span>
                </div>
            )}
            {record.weight?.value && (
                <div>
                    <span className="text-gray-600">Weight:</span>
                    <span className="ml-1 font-medium">{record.weight.value} {record.weight.unit}</span>
                </div>
            )}
        </div>
        {record.notes && (
            <p className="text-sm text-gray-600 mt-2 italic">"{record.notes}"</p>
        )}
    </div>
);

const ScheduleItem = ({ item }) => (
    <div className={`p-4 rounded-lg border-2 ${item.status === 'taken'
        ? 'bg-green-50 border-green-200'
        : item.status === 'pending'
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-gray-50 border-gray-200'
        }`}>
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.status === 'taken' ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                    {item.status === 'taken' ? (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                </div>
                <div>
                    <h4 className="text-elderly-base font-semibold text-gray-800">{item.medicineName}</h4>
                    <p className="text-elderly-base text-gray-600">{item.dosage} • {item.scheduledTime}</p>
                </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${item.status === 'taken'
                ? 'bg-green-100 text-green-800'
                : item.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                {item.status === 'taken' ? 'Completed' : item.status === 'pending' ? 'Pending' : 'Missed'}
            </span>
        </div>
    </div>
);

const AlertCard = ({ alert }) => (
    <div className={`card-elderly border-l-4 ${alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
        alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
            alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                'border-blue-500 bg-blue-50'
        }`}>
        <div className="flex justify-between items-start">
            <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-elderly-base font-semibold text-gray-800">{alert.title}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                        }`}>
                        {alert.severity}
                    </span>
                </div>
                <p className="text-elderly-base text-gray-600 mb-2">{alert.message}</p>
                <p className="text-sm text-gray-500">{new Date(alert.createdAt).toLocaleString()}</p>
            </div>
        </div>
    </div>
);

export default PatientDetailsPage;
