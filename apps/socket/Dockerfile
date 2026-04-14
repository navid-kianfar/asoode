# Build context: monorepo root (docker build . -f apps/socket/Dockerfile)

FROM node:22-alpine AS build

WORKDIR /usr/src/app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace configuration for dependency resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/socket/package.json ./apps/socket/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/socket/ ./apps/socket/

# Build socket server
RUN pnpm --filter asoode-socket build

# Deploy socket to a standalone directory with production deps only
RUN pnpm --filter asoode-socket deploy --legacy --prod /prod

# Production stage
FROM node:22-alpine AS production

RUN apk add --no-cache tini

WORKDIR /usr/src/app

COPY --chown=node:node --from=build /prod/node_modules ./node_modules
COPY --chown=node:node --from=build /prod/dist ./dist
COPY --chown=node:node --from=build /prod/package.json ./

USER node

EXPOSE 8020

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "const http = require('http'); const req = http.request({hostname:'localhost',port:8020,path:'/',method:'GET',timeout:3000}, (res) => process.exit(res.statusCode === 200 ? 0 : 1)); req.on('error', () => process.exit(1)); req.end();"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server.js"]
