FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install build essentials for native dependencies if needed
RUN apk add --no-cache curl tzdata

# Set environment variables (Port 2601 as requested)
ENV NODE_ENV=production
ENV PORT=2601
ENV DATA_DIR=/app/data

# Copy package descriptors
COPY package*.json ./

# Install dependencies (including devDependencies required for vite build)
RUN npm install

# Copy application source files
COPY . .

# Build the client bundle to /app/dist
RUN npm run build

# Create data directories and ensure permissions
RUN mkdir -p /app/data /app/data/uploads

# Expose custom port 2601
EXPOSE 2601

# Volume for data persistence across container updates
VOLUME ["/app/data"]

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:2601/api/health || exit 1

# Start production server
CMD ["npm", "run", "start"]
