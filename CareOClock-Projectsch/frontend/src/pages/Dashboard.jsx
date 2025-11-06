// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { intakeApi } from '../api/intakeApi';
import { medicineApi } from '../api/medicineApi';
import { appointmentApi } from '../api/appointmentApi';
import { alertApi } from '../api/alertApi';
import { useFetch } from '../hooks/useFetch';

// Components
import DailyQuote from '../components/DailyQuote';
import StreakTracker from '../components/StreakTracker';
import ExercisePlan from '../components/ExercisePlan';
import AppointmentCard from '../components/AppointmentCard';
import SkeletonLoader from '../components/SkeletonLoader';

const Dashboard = () => {
    const { user } = useAuth();
    const [todaySchedule, setTodaySchedule] = useState([]);
    const [adherenceStats, setAdherenceStats] = useState({});
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reminderAlert, setReminderAlert] = useState(null);
    const [showAlert, setShowAlert] = useState(false);


    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                const [scheduleRes, adherenceRes, appointmentsRes, alertsRes] = await Promise.all([
                    intakeApi.getTodaySchedule(),
                    intakeApi.getAdherenceStats(null, 30),
                    appointmentApi.getAppointments(true, 7), // Next 7 days
                    alertApi.getAlerts()
                ]);

                setTodaySchedule(scheduleRes.data.schedule || []);
                setAdherenceStats(adherenceRes.data || {});
                setUpcomingAppointments(appointmentsRes.data.appointments || []);
                setAlerts(alertsRes.data.alerts || []);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    useEffect(() => {
        if (todaySchedule.length === 0) return;

        let timers = [];

        todaySchedule.forEach(item => {
            const [hours, minutes] = item.scheduledTime.split(':').map(Number);
            const now = new Date();
            const scheduledDateTime = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                hours,
                minutes
            );

            // Set alert 5 minutes before scheduledTime
            const alertTime = new Date(scheduledDateTime.getTime() - 5 * 60000);

            const timeoutDuration = alertTime.getTime() - now.getTime();

            if (timeoutDuration > 0) {
                const timerId = setTimeout(() => {
                    setReminderAlert(item);
                    setShowAlert(true);
                }, timeoutDuration);
                timers.push(timerId);
            }
        });

        return () => {
            timers.forEach(timerId => clearTimeout(timerId));
        };
    }, [todaySchedule]);

    // Alert popup component definition
    const ReminderAlert = ({ medicineName, scheduledTime, onClose }) => (
        <div className="fixed top-20 right-4 max-w-sm bg-white shadow-lg rounded-xl p-4 border-l-4 border-blue-500 animate-slideIn">
            <div className="flex items-center space-x-4">
                <div className="text-blue-500">
                    <svg /* medication icon svg */ className="w-8 h-8" /* ... */ />
                </div>
                <div>
                    <p className="font-semibold text-lg text-gray-900">
                        Reminder: {medicineName}
                    </p>
                    <p className="text-gray-600">Time to take medicine at {scheduledTime}</p>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label="Close"
                >
                    ✕
                </button>
            </div>
        </div>
    );

    // Handle medicine intake
    const handleTakeMedicine = async (medicineId, scheduledTime) => {
        try {
            await intakeApi.logIntake({
                medicineId,
                scheduledTime,
                status: 'taken'
            });

            // Refresh today's schedule
            const scheduleRes = await intakeApi.getTodaySchedule();
            setTodaySchedule(scheduleRes.data.schedule || []);

            // Refresh adherence stats
            const adherenceRes = await intakeApi.getAdherenceStats(null, 30);
            setAdherenceStats(adherenceRes.data || {});

        } catch (error) {
            console.error('Error logging medicine intake:', error);
        }
    };

    const handleSkipMedicine = async (medicineId, scheduledTime) => {
        try {
            await intakeApi.logIntake({
                medicineId,
                scheduledTime,
                status: 'skipped'
            });

            // Refresh today's schedule
            const scheduleRes = await intakeApi.getTodaySchedule();
            setTodaySchedule(scheduleRes.data.schedule || []);

        } catch (error) {
            console.error('Error skipping medicine:', error);
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <SkeletonLoader lines={8} height="h-32" />
            </div>
        );
    }

    const pendingMedicines = todaySchedule.filter(item => item.status === 'pending');
    const completedMedicines = todaySchedule.filter(item => item.status === 'taken');
    const totalMedicines = todaySchedule.length;
    const completionPercentage = totalMedicines > 0 ? (completedMedicines.length / totalMedicines) * 100 : 0;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {showAlert && reminderAlert && (
                <ReminderAlert
                    medicineName={reminderAlert.medicineName}
                    scheduledTime={reminderAlert.scheduledTime}
                    onClose={() => setShowAlert(false)}
                />
            )}
            {/* Welcome Header */}
            <div className="mb-8">
                <h1 className="text-elderly-3xl font-bold text-gray-900 mb-2">
                    Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.name}!
                </h1>
                <p className="text-elderly-lg text-gray-600">
                    Here's your health summary for today, {new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </p>
            </div>

            {/* Alert Banner */}
            {alerts.length > 0 && (
                <div className="mb-8">
                    <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-lg">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-elderly-lg font-medium text-red-800">
                                    Important Alerts ({alerts.length})
                                </h3>
                                <div className="mt-2 space-y-2">
                                    {alerts.slice(0, 3).map((alert, index) => (
                                        <p key={index} className="text-elderly-base text-red-700">
                                            • {alert.message}
                                        </p>
                                    ))}
                                    {alerts.length > 3 && (
                                        <p className="text-elderly-base text-red-600 font-medium">
                                            + {alerts.length - 3} more alerts
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="card-elderly bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-500 text-white mr-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 8.172V5L8 4z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-elderly-2xl font-bold text-blue-700">{totalMedicines}</p>
                            <p className="text-elderly-base text-blue-600">Today's Medicines</p>
                        </div>
                    </div>
                </div>

                <div className="card-elderly bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-500 text-white mr-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-elderly-2xl font-bold text-green-700">{completedMedicines.length}</p>
                            <p className="text-elderly-base text-green-600">Completed</p>
                        </div>
                    </div>
                </div>

                <div className="card-elderly bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-500">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-yellow-500 text-white mr-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-elderly-2xl font-bold text-yellow-700">{pendingMedicines.length}</p>
                            <p className="text-elderly-base text-yellow-600">Pending</p>
                        </div>
                    </div>
                </div>

                <div className="card-elderly bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-purple-500 text-white mr-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-elderly-2xl font-bold text-purple-700">{Math.round(completionPercentage)}%</p>
                            <p className="text-elderly-base text-purple-600">Adherence</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Today's Medicine Schedule */}
                    <div className="card-elderly">
                        <h2 className="text-elderly-2xl font-bold text-gray-800 mb-6">Today's Medicine Schedule</h2>

                        {todaySchedule.length > 0 ? (
                            <div className="space-y-4">
                                {todaySchedule.map((item, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-lg border-2 transition-all duration-200 ${item.status === 'taken'
                                            ? 'bg-green-50 border-green-200'
                                            : item.status === 'pending'
                                                ? 'bg-yellow-50 border-yellow-200'
                                                : 'bg-gray-50 border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.status === 'taken' ? 'bg-green-500' : 'bg-gray-300'
                                                    }`}>
                                                    {item.status === 'taken' ? (
                                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 8.172V5L8 4z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="text-elderly-lg font-semibold text-gray-800">
                                                        {item.medicineName}
                                                    </h3>
                                                    <p className="text-elderly-base text-gray-600">
                                                        {item.dosage} • {item.scheduledTime}
                                                    </p>
                                                </div>
                                            </div>

                                            {item.status === 'pending' && (
                                                <div className="flex space-x-3">
                                                    <button
                                                        onClick={() => handleTakeMedicine(item.medicineId, item.scheduledTime)}
                                                        className="btn-success px-6 py-3"
                                                    >
                                                        ✓ Take
                                                    </button>
                                                    <button
                                                        onClick={() => handleSkipMedicine(item.medicineId, item.scheduledTime)}
                                                        className="btn-secondary px-6 py-3"
                                                    >
                                                        Skip
                                                    </button>
                                                </div>
                                            )}

                                            {item.status === 'taken' && (
                                                <span className="text-elderly-base font-medium text-green-600">
                                                    ✓ Completed
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="text-4xl mb-4">💊</div>
                                <p className="text-elderly-lg text-gray-600">
                                    No medicines scheduled for today
                                </p>
                                <p className="text-elderly-base text-gray-500 mt-2">
                                    Visit the Medicine Management page to add your medications
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Upcoming Appointments */}
                    <div className="card-elderly">
                        <h2 className="text-elderly-2xl font-bold text-gray-800 mb-6">Upcoming Appointments</h2>

                        {upcomingAppointments.length > 0 ? (
                            <div className="space-y-4">
                                {upcomingAppointments.slice(0, 3).map((appointment) => (
                                    <AppointmentCard
                                        key={appointment._id}
                                        appointment={appointment}
                                        showActions={false}
                                    />
                                ))}

                                {upcomingAppointments.length > 3 && (
                                    <div className="text-center pt-4">
                                        <p className="text-elderly-base text-gray-600">
                                            + {upcomingAppointments.length - 3} more appointments
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="text-4xl mb-4">📅</div>
                                <p className="text-elderly-lg text-gray-600">
                                    No upcoming appointments
                                </p>
                                <p className="text-elderly-base text-gray-500 mt-2">
                                    Visit the Calendar page to schedule appointments
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Daily Quote */}
                    <DailyQuote />

                    {/* Streak Tracker */}
                    <StreakTracker
                        currentStreak={adherenceStats.streak?.currentStreak || 0}
                        longestStreak={adherenceStats.streak?.longestStreak || 0}
                    />

                    {/* Exercise Plan */}
                    <ExercisePlan />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
