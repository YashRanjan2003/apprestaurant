# Base image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl postgresql-client

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
RUN apk add --no-cache libc6-compat openssl postgresql-client

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV DATABASE_URL="postgresql://postgres:KqoNQXLPAPWChPWyFSNCacfKPNUvBuvO@tramway.proxy.rlwy.net:16257/railway"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Create database check script
RUN echo '#!/bin/sh\n\
max_retries=30\n\
counter=0\n\
until pg_isready -h tramway.proxy.rlwy.net -p 16257 -U postgres || [ $counter -eq $max_retries ]; do\n\
  echo "Waiting for database connection..."\n\
  sleep 2\n\
  counter=$((counter+1))\n\
done\n\
\n\
if [ $counter -eq $max_retries ]; then\n\
  echo "Failed to connect to database"\n\
  exit 1\n\
fi\n\
\n\
echo "Database is ready"\n\
\n\
echo "Starting the application..."\n\
node server.js' > /app/start.sh

RUN chmod +x /app/start.sh

# Set permissions
RUN chown -R nextjs:nodejs .

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["/app/start.sh"] 