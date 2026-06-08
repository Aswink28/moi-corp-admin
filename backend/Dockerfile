# Company Admin Portal — backend
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 6010

CMD ["node", "src/server.js"]
