// frontend/src/pages/Contact.jsx
import React, { useState } from 'react';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
        userType: 'elderly'
    });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // In a real app, this would send the message to a backend service
        console.log('Contact form submitted:', formData);
        setSubmitted(true);

        // Reset form after 3 seconds
        setTimeout(() => {
            setSubmitted(false);
            setFormData({
                name: '',
                email: '',
                subject: '',
                message: '',
                userType: 'elderly'
            });
        }, 3000);
    };

    if (submitted) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center">
                    <div className="card-elderly max-w-md mx-auto">
                        <div className="text-6xl mb-4">✉️</div>
                        <h2 className="text-elderly-2xl font-bold text-gray-800 mb-4">
                            Message Sent!
                        </h2>
                        <p className="text-elderly-base text-gray-600">
                            Thank you for contacting us. We'll get back to you within 24 hours.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-elderly-3xl font-bold text-gray-900 mb-4">
                    Contact Us
                </h1>
                <p className="text-elderly-lg text-gray-600">
                    We're here to help you with any questions or support needs
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Contact Form */}
                <div className="card-elderly">
                    <h2 className="text-elderly-2xl font-bold text-gray-800 mb-6">
                        Send us a Message
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                Your Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                required
                                className="input-elderly"
                                placeholder="Enter your full name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                name="email"
                                required
                                className="input-elderly"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                I am a...
                            </label>
                            <select
                                name="userType"
                                className="input-elderly"
                                value={formData.userType}
                                onChange={handleChange}
                            >
                                <option value="elderly">Elderly User/Patient</option>
                                <option value="caregiver">Caregiver</option>
                                <option value="doctor">Doctor/Healthcare Provider</option>
                                <option value="family">Family Member</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                Subject *
                            </label>
                            <select
                                name="subject"
                                required
                                className="input-elderly"
                                value={formData.subject}
                                onChange={handleChange}
                            >
                                <option value="">Select a subject</option>
                                <option value="technical-support">Technical Support</option>
                                <option value="billing">Billing Question</option>
                                <option value="feature-request">Feature Request</option>
                                <option value="bug-report">Bug Report</option>
                                <option value="account-help">Account Help</option>
                                <option value="general-question">General Question</option>
                                <option value="feedback">Feedback</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                Message *
                            </label>
                            <textarea
                                name="message"
                                required
                                rows="6"
                                className="input-elderly"
                                placeholder="Please describe your question or issue in detail..."
                                value={formData.message}
                                onChange={handleChange}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary w-full"
                        >
                            Send Message
                        </button>
                    </form>
                </div>

                {/* Contact Information */}
                <div className="space-y-6">
                    {/* Phone Support */}
                    <div className="card-elderly">
                        <div className="flex items-start space-x-4">
                            <div className="bg-blue-100 p-3 rounded-full">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-elderly-lg font-semibold text-gray-800 mb-2">
                                    Phone Support
                                </h3>
                                <p className="text-elderly-base text-gray-600 mb-2">
                                    Call us for immediate assistance
                                </p>
                                <p className="text-elderly-lg font-bold text-blue-600">
                                    1-800-CARE-123
                                </p>
                                <p className="text-elderly-base text-gray-500 mt-1">
                                    Monday - Friday: 8 AM - 8 PM EST<br />
                                    Saturday: 9 AM - 5 PM EST
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Email Support */}
                    <div className="card-elderly">
                        <div className="flex items-start space-x-4">
                            <div className="bg-green-100 p-3 rounded-full">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-elderly-lg font-semibold text-gray-800 mb-2">
                                    Email Support
                                </h3>
                                <p className="text-elderly-base text-gray-600 mb-2">
                                    Send us an email for detailed questions
                                </p>
                                <p className="text-elderly-lg font-bold text-green-600">
                                    support@careoclock.com
                                </p>
                                <p className="text-elderly-base text-gray-500 mt-1">
                                    We respond within 24 hours
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Emergency */}
                    <div className="card-elderly bg-red-50 border-red-200">
                        <div className="flex items-start space-x-4">
                            <div className="bg-red-100 p-3 rounded-full">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-elderly-lg font-semibold text-red-800 mb-2">
                                    Medical Emergency?
                                </h3>
                                <p className="text-elderly-base text-red-700 mb-2">
                                    CareOClock is not for medical emergencies
                                </p>
                                <p className="text-elderly-lg font-bold text-red-600">
                                    Call 911 immediately
                                </p>
                                <p className="text-elderly-base text-red-600 mt-1">
                                    Or contact your doctor or emergency services
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* FAQ Link */}
                    <div className="card-elderly">
                        <h3 className="text-elderly-lg font-semibold text-gray-800 mb-4">
                            Frequently Asked Questions
                        </h3>
                        <p className="text-elderly-base text-gray-600 mb-4">
                            Find quick answers to common questions about using CareOClock.
                        </p>
                        <button className="btn-secondary w-full">
                            View FAQ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
