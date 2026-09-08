FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS production
ENV NODE_ENV=production
ENV SERVE_FRONTEND=true
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/ ./
COPY --from=frontend-build /frontend/dist ./public
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node", "index.js"]
