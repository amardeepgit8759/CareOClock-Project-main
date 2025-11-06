// frontend/src/components/AppointmentCard.jsx
import React from 'react';
import { formatDate, formatTime } from '../utils/formatDate';

const AppointmentCard = ({
    appointment,
    onEdit,
    onDelete,
    onConfirm,
    showActions = true
}) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'scheduled':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'completed':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'routine-checkup':
                return '🏥';
            case 'follow-up':
                return '🔄';
            case 'consultation':
                return '💬';
            case 'medication-review':
                return '💊';
            case 'lab-results':
                return '🔬';
            case 'urgent-care':
                return '🚨';
            case 'telehealth':
                return '💻';
            default:
                return '📅';
        }
    };

    const isUpcoming = () => {
        const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
        return appointmentDateTime > new Date();
    };

    const getTimeUntil = () => {
        const appointmentDateTime = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
        const now = new Date();
        const diffMs = appointmentDateTime - now;

        if (diffMs <= 0) return 'Past due';

        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
        if (diffHours > 0) return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
        return 'Less than 1 hour';
    };

    return (
        <div className="card-elderly hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                    {/* Icon */}
                    <div className="text-3xl">
                        {getTypeIcon(appointment.type)}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-elderly-lg font-semibold text-gray-800 truncate">
                                {appointment.title}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(appointment.status)}`}>
                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </span>
                        </div>

                        {/* Doctor Info */}
                        <div className="flex items-center space-x-2 mb-2">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-elderly-base text-gray-700">
                                {appointment.doctorId?.name || 'Dr. Smith'}
                            </span>
                            {appointment.doctorId?.professionalInfo?.specialty && (
                                <span className="text-sm text-gray-500">
                                    • {appointment.doctorId.professionalInfo.specialty}
                                </span>
                            )}
                        </div>

                        {/* Date & Time */}
                        <div className="flex items-center space-x-4 mb-2">
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-elderly-base text-gray-700">
                                    {formatDate(appointment.appointmentDate, 'long')}
                                </span>
                            </div>

                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-elderly-base text-gray-700">
                                    {formatTime(appointment.appointmentTime)}
                                </span>
                                <span className="text-sm text-gray-500">
                                    ({appointment.duration || 30} min)
                                </span>
                            </div>
                        </div>

                        {/* Location */}
                        {appointment.location && (
                            <div className="flex items-center space-x-2 mb-2">
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-elderly-base text-gray-700 capitalize">
                                    {appointment.location.replace('-', ' ')}
                                </span>
                            </div>
                        )}

                        {/* Description */}
                        {appointment.description && (
                            <p className="text-elderly-base text-gray-600 mb-2">
                                {appointment.description}
                            </p>
                        )}

                        {/* Time Until Appointment */}
                        {isUpcoming() && (
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-elderly-base font-medium text-blue-600">
                                    {getTimeUntil()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                {showActions && (
                    <div className="ml-4 flex flex-col space-y-2">
                        {appointment.status === 'scheduled' && onConfirm && (
                            <button
                                onClick={() => onConfirm(appointment._id)}
                                className="btn-success text-sm px-4 py-2"
                            >
                                Confirm
                            </button>
                        )}

                        {onEdit && (
                            <button
                                onClick={() => onEdit(appointment)}
                                className="btn-secondary text-sm px-4 py-2"
                            >
                                Edit
                            </button>
                        )}

                        {onDelete && appointment.status !== 'completed' && (
                            <button
                                onClick={() => onDelete(appointment._id)}
                                className="btn-danger text-sm px-4 py-2"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppointmentCard;
