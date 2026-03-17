# Stage 1: Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# Stage 2: Build the application
FROM node:18-alpine AS builder
WORKDIR /app

# Define build arguments
ARG DATABASE_URL
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL
ARG FIREBASE_SERVICE_ACCOUNT_KEY

# Set them as environment variables for the build process
ENV DATABASE_URL=$DATABASE_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV FIREBASE_SERVICE_ACCOUNT_KEY=$FIREBASE_SERVICE_ACCOUNT_KEY

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# Stage 3: Production runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Only copy if they exist
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
