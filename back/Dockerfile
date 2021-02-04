FROM node:14.15.4 AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --quiet
COPY . .
RUN npm run build

FROM node:14.15.4
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --quiet --only=production
COPY --from=builder /usr/src/app/dist ./
RUN npx prisma generate
EXPOSE 80
CMD [ "npm", "start" ]
