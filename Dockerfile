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
COPY lib/integrations-anthropic-ai/package.json lib/integrations-anthropic-ai/
COPY lib/api-spec/package.json lib/api-spec/
COPY scripts/package.json scripts/

# Copy artifact packages
COPY artifacts/api-server/package.json artifacts/api-server/
COPY artifacts/copyzap/package.json artifacts/copyzap/
COPY artifacts/mockup-sandbox/package.json artifacts/mockup-sandbox/

# Install dependencies (ignore build scripts to avoid interactive prompts in Docker)
RUN pnpm install --no-frozen-lockfile --ignore-scripts

# Copy source files
COPY . .

# Build the project
RUN pnpm run build:production

# Start the server
CMD ["pnpm", "run", "start:production"]
