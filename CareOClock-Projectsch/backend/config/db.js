// backend/config/db.js
/**
 * Database Configuration
 * MongoDB connection using Mongoose with error handling and connection events
 */

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // MongoDB connection options
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        };

        // Connect to MongoDB
        const conn = await mongoose.connect(process.env.MONGODB_URI, options);

        console.log(`\n📦 MongoDB Connected: ${conn.connection.host}`);
        console.log(`🔗 Database: ${conn.connection.name}`);

        // Connection event listeners
        mongoose.connection.on('connected', () => {
            console.log('✅ Mongoose connected to MongoDB');
        });

        mongoose.connection.on('error', (err) => {
            console.error(`❌ Mongoose connection error: ${err}`);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️  Mongoose disconnected from MongoDB');
        });

        // Graceful close on app termination
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('\n🔒 MongoDB connection closed through app termination');
            process.exit(0);
        });

    } catch (error) {
        console.error(`❌ Database connection failed: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
