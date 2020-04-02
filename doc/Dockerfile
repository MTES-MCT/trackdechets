FROM node:lts as build-deps

WORKDIR /app/website

COPY ./docs /app/docs
COPY ./website /app/website
RUN yarn install
RUN yarn run build

FROM nginx:1.15-alpine
ENV PROJECT_NAME="td-doc"
COPY --from=build-deps /app/website/build/${PROJECT_NAME} /usr/share/nginx/html