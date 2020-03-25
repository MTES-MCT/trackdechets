#!/bin/sh

envsubst \$DEVELOPERS_HOST,\$DEVELOPERS_URL_SCHEME < /etc/nginx/conf.d/default.template > /etc/nginx/conf.d/default.conf

nginx -g 'daemon off;'
