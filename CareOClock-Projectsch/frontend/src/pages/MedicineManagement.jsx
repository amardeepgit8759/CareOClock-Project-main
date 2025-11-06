// frontend/src/pages/MedicineManagement.jsx
import React, { useState, useEffect } from 'react';
import { medicineApi } from '../api/medicineApi';
import { useAuth } from '../context/AuthContext';
import SkeletonLoader from '../components/SkeletonLoader';

const MedicineManagement = () => {
    const { user, loading: authLoading } = useAuth();
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        genericName: '',
        dosage: '',
        frequency: 'Once daily',
        stock: '',
        unit: 'tablets',
        condition: '',
        instructions: '',
        reminderTimes: ['09:00']
    });

    const frequencyOptions = [
        'Once daily',
        'Twice daily',
        'Three times daily',
        'Four times daily',
        'Every 8 hours',
        'Every 12 hours',
        'As needed'
    ];

    const unitOptions = [
        'tablets',
        'capsules',
        'ml',
        'drops',
        'puffs',
        'units',
        'other'
    ];

    useEffect(() => {
        if (user) fetchMedicines();
    }, [user]);


    const fetchMedicines = async () => {
        try {
            setLoading(true);
            const response = await medicineApi.getMedicines();
            setMedicines(response.data || []);
        } catch (error) {
            console.error('Error fetching medicines:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const medicineData = { ...formData, stock: parseInt(formData.stock) || 0 };

        try {
            if (editingMedicine) {
                await medicineApi.updateMedicine(editingMedicine._id, medicineData);
            } else {
                await medicineApi.createMedicine(medicineData);
            }
            setShowAddForm(false);
            setEditingMedicine(null);
            setFormData({
                name: '',
                genericName: '',
                dosage: '',
                frequency: 'Once daily',
                stock: '',
                unit: 'tablets',
                condition: '',
                instructions: '',
                reminderTimes: ['09:00'],
            });
            fetchMedicines();
        } catch (error) {
            console.error('Error saving medicine:', error);
        }
    };

    const handleEdit = (medicine) => {
        setEditingMedicine(medicine);
        setFormData({
            name: medicine.name || '',
            genericName: medicine.genericName || '',
            dosage: medicine.dosage || '',
            frequency: medicine.frequency || 'Once daily',
            stock: medicine.stock?.toString() || '',
            unit: medicine.unit || 'tablets',
            condition: medicine.condition || '',
            instructions: medicine.instructions || '',
            reminderTimes: medicine.reminderTimes || ['09:00']
        });
        setShowAddForm(true);
    };

    const handleDelete = async (medicineId) => {
        if (window.confirm('Are you sure you want to delete this medicine?')) {
            try {
                await medicineApi.deleteMedicine(medicineId);
                fetchMedicines();
            } catch (error) {
                console.error('Error deleting medicine:', error);
            }
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };
    
    if (authLoading) return <div>Loading user info...</div>;
    if (!user) return <div>Please login to manage medicines.</div>;
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
                    <h1 className="text-elderly-3xl font-bold text-gray-900">Medicine Management</h1>
                    <p className="text-elderly-lg text-gray-600 mt-2">
                        Manage your medications and track inventory
                    </p>
                </div>
                <button
                    onClick={() => {
                        setShowAddForm(true);
                        setEditingMedicine(null);
                        setFormData({
                            name: '',
                            genericName: '',
                            dosage: '',
                            frequency: 'Once daily',
                            stock: '',
                            unit: 'tablets',
                            condition: '',
                            instructions: '',
                            reminderTimes: ['09:00']
                        });
                    }}
                    className="btn-primary"
                >
                    Add New Medicine
                </button>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className="card-elderly mb-8">
                    <h2 className="text-elderly-2xl font-bold text-gray-800 mb-6">
                        {editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
                    </h2>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                Medicine Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                required
                                className="input-elderly"
                                placeholder="e.g., Lisinopril"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                Generic Name
                            </label>
                            <input
                                type="text"
                                name="genericName"
                                className="input-elderly"
                                placeholder="e.g., ACE Inhibitor"
                                value={formData.genericName}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                Dosage *
                            </label>
                            <input
                                type="text"
                                name="dosage"
                                required
                                className="input-elderly"
                                placeholder="e.g., 10mg"
                                value={formData.dosage}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                Frequency *
                            </label>
                            <select
                                name="frequency"
                                required
                                className="input-elderly"
                                value={formData.frequency}
                                onChange={handleChange}
                            >
                                {frequencyOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                Reminder Times *
                            </label>
                            {formData.reminderTimes.map((time, index) => (
                                <div key={index} className="flex items-center mb-2 space-x-2">
                                    <input
                                        type="time"
                                        required
                                        value={time}
                                        onChange={(e) => {
                                            const newTimes = [...formData.reminderTimes];
                                            newTimes[index] = e.target.value;
                                            setFormData({ ...formData, reminderTimes: newTimes });
                                        }}
                                        className="input-elderly flex-grow"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newTimes = formData.reminderTimes.filter((_, i) => i !== index);
                                            setFormData({ ...formData, reminderTimes: newTimes });
                                        }}
                                        className="btn-danger"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() =>
                                    setFormData({ ...formData, reminderTimes: [...formData.reminderTimes, ''] })
                                }
                                className="btn-secondary"
                            >
                                Add Time
                            </button>
                        </div>


                        <div>
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                Current Stock *
                            </label>
                            <input
                                type="number"
                                name="stock"
                                required
                                min="0"
                                className="input-elderly"
                                placeholder="e.g., 30"
                                value={formData.stock}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                Unit
                            </label>
                            <select
                                name="unit"
                                className="input-elderly"
                                value={formData.unit}
                                onChange={handleChange}
                            >
                                {unitOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                Condition/Purpose
                            </label>
                            <input
                                type="text"
                                name="condition"
                                className="input-elderly"
                                placeholder="e.g., High Blood Pressure"
                                value={formData.condition}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">
                                Instructions
                            </label>
                            <textarea
                                name="instructions"
                                rows="3"
                                className="input-elderly"
                                placeholder="e.g., Take with food in the morning"
                                value={formData.instructions}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="md:col-span-2 flex space-x-4">
                            <button
                                type="submit"
                                className="btn-primary"
                            >
                                {editingMedicine ? 'Update Medicine' : 'Add Medicine'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddForm(false);
                                    setEditingMedicine(null);
                                }}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Medicine List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {medicines.length > 0 ? (
                    medicines.map((medicine) => (
                        <div key={medicine._id} className="card-elderly hover:shadow-xl transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-elderly-xl font-bold text-gray-800 mb-1">
                                        {medicine.name}
                                    </h3>
                                    {medicine.genericName && (
                                        <p className="text-elderly-base text-gray-600">
                                            {medicine.genericName}
                                        </p>
                                    )}
                                </div>

                                {medicine.daysRemaining <= medicine.lowStockAlert && (
                                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                                        Low Stock
                                    </span>
                                )}
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between">
                                    <span className="text-elderly-base text-gray-600">Dosage:</span>
                                    <span className="text-elderly-base font-medium">{medicine.dosage}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-elderly-base text-gray-600">Frequency:</span>
                                    <span className="text-elderly-base font-medium">{medicine.frequency}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-elderly-base text-gray-600">Stock:</span>
                                    <span className="text-elderly-base font-medium">
                                        {medicine.stock} {medicine.unit}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-elderly-base text-gray-600">Days remaining:</span>
                                    <span className={`text-elderly-base font-medium ${medicine.daysRemaining <= medicine.lowStockAlert ? 'text-red-600' : 'text-green-600'
                                        }`}>
                                        {medicine.daysRemaining} days
                                    </span>
                                </div>

                                {medicine.condition && (
                                    <div className="flex justify-between">
                                        <span className="text-elderly-base text-gray-600">For:</span>
                                        <span className="text-elderly-base font-medium">{medicine.condition}</span>
                                    </div>
                                )}
                            </div>

                            {medicine.instructions && (
                                <div className="mb-6">
                                    <p className="text-elderly-base text-gray-700 bg-gray-50 p-3 rounded-lg">
                                        <strong>Instructions:</strong> {medicine.instructions}
                                    </p>
                                </div>
                            )}

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => handleEdit(medicine)}
                                    className="btn-secondary flex-1"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(medicine._id)}
                                    className="btn-danger flex-1"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="md:col-span-3 text-center py-12">
                        <div className="text-6xl mb-4">💊</div>
                        <h3 className="text-elderly-2xl font-bold text-gray-800 mb-2">
                            No medicines added yet
                        </h3>
                        <p className="text-elderly-lg text-gray-600 mb-6">
                            Start by adding your first medicine to begin tracking
                        </p>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="btn-primary"
                        >
                            Add Your First Medicine
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MedicineManagement;
