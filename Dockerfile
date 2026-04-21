FROM node:20-alpine

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --omit=dev

COPY server/ ./

ENV NODE_ENV=production
# Port 80 matches typical lab security groups (inbound TCP 80).
ENV PORT=80
EXPOSE 80

CMD ["npm", "start"]
