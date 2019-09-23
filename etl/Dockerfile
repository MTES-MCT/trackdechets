FROM puckel/docker-airflow:1.10.4

USER root

# https://stackoverflow.com/questions/51033689/how-to-fix-error-on-postgres-install-ubuntu
RUN mkdir -p /usr/share/man/man1 /usr/share/man/man7

RUN apt-get update -yqq && \
    apt-get install -yqq --no-install-recommends \
    postgis \
    postgresql-client \
    openjdk-8-jdk \
    wget \
    unzip

COPY requirements.txt /requirements.txt
RUN pip install -r /requirements.txt && rm /requirements.txt

ENV EMBULK_BIN /usr/local/bin/embulk
ENV EMBULK_DIR $AIRFLOW_HOME/embulk
ENV DATA_DIR $AIRFLOW_HOME/data
ENV SQL_DIR $AIRFLOW_HOME/sql

RUN curl -o $EMBULK_BIN -L "https://dl.embulk.org/embulk-0.9.9.jar"
RUN chmod +x $EMBULK_BIN

USER airflow

RUN $EMBULK_BIN gem install embulk-output-postgresql

COPY --chown=airflow code/dags /usr/local/airflow/dags
COPY --chown=airflow code/embulk /usr/local/airflow/embulk
COPY --chown=airflow code/sql /usr/local/airflow/sql
RUN mkdir /usr/local/airflow/data