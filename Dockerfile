# Base image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy package files and prisma schema
COPY package.json ./
COPY prisma ./prisma/

# Install dependencies with clean slate
RUN npm install --ignore-scripts

# Builder stage
FROM base AS builder
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy all dependencies and generated files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

# Create .env file for build time
RUN echo "DATABASE_URL=\"postgresql://postgres:KqoNQXLPAPWChPWyFSNCacfKPNUvBuvO@tramway.proxy.rlwy.net:16257/railway\"" > .env

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image
FROM base AS runner
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/.env ./.env

# Set permissions
RUN chown -R nextjs:nodejs .

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Create startup script with environment variable
RUN echo '#!/bin/sh\n\
export DATABASE_URL="postgresql://postgres:KqoNQXLPAPWChPWyFSNCacfKPNUvBuvO@tramway.proxy.rlwy.net:16257/railway"\n\
echo "Waiting for database..."\n\
sleep 5\n\
echo "Running database migrations..."\n\
npx prisma migrate deploy\n\
echo "Starting the application..."\n\
node server.js' > /app/start.sh

RUN chmod +x /app/start.sh

CMD ["/app/start.sh"] 