# Dockerfile for Kubernetes deployment
FROM node:18-alpine

# Set working directory
WORKDIR /app

    # Copy package.json and package-lock.json
    COPY package*.json ./
    
    # Install dependencies
    RUN npm ci --only=production
    
    # Copy application code
    COPY . .

# Expose port
EXPOSE 8050

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8050/health || exit 1

# Start application
CMD ["npm", "start"]
