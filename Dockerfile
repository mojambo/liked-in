FROM node:18

# Install dependencies for Chrome
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Set Puppeteer cache directory
ENV PUPPETEER_CACHE_DIR=/usr/src/app/.cache/puppeteer
# Tell Puppeteer to skip installing Chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Create cache directory and set permissions
RUN mkdir -p $PUPPETEER_CACHE_DIR && chown -R node:node $PUPPETEER_CACHE_DIR

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Install Puppeteer browsers as non-root user
USER node
RUN npx puppeteer browsers install chrome
USER root

# Create the data directory and set permissions
RUN mkdir -p /usr/src/app/data && chown -R node:node /usr/src/app

# Copy the rest of the application code
COPY --chown=node:node . .

# Switch to non-root user
USER node

# Build TypeScript
RUN npm run build

# Command to run the application
CMD [ "node", "dist/app.js" ]
