FROM node:11.2.0-alpine
RUN npm install -g nodemon
WORKDIR /usr/src/app
COPY package.json package.json
RUN npm install --silent
COPY . .
EXPOSE 81
CMD [ "npm", "start" ]
