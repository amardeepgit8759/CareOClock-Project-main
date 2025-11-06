// backend/middleware/authMiddleware.js
/**
 * Authentication Middleware
 * JWT token verification and role-based access control
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT Token Middleware
 */
const protect = async (req, res, next) => {
    let token;

    // console.log('Authorization header:', req.headers.authorization);

    try {
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            console.log('No token found in request');
            return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        // console.log('Authenticated user:', user);

        if (!user) {
            return res.status(401).json({ success: false, message: 'Token valid but user no longer exists' });
        }

        if (!user.isActive) {
            return res.status(401).json({ success: false, message: 'Account has been deactivated' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        // handle errors
    }
};


/**
 * Role-based Access Control Middleware
 */
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. ${req.user.role} role is not authorized for this action`
            });
        }

        next();
    };
};

/**
 * Resource Ownership Middleware
 */
const checkResourceAccess = (resourceUserField = 'userId') => {
    return async (req, res, next) => {
        try {
            const currentUser = req.user;

            // Safe way to get resourceUserId from params, body, or query
            const resourceUserId = req.params?.userId || req.body?.userId || req.query?.userId;

            // If no specific userId in request, allow general access (adjust if needed)
            if (!resourceUserId) {
                return next();
            }

            // Users can always access their own resources
            if (currentUser.id.toString() === resourceUserId) {
                return next();
            }

            // Role-based resource ownership checks
            switch (currentUser.role) {
                case 'Elderly':
                    return res.status(403).json({ success: false, message: 'Access denied. You can only access your own data.' });
                case 'Caregiver':
                    if (!currentUser.assignedPatients.includes(resourceUserId)) {
                        return res.status(403).json({ success: false, message: 'Access denied. You can only access data for your assigned patients.' });
                    }
                    break;
                case 'Doctor':
                    if (!currentUser.assignedPatients.includes(resourceUserId)) {
                        return res.status(403).json({ success: false, message: 'Access denied. You can only access data for your assigned patients.' });
                    }
                    break;
                default:
                    return res.status(403).json({ success: false, message: 'Access denied. Invalid user role.' });
            }
            next();
        } catch (error) {
            console.error('Resource access check error:', error);
            return res.status(500).json({ success: false, message: 'Error checking resource access permissions' });
        }
    };
};

module.exports = {
    protect,
    restrictTo,
    checkResourceAccess
};
