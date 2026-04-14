# Build context: monorepo root (docker build . -f apps/backend/Dockerfile)

FROM node:22-alpine AS build

WORKDIR /usr/src/app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace configuration for dependency resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/backend/ ./apps/backend/

# Build shared package, generate Prisma client, build backend
RUN pnpm --filter @asoode/shared build \
    && pnpm --filter @asoode/backend prisma:generate \
    && pnpm --filter @asoode/backend build

# Deploy backend to a standalone directory with production deps only
RUN pnpm --filter @asoode/backend deploy --legacy --prod /prod

# Copy Prisma generated client (pnpm stores it inside .pnpm, not at top-level)
RUN mkdir -p /prod/node_modules/.prisma && \
    cp -r $(find node_modules/.pnpm -path "*/.prisma/client" -type d | head -1) /prod/node_modules/.prisma/

# Production stage
FROM node:22-alpine AS production

RUN apk add --no-cache tini

WORKDIR /usr/src/app

COPY --chown=node:node --from=build /prod/node_modules ./node_modules
COPY --chown=node:node --from=build /prod/dist ./dist
COPY --chown=node:node --from=build /prod/prisma ./prisma
COPY --chown=node:node --from=build /prod/package.json ./

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "const http = require('http'); const req = http.request({hostname:'localhost',port:3000,path:'/health',method:'GET',timeout:3000}, (res) => process.exit(res.statusCode === 200 ? 0 : 1)); req.on('error', () => process.exit(1)); req.end();"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/src/main.js"]
