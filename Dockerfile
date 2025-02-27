# Base image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Add OpenSSL and other necessary dependencies
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy package files and prisma directory
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Builder stage
FROM base AS builder
WORKDIR /app

# Add OpenSSL for this stage too
RUN apk add --no-cache openssl

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

# Create .env file for build time
RUN touch .env

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Add OpenSSL for production
RUN apk add --no-cache openssl

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules ./node_modules

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Create a script to handle startup
COPY --chown=nextjs:nodejs <<EOF /app/start.sh
#!/bin/sh
# Wait for database to be ready
echo "Waiting for database..."
sleep 5

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Start the application
echo "Starting the application..."
node server.js
EOF

RUN chmod +x /app/start.sh

CMD ["/app/start.sh"] 