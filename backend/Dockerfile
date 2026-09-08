FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies if needed for build)
RUN npm ci --omit=dev

# Copy the rest of the application files
COPY . .


EXPOSE 3000

CMD ["node", "index.js"]
