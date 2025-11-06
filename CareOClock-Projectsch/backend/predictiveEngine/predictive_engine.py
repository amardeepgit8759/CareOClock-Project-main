"""
CareOClock Predictive Analytics Engine
Author: AI Assistant (Adapted for User-Specific Time-Series Analysis)
Description: Flask API for real-time health risk analysis based on user-specific
             trends and anomalies. This is a Rule-Based and Statistical Engine.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import logging
from pymongo import MongoClient
from bson import ObjectId
from sklearn.linear_model import LinearRegression
import warnings

# Suppress warnings from sklearn/pandas
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)


class PredictionService:
    def __init__(self, mongodb_uri=''):
        try:
            self.client = MongoClient(mongodb_uri)
            self.db = self.client['careoclock'] # Use your DB name
            self.records_collection = self.db['healthrecords']
            logger.info("Successfully connected to MongoDB.")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise e

    def _flatten_data(self, new_data_nested):
        """
        Flattens the nested data from the user's form into a simple dict.
        """
        flat_data = {}
        try:
            # Vitals
            flat_data['bp_systolic'] = float(new_data_nested.get('bloodPressure', {}).get('systolic'))
            flat_data['bp_diastolic'] = float(new_data_nested.get('bloodPressure', {}).get('diastolic'))
            flat_data['glucose'] = float(new_data_nested.get('bloodSugar', {}).get('value'))
            flat_data['glucose_testType'] = new_data_nested.get('bloodSugar', {}).get('testType', 'random')
            flat_data['heart_rate'] = float(new_data_nested.get('heartRate', {}).get('value'))
            flat_data['weight'] = float(new_data_nested.get('weight', {}).get('value'))
            flat_data['sleep_hours'] = float(new_data_nested.get('sleepHours'))
            flat_data['temperature'] = float(new_data_nested.get('temperature'))
            flat_data['oxygen_level'] = float(new_data_nested.get('oxygenLevel'))
        except Exception as e:
            logger.error(f"Error flattening new data: {e}")
            return None
        return flat_data

    def fetch_user_history(self, user_id, days=30):
        """
        Fetches the user's past data from MongoDB and returns a clean DataFrame.
        """
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            cursor = self.records_collection.find({
                "userId": ObjectId(user_id),
                "date": {"$gte": start_date}
            }).sort("date", 1) # Sort oldest to newest

            records = list(cursor)
            if not records:
                logger.info(f"No recent history found for user {user_id}")
                return pd.DataFrame()

            # Normalize the nested BSON data into a flat list of dicts
            flat_list = []
            for doc in records:
                flat_doc = {
                    'date': doc.get('date'),
                    'bp_systolic': doc.get('bloodPressure', {}).get('systolic'),
                    'bp_diastolic': doc.get('bloodPressure', {}).get('diastolic'),
                    'glucose': doc.get('bloodSugar', {}).get('value'),
                    'heart_rate': doc.get('heartRate', {}).get('value'),
                    'weight': doc.get('weight', {}).get('value'),
                    'sleep_hours': doc.get('sleepHours'),
                    'temperature': doc.get('temperature'),
                    'oxygen_level': doc.get('oxygenLevel')
                }
                flat_list.append(flat_doc)

            df = pd.DataFrame(flat_list)
            df = df.dropna(how='all', subset=df.columns.difference(['date']))
            df['date'] = pd.to_datetime(df['date'])
            
            # Convert all data cols to numeric, coercing errors
            for col in df.columns.difference(['date']):
                df[col] = pd.to_numeric(df[col], errors='coerce')

            return df

        except Exception as e:
            logger.error(f"Error fetching user history: {e}")
            return pd.DataFrame()

    def analyze_safety_net(self, data):
        """
        STAGE 1: Checks the new data point for immediate, severe risks.
        """
        alerts = []
        suggestions = []

        # Blood Pressure
        if data['bp_systolic'] > 180 or data['bp_diastolic'] > 120:
            alerts.append("Hypertensive Crisis: Blood pressure is dangerously high. Seek immediate medical attention.")
        elif data['bp_systolic'] > 140 or data['bp_diastolic'] > 90:
            alerts.append("High Blood Pressure (Stage 2): Your blood pressure is high.")
        elif data['bp_systolic'] > 130 or data['bp_diastolic'] > 80:
            alerts.append("High Blood Pressure (Stage 1): Your blood pressure is elevated.")

        # Oxygen Level
        if data['oxygen_level'] < 92:
            alerts.append("Very Low Oxygen: Your oxygen saturation is critically low. This could be a medical emergency.")
        elif data['oxygen_level'] < 95:
            alerts.append("Low Oxygen: Your oxygen saturation is below normal. Please monitor closely.")

        # Blood Sugar
        tt = data['glucose_testType']
        gl = data['glucose']
        if gl > 250:
            alerts.append("Very High Blood Sugar: Your glucose level is very high. Check for ketones if possible.")
        elif gl < 70:
            alerts.append("Low Blood Sugar (Hypoglycemia): Your glucose is low. Please consume fast-acting carbs.")
        elif tt == 'fasting' and gl > 125:
            alerts.append("High Fasting Glucose: Your fasting glucose is high, which is a risk factor for diabetes.")
        elif tt == 'post-meal' and gl > 180:
            alerts.append("High Post-Meal Glucose: Your glucose is high after eating.")
            
        # Heart Rate
        if data['heart_rate'] > 120:
            alerts.append("Very High Heart Rate (Tachycardia): Your resting heart rate is very high.")
        elif data['heart_rate'] < 50:
            alerts.append("Very Low Heart Rate (Bradycardia): Your resting heart rate is very low.")

        # Temperature
        if data['temperature'] > 103:
            alerts.append("High Fever: Your temperature is very high. Seek medical advice.")
        elif data['temperature'] > 100.4:
            alerts.append("Fever: You have a fever. Rest and hydrate.")
        elif data['temperature'] < 95:
            alerts.append("Low Body Temperature (Hypothermia): Your temperature is very low.")

        return alerts, suggestions

    def analyze_anomalies(self, new_data, history_df):
        """
        STAGE 2: Checks for "statistical shocks" (Z-Score) vs. user's own baseline.
        """
        alerts = []
        if len(history_df) < 5: # Not enough data to get a stable baseline
            return alerts

        for feature in ['heart_rate', 'bp_systolic', 'glucose']:
            if feature not in history_df or history_df[feature].isnull().all():
                continue
                
            mean = history_df[feature].mean()
            std = history_df[feature].std()
            
            if std == 0 or pd.isna(std) or pd.isna(mean):
                continue
                
            new_value = new_data[feature]
            z_score = (new_value - mean) / std

            if abs(z_score) > 2.5: # 2.5 std devs is a significant anomaly
                direction = "spike" if z_score > 0 else "drop"
                alerts.append(f"Sudden {direction} in {feature.replace('_', ' ')}: Your new reading is {abs(z_score):.1f} times different than your recent average.")
        
        return alerts

    def analyze_trends(self, history_df):
        """
        STAGE 3: Checks for slow-moving trends (Linear Regression).
        """
        suggestions = []
        if len(history_df) < 7: # Not enough data to spot a trend
            return suggestions

        # 1. Moving Average Comparison
        for feature in ['bp_systolic', 'weight', 'glucose']:
            if feature not in history_df or history_df[feature].count() < 7:
                continue
            
            avg_30d = history_df[feature].mean()
            avg_7d = history_df.tail(7)[feature].mean()
            
            if pd.isna(avg_30d) or pd.isna(avg_7d):
                continue

            if avg_7d > (avg_30d * 1.05): # 7-day avg is 5% higher than 30-day avg
                suggestions.append(f"Upward Trend: Your {feature.replace('_', ' ')} has been higher than your monthly average for the past week.")
            elif avg_7d < (avg_30d * 0.95) and feature != 'weight': # 5% lower (good for BP/glucose)
                suggestions.append(f"Downward Trend: Your {feature.replace('_', ' ')} has been lower than your monthly average. Keep up the good work!")

        # 2. Linear Regression Slope
        df = history_df.dropna(subset=['bp_systolic', 'weight']).copy()
        if len(df) > 7:
            df['time'] = (df['date'] - df['date'].min()).dt.total_seconds()
            X = df[['time']]
            
            # BP Trend
            y_bp = df['bp_systolic']
            lr_bp = LinearRegression().fit(X, y_bp)
            slope_bp = lr_bp.coef_[0] * (60*60*24) # Get slope in "units per day"
            
            if slope_bp > 0.5: # If BP is rising by > 0.5 points per day
                suggestions.append("Long-Term Trend: Your blood pressure appears to be on a gradual upward trend over the last month.")

        return suggestions

    def predict_risk(self, new_data_nested, user_id):
        """
        Orchestrates the full analysis and generates a final report.
        """
        
        # 1. Flatten the new data from the form
        new_data_flat = self._flatten_data(new_data_nested)
        if new_data_flat is None:
            return {'error': 'Invalid input data format'}

        # 2. Fetch user's history
        history_df = self.fetch_user_history(user_id, days=30)

        # 3. Run all analysis stages
        safety_alerts, safety_suggestions = self.analyze_safety_net(new_data_flat)
        anomaly_alerts = self.analyze_anomalies(new_data_flat, history_df)
        trend_suggestions = self.analyze_trends(history_df)
        
        # 4. Combine all findings
        all_alerts = safety_alerts + anomaly_alerts
        all_suggestions = safety_suggestions + trend_suggestions

        # 5. Determine final risk level
        risk_level = "Low"
        if any("critically" in a or "dangerously" in a or "emergency" in a for a in all_alerts):
            risk_level = "High"
        elif all_alerts:
            risk_level = "Medium"
        elif all_suggestions:
            risk_level = "Low" # Low risk, but with suggestions

        # 6. Build the final JSON response
        response = {
            'risk_level': risk_level,
            'alerts': all_alerts,
            'suggestions': all_suggestions,
            'analysis_summary': {
                'immediate_alerts': len(safety_alerts),
                'anomaly_alerts': len(anomaly_alerts),
                'trend_suggestions': len(trend_suggestions)
            },
            'timestamp': datetime.now().isoformat()
        }
        
        return response


# --- FLASK APP ---

try:
    prediction_service = PredictionService()
except Exception as e:
    logger.error(f"CRITICAL: Failed to initialize PredictionService. {e}")
    # In a real production app, you might exit or prevent Flask from starting
    # For this example, we'll let it run so /health can report an error
    prediction_service = None

@app.route('/health', methods=['GET'])
def health_check():
    if prediction_service is None:
        return jsonify({
            'status': 'unhealthy',
            'error': 'PredictionService failed to initialize. Check DB connection.'
        }), 500
        
    return jsonify({
        'status': 'healthy',
        'engine_type': 'Rule-Based & Time-Series Analysis',
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/predict', methods=['POST'])
def predict():
    if prediction_service is None:
        return jsonify({'error': 'Prediction service is offline.'}), 503

    try:
        if not request.json:
            return jsonify({'error': 'No JSON data provided'}), 400

        health_data = request.json
        user_id = health_data.get('userId')

        if not user_id:
            return jsonify({'error': 'Missing required field: userId'}), 400
        
        if not ObjectId.is_valid(user_id):
            return jsonify({'error': 'Invalid userId format'}), 400

        # --- Data Validation (based on your form) ---
        if 'bloodPressure' not in health_data or 'bloodSugar' not in health_data or \
           'heartRate' not in health_data or 'sleepHours' not in health_data or \
           'temperature' not in health_data or 'oxygenLevel' not in health_data:
            return jsonify({'error': 'Missing one or more required health readings.'}), 400


        result = prediction_service.predict_risk(health_data, user_id)
        
        if 'error' in result:
             return jsonify(result), 400
             
        logger.info(f"Prediction made for user {user_id}: {result['risk_level']}")
        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({'error': f'Internal server error: {e}'}), 500


@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404


if __name__ == '__main__':
    print("Starting CareOClock Predictive Engine (Time-Series & Rules)...")
    app.run(host='0.0.0.0', port=5001, debug=True)