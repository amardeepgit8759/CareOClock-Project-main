import json
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

print("=" * 60)
print("CAREOCLOCK MODEL EVALUATION")
print(f"Timestamp: {datetime.now()}")
print("=" * 60)

# Load dataset
df = pd.read_csv('balanced_health_data.csv')
print(f"\n✓ Dataset loaded: {len(df)} records, {len(df.columns)} features")

# Display features
features_list = df.columns.tolist()
print(f"Features: {features_list}")

# Separate features and target
target_column = 'risk_level'
X = df.drop(target_column, axis=1)
y = df[target_column]

print(f"\n✓ Feature matrix shape: {X.shape}")
print(f"✓ Target distribution:")
print(y.value_counts())

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"\n✓ Train/Test split: {len(X_train)} / {len(X_test)}")

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# ==================== ENCODE TARGET VARIABLE ====================
# This is critical for XGBoost
label_encoder = LabelEncoder()
y_train_encoded = label_encoder.fit_transform(y_train)
y_test_encoded = label_encoder.transform(y_test)
# ================================================================

print("\n" + "=" * 60)
print("MODEL 1: RANDOM FOREST")
print("=" * 60)

rf_model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
rf_model.fit(X_train_scaled, y_train_encoded)
y_pred_rf = rf_model.predict(X_test_scaled)

# Decode predictions back to original labels for display
y_pred_rf_labels = label_encoder.inverse_transform(y_pred_rf)
y_test_labels = label_encoder.inverse_transform(y_test_encoded)

print(f"Test Accuracy:    {accuracy_score(y_test_encoded, y_pred_rf):.4f} ({accuracy_score(y_test_encoded, y_pred_rf)*100:.2f}%)")
print(f"Precision (Weighted): {precision_score(y_test_encoded, y_pred_rf, average='weighted'):.4f}")
print(f"Recall (Weighted):    {recall_score(y_test_encoded, y_pred_rf, average='weighted'):.4f}")
print(f"F1-Score (Weighted):  {f1_score(y_test_encoded, y_pred_rf, average='weighted'):.4f}")

# ROC-AUC (one-vs-rest for multiclass)
try:
    roc_auc = roc_auc_score(y_test_encoded, rf_model.predict_proba(X_test_scaled), 
                            multi_class='ovr', average='weighted')
    print(f"ROC-AUC Score:        {roc_auc:.4f}")
except:
    print("ROC-AUC Score:        N/A")

print("\nPer-Class Metrics (RandomForest):")
print(classification_report(y_test_labels, y_pred_rf_labels))

print("\nConfusion Matrix (RandomForest):")
cm_rf = confusion_matrix(y_test_encoded, y_pred_rf)
print(cm_rf)

print("\n" + "=" * 60)
print("MODEL 2: XGBOOST")
print("=" * 60)

# Train XGBoost with ENCODED labels
xgb_model = XGBClassifier(n_estimators=100, max_depth=5, random_state=42, verbosity=0)
xgb_model.fit(X_train_scaled, y_train_encoded, verbose=False)
y_pred_xgb = xgb_model.predict(X_test_scaled)

# Decode predictions back to original labels for display
y_pred_xgb_labels = label_encoder.inverse_transform(y_pred_xgb)

print(f"Test Accuracy:    {accuracy_score(y_test_encoded, y_pred_xgb):.4f} ({accuracy_score(y_test_encoded, y_pred_xgb)*100:.2f}%)")
print(f"Precision (Weighted): {precision_score(y_test_encoded, y_pred_xgb, average='weighted'):.4f}")
print(f"Recall (Weighted):    {recall_score(y_test_encoded, y_pred_xgb, average='weighted'):.4f}")
print(f"F1-Score (Weighted):  {f1_score(y_test_encoded, y_pred_xgb, average='weighted'):.4f}")

# ROC-AUC (one-vs-rest for multiclass)
try:
    roc_auc = roc_auc_score(y_test_encoded, xgb_model.predict_proba(X_test_scaled), 
                            multi_class='ovr', average='weighted')
    print(f"ROC-AUC Score:        {roc_auc:.4f}")
except:
    print("ROC-AUC Score:        N/A")

print("\nPer-Class Metrics (XGBoost):")
print(classification_report(y_test_labels, y_pred_xgb_labels))

print("\nConfusion Matrix (XGBoost):")
cm_xgb = confusion_matrix(y_test_encoded, y_pred_xgb)
print(cm_xgb)

print("\n" + "=" * 60)
print("MODEL COMPARISON")
print("=" * 60)

rf_acc = accuracy_score(y_test_encoded, y_pred_rf)
xgb_acc = accuracy_score(y_test_encoded, y_pred_xgb)

print(f"Random Forest Accuracy: {rf_acc:.4f}")
print(f"XGBoost Accuracy:       {xgb_acc:.4f}")

if rf_acc > xgb_acc:
    print(f"\n✓ Random Forest performs better by {(rf_acc - xgb_acc)*100:.2f}%")
elif xgb_acc > rf_acc:
    print(f"\n✓ XGBoost performs better by {(xgb_acc - rf_acc)*100:.2f}%")
else:
    print("\n✓ Both models have equal accuracy")

print("\n" + "=" * 60)

# Collect evaluation metrics to save
evaluation_results = {
    "random_forest": {
        "accuracy": float(rf_acc),
        "precision_weighted": precision_score(y_test_encoded, y_pred_rf, average='weighted'),
        "recall_weighted": recall_score(y_test_encoded, y_pred_rf, average='weighted'),
        "f1_score_weighted": f1_score(y_test_encoded, y_pred_rf, average='weighted'),
        "roc_auc": roc_auc if 'roc_auc' in locals() else None,
        "confusion_matrix": cm_rf.tolist()
    },
    "xgboost": {
        "accuracy": float(xgb_acc),
        "precision_weighted": precision_score(y_test_encoded, y_pred_xgb, average='weighted'),
        "recall_weighted": recall_score(y_test_encoded, y_pred_xgb, average='weighted'),
        "f1_score_weighted": f1_score(y_test_encoded, y_pred_xgb, average='weighted'),
        "roc_auc": roc_auc if 'roc_auc' in locals() else None,
        "confusion_matrix": cm_xgb.tolist()
    },
    "model_comparison": {
        "better_model": "Random Forest" if rf_acc > xgb_acc else "XGBoost" if xgb_acc > rf_acc else "Equal performance",
        "accuracy_difference": abs(rf_acc - xgb_acc)
    },
    "timestamp": str(datetime.now())
}

# Save to JSON file
with open("evaluation_results.json", "w") as f:
    json.dump(evaluation_results, f, indent=4)

print("\n✓ Evaluation results saved to: evaluation_results.json")

print("EVALUATION COMPLETE")
print("=" * 60)