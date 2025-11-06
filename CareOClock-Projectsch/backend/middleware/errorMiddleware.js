// backend/middleware/errorMiddleware.js
/**
 * Error Handling Middleware
 * Global error handler for Express application
 */

class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
    const keyValue = err.keyValue || {};
    const field = Object.keys(keyValue)[0] || 'field';
    const value = keyValue[field] || '';

    const message = `Duplicate value for '${field}': "${value}". Please use another value!`;
    return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = () =>
    new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
    new AppError('Your token has expired. Please log in again.', 401);

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        success: false,
        error: err,
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
    });
};

const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            timestamp: new Date().toISOString()
        });
    } else {
        console.error('ERROR 💥:', err);
        res.status(500).json({
            success: false,
            message: 'Something went wrong on our end. Please try again later.',
            timestamp: new Date().toISOString()
        });
    }
};

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.statusCode = err.statusCode || 500;

    console.error('\n--- ERROR DETAILS ---');
    console.error(`Time: ${new Date().toISOString()}`);
    console.error(`Path: ${req.method} ${req.originalUrl}`);
    console.error(`User: ${req.user ? req.user.email : 'Not authenticated'}`);
    console.error(`Error: ${err.message}`);
    console.error('--- END ERROR ---\n');

    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(error, res);
    } else {
        sendErrorProd(error, res);
    }
};

const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
    const response = {
        success: true,
        message,
        timestamp: new Date().toISOString()
    };

    if (data !== null) {
        response.data = data;
    }

    res.status(statusCode).json(response);
};

module.exports = {
    AppError,
    catchAsync,
    errorHandler,
    sendSuccess
};
