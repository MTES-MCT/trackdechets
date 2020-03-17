FROM node:lts as build-deps

WORKDIR /app/website

COPY ./docs /app/docs
COPY ./website /app/website
RUN yarn install
RUN yarn run build

FROM nginx:1.15-alpine
COPY --from=build-deps /app/website/build /usr/share/nginx/html