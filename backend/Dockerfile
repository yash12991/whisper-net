FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy workspace configuration and manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY packages/crypto/package.json packages/crypto/
COPY packages/types/package.json packages/types/
COPY packages/config/package.json packages/config/
COPY prisma/schema.prisma prisma/

# Install workspace dependencies
RUN pnpm install --frozen-lockfile

# Copy full repository source
COPY . .

# Generate Prisma Client
RUN pnpm exec prisma generate --schema=prisma/schema.prisma

# Build shared crypto, types, config packages
RUN pnpm --filter "@securechat/*" build

# Build backend TypeScript
RUN pnpm --filter server build

# Production runtime stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY --from=builder /app /app

WORKDIR /app/backend

EXPOSE 4000
CMD ["node", "dist/index.js"]
