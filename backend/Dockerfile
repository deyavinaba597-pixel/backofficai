# syntax=docker/dockerfile:1
FROM node:20-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client and build TypeScript
RUN npx prisma generate
RUN npm run build

EXPOSE 3001

# Migrate and start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
