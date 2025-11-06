const express = require('express');
const router = express.Router();
const MedicineIntake = require('../models/MedicineIntake');

router.get('/daily', async (req, res) => {
    try {
        // Use req.user._id if exists, otherwise fallback to req.query.userId
        const userId = (req.user && req.user._id) || req.query.userId;

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId' });
        }

        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Missing startDate or endDate' });
        }

        const dailyAdherence = await MedicineIntake.getDailyAdherence(userId, startDate, endDate);
        res.json({ daily: dailyAdherence });
    } catch (error) {
        console.error('Error fetching daily adherence:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



module.exports = router;
