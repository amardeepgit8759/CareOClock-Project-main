// frontend/src/pages/SignupPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SignupPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
        age: '',
        phone: '',
        specialty: '' // For doctors
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { register } = useAuth();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        if (formData.role === 'Elderly' && (!formData.age || formData.age < 18)) {
            setError('Age is required for elderly users and must be at least 18');
            setLoading(false);
            return;
        }

        // Prepare registration data
        const registrationData = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            age: formData.age ? parseInt(formData.age) : undefined,
            phone: formData.phone
        };

        if (formData.role === 'Doctor' && formData.specialty) {
            registrationData.professionalInfo = {
                specialty: formData.specialty
            };
        }

        const result = await register(registrationData);

        if (!result.success) {
            setError(result.error);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl font-bold text-white">C</span>
                    </div>
                    <h2 className="text-elderly-3xl font-bold text-gray-900">
                        Join CareOClock
                    </h2>
                    <p className="mt-2 text-elderly-base text-gray-600">
                        Create your account to start managing your health
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        <div className="flex">
                            <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span className="text-elderly-base">{error}</span>
                        </div>
                    </div>
                )}

                {/* Registration Form */}
                <form className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                Full Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                className="input-elderly"
                                placeholder="Enter your full name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="input-elderly"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Role Selection */}
                        <div>
                            <label htmlFor="role" className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                I am a...
                            </label>
                            <select
                                id="role"
                                name="role"
                                required
                                className="input-elderly"
                                value={formData.role}
                                onChange={handleChange}
                            >
                                <option value="">Select your role</option>
                                <option value="Elderly">Elderly Person (Patient)</option>
                                <option value="Caregiver">Caregiver</option>
                                <option value="Doctor">Doctor/Healthcare Provider</option>
                            </select>
                        </div>

                        {/* Age (for Elderly) */}
                        {formData.role === 'Elderly' && (
                            <div>
                                <label htmlFor="age" className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                    Age
                                </label>
                                <input
                                    id="age"
                                    name="age"
                                    type="number"
                                    min="18"
                                    max="120"
                                    required
                                    className="input-elderly"
                                    placeholder="Enter your age"
                                    value={formData.age}
                                    onChange={handleChange}
                                />
                            </div>
                        )}

                        {/* Specialty (for Doctors) */}
                        {formData.role === 'Doctor' && (
                            <div>
                                <label htmlFor="specialty" className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                    Medical Specialty
                                </label>
                                <input
                                    id="specialty"
                                    name="specialty"
                                    type="text"
                                    className="input-elderly"
                                    placeholder="e.g., Geriatric Medicine, Family Medicine"
                                    value={formData.specialty}
                                    onChange={handleChange}
                                />
                            </div>
                        )}

                        {/* Phone */}
                        <div>
                            <label htmlFor="phone" className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                Phone Number (Optional)
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                className="input-elderly"
                                placeholder="Enter your phone number"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="input-elderly"
                                placeholder="Create a password (min 6 characters)"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="input-elderly"
                                placeholder="Confirm your password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-success w-full"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating Account...
                            </div>
                        ) : (
                            'Create Account'
                        )}
                    </button>

                    <div className="text-center">
                        <p className="text-elderly-base text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="font-medium text-green-600 hover:text-green-500" />
                            Sign in here
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignupPage;
