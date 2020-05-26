FROM node:14.3 AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --quiet
COPY . .
RUN npm run build

FROM node:14.3-slim
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --quiet --only=production
COPY --from=builder /usr/src/app/dist ./
EXPOSE 80
CMD [ "npm", "start" ]
