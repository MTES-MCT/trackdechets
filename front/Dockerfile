FROM node:10.14-alpine as build-deps

ARG build_env=production

WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm install
COPY . ./

# https://create-react-app.dev/docs/deployment#customizing-environment-variables-for-arbitrary-build-environments
RUN npm run build:$build_env


FROM nginx:1.15-alpine
COPY default.conf /etc/nginx/conf.d/
COPY --from=build-deps /usr/src/app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
