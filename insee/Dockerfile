# build stage
FROM golang:1.11 AS build-env
WORKDIR /go/src/app
ADD ./src .
RUN go get && CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o build/insee

# final stage
FROM alpine
RUN apk update && apk add ca-certificates
WORKDIR /app
COPY --from=build-env /go/src/app/build/ .
EXPOSE 81
ENTRYPOINT [ "./insee" ]

