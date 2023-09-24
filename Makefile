all: deploy

deploy:
	git pull && make build && make start

build:
	docker compose build

start:
	docker compose up --detach

stop:
	docker compose stop

bash:
	docker exec -it summarize-tg-bot-app bash