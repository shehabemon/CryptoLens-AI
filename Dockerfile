# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Generate Prisma client
RUN npx prisma generate --schema server/prisma/schema.prisma

# Build frontend
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --production

# Copy Prisma schema and generated client
COPY server/prisma ./server/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy server source (tsx will compile at runtime)
COPY server ./server

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Add tsx for runtime TypeScript execution
RUN npm install tsx

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Serve static files from dist and API from server
CMD ["npx", "tsx", "server/index.ts"]
