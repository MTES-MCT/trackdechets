FROM python:3.8.2-alpine3.11 as build-deps

ENV MKDOCS_VERSION="1.0.4"

RUN pip install mkdocs==${MKDOCS_VERSION} pymdown-extensions

WORKDIR /workdir

COPY mkdocs.yml mkdocs.yml
COPY docs docs
RUN mkdocs build

FROM nginx:1.15-alpine
COPY --from=build-deps /workdir/site /usr/share/nginx/html
