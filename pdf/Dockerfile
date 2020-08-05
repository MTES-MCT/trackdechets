FROM node:12.13-slim AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --silent
COPY . .
RUN npm run build

FROM node:12.13-slim
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --silent
COPY --from=builder /usr/src/app/dist ./dist
EXPOSE 3201
CMD [ "npm", "start" ]
