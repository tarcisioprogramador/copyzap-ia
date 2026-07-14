FROM node:22-alpine AS base
RUN npm i -g pnpm
WORKDIR /app

# Copy all workspace config files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json tsconfig.base.json ./
COPY .npmrc ./

# Copy lib packages (needed for workspace resolution)
COPY lib/db/package.json lib/db/
COPY lib/api-zod/package.json lib/api-zod/
COPY lib/api-client-react/package.json lib/api-client-react/
COPY lib/api-spec/package.json lib/api-spec/
COPY scripts/package.json scripts/

# Copy artifact packages
COPY artifacts/api-server/package.json artifacts/api-server/
COPY artifacts/copyzap/package.json artifacts/copyzap/
COPY artifacts/mockup-sandbox/package.json artifacts/mockup-sandbox/

# Install dependencies
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# Copy source files
COPY . .

# Build the api-server and libs
RUN pnpm run build:production

# Run DB migrations on start (drizzle-kit push)
CMD ["sh", "-c", "pnpm --filter @workspace/db run push-force && pnpm run start:production"]
