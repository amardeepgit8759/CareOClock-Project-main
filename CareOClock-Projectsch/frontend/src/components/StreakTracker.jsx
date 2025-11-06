// frontend/src/components/StreakTracker.jsx
import React from 'react';

const StreakTracker = ({ currentStreak, longestStreak, loading = false }) => {
    if (loading) {
        return (
            <div className="card-elderly animate-pulse">
                <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-gray-300 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
        );
    }

    const getStreakMessage = (streak) => {
        if (streak === 0) return "Let's start your streak today!";
        if (streak === 1) return "Great start! Keep it up!";
        if (streak < 7) return "You're building momentum!";
        if (streak < 30) return "Excellent consistency!";
        return "Outstanding dedication!";
    };

    const getStreakColor = (streak) => {
        if (streak === 0) return "text-gray-500";
        if (streak < 7) return "text-yellow-600";
        if (streak < 30) return "text-blue-600";
        return "text-green-600";
    };

    const getStreakBgColor = (streak) => {
        if (streak === 0) return "from-gray-50 to-gray-100";
        if (streak < 7) return "from-yellow-50 to-yellow-100";
        if (streak < 30) return "from-blue-50 to-blue-100";
        return "from-green-50 to-green-100";
    };

    const getBorderColor = (streak) => {
        if (streak === 0) return "border-gray-400";
        if (streak < 7) return "border-yellow-400";
        if (streak < 30) return "border-blue-400";
        return "border-green-400";
    };

    return (
        <div className={`card-elderly bg-gradient-to-br ${getStreakBgColor(currentStreak)} border-l-4 ${getBorderColor(currentStreak)}`}>
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <h3 className="text-elderly-lg font-semibold text-gray-800 mb-2">
                        Medication Streak
                    </h3>

                    <div className="flex items-center space-x-6 mb-3">
                        <div>
                            <div className={`text-elderly-3xl font-bold ${getStreakColor(currentStreak)}`}>
                                {currentStreak}
                            </div>
                            <div className="text-elderly-base text-gray-600">
                                Current Days
                            </div>
                        </div>

                        <div className="h-12 w-px bg-gray-300"></div>

                        <div>
                            <div className="text-elderly-xl font-semibold text-gray-700">
                                {longestStreak}
                            </div>
                            <div className="text-elderly-base text-gray-600">
                                Best Streak
                            </div>
                        </div>
                    </div>

                    <p className={`text-elderly-base font-medium ${getStreakColor(currentStreak)}`}>
                        {getStreakMessage(currentStreak)}
                    </p>
                </div>

                <div className="ml-4">
                    <div className={`w-16 h-16 rounded-full ${getStreakBgColor(currentStreak)} border-4 ${getBorderColor(currentStreak)} flex items-center justify-center`}>
                        {currentStreak === 0 ? (
                            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg className={`w-8 h-8 ${getStreakColor(currentStreak)}`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress towards next milestone</span>
                    <span>{currentStreak % 7}/7 days</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                        className={`h-3 rounded-full transition-all duration-300 ${currentStreak === 0 ? 'bg-gray-400' :
                                currentStreak < 7 ? 'bg-yellow-400' :
                                    currentStreak < 30 ? 'bg-blue-500' : 'bg-green-500'
                            }`}
                        style={{ width: `${((currentStreak % 7) / 7) * 100}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default StreakTracker;
