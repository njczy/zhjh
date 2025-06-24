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

# Set environment variable to disable telemetry and handle symlink issues
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the Next.js application for Linux production environment
# This will enable standalone output for Docker deployment
RUN pnpm run build:linux

# In standalone mode, Next.js builds a minimal server.
# It also creates a 'standalone' folder with all necessary files.
# We need to manually copy the 'public' and '.next/static' folders to the standalone output.
# The standalone output is in .next/standalone

# Check if standalone directory exists and copy files
RUN if [ -d "./.next/standalone" ]; then \
      cp -r ./public ./.next/standalone/public 2>/dev/null || echo "Public folder already exists or not needed"; \
      cp -r ./.next/static ./.next/standalone/.next/static 2>/dev/null || echo "Static folder already exists or not needed"; \
    else \
      echo "Standalone build not created, using regular build"; \
      mkdir -p ./.next/standalone; \
      cp -r ./public ./.next/standalone/public; \
      cp -r ./.next ./.next/standalone/.next; \
      cp ./package.json ./.next/standalone/; \
      cp ./next.config.mjs ./.next/standalone/; \
    fi

# 2. Runner Stage
FROM node:20-slim AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install pnpm in runner stage
RUN npm config set registry https://registry.npmmirror.com && \
    npm install -g pnpm

# Copy the standalone output from the builder stage
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Install production dependencies if package.json exists
# Use pnpm instead of npm to avoid @next/font issues
RUN if [ -f "./package.json" ]; then \
      pnpm config set registry https://registry.npmmirror.com && \
      pnpm install --prod --ignore-scripts || \
      (echo "pnpm install failed, trying npm fallback" && \
       npm config set registry https://registry.npmmirror.com && \
       sed -i 's/"@next\/font"[^,]*,\?//g' ./package.json && \
       sed -i 's/,\s*}/}/g' ./package.json && \
       npm install --production --ignore-scripts --legacy-peer-deps); \
    fi

# The standalone server is located at server.js (if it exists) or start with next start
CMD if [ -f "./server.js" ]; then \
      node server.js; \
    else \
      npm start; \
    fi