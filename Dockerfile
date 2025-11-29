
# ------------------------------------------------------------------
# Stage 1: Install dependencies
# ------------------------------------------------------------------

FROM node:18-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./

# Used 'npm ci' instead of 'install'
# ci (clean install) is faster and strictly follows the lock file
# --only=production skips Dev dependencies
RUN npm ci --only=production

# ------------------------------------------------------------------
# Stage 2: Run application
# ------------------------------------------------------------------

FROM node:18-alpine AS runner

WORKDIR /app

# Node image comes with a user called 'node'
USER node

# Copy dependencies (from 'deps' stage) instead of installing
COPY --from=deps /app/node_modules ./node_modules

# Ensure ownership is set to 'node' for copying the codebase
COPY --chown=node:node . .

EXPOSE 3000

HEALTHCHECK --interval=20s --timeout=3s --start-period=10s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/healthcheck || exit 1

CMD ["node", "src/index.js"]