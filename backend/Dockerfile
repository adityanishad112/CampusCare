FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Ensure ML models are present (train only if artifacts do not exist)
RUN python -c "import os; exit(0 if os.path.exists('ml/model_artifacts/classifier.joblib') else 1)" || (python ml/data/generate_dataset.py && python ml/train_classifier.py && python ml/evaluate_classifier.py)

RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

EXPOSE 8000 10000

ENTRYPOINT ["./docker-entrypoint.sh"]
