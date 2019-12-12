FROM prismagraphql/prisma:1.34.10
COPY ./prerun_hook.sh /app/prerun_hook.sh
RUN chmod +x /app/prerun_hook.sh && \
    apk add postgresql-client
