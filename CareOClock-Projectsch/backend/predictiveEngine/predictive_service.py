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

warnings.filterwarnings('ignore')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

class PredictionService:
    def __init__(self, mongodb_uri=''):
        try:
            self.client = MongoClient(mongodb_uri)
            self.db = self.client['test']  # Use your DB name
            self.records_collection = self.db['healthrecords']
            logger.info("Successfully connected to MongoDB.")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise e

    def _flatten_data(self, new_data_nested):
        flat_data = {}
        try:
            bp_data = new_data_nested.get('bloodPressure', {})
            flat_data['bp_systolic'] = float(bp_data.get('systolic') or new_data_nested.get('bp_systolic', 0))
            flat_data['bp_diastolic'] = float(bp_data.get('diastolic') or new_data_nested.get('bp_diastolic', 0))

            sugar_data = new_data_nested.get('bloodSugar', {})
            flat_data['glucose'] = float(sugar_data.get('value') or new_data_nested.get('glucose', 0))
            flat_data['glucose_testType'] = sugar_data.get('testType') or new_data_nested.get('glucose_testType', 'random')

            hr_data = new_data_nested.get('heartRate', {})
            flat_data['heart_rate'] = float(hr_data.get('value') or new_data_nested.get('heart_rate', 0))

            weight_data = new_data_nested.get('weight', {})
            flat_data['weight'] = float(weight_data.get('value') or new_data_nested.get('weight', 0))

            flat_data['sleep_hours'] = float(new_data_nested.get('sleepHours') or new_data_nested.get('sleep_hours', 0))
            flat_data['temperature'] = float(new_data_nested.get('temperature') or new_data_nested.get('temperature', 0))
            flat_data['oxygen_level'] = float(new_data_nested.get('oxygenLevel') or new_data_nested.get('oxygen_level', 0))

            # Filter zeros if truly missing
            for key in list(flat_data.keys()):
                if flat_data[key] == 0 and key not in new_data_nested and not any(key in d for d in (bp_data, sugar_data, hr_data, weight_data)):
                    flat_data[key] = None

        except Exception as e:
            logger.error(f"Error flattening new data: {e}. Data: {new_data_nested}")
            return None
        return flat_data

    def fetch_user_history(self, user_id, days=14):
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            cursor = self.records_collection.find({
                "userId": ObjectId(user_id),
                "date": {"$gte": start_date}
            }).sort("date", 1)

            records = list(cursor)
            if not records:
                logger.info(f"No recent history found for user {user_id}")
                return pd.DataFrame()

            flat_list = []
            for doc in records:
                flat_doc = {
                    'date': doc.get('date'),
                    'bp_systolic': doc.get('bloodPressure', {}).get('systolic'),
                    'bp_diastolic': doc.get('bloodPressure', {}).get('diastolic'),
                    'glucose': doc.get('bloodSugar', {}).get('value'),
                    'heart_rate': doc.get('heartRate', {}).get('value'),
                    'weight': doc.get('weight', {}).get('value'),
                    'sleep_hours': (doc.get('sleepHours', {}) if isinstance(doc.get('sleepHours'), dict) else {'value': doc.get('sleepHours')}).get('value'),
                    'temperature': (doc.get('temperature', {}) if isinstance(doc.get('temperature'), dict) else {'value': doc.get('temperature')}).get('value'),
                    'oxygen_level': (doc.get('oxygenLevel', {}) if isinstance(doc.get('oxygenLevel'), dict) else {'value': doc.get('oxygenLevel')}).get('value')
                }
                flat_list.append(flat_doc)

            df = pd.DataFrame(flat_list)
            df = df.dropna(how='all', subset=df.columns.difference(['date']))
            df['date'] = pd.to_datetime(df['date'])
            for col in df.columns.difference(['date']):
                df[col] = pd.to_numeric(df[col], errors='coerce')
            return df
        except Exception as e:
            logger.error(f"Error fetching user history: {e}")
            return pd.DataFrame()

    def analyze_safety_net(self, data):
        alerts = []
        suggestions = []

        if data.get('bp_systolic') and data.get('bp_diastolic'):
            systolic = data['bp_systolic']
            diastolic = data['bp_diastolic']

            if systolic > 180 or diastolic > 120:
                alerts.append("Hypertensive Crisis: Blood pressure is dangerously high. Seek immediate medical attention.")
            if systolic < 90 or diastolic < 60:
                alerts.append("Hypotensive Crisis: Blood pressure is dangerously low. Please rest and contact your doctor.")
            if systolic > 140 or diastolic > 90:
                alerts.append("High Blood Pressure (Stage 2): Your blood pressure is high.")
            elif systolic > 130 or diastolic > 80:
                alerts.append("High Blood Pressure (Stage 1): Your blood pressure is elevated.")

        if data.get('oxygen_level'):
            o2 = data['oxygen_level']
            if o2 < 92:
                alerts.append("Very Low Oxygen: Your oxygen saturation is critically low. This could be a medical emergency.")
            elif o2 < 95:
                alerts.append("Low Oxygen: Your oxygen saturation is below normal. Please monitor closely.")

        if data.get('glucose'):
            tt = data.get('glucose_testType', 'random')
            gl = data['glucose']
            if gl > 250:
                alerts.append("Very High Blood Sugar: Your glucose level is very high. Check for ketones if possible.")
            elif gl < 70:
                alerts.append("Low Blood Sugar (Hypoglycemia): Your glucose is low. Please consume fast-acting carbs.")
            elif tt == 'fasting' and gl > 125:
                alerts.append("High Fasting Glucose: Your fasting glucose is high, which is a risk factor for diabetes.")
            elif tt == 'post-meal' and gl > 180:
                alerts.append("High Post-Meal Glucose: Your glucose is high after eating.")

        if data.get('heart_rate'):
            hr = data['heart_rate']
            if hr > 120:
                alerts.append("Very High Heart Rate (Tachycardia): Your resting heart rate is very high.")
            elif hr < 50:
                alerts.append("Very Low Heart Rate (Bradycardia): Your resting heart rate is very low.")

        if data.get('temperature'):
            temp = data['temperature']
            if temp > 103:
                alerts.append("High Fever: Your temperature is very high. Seek medical advice.")
            elif temp > 100.4:
                alerts.append("Fever: You have a fever. Rest and hydrate.")
            elif temp < 95:
                alerts.append("Low Body Temperature (Hypothermia): Your temperature is very low.")

        return alerts, suggestions

    def analyze_safety_net_history(self, history_df):
        alerts = []
        suggestions = []
        for _, record in history_df.iterrows():
            sys = record.get('bp_systolic')
            dia = record.get('bp_diastolic')
            o2 = record.get('oxygen_level')
            gl = record.get('glucose')
            hr = record.get('heart_rate')
            temp = record.get('temperature')

            if sys is not None and dia is not None:
                if sys > 180 or dia > 120:
                    alerts.append(f"Hypertensive Crisis at {record['date']}: BP {sys}/{dia}")
                if sys < 90 or dia < 60:
                    alerts.append(f"Hypotensive Crisis at {record['date']}: BP {sys}/{dia}")
                if 140 < sys <= 180 or 90 < dia <= 120:
                    alerts.append(f"High Blood Pressure (Stage 2) at {record['date']}: BP {sys}/{dia}")
                if 130 < sys <= 140 or 80 < dia <= 90:
                    alerts.append(f"High Blood Pressure (Stage 1) at {record['date']}: BP {sys}/{dia}")

            if o2 is not None:
                if o2 < 92:
                    alerts.append(f"Very Low Oxygen at {record['date']}: {o2}%")
                elif o2 < 95:
                    alerts.append(f"Low Oxygen at {record['date']}: {o2}%")

            if gl is not None:
                if gl > 250:
                    alerts.append(f"Very High Blood Sugar at {record['date']}: {gl}")
                elif gl < 70:
                    alerts.append(f"Low Blood Sugar at {record['date']}: {gl}")

            if hr is not None:
                if hr > 120:
                    alerts.append(f"Very High Heart Rate at {record['date']}: {hr}")
                elif hr < 50:
                    alerts.append(f"Very Low Heart Rate at {record['date']}: {hr}")

            if temp is not None:
                if temp > 103:
                    alerts.append(f"High Fever at {record['date']}: {temp}")
                elif temp > 100.4:
                    alerts.append(f"Fever at {record['date']}: {temp}")
                elif temp < 95:
                    alerts.append(f"Low Body Temperature at {record['date']}: {temp}")

        return alerts, suggestions

    def analyze_anomalies(self, new_data, history_df):
        alerts = []
        if len(history_df) < 5:
            return alerts
        recent_df = history_df.tail(7) if len(history_df) > 7 else history_df
        for feature in ['heart_rate', 'bp_systolic', 'glucose']:
            if feature not in recent_df or recent_df[feature].isnull().all() or not new_data.get(feature):
                continue
            mean = recent_df[feature].mean()
            std = recent_df[feature].std()
            if std == 0 or pd.isna(std) or pd.isna(mean):
                continue
            new_value = new_data[feature]
            z_score = (new_value - mean) / std
            if abs(z_score) > 2.5:
                direction = "spike" if z_score > 0 else "drop"
                alerts.append(f"Sudden {direction} in {feature.replace('_', ' ')}: Your new reading is {abs(z_score):.1f} times different than your recent average.")
        return alerts

    def analyze_trends(self, history_df):
        suggestions = []
        if len(history_df) < 7:
            return suggestions
        for feature in ['bp_systolic', 'weight', 'glucose']:
            if feature not in history_df or history_df[feature].count() < 7:
                continue
            avg_30d = history_df[feature].mean()
            avg_7d = history_df.tail(7)[feature].mean()
            if pd.isna(avg_30d) or pd.isna(avg_7d):
                continue
            if avg_7d > (avg_30d * 1.02):
                suggestions.append(f"Upward Trend: Your {feature.replace('_', ' ')} has been higher than your monthly average for the past week.")
            elif avg_7d < (avg_30d * 0.95) and feature != 'weight':
                suggestions.append(f"Downward Trend: Your {feature.replace('_', ' ')} has been lower than your monthly average. Keep up the good work!")
        df = history_df.dropna(subset=['bp_systolic', 'weight']).copy()
        if len(df) > 7:
            df['time'] = (df['date'] - df['date'].min()).dt.total_seconds()
            X = df[['time']]
            y_bp = df['bp_systolic']
            lr_bp = LinearRegression().fit(X, y_bp)
            slope_bp = lr_bp.coef_[0] * (60 * 60 * 24)
            if slope_bp > 0.5:
                suggestions.append("Long-Term Trend: Your blood pressure appears to be on a gradual upward trend over the last month.")
        return suggestions

    def predict_risk(self, new_data_nested, user_id):
        new_data_flat = self._flatten_data(new_data_nested)
        if new_data_flat is None:
            return {'error': 'Invalid input data format'}

        history_df = self.fetch_user_history(user_id, days=14)

        history_alerts, history_suggestions = self.analyze_safety_net_history(history_df)
        safety_alerts, safety_suggestions = self.analyze_safety_net(new_data_flat)
        anomaly_alerts = self.analyze_anomalies(new_data_flat, history_df)
        trend_suggestions = self.analyze_trends(history_df)

        all_alerts = history_alerts + safety_alerts + anomaly_alerts
        all_suggestions = history_suggestions + safety_suggestions + trend_suggestions

        risk_level = "Low"
        confidence_score = 0.5

        for alert in safety_alerts:
            if any(keyword in alert for keyword in ["Crisis", "critically", "dangerously", "emergency"]):
                confidence_score += 0.3
            else:
                confidence_score += 0.15

        confidence_score += len(anomaly_alerts) * 0.1
        confidence_score += len(trend_suggestions) * 0.05
        confidence = min(confidence_score, 0.98)

        if any("critically" in a or "dangerously" in a or "emergency" in a for a in all_alerts):
            risk_level = "High"
        elif all_alerts:
            risk_level = "Medium"
        elif all_suggestions:
            risk_level = "Low"
        if not all_alerts and not all_suggestions:
            confidence = 0.95

        response = {
            'risk_level': risk_level,
            'confidence': confidence,
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


try:
    prediction_service = PredictionService()
except Exception as e:
    logger.error(f"CRITICAL: Failed to initialize PredictionService. {e}")
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

        # Debug incoming data
        print(f"Incoming health data: {health_data}")

        user_id = health_data.get('userId')

        if not user_id:
            return jsonify({'error': 'Missing required field: userId'}), 400

        if not ObjectId.is_valid(user_id):
            return jsonify({'error': 'Invalid userId format'}), 400

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


@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'message': 'CareOClock Predictive Engine is running.',
        'endpoints': {
            '/health': 'GET - Check service health',
            '/predict': 'POST - Get risk prediction'
        }
    }), 200


if __name__ == '__main__':
    print("\n--- Starting CareOClock Predictive Engine (Time-Series & Rules) ---")
    app.run(host='0.0.0.0', port=5001, debug=True)
