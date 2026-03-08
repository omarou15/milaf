FROM node:20-slim

# Install Python for PyMuPDF
RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-dev gcc \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install pymupdf --break-system-packages

WORKDIR /app

# Copy package files
COPY package.json ./

# Install deps
RUN npm install

# Copy source
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript
RUN npx tsc

# Expose port
EXPOSE ${PORT:-4000}

# Start
CMD ["node", "dist/index.js"]
