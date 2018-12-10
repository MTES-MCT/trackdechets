FROM node:10.14-alpine as build-deps
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
ARG REACT_APP_API_ENDPOINT
ENV REACT_APP_API_ENDPOINT ${REACT_APP_API_ENDPOINT}
RUN npm run build

FROM nginx:1.15-alpine
COPY default.conf /etc/nginx/conf.d/
COPY --from=build-deps /usr/src/app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
