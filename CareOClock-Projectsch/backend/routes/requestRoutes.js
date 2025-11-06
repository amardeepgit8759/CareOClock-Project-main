// backend/routes/requestRoutes.js
const express = require('express');
const router = express.Router();
const { createRequest, getRequestsForUser, respondToRequest } = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createRequest);            // Create a request
router.get('/', protect, getRequestsForUser);         // List requests for logged-in user
router.patch('/:id', protect, respondToRequest);      // Accept or reject request

module.exports = router;
