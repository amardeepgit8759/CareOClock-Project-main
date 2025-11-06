// frontend/src/pages/Calendar.jsx
import React, { useState, useEffect } from 'react';
import { appointmentApi } from '../api/appointmentApi';
import AppointmentCard from '../components/AppointmentCard';
import SkeletonLoader from '../components/SkeletonLoader';

const Calendar = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        appointmentDate: '',
        appointmentTime: '',
        type: 'routine-checkup',
        description: '',
        location: 'clinic',
        doctorId: '', // Would normally be populated from a doctor list
        duration: 30
    });

    const appointmentTypes = [
        { value: 'routine-checkup', label: 'Routine Checkup' },
        { value: 'follow-up', label: 'Follow-up' },
        { value: 'consultation', label: 'Consultation' },
        { value: 'medication-review', label: 'Medication Review' },
        { value: 'lab-results', label: 'Lab Results' },
        { value: 'urgent-care', label: 'Urgent Care' },
        { value: 'telehealth', label: 'Telehealth' },
        { value: 'other', label: 'Other' }
    ];

    const locationTypes = [
        { value: 'clinic', label: 'Clinic' },
        { value: 'hospital', label: 'Hospital' },
        { value: 'home-visit', label: 'Home Visit' },
        { value: 'telehealth', label: 'Telehealth' },
        { value: 'other', label: 'Other' }
    ];

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const response = await appointmentApi.getAppointments(false, 90); // Get all appointments for 90 days
            setAppointments(response.data.appointments || []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const appointmentData = {
                ...formData,
                patientId: 'current-user', // This would be handled by the backend
                doctorId: formData.doctorId || 'default-doctor', // Placeholder
                duration: parseInt(formData.duration)
            };

            if (editingAppointment) {
                await appointmentApi.updateAppointment(editingAppointment._id, appointmentData);
            } else {
                await appointmentApi.createAppointment(appointmentData);
            }

            setShowAddForm(false);
            setEditingAppointment(null);
            resetForm();
            fetchAppointments();

        } catch (error) {
            console.error('Error saving appointment:', error);
        }
    };

    const handleEdit = (appointment) => {
        setEditingAppointment(appointment);
        setFormData({
            title: appointment.title || '',
            appointmentDate: appointment.appointmentDate.split('T')[0] || '',
            appointmentTime: appointment.appointmentTime || '',
            type: appointment.type || 'routine-checkup',
            description: appointment.description || '',
            location: appointment.location || 'clinic',
            doctorId: appointment.doctorId || '',
            duration: appointment.duration || 30
        });
        setShowAddForm(true);
    };

    const handleDelete = async (appointmentId) => {
        if (window.confirm('Are you sure you want to cancel this appointment?')) {
            try {
                await appointmentApi.deleteAppointment(appointmentId);
                fetchAppointments();
            } catch (error) {
                console.error('Error deleting appointment:', error);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            appointmentDate: '',
            appointmentTime: '',
            type: 'routine-checkup',
            description: '',
            location: 'clinic',
            doctorId: '',
            duration: 30
        });
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Group appointments by month
    const groupedAppointments = appointments.reduce((groups, appointment) => {
        const date = new Date(appointment.appointmentDate);
        const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

        if (!groups[monthKey]) {
            groups[monthKey] = [];
        }

        groups[monthKey].push(appointment);
        return groups;
    }, {});

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <SkeletonLoader lines={6} height="h-32" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-elderly-3xl font-bold text-gray-900">Appointment Calendar</h1>
                    <p className="text-elderly-lg text-gray-600 mt-2">
                        Manage your doctor appointments and medical visits
                    </p>
                </div>
                <button
                    onClick={() => {
                        setShowAddForm(true);
                        setEditingAppointment(null);
                        resetForm();
                    }}
                    className="btn-primary"
                >
                    Schedule Appointment
                </button>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className="card-elderly mb-8">
                    <h2 className="text-elderly-2xl font-bold text-gray-800 mb-6">
                        {editingAppointment ? 'Edit Appointment' : 'Schedule New Appointment'}
                    </h2>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                Appointment Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                required
                                className="input-elderly"
                                placeholder="e.g., Annual Checkup"
                                value={formData.title}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                Appointment Type *
                            </label>
                            <select
                                name="type"
                                required
                                className="input-elderly"
                                value={formData.type}
                                onChange={handleChange}
                            >
                                {appointmentTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                Date *
                            </label>
                            <input
                                type="date"
                                name="appointmentDate"
                                required
                                className="input-elderly"
                                min={new Date().toISOString().split('T')[0]}
                                value={formData.appointmentDate}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                Time *
                            </label>
                            <input
                                type="time"
                                name="appointmentTime"
                                required
                                className="input-elderly"
                                value={formData.appointmentTime}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                Location *
                            </label>
                            <select
                                name="location"
                                required
                                className="input-elderly"
                                value={formData.location}
                                onChange={handleChange}
                            >
                                {locationTypes.map(location => (
                                    <option key={location.value} value={location.value}>
                                        {location.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                Duration (minutes)
                            </label>
                            <select
                                name="duration"
                                className="input-elderly"
                                value={formData.duration}
                                onChange={handleChange}
                            >
                                <option value={15}>15 minutes</option>
                                <option value={30}>30 minutes</option>
                                <option value={45}>45 minutes</option>
                                <option value={60}>1 hour</option>
                                <option value={90}>1.5 hours</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                Description/Notes
                            </label>
                            <textarea
                                name="description"
                                rows="3"
                                className="input-elderly"
                                placeholder="Additional details about the appointment"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="md:col-span-2 flex space-x-4">
                            <button type="submit" className="btn-primary">
                                {editingAppointment ? 'Update Appointment' : 'Schedule Appointment'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddForm(false);
                                    setEditingAppointment(null);
                                }}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Appointments List */}
            <div className="space-y-8">
                {Object.keys(groupedAppointments).length > 0 ? (
                    Object.entries(groupedAppointments)
                        .sort(([a], [b]) => new Date(a) - new Date(b))
                        .map(([month, monthAppointments]) => (
                            <div key={month}>
                                <h2 className="text-elderly-2xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
                                    {month}
                                </h2>
                                <div className="space-y-4">
                                    {monthAppointments
                                        .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
                                        .map((appointment) => (
                                            <AppointmentCard
                                                key={appointment._id}
                                                appointment={appointment}
                                                onEdit={handleEdit}
                                                onDelete={handleDelete}
                                                showActions={true}
                                            />
                                        ))}
                                </div>
                            </div>
                        ))
                ) : (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📅</div>
                        <h3 className="text-elderly-2xl font-bold text-gray-800 mb-2">
                            No appointments scheduled
                        </h3>
                        <p className="text-elderly-lg text-gray-600 mb-6">
                            Schedule your first appointment to get started
                        </p>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="btn-primary"
                        >
                            Schedule Your First Appointment
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Calendar;
