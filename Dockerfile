FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# In a real production setup, we would build the TS files first
# For simplicity in this microservice we can just run with tsx
EXPOSE 3000

CMD ["npx", "tsx", "src/server.ts"]
