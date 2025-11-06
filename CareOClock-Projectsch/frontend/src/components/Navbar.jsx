import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinks = [
        { path: '/dashboard', label: 'Dashboard', roles: ['Elderly', 'Caregiver', 'Doctor'] },
        { path: '/medicines', label: 'Medicines', roles: ['Elderly'] },
        { path: '/health', label: 'Health', roles: ['Elderly'] },
        { path: '/reports', label: 'Reports', roles: ['Elderly'] },
        { path: '/calendar', label: 'Calendar', roles: ['Elderly'] },
        { path: '/about', label: 'About', roles: ['Elderly', 'Caregiver', 'Doctor'] },
        { path: '/contact', label: 'Contact', roles: ['Elderly', 'Caregiver', 'Doctor'] }
    ];

    const filteredNavLinks = navLinks.filter(link =>
        link.roles.includes(user?.role)
    );

    return (
        <nav className="bg-white shadow-lg border-b-2 border-blue-100 fixed top-0 left-0 right-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link to="/dashboard" className="flex items-center">
                            <div className="bg-blue-600 text-white w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                                <span className="text-xl font-bold">C</span>
                            </div>
                            <span className="text-elderly-xl font-bold text-gray-800">CareOClock</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            {filteredNavLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`px-4 py-2 rounded-lg text-elderly-base font-medium transition-colors duration-200 ${location.pathname === link.path
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* User Menu */}
                    <div className="hidden md:block relative">
                        <button
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className="flex items-center space-x-4 focus:outline-none"
                        >
                            <div className="text-right">
                                <div className="text-elderly-base font-medium text-gray-800">
                                    {user?.name}
                                </div>
                                <div className="text-sm text-gray-500">{user?.role}</div>
                            </div>
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-medium">{user?.name?.charAt(0)?.toUpperCase()}</span>
                            </div>
                        </button>
                        {isUserMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                                <Link
                                    to="/profile"
                                    onClick={() => setIsUserMenuOpen(false)}
                                    className="block px-4 py-2 text-gray-700 hover:bg-blue-100"
                                >
                                    Profile
                                </Link>
                                <Link
                                    to="/requests"
                                    onClick={() => setIsUserMenuOpen(false)}
                                    className="block px-4 py-2 text-gray-700 hover:bg-blue-100"
                                >
                                    Assignment Requests
                                </Link>
                                <button
                                    onClick={() => {
                                        setIsUserMenuOpen(false);
                                        handleLogout();
                                    }}
                                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-100"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="bg-gray-200 inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                        >
                            <span className="sr-only">Open main menu</span>
                            {!isMenuOpen ? (
                                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            ) : (
                                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {isMenuOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
                            {filteredNavLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`block px-3 py-2 rounded-md text-elderly-base font-medium transition-colors duration-200 ${location.pathname === link.path
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                                        }`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}

                            {/* Mobile User Info */}
                            <div className="border-t border-gray-200 pt-4 pb-3">
                                <div className="flex items-center px-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                        <span className="text-blue-600 font-medium">
                                            {user?.name?.charAt(0)?.toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="text-elderly-base font-medium text-gray-800">{user?.name}</div>
                                        <div className="text-sm text-gray-500">{user?.role}</div>
                                    </div>
                                </div>
                                <div className="mt-3 px-3">
                                    <button onClick={handleLogout} className="btn-secondary w-full">
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
