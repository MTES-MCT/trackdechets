FROM alpine:latest as build-deps

ENV MKDOCS_VERSION="1.0.4" \
  GIT_REPO='false' \
  LIVE_RELOAD_SUPPORT='false'

RUN \
  apk add --update \
  ca-certificates \
  bash \
  git \
  openssh \
  python2 \
  python2-dev \
  py-setuptools; \
  easy_install-2.7 pip && \
  pip install mkdocs==${MKDOCS_VERSION} && \
  rm -rf /tmp/* /var/tmp/* /var/cache/apk/* /var/cache/distfiles/*

WORKDIR /workdir

COPY mkdocs.yml mkdocs.yml
COPY docs docs
RUN mkdocs build

FROM nginx:1.15-alpine
COPY --from=build-deps /workdir/site /usr/share/nginx/html
