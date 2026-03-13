FROM python:3.10-slim

WORKDIR /app

# Install dependencies first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the Python application files into the Docker Image
# We deliberately avoid copying `blockchain/` (the Node.js legacy) into the final Python image
COPY app/ app/
COPY audit_events.db .

# Expose port 8005
EXPOSE 8005

# Start the FastAPI application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8005"]
