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

# Copier les packages partagés
COPY packages/ ./packages/

# Copier l'API
COPY apps/api/package.json ./apps/api/
WORKDIR /app/apps/api
RUN npm install

COPY apps/api/ ./

# Copier le module DPE (partagé avec web)
COPY apps/web/lib/modules/ ./web/lib/modules/

RUN npm run build

EXPOSE 4000

CMD ["node", "dist/index.js"]
