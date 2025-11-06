// frontend/src/pages/Skeletal.jsx
import React from 'react';

const Skeletal = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-elderly-3xl font-bold text-gray-900 mb-4">
                    Coming Soon
                </h1>
                <p className="text-elderly-lg text-gray-600">
                    This feature is under development and will be available soon
                </p>
            </div>

            {/* Placeholder Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {Array.from({ length: 6 }, (_, index) => (
                    <div key={index} className="card-elderly">
                        <div className="animate-pulse">
                            <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-300 rounded w-full"></div>
                                <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                                <div className="h-4 bg-gray-300 rounded w-4/6"></div>
                            </div>
                            <div className="mt-6">
                                <div className="h-10 bg-gray-300 rounded w-full"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Future Features */}
            <div className="card-elderly">
                <h2 className="text-elderly-2xl font-bold text-gray-800 mb-6">
                    Planned Features
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start space-x-4">
                        <div className="bg-blue-100 p-3 rounded-full">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-elderly-lg font-semibold text-gray-800 mb-2">
                                Voice Commands
                            </h3>
                            <p className="text-elderly-base text-gray-600">
                                Use voice commands to log medication intake and health readings.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-4">
                        <div className="bg-green-100 p-3 rounded-full">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-elderly-lg font-semibold text-gray-800 mb-2">
                                Mobile App
                            </h3>
                            <p className="text-elderly-base text-gray-600">
                                Native iOS and Android apps for on-the-go medication management.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-4">
                        <div className="bg-purple-100 p-3 rounded-full">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-elderly-lg font-semibold text-gray-800 mb-2">
                                Smart Devices
                            </h3>
                            <p className="text-elderly-base text-gray-600">
                                Integration with smart pill dispensers and health monitoring devices.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-4">
                        <div className="bg-yellow-100 p-3 rounded-full">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.81 7.81 0 003-6 7.81 7.81 0 00-3-6v5z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-elderly-lg font-semibold text-gray-800 mb-2">
                                AI Health Insights
                            </h3>
                            <p className="text-elderly-base text-gray-600">
                                Advanced AI analysis of health patterns and personalized recommendations.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-elderly-base text-gray-600 mb-4">
                        Want to be notified when new features are available?
                    </p>
                    <button className="btn-primary">
                        Join Our Updates List
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Skeletal;
