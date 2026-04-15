# Build context: monorepo root (docker build . -f apps/backend/Dockerfile)

FROM node:22-alpine AS build

WORKDIR /usr/src/app

# Establish pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy ALL package.json files to satisfy pnpm workspace requirements
# This ensures pnpm install has the full context of the monorepo
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/socket/package.json ./apps/socket/
COPY apps/worker/package.json ./apps/worker/
COPY apps/website/package.json ./apps/website/

# Install dependencies including devDeps for build
RUN pnpm install --frozen-lockfile

# Copy source code and config
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/backend/ ./apps/backend/

# Build dependencies and the app
# We generate Prisma client specifically for the backend
RUN pnpm --filter @asoode/shared build \
    && pnpm --filter @asoode/backend prisma:generate \
    && pnpm --filter @asoode/backend build

# Deploy only the production dependencies of the backend to a separate folder
RUN pnpm --filter @asoode/backend deploy --legacy --prod /prod

# Ensure Prisma client is in the production node_modules
# By default, Prisma generates into node_modules/.prisma/client
# We copy the entire .prisma directory to the production folder
RUN mkdir -p /prod/node_modules/.prisma && \
    cp -r apps/backend/node_modules/.prisma/client /prod/node_modules/.prisma/ 2>/dev/null || \
    cp -r node_modules/.prisma/client /prod/node_modules/.prisma/ || \
    echo "No Prisma client found, proceeding anyway (might fail at runtime)"

# Production stage
FROM node:22-alpine AS production

RUN apk add --no-cache tini

WORKDIR /usr/src/app

# Copy production artifacts
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
