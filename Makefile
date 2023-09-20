all: deploy

deploy:
	git pull && docker compose build && make start

start:
	docker compose up --detach

stop:
	docker compose stop

bash:
	docker exec -it summarize-tg-bot-app bash