#!/usr/bin/env python3
"""
CareOClock System Performance Testing
Tests API response times, alert generation, etc.
"""

import time
import json
import requests
import random
from datetime import datetime
import numpy as np

print("=" * 60)
print("CAREOCLOCK SYSTEM PERFORMANCE TEST")
print(f"Timestamp: {datetime.now()}")
print("=" * 60)

# Test data
test_health_records = [
    {
        "heart_rate": random.randint(60, 100),
        "bp_systolic": random.randint(110, 160),
        "bp_diastolic": random.randint(70, 100),
        "glucose": random.randint(80, 200),
        "temperature": random.uniform(36.5, 37.5),
        "oxygen_level": random.randint(94, 99),
        "age": random.randint(60, 85),
        "sleep_hours": random.randint(4, 9),
        "adherence_rate": random.randint(50, 100)
    }
    for _ in range(10)
]

# Prediction service endpoint
PREDICT_URL = "http://localhost:5001/predict"

print(f"\nTesting Prediction Service...")
print(f"Endpoint: {PREDICT_URL}\n")

response_times = []
predictions = []

for i, record in enumerate(test_health_records):
    try:
        start_time = time.time()
        response = requests.post(PREDICT_URL, json=record, timeout=5)
        end_time = time.time()
        
        response_time = (end_time - start_time) * 1000  # ms
        response_times.append(response_time)
        
        if response.status_code == 200:
            pred_data = response.json()
            predictions.append(pred_data)
            print(f"Request {i+1}: {response_time:.2f}ms | Risk: {pred_data.get('risk_level')} | Confidence: {pred_data.get('confidence'):.4f}")
        else:
            print(f"Request {i+1}: ERROR - Status {response.status_code}")
    except Exception as e:
        print(f"Request {i+1}: FAILED - {str(e)}")

# Calculate performance metrics
print("\n" + "=" * 60)
print("PERFORMANCE METRICS")
print("=" * 60)
print(f"\nAverage Response Time: {np.mean(response_times):.2f} ms")
print(f"Min Response Time:     {np.min(response_times):.2f} ms")
print(f"Max Response Time:     {np.max(response_times):.2f} ms")
print(f"Std Dev:               {np.std(response_times):.2f} ms")

# Save to file
perf_results = {
    "test_count": len(response_times),
    "avg_response_time_ms": float(np.mean(response_times)),
    "min_response_time_ms": float(np.min(response_times)),
    "max_response_time_ms": float(np.max(response_times)),
    "std_dev_ms": float(np.std(response_times)),
    "timestamp": str(datetime.now())
}

with open('performance_results.json', 'w') as f:
    json.dump(perf_results, f, indent=2)

print("\n✓ Performance results saved to: performance_results.json")
print("=" * 60)
