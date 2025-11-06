import React, { useState, useEffect } from 'react';
// --- Adjusting import paths ---
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/userApi';
import SkeletonLoader from '../components/SkeletonLoader';
// --- Importing all icons ---
import {
    User, Mail, Phone, MapPin, Heart, Stethoscope, Save, X, Edit2,
    Cake, ShieldAlert, Building, PhoneForwarded, Users
} from 'lucide-react';

const ProfilePage = () => {
    const { user, setUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [activeTab, setActiveTab] = useState('personal');

    useEffect(() => {
        if (user?.id) {
            fetchProfile();
        }
    }, [user?.id]);

    const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await userApi.getUserProfile(user.id);
            if (res.data?.user) {
                const fetchedUser = res.data.user;
                // Ensure nested objects exist for the form
                fetchedUser.medicalInfo = fetchedUser.medicalInfo || { emergencyContact: {} };
                fetchedUser.professionalInfo = fetchedUser.professionalInfo || {};

                setProfile(fetchedUser);
                setFormData(fetchedUser);
            } else {
                throw new Error('User data not found');
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Failed to fetch profile data.');
        } finally {
            setLoading(false);
        }
    };

    // --- Edit Handlers ---
    const handleEditToggle = () => {
        if (isEditing) {
            setFormData(profile); // Reset changes on cancel
        }
        setIsEditing(!isEditing);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');

            // Handle deeply nested fields like medicalInfo.emergencyContact.name
            if (parent === 'medicalInfo' || parent === 'professionalInfo') {
                const [field, subField] = child.split('.');
                if (subField) {
                    setFormData(prev => ({
                        ...prev,
                        [parent]: {
                            ...prev[parent],
                            [field]: {
                                ...prev[parent][field],
                                [subField]: value
                            }
                        }
                    }));
                } else {
                    // Handle direct properties of medicalInfo/professionalInfo
                    setFormData(prev => ({
                        ...prev,
                        [parent]: { ...prev[parent], [child]: value }
                    }));
                }
            } else {
                // Handle simple nesting (none in current model, but good to keep)
                setFormData(prev => ({
                    ...prev,
                    [parent]: { ...prev[parent], [child]: value }
                }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Updated to handle nested array fields
    const handleArrayChange = (e, index, field) => {
        const { value } = e.target;
        const [parent, child] = field.split('.'); // e.g., "medicalInfo.conditions"

        const list = [...(formData[parent]?.[child] || [])];
        list[index] = value;
        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [child]: list
            }
        }));
    };

    const addArrayItem = (field) => {
        const [parent, child] = field.split('.');
        const list = [...(formData[parent]?.[child] || [])];
        list.push('');
        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [child]: list
            }
        }));
    };

    const removeArrayItem = (index, field) => {
        const [parent, child] = field.split('.');
        const list = [...(formData[parent]?.[child] || [])];
        list.splice(index, 1);
        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [child]: list
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null); // Clear previous errors

        // --- FIX: Create a clean payload ---
        // Removed name, email, and profilePicture from here
        const updatePayload = {
            phone: formData.phone,
            age: formData.age,
            medicalInfo: formData.medicalInfo,
            professionalInfo: formData.professionalInfo
        };

        try {
            // Send the clean payload
            const res = await userApi.updateUser(user.id, updatePayload);

            if (res.data?.user) {
                const updatedUser = res.data.user;
                // Ensure nested objects exist again after update
                updatedUser.medicalInfo = updatedUser.medicalInfo || { emergencyContact: {} };
                updatedUser.professionalInfo = updatedUser.professionalInfo || {};

                setProfile(updatedUser);
                setUser(prevUser => ({ ...prevUser, ...updatedUser })); // Update context
                setIsEditing(false);
            } else {
                // Handle cases where API returns 200 but no user
                throw new Error('Failed to save profile: No user data returned.');
            }
        } catch (err) {
            // --- FIX: Show more descriptive errors ---
            const serverError = err.response?.data?.message || err.message;
            console.error('Error saving profile:', serverError);
            setError(`Failed to save profile: ${serverError}`);
        } finally {
            setLoading(false);
        }
    };

    // --- Helper Functions ---
    const displayField = (value, placeholder = 'Not set') =>
        value || (isEditing ? '' : <span className="text-gray-400">{placeholder}</span>);

    // --- Render Logic ---
    if (loading && !profile) {
        return (
            <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <SkeletonLoader lines={10} height="h-20" />
            </div>
        );
    }

    if (!profile) return null; // Don't render if profile isn't loaded

    const renderTabs = () => {
        switch (profile.role) {
            case 'Elderly':
                return ['personal', 'health'];
            case 'Doctor':
                return ['personal', 'professional'];
            case 'Caregiver':
                return ['personal']; // Caregivers have no specific extra fields in the model
            default:
                return ['personal'];
        }
    };

    return (
        <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <form onSubmit={handleSubmit}>
                {/* --- Form Header with Save/Cancel --- */}
                {isEditing && (
                    <div className="flex justify-end items-center mb-6 space-x-3 sticky top-20 z-10">
                        <button
                            type="button"
                            onClick={handleEditToggle}
                            className="btn-secondary flex items-center space-x-2"
                        >
                            <X size={18} />
                            <span>Cancel</span>
                        </button>
                        <button
                            type="submit"
                            className="btn-primary flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                        >
                            <Save size={18} />
                            <span>Save Changes</span>
                        </button>
                    </div>
                )}

                {/* --- Display API Error --- */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                        <p className="font-medium text-red-800">Error</p>
                        <p className="text-red-700">{error}</p>
                    </div>
                )}


                <div className="flex flex-col md:flex-row md:space-x-8">
                    {/* --- Left Column: Sticky Profile Card --- */}
                    <div className="md:w-1/3 mb-8 md:mb-0">
                        <div className="card-elderly p-6 text-center sticky top-28">
                            {/* --- UPDATED to use profilePicture --- */}
                            <img
                                src={profile.profilePicture || `https://placehold.co/128x128/E0E7FF/3730A3?text=${profile.name?.charAt(0)?.toUpperCase()}`}
                                alt="Profile"
                                className="w-32 h-32 rounded-full object-cover border-4 border-blue-200 mx-auto"
                                onError={(e) => { e.target.src = `https://placehold.co/128x128/E0E7FF/3730A3?text=${profile.name?.charAt(0)?.toUpperCase()}` }}
                            />
                            <h1 className="text-3xl font-bold text-gray-900 mt-4">{profile.name}</h1>
                            <p className="text-xl text-gray-500 capitalize">{profile.role}</p>

                            {!isEditing && (
                                <button
                                    type="button"
                                    onClick={handleEditToggle}
                                    className="btn-primary w-full mt-6 flex items-center justify-center space-x-2"
                                >
                                    <Edit2 size={18} />
                                    <span>Edit Profile</span>
                                </button>
                            )}

                            <div className="text-left mt-8 space-y-4">
                                <InfoField icon={<Mail />} value={displayField(profile.email)} />
                                <InfoField icon={<Phone />} value={displayField(profile.phone)} />
                                {profile.age && <InfoField icon={<Cake />} value={`${profile.age} years old`} />}
                            </div>
                        </div>
                    </div>

                    {/* --- Right Column: Tabbed Content --- */}
                    <div className="md:w-2/3">
                        {/* Tab Navigation */}
                        <div className="border-b border-gray-200 mb-6">
                            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                {renderTabs().includes('personal') && (
                                    <TabButton name="Personal" tabId="personal" activeTab={activeTab} setActiveTab={setActiveTab} />
                                )}
                                {renderTabs().includes('health') && (
                                    <TabButton name="Health Details" tabId="health" activeTab={activeTab} setActiveTab={setActiveTab} />
                                )}
                                {renderTabs().includes('professional') && (
                                    <TabButton name="Professional" tabId="professional" activeTab={activeTab} setActiveTab={setActiveTab} />
                                )}
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="card-elderly p-6">
                            {/* Personal Details Tab */}
                            <div className={activeTab === 'personal' ? 'block' : 'hidden'}>
                                <h2 className="card-header-elderly !p-0 !mb-6">Personal Details</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* --- FIELDS SET TO isEditing={false} --- */}
                                    <EditableField label="Full Name" name="name" value={formData.name} onChange={handleChange} isEditing={false} />
                                    <EditableField label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} isEditing={false} />
                                    <EditableField label="Phone Number" name="phone" type="tel" value={formData.phone} onChange={handleChange} isEditing={isEditing} />
                                    <EditableField label="Age" name="age" type="number" value={formData.age} onChange={handleChange} isEditing={isEditing} />
                                    {/* --- REMOVED Profile Picture URL Field --- */}
                                </div>
                            </div>

                            {/* Health Details Tab */}
                            {profile.role === 'Elderly' && (
                                <div className={activeTab === 'health' ? 'block' : 'hidden'}>
                                    <h2 className="card-header-elderly !p-0 !mb-6">Health Details</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <EditableField label="Emergency Contact" name="medicalInfo.emergencyContact.name" value={formData.medicalInfo?.emergencyContact?.name} onChange={handleChange} isEditing={isEditing} />
                                        <EditableField label="Emergency Phone" name="medicalInfo.emergencyContact.phone" type="tel" value={formData.medicalInfo?.emergencyContact?.phone} onChange={handleChange} isEditing={isEditing} />
                                        <EditableField label="Emergency Relationship" name="medicalInfo.emergencyContact.relationship" value={formData.medicalInfo?.emergencyContact?.relationship} onChange={handleChange} isEditing={isEditing} />
                                    </div>
                                    <EditableArrayField
                                        label="Allergies"
                                        field="medicalInfo.allergies"
                                        formData={formData}
                                        isEditing={isEditing}
                                        handleArrayChange={handleArrayChange}
                                        addArrayItem={addArrayItem}
                                        removeArrayItem={removeArrayItem}
                                    />
                                    <EditableArrayField
                                        label="Medical Conditions"
                                        field="medicalInfo.conditions"
                                        formData={formData}
                                        isEditing={isEditing}
                                        handleArrayChange={handleArrayChange}
                                        addArrayItem={addArrayItem}
                                        removeArrayItem={removeArrayItem}
                                    />
                                </div>
                            )}

                            {/* Professional Details Tab */}
                            {profile.role === 'Doctor' && (
                                <div className={activeTab === 'professional' ? 'block' : 'hidden'}>
                                    <h2 className="card-header-elderly !p-0 !mb-6">Professional Details</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <EditableField label="Specialty" name="professionalInfo.specialty" value={formData.professionalInfo?.specialty} onChange={handleChange} isEditing={isEditing} />
                                        <EditableField label="Hospital Affiliation" name="professionalInfo.hospitalAffiliation" value={formData.professionalInfo?.hospitalAffiliation} onChange={handleChange} isEditing={isEditing} />
                                        <EditableField label="License Number" name="professionalInfo.licenseNumber" value={formData.professionalInfo?.licenseNumber} onChange={handleChange} isEditing={isEditing} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

// --- Helper Components ---

const InfoField = ({ icon, value }) => (
    <div className="flex items-center space-x-3 text-gray-600">
        <span className="text-blue-500">{React.cloneElement(icon, { size: 20 })}</span>
        <span className="text-lg">{value}</span>
    </div>
);

const TabButton = ({ name, tabId, activeTab, setActiveTab }) => (
    <button
        type="button"
        onClick={() => setActiveTab(tabId)}
        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg ${activeTab === tabId
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
    >
        {name}
    </button>
);

// --- FIX: Removed duplicate EditableField component ---
// This is the only one needed
const EditableField = ({ label, name, value, onChange, isEditing, type = 'text', displayValue }) => (
    <div>
        <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
        {isEditing ? (
            <input
                type={type}
                name={name}
                value={value || ''}
                onChange={onChange}
                className="form-input-elderly w-full"
                // --- Updated logic ---
                // Disable the input if isEditing is explicitly false, otherwise respect the form's edit state
                disabled={isEditing === false}
                readOnly={isEditing === false}
            />
        ) : (
            <p className="text-lg text-gray-900 h-10 flex items-center">
                {displayValue !== undefined ? (displayValue || <span className="text-gray-400">Not set</span>) : (value || <span className="text-gray-400">Not set</span>)}
            </p>
        )}
    </div>
);


const EditableArrayField = ({ label, field, formData, isEditing, handleArrayChange, addArrayItem, removeArrayItem }) => (
    <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-800 mb-2">{label}</h3>
        {(() => {
            const [parent, child] = field.split('.');
            const items = formData[parent]?.[child] || [];

            return (
                <>
                    {items.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                            {isEditing ? (
                                <>
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => handleArrayChange(e, index, field)}
                                        className="form-input-elderly flex-grow"
                                    />
                                    <button type="button" onClick={() => removeArrayItem(index, field)} className="text-red-500 hover:text-red-700">
                                        <X size={18} />
                                    </button>
                                </>
                            ) : (
                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">{item}</span>
                            )}
                        </div>
                    ))}
                    {isEditing && (
                        <button type="button" onClick={() => addArrayItem(field)} className="btn-secondary text-sm mt-2">
                            Add {label.slice(0, -1)}
                        </button>
                    )}
                    {items.length === 0 && !isEditing && (
                        <span className="text-gray-400">No {label.toLowerCase()} listed.</span>
                    )}
                </>
            );
        })()}
    </div>
);

export default ProfilePage;

