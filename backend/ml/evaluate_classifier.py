import os
import json
import joblib
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix, f1_score, precision_score, recall_score

def evaluate():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    test_path = os.path.join(current_dir, "data", "test_complaints.csv")
    artifacts_dir = os.path.join(current_dir, "model_artifacts")
    
    model_path = os.path.join(artifacts_dir, "classifier.joblib")
    vectorizer_path = os.path.join(artifacts_dir, "vectorizer.joblib")
    metrics_path = os.path.join(artifacts_dir, "evaluation_metrics.json")

    if not os.path.exists(model_path) or not os.path.exists(vectorizer_path):
        raise FileNotFoundError("Trained model or vectorizer not found. Run train_classifier.py first.")

    classifier = joblib.load(model_path)
    vectorizer = joblib.load(vectorizer_path)

    test_df = pd.read_csv(test_path)
    X_test = test_df["title"].fillna("") + " " + test_df["description"].fillna("")
    y_true = test_df["category"]

    X_vec = vectorizer.transform(X_test)
    y_pred = classifier.predict(X_vec)

    # Compute metrics
    macro_f1 = f1_score(y_true, y_pred, average="macro")
    weighted_f1 = f1_score(y_true, y_pred, average="weighted")
    macro_precision = precision_score(y_true, y_pred, average="macro", zero_division=0)
    macro_recall = recall_score(y_true, y_pred, average="macro", zero_division=0)

    report_dict = classification_report(y_true, y_pred, output_dict=True, zero_division=0)
    labels = sorted(list(set(y_true)))
    cm = confusion_matrix(y_true, y_pred, labels=labels)

    # Format confusion matrix for reporting
    cm_formatted = {
        "labels": labels,
        "matrix": cm.tolist()
    }

    metrics_output = {
        "dataset_note": "Evaluated on held-out synthetic academic complaint corpus. Note: Evaluation on synthetic data demonstrates algorithmic integrity and pipeline correctness, but does not establish real-world generalization.",
        "test_samples_count": len(test_df),
        "macro_f1": round(float(macro_f1), 4),
        "weighted_f1": round(float(weighted_f1), 4),
        "macro_precision": round(float(macro_precision), 4),
        "macro_recall": round(float(macro_recall), 4),
        "per_category": {
            k: {
                "precision": round(v["precision"], 4),
                "recall": round(v["recall"], 4),
                "f1_score": round(v["f1-score"], 4),
                "support": v["support"]
            }
            for k, v in report_dict.items() if k in labels
        },
        "confusion_matrix": cm_formatted
    }

    with open(metrics_path, "w") as f:
        json.dump(metrics_output, f, indent=2)

    print("============================================================")
    print(" CAMPUSCARE AI MODEL EVALUATION REPORT (Held-Out Test Set)")
    print("============================================================")
    print(f"Total Test Samples: {len(test_df)}")
    print(f"Macro F1 Score:     {macro_f1:.4f}")
    print(f"Macro Precision:    {macro_precision:.4f}")
    print(f"Macro Recall:       {macro_recall:.4f}")
    print(f"Weighted F1 Score:  {weighted_f1:.4f}")
    print("\nDetailed Per-Category Classification Report:")
    print(classification_report(y_true, y_pred, zero_division=0))
    print("\nConfusion Matrix:")
    header = " | ".join([f"{l[:8]:>8}" for l in labels])
    print(f"{'':>20} | {header}")
    print("-" * (24 + len(header)))
    for idx, row in enumerate(cm):
        row_str = " | ".join([f"{val:>8}" for val in row])
        print(f"{labels[idx][:20]:>20} | {row_str}")
    print("============================================================")
    print(f"Metrics saved to {metrics_path}")

if __name__ == "__main__":
    evaluate()
