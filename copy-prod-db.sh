#!/bin/bash

source .env

echo "Создание дампа удаленной базы данных..."
ssh $PROD_SSH_SERVER "docker exec -e PGPASSWORD=$PROD_POSTGRES_PASSWORD summarize-tg-bot-db pg_dump -U $PROD_POSTGRES_USER -F c $PROD_DATABASE_NAME > /tmp/remote_db_dump.sql"

echo "Копирование дампа на локальную машину..."
scp $PROD_SSH_SERVER:/tmp/remote_db_dump.sql /tmp/remote_db_dump.sql

echo "Удаление дампа с удаленной машины..."
ssh $PROD_SSH_SERVER "rm /tmp/remote_db_dump.sql"

echo "Создание новой базы данных на локальной машине..."
PGPASSWORD=$POSTGRES_PASSWORD psql -U $POSTGRES_USER -c "DROP DATABASE IF EXISTS \"$DATABASE_NAME\";"
PGPASSWORD=$POSTGRES_PASSWORD psql -U $POSTGRES_USER -c "CREATE DATABASE \"$DATABASE_NAME\";"

echo "Восстановление дампа в локальную базу данных..."
PGPASSWORD=$POSTGRES_PASSWORD pg_restore -U $POSTGRES_USER -d $DATABASE_NAME /tmp/remote_db_dump.sql --no-owner

echo "Удаление локального дампа после завершения..."
rm /tmp/remote_db_dump.sql

echo "Копирование базы данных завершено успешно!"
