FROM node:18-slim

# Install Python and build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency files first for caching
COPY package*.json ./
COPY resume/requirements.txt ./resume/

# Install Node dependencies
RUN npm install

# Install Python dependencies
# Using --break-system-packages because we are in a container
RUN pip3 install --no-cache-dir -r resume/requirements.txt --break-system-packages

# Copy the rest of the application
COPY . .

# Grant execution permissions to scripts
RUN chmod +x start-prod.sh

# Expose ports
EXPOSE 3000 8000

# Start command
CMD ["./start-prod.sh"]
