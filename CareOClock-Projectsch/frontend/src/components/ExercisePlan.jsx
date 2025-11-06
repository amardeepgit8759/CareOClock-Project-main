// frontend/src/components/ExercisePlan.jsx
import React, { useState, useEffect } from 'react';

const ExercisePlan = () => {
    const [todayExercises, setTodayExercises] = useState([]);
    const [completedExercises, setCompletedExercises] = useState(new Set());

    const exercisePlans = [
        {
            day: 0, // Sunday
            exercises: [
                {
                    name: "Gentle Stretching",
                    duration: "10 minutes",
                    description: "Light stretching for flexibility and relaxation",
                    icon: "🧘‍♀️"
                },
                {
                    name: "Deep Breathing",
                    duration: "5 minutes",
                    description: "4-7-8 breathing technique for relaxation",
                    icon: "🫁"
                }
            ]
        },
        {
            day: 1, // Monday
            exercises: [
                {
                    name: "Morning Walk",
                    duration: "15-20 minutes",
                    description: "Gentle walk around the neighborhood",
                    icon: "🚶‍♀️"
                },
                {
                    name: "Chair Exercises",
                    duration: "10 minutes",
                    description: "Seated arm and leg movements",
                    icon: "🪑"
                }
            ]
        },
        {
            day: 2, // Tuesday
            exercises: [
                {
                    name: "Light Yoga",
                    duration: "15 minutes",
                    description: "Gentle stretching and balance poses",
                    icon: "🧘‍♀️"
                },
                {
                    name: "Hand Exercises",
                    duration: "5 minutes",
                    description: "Finger and wrist mobility exercises",
                    icon: "👐"
                }
            ]
        },
        {
            day: 3, // Wednesday
            exercises: [
                {
                    name: "Balance Training",
                    duration: "10 minutes",
                    description: "Simple balance exercises with chair support",
                    icon: "⚖️"
                },
                {
                    name: "Neck & Shoulder Rolls",
                    duration: "5 minutes",
                    description: "Gentle neck and shoulder movements",
                    icon: "💆‍♀️"
                }
            ]
        },
        {
            day: 4, // Thursday
            exercises: [
                {
                    name: "Stationary Marching",
                    duration: "10 minutes",
                    description: "Marching in place or while seated",
                    icon: "🥾"
                },
                {
                    name: "Arm Circles",
                    duration: "5 minutes",
                    description: "Forward and backward arm circles",
                    icon: "🔄"
                }
            ]
        },
        {
            day: 5, // Friday
            exercises: [
                {
                    name: "Water Exercises",
                    duration: "20 minutes",
                    description: "If pool available, or water bottle weights",
                    icon: "🏊‍♀️"
                },
                {
                    name: "Ankle Pumps",
                    duration: "5 minutes",
                    description: "Ankle flexion and extension",
                    icon: "🦵"
                }
            ]
        },
        {
            day: 6, // Saturday
            exercises: [
                {
                    name: "Garden Walking",
                    duration: "15 minutes",
                    description: "Leisurely walk in garden or park",
                    icon: "🌿"
                },
                {
                    name: "Breathing Meditation",
                    duration: "10 minutes",
                    description: "Mindful breathing and relaxation",
                    icon: "🧠"
                }
            ]
        }
    ];

    useEffect(() => {
        const today = new Date().getDay();
        const plan = exercisePlans.find(p => p.day === today);
        setTodayExercises(plan ? plan.exercises : []);

        // Load completed exercises from localStorage
        const saved = localStorage.getItem(`exercises-${new Date().toDateString()}`);
        if (saved) {
            setCompletedExercises(new Set(JSON.parse(saved)));
        }
    }, []);

    const toggleExerciseCompletion = (exerciseName) => {
        const newCompleted = new Set(completedExercises);
        if (newCompleted.has(exerciseName)) {
            newCompleted.delete(exerciseName);
        } else {
            newCompleted.add(exerciseName);
        }
        setCompletedExercises(newCompleted);

        // Save to localStorage
        localStorage.setItem(
            `exercises-${new Date().toDateString()}`,
            JSON.stringify([...newCompleted])
        );
    };

    const completionPercentage = todayExercises.length > 0
        ? (completedExercises.size / todayExercises.length) * 100
        : 0;

    return (
        <div className="card-elderly bg-gradient-to-br from-green-50 to-emerald-100 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-elderly-lg font-semibold text-gray-800">
                    Today's Exercise Plan
                </h3>
                <div className="text-right">
                    <div className="text-elderly-base font-medium text-green-600">
                        {completedExercises.size}/{todayExercises.length} Complete
                    </div>
                    <div className="text-sm text-gray-600">
                        {Math.round(completionPercentage)}%
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="w-full bg-green-200 rounded-full h-3">
                    <div
                        className="bg-green-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${completionPercentage}%` }}
                    ></div>
                </div>
            </div>

            {/* Exercise List */}
            <div className="space-y-4">
                {todayExercises.length > 0 ? (
                    todayExercises.map((exercise, index) => {
                        const isCompleted = completedExercises.has(exercise.name);
                        return (
                            <div
                                key={index}
                                className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${isCompleted
                                        ? 'bg-green-100 border-green-300'
                                        : 'bg-white border-gray-200 hover:border-green-300'
                                    }`}
                                onClick={() => toggleExerciseCompletion(exercise.name)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-2xl">{exercise.icon}</span>
                                        <div>
                                            <h4 className={`text-elderly-base font-medium ${isCompleted ? 'text-green-700 line-through' : 'text-gray-800'
                                                }`}>
                                                {exercise.name}
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                {exercise.duration} • {exercise.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isCompleted
                                            ? 'bg-green-500 border-green-500'
                                            : 'border-gray-300'
                                        }`}>
                                        {isCompleted && (
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-8">
                        <div className="text-4xl mb-2">🎉</div>
                        <p className="text-elderly-base text-gray-600">
                            Rest day! Take time to relax and recover.
                        </p>
                    </div>
                )}
            </div>

            {/* Encouragement Message */}
            {completionPercentage === 100 && todayExercises.length > 0 && (
                <div className="mt-6 p-4 bg-green-100 rounded-lg border border-green-300">
                    <div className="flex items-center">
                        <span className="text-2xl mr-3">🎉</span>
                        <div>
                            <h4 className="text-elderly-base font-medium text-green-800">
                                Excellent work today!
                            </h4>
                            <p className="text-sm text-green-700">
                                You've completed all your exercises. Your body thanks you!
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Safety Reminder */}
            <div className="mt-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start">
                    <span className="text-lg mr-2">⚠️</span>
                    <p className="text-sm text-yellow-800">
                        <strong>Safety First:</strong> Stop any exercise if you feel dizzy, short of breath,
                        or experience pain. Consult your doctor before starting new exercises.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ExercisePlan;
