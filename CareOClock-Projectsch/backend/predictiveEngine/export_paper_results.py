#!/usr/bin/env python3
"""
Export evaluation results in LaTeX table format for paper
"""

import json

# Load evaluation results
with open('evaluation_results.json', 'r') as f:
    results = json.load(f)

rf = results['random_forest']
xgb = results['xgboost']

print("\n" + "=" * 80)
print("LATEX TABLE CODE FOR PAPER")
print("=" * 80)

print("""
\\begin{table}[h]
\\centering
\\caption{Model Performance Comparison}
\\label{tab:model_perf}
\\begin{tabular}{@{}lcccc@{}}
\\toprule
\\textbf{Metric} & \\textbf{RF} & \\textbf{XGBoost} & \\textbf{Unit} \\\\
\\midrule""")

print(f"Test Accuracy & {rf['accuracy']:.4f} & {xgb['accuracy']:.4f} & ratio \\\\")
print(f"Precision & {rf['precision_weighted']:.4f} & {xgb['precision_weighted']:.4f} & ratio \\\\")
print(f"Recall & {rf['recall_weighted']:.4f} & {xgb['recall_weighted']:.4f} & ratio \\\\")
print(f"F1-Score & {rf['f1_score_weighted']:.4f} & {xgb['f1_score_weighted']:.4f} & score \\\\")
print(f"ROC-AUC & {rf['roc_auc']:.4f} & {xgb['roc_auc']:.4f} & area \\\\")

print("""\\bottomrule
\\end{tabular}
\\end{table}
""")

print("\nCONFUSION MATRIX (XGBoost):")
print("True Class 0 (Low):    ", xgb['confusion_matrix'][0])
print("True Class 1 (Medium): ", xgb['confusion_matrix'][1])
print("True Class 2 (High):   ", xgb['confusion_matrix'][2])

# Calculate accuracy
print(f"\nKey Result: XGBoost Accuracy = {xgb['accuracy']*100:.2f}%")
print(f"Key Result: XGBoost ROC-AUC = {xgb['roc_auc']:.4f}")
