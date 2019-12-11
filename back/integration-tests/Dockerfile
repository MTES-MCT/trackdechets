FROM prismagraphql/prisma:1.33.0
COPY ./prerun_hook.sh /app/prerun_hook.sh
RUN chmod +x /app/prerun_hook.sh && \
    apk add postgresql-client
