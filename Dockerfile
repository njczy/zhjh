# 1. Builder Stage
FROM node:20-slim AS builder
WORKDIR /app

# Use Taobao mirror for npm
RUN npm config set registry https://registry.npmmirror.com

# Install pnpm
RUN npm install -g pnpm

# Copy package files and install dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Build the Next.js application
RUN pnpm build

# In standalone mode, Next.js builds a minimal server.
# It also creates a 'standalone' folder with all necessary files.
# We need to manually copy the 'public' and '.next/static' folders to the standalone output.
# The standalone output is in .next/standalone
RUN cp -r ./public ./.next/standalone/public
RUN cp -r ./.next/static ./.next/standalone/.next/static


# 2. Runner Stage
FROM node:20-slim AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
# The default port is 3000, but the standalone server will run on 3000 by default.
# We will rely on the docker-compose port mapping to expose it.

# Copy the standalone output from the builder stage
COPY --from=builder /app/.next/standalone ./

# The standalone server is located at server.js
CMD ["node", "server.js"]