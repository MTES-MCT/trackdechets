FROM node:12.13-buster
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --silent
RUN npm rebuild hummus --build-from-source
COPY . .
EXPOSE 3201:3201
CMD [ "npm", "start" ]
