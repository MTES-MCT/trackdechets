FROM postgres:10.5

RUN apt-get update -yqq && \
    apt-get install -yqq postgresql-10-postgis-scripts

RUN mkdir -p /docker-entrypoint-initdb.d
COPY scripts/init-airflow-user-db.sh /docker-entrypoint-initdb.d