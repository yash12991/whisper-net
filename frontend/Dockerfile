FROM node:22-alpine AS builder

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy workspace manifests
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

# Build shared crypto packages
RUN pnpm --filter "@securechat/*" build

# Build Next.js frontend
RUN pnpm --filter web build

# Production runtime stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY --from=builder /app /app

WORKDIR /app/frontend

EXPOSE 3000
CMD ["pnpm", "start"]
