FROM node:20-slim

# Python + PyMuPDF
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install pymupdf --break-system-packages

WORKDIR /app

# Railway build context = apps/api/ (rootDirectory)
COPY package.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 4000

CMD ["node", "dist/index.js"]
