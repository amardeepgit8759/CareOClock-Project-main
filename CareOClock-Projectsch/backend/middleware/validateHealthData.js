const validateHealthData = (req, res, next) => {
    // console.log('validateHealthData executed');
    const data = req.body;
    const errors = [];

    // Required userId check including authenticated user
    if (!data.userId && !req.params.userId && !req.user?.id) errors.push('Missing userId');
    // console.log('validateHealthData - req.user:', req.user);
    // console.log('validateHealthData - req.body.userId:', req.body.userId);


    if (!data.bloodPressure || data.bloodPressure.systolic == null || data.bloodPressure.diastolic == null)
        errors.push('Missing bloodPressure values');
    if (!data.bloodSugar || data.bloodSugar.value == null || !data.bloodSugar.testType)
        errors.push('Missing bloodSugar values');
    if (!data.heartRate || data.heartRate.value == null)
        errors.push('Missing heartRate value');

    // Numeric ranges validation
    const { systolic, diastolic } = data.bloodPressure || {};
    if (systolic && (systolic < 70 || systolic > 250)) errors.push('Systolic blood pressure out of range (70-250)');
    if (diastolic && (diastolic < 40 || diastolic > 160)) errors.push('Diastolic blood pressure out of range (40-160)');
    if (data.bloodSugar?.value && (data.bloodSugar.value < 20 || data.bloodSugar.value > 600))
        errors.push('Blood sugar out of range (20-600)');
    if (data.heartRate?.value && (data.heartRate.value < 30 || data.heartRate.value > 220))
        errors.push('Heart rate out of range (30-220)');
    if (data.sleepHours && (data.sleepHours < 0 || data.sleepHours > 24)) errors.push('Sleep hours out of range (0-24)');
    if (data.temperature && (data.temperature < 95 || data.temperature > 107)) errors.push('Temperature out of range (95-107°F)');
    if (data.oxygenLevel && (data.oxygenLevel < 50 || data.oxygenLevel > 100)) errors.push('Oxygen level out of range (50-100%)');

    if (errors.length > 0) {
        return res.status(400).json({ message: 'Validation failed', errors });
    }
    next();
};

module.exports = validateHealthData;
