# build stage
FROM golang:alpine AS build-env
ADD . /src
RUN cd /src/app && go build -o insee

# final stage
FROM alpine
WORKDIR /app
COPY --from=build-env /src/app/insee /app/
COPY --from=build-env /src/cron /cron
ENTRYPOINT ./insee
