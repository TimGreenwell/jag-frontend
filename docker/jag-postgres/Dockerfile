FROM postgres:15.1-alpine3.17

WORKDIR /

COPY docker/jag-postgres/create_tables.sql /docker-entrypoint-initdb.d/10_create_tables.sql
