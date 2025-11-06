import React, { useState, useEffect } from 'react';
import { healthApi } from '../api/healthApi';
import ChartComponent from '../components/ChartComponent';
import SkeletonLoader from '../components/SkeletonLoader';
import { predictiveApi } from '../api/predictiveApi';
import { useAuth } from '../context/AuthContext';

// Helper to parse BSON-wrapped numbers from MongoDB
function parseMongoNumber(obj) {
    // 1. Handle null or undefined
    if (obj === null || obj === undefined) return null;

    // 2. Already a plain number
    if (typeof obj === 'number') return obj;

    if (typeof obj === 'object') {
        // 3. THIS IS THE FIX: Handle our own { value: 7.5 } format
        if ('value' in obj && typeof obj.value === 'number') {
            return obj.value;
        }

        // 4. Handle BSON number types
        if ('$numberInt' in obj) return parseInt(obj.$numberInt, 10);
        if ('$numberDouble' in obj) return parseFloat(obj.$numberDouble);
    }

    // 5. If it's an object we don't recognize, or something else, return null
    return null;
}

// Normalize MongoDB record fields into plain JS numbers
function normalizeRecord(record) {
    return {
        ...record,
        bloodPressure: {
            systolic: parseMongoNumber(record.bloodPressure?.systolic),
            diastolic: parseMongoNumber(record.bloodPressure?.diastolic),
            unit: record.bloodPressure?.unit,
        },
        bloodSugar: {
            value: parseMongoNumber(record.bloodSugar?.value),
            testType: record.bloodSugar?.testType,
            unit: record.bloodSugar?.unit,
        },
        heartRate: {
            value: parseMongoNumber(record.heartRate?.value),
            unit: record.heartRate?.unit,
        },
        weight: {
            value: parseMongoNumber(record.weight?.value),
            unit: record.weight?.unit,
        },
        sleepHours: parseMongoNumber(record.sleepHours),
        temperature: parseMongoNumber(record.temperature),
        oxygenLevel: parseMongoNumber(record.oxygenLevel),
        age: record.age,
    };
}

const HealthTracking = () => {
    const [healthRecords, setHealthRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm] = useState(true);
    const [prediction, setPrediction] = useState(null);
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        bloodPressure: { systolic: '', diastolic: '' },
        bloodSugar: { value: '', testType: 'random' },
        heartRate: { value: '' },
        weight: { value: '', unit: 'kg' },
        sleepHours: '',
        temperature: '',
        oxygenLevel: '',
        notes: '',
    });

    useEffect(() => {
        fetchHealthRecords();
    }, []);

    useEffect(() => {
        if (healthRecords.length > 0) {
            getPredictionForLatest();
        }
    }, [healthRecords, user]);

    const getPredictionForLatest = async () => {
        const latest = healthRecords[0]; // newest first
        if (!latest || !user?._id) return;

        const dataToSend = {
            ...latest, 
            userId: user._id 
        };
        console.log("This is user id : ",user.id);
        try {
            const res = await predictiveApi.predictRisk(dataToSend);
            console.log("this is predictive res",res);
            
            setPrediction(res?.data);
        } catch (err) {
            console.error("Error fetching prediction:", err.response ? err.response.data : err.message);
            setPrediction({ error: 'Unable to fetch risk analysis' });
        }
    };

    const fetchHealthRecords = async () => {
        try {
            setLoading(true);
            const response = await healthApi.getHealthRecords(null, 30);
            const recordsRaw = response?.data?.records || [];
            const records = recordsRaw.map(normalizeRecord); // normalize here
            setHealthRecords(records);


        } catch (error) {
            console.error('Error fetching health records:', error);
            setHealthRecords([]);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData((prev) => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value,
                },
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const validateForm = () => {
        const errors = [];

        if (formData.sleepHours !== '') {
            const sleep = parseFloat(formData.sleepHours);
            if (isNaN(sleep) || sleep < 0 || sleep > 24) {
                errors.push('Sleep hours must be between 0 and 24.');
            }
        }

        if (formData.temperature !== '') {
            const temp = parseFloat(formData.temperature);
            if (isNaN(temp) || temp < 95 || temp > 110) {
                errors.push('Temperature must be between 95°F and 110°F.');
            }
        }

        if (formData.oxygenLevel !== '') {
            const oxygen = parseFloat(formData.oxygenLevel);
            if (isNaN(oxygen) || oxygen < 50 || oxygen > 100) {
                errors.push('Oxygen level must be between 50% and 100%.');
            }
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = validateForm();
        if (errors.length > 0) {
            alert('Please fix the following errors:\n' + errors.join('\n'));
            return;
        }

        try {
            const healthData = {
                bloodPressure: {
                    systolic: parseInt(formData.bloodPressure.systolic) || null,
                    diastolic: parseInt(formData.bloodPressure.diastolic) || null,
                },
                bloodSugar: {
                    value: parseInt(formData.bloodSugar.value) || null,
                    testType: formData.bloodSugar.testType,
                },
                heartRate: {
                    value: parseInt(formData.heartRate.value) || null,
                },
                weight: {
                    value: parseFloat(formData.weight.value) || null,
                    unit: formData.weight.unit,
                },
                sleepHours: formData.sleepHours === '' ? null : { value: parseFloat(formData.sleepHours) },
                temperature: formData.temperature === '' ? null : { value: parseFloat(formData.temperature) },
                oxygenLevel: formData.oxygenLevel === '' ? null : { value: parseFloat(formData.oxygenLevel) },
                notes: formData.notes,
            };

            // Remove null or empty nested values
            Object.keys(healthData).forEach((key) => {
                if (typeof healthData[key] === 'object' && healthData[key] !== null) {
                    Object.keys(healthData[key]).forEach((subKey) => {
                        if (healthData[key][subKey] === null || healthData[key][subKey] === '') {
                            delete healthData[key][subKey];
                        }
                    });
                    if (Object.keys(healthData[key]).length === 0) {
                        delete healthData[key];
                    }
                } else if (healthData[key] === null || healthData[key] === '') {
                    delete healthData[key];
                }
            });

            await healthApi.createHealthRecord(healthData);

            setFormData({
                bloodPressure: { systolic: '', diastolic: '' },
                bloodSugar: { value: '', testType: 'random' },
                heartRate: { value: '' },
                weight: { value: '', unit: 'kg' },
                sleepHours: '',
                temperature: '',
                oxygenLevel: '',
                notes: '',
            });

            fetchHealthRecords();
        } catch (error) {
            console.error('Error saving health record:', error);
            alert('Failed to save health record! Please try again.');
        }
    };




    // Prepare data for charts (last 14 days)
    const bpChartData = healthRecords
        .filter((r) => r.bloodPressure?.systolic && r.bloodPressure?.diastolic)
        .map((record) => ({
            date: new Date(record.date).toLocaleDateString(),
            systolic: record.bloodPressure.systolic,
            diastolic: record.bloodPressure.diastolic,
        }))
        .slice(-14);

    const sugarChartData = healthRecords
        .filter((r) => r.bloodSugar?.value)
        .map((record) => ({
            date: new Date(record.date).toLocaleDateString(),
            value: record.bloodSugar.value,
        }))
        .slice(-14);

    const heartRateChartData = healthRecords
        .filter((r) => r.heartRate?.value)
        .map((record) => ({
            date: new Date(record.date).toLocaleDateString(),
            value: record.heartRate.value,
        }))
        .slice(-14);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <SkeletonLoader lines={6} height="h-32" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-elderly-3xl font-bold text-gray-900">Health Tracking</h1>
                <p className="text-elderly-lg text-gray-600">Monitor your vital signs and health metrics</p>
            </div>

            {showAddForm && (
                <div className="card-elderly mb-8 p-6">
                    <h2 className="text-elderly-2xl font-bold text-gray-800 mb-6">Add New Health Reading</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Blood Pressure */}
                        <div className="md:col-span-2">
                            <h3 className="text-elderly-lg font-semibold text-gray-800 mb-3">Blood Pressure (mmHg)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-elderly-base font-medium text-gray-700 mb-2">Systolic (Upper)</label>
                                    <input
                                        type="number"
                                        name="bloodPressure.systolic"
                                        min="50"
                                        max="300"
                                        className="input-elderly"
                                        placeholder="e.g., 120"
                                        value={formData.bloodPressure.systolic}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-elderly-base font-medium text-gray-700 mb-2">Diastolic (Lower)</label>
                                    <input
                                        type="number"
                                        name="bloodPressure.diastolic"
                                        min="30"
                                        max="200"
                                        className="input-elderly"
                                        placeholder="e.g., 80"
                                        value={formData.bloodPressure.diastolic}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Blood Sugar */}
                        <div>
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">Blood Sugar (mg/dL)</label>
                            <input
                                type="number"
                                name="bloodSugar.value"
                                min="20"
                                max="600"
                                className="input-elderly"
                                placeholder="e.g., 95"
                                value={formData.bloodSugar.value}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">Test Type</label>
                            <select name="bloodSugar.testType" className="input-elderly" value={formData.bloodSugar.testType} onChange={handleChange}>
                                <option value="random">Random</option>
                                <option value="fasting">Fasting</option>
                                <option value="post-meal">Post-meal</option>
                                <option value="bedtime">Bedtime</option>
                            </select>
                        </div>

                        {/* Heart Rate */}
                        <div>
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">Heart Rate (BPM)</label>
                            <input
                                type="number"
                                name="heartRate.value"
                                min="30"
                                max="250"
                                className="input-elderly"
                                placeholder="e.g., 72"
                                value={formData.heartRate.value}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Weight */}
                        <div>
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">Weight</label>
                            <div className="flex space-x-2">
                                <input
                                    type="number"
                                    name="weight.value"
                                    min="20"
                                    max="500"
                                    step="0.1"
                                    className="input-elderly flex-1"
                                    placeholder="e.g., 70.5"
                                    value={formData.weight.value}
                                    onChange={handleChange}
                                />
                                <select name="weight.unit" className="input-elderly w-24" value={formData.weight.unit} onChange={handleChange}>
                                    <option value="kg">kg</option>
                                    <option value="lbs">lbs</option>
                                </select>
                            </div>
                        </div>

                        {/* Sleep Hours */}
                        <div>
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">Sleep Hours</label>
                            <input
                                type="number"
                                name="sleepHours"
                                min="0"
                                max="24"
                                step="0.1"
                                className="input-elderly"
                                placeholder="e.g., 7.5"
                                value={formData.sleepHours}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Temperature */}
                        <div>
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">Body Temperature (°F)</label>
                            <input
                                type="number"
                                name="temperature"
                                min="90"
                                max="110"
                                step="0.1"
                                className="input-elderly"
                                placeholder="e.g., 98.6"
                                value={formData.temperature}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Oxygen Level */}
                        <div>
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">Oxygen Level (%)</label>
                            <input
                                type="number"
                                name="oxygenLevel"
                                min="50"
                                max="100"
                                step="0.1"
                                className="input-elderly"
                                placeholder="e.g., 98"
                                value={formData.oxygenLevel}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Notes */}
                        <div className="md:col-span-2">
                            <label className="block text-elderly-lg font-medium text-gray-700 mb-2">Notes (Optional)</label>
                            <textarea
                                name="notes"
                                rows="3"
                                className="input-elderly"
                                placeholder="How are you feeling? Any symptoms or observations?"
                                value={formData.notes}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="md:col-span-2 flex space-x-4">
                            <button type="submit" className="btn-primary">
                                Save Reading
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Render charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <ChartComponent type="line" data={bpChartData} title="Blood Pressure Trends (Last 14 Days)" xAxisKey="date" yAxisKey="systolic" color="#EF4444" height={300} />
                <ChartComponent type="line" data={sugarChartData} title="Blood Sugar Trends (Last 14 Days)" xAxisKey="date" yAxisKey="value" color="#10B981" height={300} />
                <ChartComponent type="line" data={heartRateChartData} title="Heart Rate Trends (Last 14 Days)" xAxisKey="date" yAxisKey="value" color="#3B82F6" height={300} />
            </div>

            {/* Latest records */}
            <div className="card-elderly mt-8">
                <h3 className="text-elderly-lg font-semibold text-gray-800 mb-4">Latest Readings</h3>
                {healthRecords.length ? (
                    <>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {healthRecords.map((record, idx) => (
                                <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-elderly-base font-medium text-gray-800">{new Date(record.date).toLocaleDateString()}</span>
                                        {record.hasAbnormalReading && <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">Alert</span>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        {record.bloodPressure?.systolic && (
                                            <div>
                                                <span className="text-gray-600">BP:</span>{' '}
                                                <span className="ml-1 font-medium">
                                                    {record.bloodPressure.systolic}/{record.bloodPressure.diastolic}
                                                </span>
                                            </div>
                                        )}
                                        {record.bloodSugar?.value && (
                                            <div>
                                                <span className="text-gray-600">Sugar:</span>{' '}
                                                <span className="ml-1 font-medium">{record.bloodSugar.value}</span>
                                            </div>
                                        )}
                                        {record.heartRate?.value && (
                                            <div>
                                                <span className="text-gray-600">HR:</span>{' '}
                                                <span className="ml-1 font-medium">{record.heartRate.value}</span>
                                            </div>
                                        )}
                                        {record.weight?.value && (
                                            <div>
                                                <span className="text-gray-600">Weight:</span>{' '}
                                                <span className="ml-1 font-medium">
                                                    {record.weight.value} {record.weight.unit}
                                                </span>
                                            </div>
                                        )}
                                        {record.sleepHours !== undefined && (
                                            <div>
                                                <span className="text-gray-600">Sleep:</span>{' '}
                                                <span className="ml-1 font-medium">{record.sleepHours}</span>
                                            </div>
                                        )}
                                        {record.temperature !== undefined && (
                                            <div>
                                                <span className="text-gray-600">Temp:</span>{' '}
                                                <span className="ml-1 font-medium">{record.temperature}</span>
                                            </div>
                                        )}
                                        {record.oxygenLevel !== undefined && (
                                            <div>
                                                <span className="text-gray-600">Oxygen:</span>{' '}
                                                <span className="ml-1 font-medium">{record.oxygenLevel}</span>
                                            </div>
                                        )}
                                    </div>
                                    {record.notes && <p className="text-sm text-gray-600 mt-2 italic">"{record.notes}"</p>}
                                </div>
                            ))}
                        </div>

                        {/* Suggestion Box UI */}
                        {prediction && !prediction.error && (
                            <div
                                className={`rounded-xl shadow-lg mt-8 p-6 bg-gradient-to-br from-${prediction.risk_level === 'High' ? 'red-200' : prediction.risk_level === 'Medium' ? 'yellow-100' : 'emerald-100'
                                    } to-white border-l-8 ${prediction.risk_level === 'High'
                                        ? 'border-red-500'
                                        : prediction.risk_level === 'Medium'
                                            ? 'border-yellow-400'
                                            : 'border-emerald-400'
                                    }`}
                            >
                                <div className="flex items-center mb-2">
                                    <span
                                        className={`text-3xl mr-2 ${prediction.risk_level === 'High' ? 'text-red-600' : prediction.risk_level === 'Medium' ? 'text-yellow-700' : 'text-emerald-700'
                                            }`}
                                    >
                                        {prediction.risk_level === 'High' && '⚠️'}
                                        {prediction.risk_level === 'Medium' && '⚡'}
                                        {prediction.risk_level === 'Low' && '✅'}
                                    </span>
                                    <span className="text-2xl font-semibold">{prediction.risk_level} Risk</span>
                                    <span
                                        className={`ml-4 px-3 py-1 rounded-full text-xs ${prediction.risk_level === 'High'
                                            ? 'bg-red-500 text-white'
                                            : prediction.risk_level === 'Medium'
                                                ? 'bg-yellow-300 text-gray-900'
                                                : 'bg-emerald-400 text-white'
                                            }`}
                                    >
                                        {`Confidence: ${(prediction.confidence * 100).toFixed(1)}%`}
                                    </span>
                                </div>
                                <p className="text-base mb-1 text-gray-800">{prediction.explanation || "Based on your latest readings, here is our analysis."}</p>

                                {prediction.alerts?.length > 0 && (
                                    <div className="mt-2">
                                        <span className="font-medium text-gray-700">Key Risk Factors: </span>
                                        <ul className="list-disc list-inside text-sm text-gray-700">
                                            {prediction.alerts.slice(0, 4).map((factor, idx) => (
                                                <li key={idx}>{factor}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Additional Suggestions Section */}
                                <div className="mt-4">
                                    <span className="font-semibold text-gray-800 mb-1 block">Additional Health Suggestions:</span>
                                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                        {/* Create a single string to check for keywords. This is much safer. */}
                                    {(() => {
                                        const allText = [
                                            ...(prediction.alerts || []), 
                                            ...(prediction.suggestions || [])
                                        ].join(' ').toLowerCase();

                                        return (
                                            <>
                                                {allText.includes('sleep') && (
                                                    <li>Try to get 7-8 hours of quality sleep each night.</li>
                                                )}
                                                {(allText.includes('blood pressure') || allText.includes('systolic') || allText.includes('hypertens')) && (
                                                    <li>Reduce salt intake and monitor blood pressure regularly.</li>
                                                )}
                                                {(allText.includes('heart rate') || allText.includes('tachycardia') || allText.includes('bradycardia')) && (
                                                    <li>Avoid stimulants like caffeine and seek medical advice if irregular.</li>
                                                )}
                                                {(allText.includes('glucose') || allText.includes('sugar')) && (
                                                    <li>Maintain balanced nutrition and monitor sugar levels.</li>
                                                )}
                                                {allText.includes('oxygen') && (
                                                    <li>Check lung health and avoid polluted environments.</li>
                                                )}
                                                {prediction.risk_level === 'High' && (
                                                    <li>Seek immediate medical consultation for comprehensive evaluation.</li>
                                                )}
                                                {prediction.risk_level === 'Medium' && (
                                                    <li>Consider lifestyle changes and regular follow-ups with your doctor.</li>
                                                )}
                                                {prediction.risk_level === 'Low' && (
                                                    <li>Continue current healthy habits and routine health checkups.</li>
                                                )}
                                            </>
                                        );
                                    })()}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {prediction && prediction.error && (
                            <div className="bg-yellow-100 rounded p-3 mt-8 text-yellow-800 border-l-4 border-yellow-400">
                                Prediction suggestions unavailable: {prediction.error}
                            </div>
                        )}

                    </>
                ) : (
                    <p className="text-center py-8 text-elderly-base text-gray-600">No health records yet.</p>
                )}
            </div>
        </div>
    );
};

export default HealthTracking;
