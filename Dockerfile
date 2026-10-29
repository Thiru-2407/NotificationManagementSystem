
FROM python:3.12-slim

WORKDIR /app

ARG APP_VERSION=v2
ENV APP_VERSION=$APP_VERSION

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY templates/ templates/
COPY static/ static/

EXPOSE 5000

CMD ["python", "app.py"]
