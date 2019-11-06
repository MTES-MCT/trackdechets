FROM node:10.14-alpine as build-deps

# Will be needed when react-snap is activated
# RUN apk update && apk upgrade && \
#     echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories && \
#     echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories && \
#     apk add --no-cache \
#       chromium@edge \
#       nss@edge \
#       freetype@edge \
#       harfbuzz@edge \
#       ttf-freefont@edge

# ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

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
