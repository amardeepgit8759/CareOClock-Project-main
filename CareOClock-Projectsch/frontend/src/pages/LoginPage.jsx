// frontend/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();

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

        const result = await login(formData.email, formData.password);

        if (!result.success) {
            setError(result.error);
        }

        setLoading(false);
    };

    // Demo account buttons
    const demoAccounts = [
        {
            role: 'Elderly',
            email: 'margaret@demo.com',
            password: 'password123',
            name: 'Margaret Johnson',
            color: 'bg-blue-600 hover:bg-blue-700'
        },
        {
            role: 'Caregiver',
            email: 'sarah@demo.com',
            password: 'password123',
            name: 'Sarah Williams',
            color: 'bg-green-600 hover:bg-green-700'
        },
        {
            role: 'Doctor',
            email: 'doctor@demo.com',
            password: 'password123',
            name: 'Dr. Martinez',
            color: 'bg-purple-600 hover:bg-purple-700'
        }
    ];

    const loginWithDemo = async (email, password) => {
        setLoading(true);
        setError('');

        const result = await login(email, password);

        if (!result.success) {
            setError(result.error);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl font-bold text-white">C</span>
                    </div>
                    <h2 className="text-elderly-3xl font-bold text-gray-900">
                        Welcome to CareOClock
                    </h2>
                    <p className="mt-2 text-elderly-base text-gray-600">
                        Sign in to your account to manage your health
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

                {/* Login Form */}
                <form className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg" onSubmit={handleSubmit}>
                    <div className="space-y-4">
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

                        <div>
                            <label htmlFor="password" className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="input-elderly"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Signing In...
                            </div>
                        ) : (
                            'Sign In'
                        )}
                    </button>

                    <div className="text-center">
                        <p className="text-elderly-base text-gray-600">
                            Don't have an account?{' '}
                            <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                                Sign up here
                            </Link>
                        </p>
                    </div>
                </form>

                {/* Demo Accounts */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="text-elderly-lg font-semibold text-gray-800 mb-4 text-center">
                        Try Demo Accounts
                    </h3>
                    <div className="space-y-3">
                        {demoAccounts.map((account, index) => (
                            <button
                                key={index}
                                onClick={() => loginWithDemo(account.email, account.password)}
                                disabled={loading}
                                className={`w-full ${account.color} text-white py-3 px-4 rounded-lg font-medium text-elderly-base transition-colors disabled:opacity-50`}
                            >
                                Login as {account.role} ({account.name})
                            </button>
                        ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-4 text-center">
                        These are demo accounts for testing purposes
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
