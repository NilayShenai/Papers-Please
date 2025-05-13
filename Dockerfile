# 1. Base image for building
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# 2. Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Install only production deps (optional for faster image)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy compiled output and public files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/data ./data
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/next.config.js ./next.config.js

# Start Next.js
EXPOSE 3000
CMD ["npm", "start"]
