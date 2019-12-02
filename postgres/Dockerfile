FROM postgres:10.5

ENV PG_MAJOR 10
ENV POSTGIS_MAJOR 2.5

RUN apt-get update -yqq && \
    apt-get install -yqq postgresql-$PG_MAJOR-postgis-$POSTGIS_MAJOR-scripts

RUN mkdir -p /docker-entrypoint-initdb.d
COPY scripts/init-airflow-user-db.sh /docker-entrypoint-initdb.d