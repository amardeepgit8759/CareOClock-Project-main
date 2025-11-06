// frontend/src/pages/About.jsx
import React from 'react';

const About = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-12">
                <h1 className="text-elderly-3xl font-bold text-gray-900 mb-4">
                    About CareOClock
                </h1>
                <p className="text-elderly-lg text-gray-600">
                    Empowering elderly individuals and their caregivers with smart medication management
                </p>
            </div>

            <div className="space-y-12">
                {/* Mission */}
                <div className="card-elderly">
                    <h2 className="text-elderly-2xl font-bold text-gray-800 mb-4">
                        Our Mission
                    </h2>
                    <p className="text-elderly-base text-gray-700 leading-relaxed">
                        CareOClock is dedicated to improving medication adherence and health outcomes for elderly
                        individuals through innovative technology, predictive analytics, and compassionate care
                        coordination. We believe that proper medication management is fundamental to maintaining
                        independence and quality of life in our golden years.
                    </p>
                </div>

                {/* Key Features */}
                <div className="card-elderly">
                    <h2 className="text-elderly-2xl font-bold text-gray-800 mb-6">
                        Key Features
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start space-x-4">
                            <div className="bg-blue-100 p-3 rounded-full">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-elderly-lg font-semibold text-gray-800 mb-2">
                                    Smart Reminders
                                </h3>
                                <p className="text-elderly-base text-gray-600">
                                    Personalized medication reminders that adapt to your schedule and preferences.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="bg-green-100 p-3 rounded-full">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-elderly-lg font-semibold text-gray-800 mb-2">
                                    Health Tracking
                                </h3>
                                <p className="text-elderly-base text-gray-600">
                                    Monitor vital signs and track health trends with easy-to-read charts and reports.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="bg-purple-100 p-3 rounded-full">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-elderly-lg font-semibold text-gray-800 mb-2">
                                    Care Coordination
                                </h3>
                                <p className="text-elderly-base text-gray-600">
                                    Connect patients, caregivers, and doctors for seamless communication and care.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="bg-red-100 p-3 rounded-full">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-elderly-lg font-semibold text-gray-800 mb-2">
                                    Predictive Alerts
                                </h3>
                                <p className="text-elderly-base text-gray-600">
                                    Advanced analytics detect adherence issues before they become serious problems.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Technology */}
                <div className="card-elderly">
                    <h2 className="text-elderly-2xl font-bold text-gray-800 mb-4">
                        Built with Modern Technology
                    </h2>
                    <p className="text-elderly-base text-gray-700 leading-relaxed mb-6">
                        CareOClock is built using the latest web technologies to ensure reliability, security,
                        and ease of use. Our platform features:
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl mb-2">⚛️</div>
                            <h4 className="text-elderly-base font-semibold">React</h4>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl mb-2">🟢</div>
                            <h4 className="text-elderly-base font-semibold">Node.js</h4>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl mb-2">🍃</div>
                            <h4 className="text-elderly-base font-semibold">MongoDB</h4>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl mb-2">🔒</div>
                            <h4 className="text-elderly-base font-semibold">Secure</h4>
                        </div>
                    </div>
                </div>

                {/* Contact */}
                <div className="card-elderly">
                    <h2 className="text-elderly-2xl font-bold text-gray-800 mb-4">
                        Contact Us
                    </h2>
                    <p className="text-elderly-base text-gray-700 leading-relaxed mb-4">
                        Have questions or need support? We're here to help you make the most of CareOClock.
                    </p>

                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                        <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="text-elderly-base">support@careoclock.com</span>
                        </div>

                        <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="text-elderly-base">1-800-CARE-123</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
