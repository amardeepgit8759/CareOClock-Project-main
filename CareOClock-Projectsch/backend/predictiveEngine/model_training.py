"""
CareOClock Predictive Analytics Engine - Model Training
Author: AI Assistant
Description: Trains RandomForest and XGBoost models for health risk prediction
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
import xgboost as xgb
import pickle
import joblib
from datetime import datetime
import pymongo
import warnings
warnings.filterwarnings('ignore')


class HealthRiskPredictor:
    def __init__(self, mongodb_uri=''):
        self.client = pymongo.MongoClient(mongodb_uri)
        self.db = self.client['careoclock']  # Use your DB name
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.rf_model = None
        self.xgb_model = None
        self.feature_names = None
        self.best_model = None
        self.best_model_name = None

    def load_data_from_mongodb(self):
        """
        Load health data from MongoDB (adapted for your existing HealthRecord structure)
        """
        try:
            cursor = self.db.healthrecords.find({})
            data_list = []

            for doc in cursor:
                heart_rate = doc.get('heartRate', {}).get('value')
                bp_systolic = doc.get('bloodPressure', {}).get('systolic')
                bp_diastolic = doc.get('bloodPressure', {}).get('diastolic')
                glucose = doc.get('bloodSugar', {}).get('value')
                sleep_hours = doc.get('sleepHours', {}).get('value', 7)
                temperature = doc.get('temperature', {}).get('value', 98.6)
                oxygen_level = doc.get('oxygenLevel', {}).get('value', 98)
                weight = doc.get('weight', {}).get('value', 70)
                activity_level = doc.get('activityLevel', 5)
                stress_level = doc.get('stressLevel', 5)
                mood_rating = doc.get('moodRating', 5)
                energy_level = doc.get('energyLevel', 5)
                pain_level = doc.get('painLevel', 0)

                if (heart_rate is not None and bp_systolic is not None 
                    and bp_diastolic is not None and glucose is not None):
                    data_list.append({
                        'heart_rate': heart_rate,
                        'bp_systolic': bp_systolic,
                        'bp_diastolic': bp_diastolic,
                        'glucose': glucose,
                        'sleep_hours': sleep_hours,
                        'temperature': temperature,
                        'oxygen_level': oxygen_level,
                        'weight': weight,
                        'activity_level': activity_level,
                        'stress_level': stress_level,
                        'mood_rating': mood_rating,
                        'energy_level': energy_level,
                        'pain_level': pain_level,
                        'age': 65,  # Placeholder for age
                        'risk_level': self._calculate_risk_label(doc)
                    })

            if not data_list:
                print("No real data found. Generating sample training data...")
                return self._generate_sample_data()

            df = pd.DataFrame(data_list)

            print("Risk level distribution:\n", df['risk_level'].value_counts())

            return df

        except Exception as e:
            print(f"Error loading data from MongoDB: {e}")
            return self._generate_sample_data()

    def load_data_from_csv(self, csv_path='balanced_health_data.csv'):
        try:
            df = pd.read_csv(csv_path)
            print(f"Loaded {len(df)} records from CSV")
            print("Risk level distribution:\n", df['risk_level'].value_counts())
            return df
        except Exception as e:
            print(f"Error loading CSV data: {e}")
            return None

    def _calculate_risk_label(self, doc):
        risk_factors = 0

        hr = doc.get('heartRate', {}).get('value', 70)
        if hr > 100 or hr < 60:
            risk_factors += 1

        bp = doc.get('bloodPressure', {})
        if bp.get('systolic', 120) > 140 or bp.get('diastolic', 80) > 90:
            risk_factors += 1

        glucose = doc.get('bloodSugar', {}).get('value', 100)
        if glucose > 140:
            risk_factors += 1

        sleep_hours = doc.get('sleepHours', {}).get('value', 7)
        if sleep_hours < 6:
            risk_factors += 1

        age = doc.get('age', 65)
        if age > 65:
            risk_factors += 1

        if risk_factors >= 3:
            return 'High'
        elif risk_factors >= 2:
            return 'Medium'
        else:
            return 'Low'

    def _generate_sample_data(self, n_samples=1000):
        np.random.seed(42)
        data = {
            'heart_rate': np.random.normal(75, 15, n_samples),
            'bp_systolic': np.random.normal(120, 20, n_samples),
            'bp_diastolic': np.random.normal(80, 10, n_samples),
            'glucose': np.random.normal(100, 25, n_samples),
            'sleep_hours': np.random.normal(7, 1.5, n_samples),
            'temperature': np.random.normal(98.6, 0.8, n_samples),
            'oxygen_level': np.random.normal(98, 2, n_samples),
            'age': np.random.randint(20, 90, n_samples)
        }
        df = pd.DataFrame(data)

        def get_risk_level(row):
            score = 0
            if row['heart_rate'] > 100 or row['heart_rate'] < 60:
                score += 1
            if row['bp_systolic'] > 140 or row['bp_diastolic'] > 90:
                score += 1
            if row['glucose'] > 140:
                score += 1
            if row['sleep_hours'] < 6:
                score += 1
            if row['age'] > 65:
                score += 0.5
            if score >= 3:
                return 'High'
            elif score >= 1.5:
                return 'Medium'
            else:
                return 'Low'

        df['risk_level'] = df.apply(get_risk_level, axis=1)
        print("Sample data risk distribution:\n", df['risk_level'].value_counts())
        return df

    def preprocess_data(self, df):
        df = df.fillna(df.mean(numeric_only=True))
        df['bp_ratio'] = df['bp_systolic'] / df['bp_diastolic'].replace(0, 1)
        df['bmi_estimate'] = np.random.normal(25, 5, len(df))  # Placeholder

        def hr_category(hr):
            if hr < 60:
                return 0
            elif hr <= 100:
                return 1
            else:
                return 2

        df['heart_rate_category'] = df['heart_rate'].apply(hr_category)

        feature_columns = ['heart_rate', 'bp_systolic', 'bp_diastolic', 'glucose',
                           'sleep_hours', 'temperature', 'oxygen_level', 'age',
                           'bp_ratio', 'bmi_estimate', 'heart_rate_category']

        X = df[feature_columns]
        y = df['risk_level']

        self.feature_names = feature_columns

        y_encoded = self.label_encoder.fit_transform(y)
        print("Encoded classes:", list(self.label_encoder.classes_))
        X_scaled = self.scaler.fit_transform(X)

        return X_scaled, y_encoded

    def train_models(self, X, y):
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        print("Training Random Forest...")
        rf_params = {'n_estimators': [100], 'max_depth': [10, None], 'min_samples_split': [2, 5]}
        self.rf_model = RandomForestClassifier(random_state=42)
        rf_grid = GridSearchCV(self.rf_model, rf_params, cv=3, scoring='accuracy', n_jobs=-1)
        rf_grid.fit(X_train, y_train)
        self.rf_model = rf_grid.best_estimator_

        print("Training XGBoost...")
        xgb_params = {'n_estimators': [100], 'max_depth': [6, 10], 'learning_rate': [0.1]}
        self.xgb_model = xgb.XGBClassifier(random_state=42, use_label_encoder=False, eval_metric='mlogloss')
        xgb_grid = GridSearchCV(self.xgb_model, xgb_params, cv=3, scoring='accuracy', n_jobs=-1)
        xgb_grid.fit(X_train, y_train)
        self.xgb_model = xgb_grid.best_estimator_

        rf_score = self.rf_model.score(X_test, y_test)
        xgb_score = self.xgb_model.score(X_test, y_test)

        print(f"Random Forest Accuracy: {rf_score:.4f}")
        print(f"XGBoost Accuracy: {xgb_score:.4f}")

        if xgb_score > rf_score:
            self.best_model = self.xgb_model
            self.best_model_name = 'XGBoost'
        else:
            self.best_model = self.rf_model
            self.best_model_name = 'RandomForest'

        print(f"Selected Best Model: {self.best_model_name}")

        return {'rf_accuracy': rf_score, 'xgb_accuracy': xgb_score, 'best_model': self.best_model_name}

    def save_models(self, save_path='./'):
        try:
            joblib.dump(self.rf_model, f'{save_path}random_forest_model.pkl')
            joblib.dump(self.xgb_model, f'{save_path}xgboost_model.pkl')
            joblib.dump(self.best_model, f'{save_path}best_model.pkl')

            joblib.dump(self.scaler, f'{save_path}scaler.pkl')
            joblib.dump(self.label_encoder, f'{save_path}label_encoder.pkl')

            with open(f'{save_path}feature_names.pkl', 'wb') as f:
                pickle.dump(self.feature_names, f)

            metadata = {
                'timestamp': datetime.now().isoformat(),
                'best_model': self.best_model_name,
                'feature_names': self.feature_names,
                'model_version': '1.0'
            }

            with open(f'{save_path}model_metadata.pkl', 'wb') as f:
                pickle.dump(metadata, f)

            print(f"Models saved successfully to {save_path}")
        except Exception as e:
            print(f"Error saving models: {e}")


def main():
    print("Starting CareOClock Predictive Analytics Training...")

    predictor = HealthRiskPredictor()

    # To load data from CSV, uncomment next line and comment MongoDB load line
    df = predictor.load_data_from_csv()  # Load from CSV

    # df = predictor.load_data_from_mongodb()  # Use this line if loading from MongoDB instead

    if df is None or df.empty:
        print("No data available to train. Exiting.")
        return

    print("Preprocessing data...")
    X, y = predictor.preprocess_data(df)

    print("Training models...")
    results = predictor.train_models(X, y)

    print("Saving models...")
    predictor.save_models()

    print("Training completed successfully!")
    print("Results:", results)


if __name__ == "__main__":
    main()
