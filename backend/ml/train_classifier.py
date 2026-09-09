import os
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report

def train():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(current_dir, "data", "train_complaints.csv")
    artifacts_dir = os.path.join(current_dir, "model_artifacts")
    os.makedirs(artifacts_dir, exist_ok=True)

    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Training dataset not found at {data_path}. Run generate_dataset.py first.")

    df = pd.read_csv(data_path)
    X = df["title"].fillna("") + " " + df["description"].fillna("")
    y = df["category"]

    print(f"Training TF-IDF + LogisticRegression baseline on {len(df)} samples...")
    print(f"Category distribution:\n{y.value_counts()}")

    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        sublinear_tf=True,
        min_df=1,
        max_features=5000,
        stop_words="english"
    )

    X_vec = vectorizer.fit_transform(X)

    classifier = LogisticRegression(
        C=2.0,
        max_iter=1000,
        class_weight="balanced",
        random_state=42
    )

    classifier.fit(X_vec, y)

    # Save artifacts
    model_path = os.path.join(artifacts_dir, "classifier.joblib")
    vectorizer_path = os.path.join(artifacts_dir, "vectorizer.joblib")

    joblib.dump(classifier, model_path)
    joblib.dump(vectorizer, vectorizer_path)

    print(f"Model successfully saved to {model_path}")
    print(f"Vectorizer successfully saved to {vectorizer_path}")

    # Evaluate on training data
    y_pred = classifier.predict(X_vec)
    print("\n--- Training Set Performance ---")
    print(classification_report(y, y_pred))

if __name__ == "__main__":
    train()
