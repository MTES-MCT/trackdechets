FROM node:20.7
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --quiet
COPY . .
CMD [ "npx", "nx", "dev:integration", "back" ]