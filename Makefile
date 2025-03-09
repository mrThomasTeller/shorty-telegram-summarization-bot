all: deploy

deploy: check-env
	make build && make start-detached

build:
	docker compose build

start: check-env
	docker compose up

start-detached: check-env
	docker compose up --detach && docker system prune -f

stop:
	docker compose stop

bash:
	docker exec -it summarize-tg-bot-app bash

app-log:
	docker compose logs app -f --timestamps

all-logs:
	docker compose logs -f --timestamps

get-ssl-cert:
	docker compose -f docker-compose.get-ssl-cert.yml up --build

prepare:
	bash ./disable_history.sh

check-env:
	@if [ -z "$$CRYPTO_KEY" ]; then \
		if [ ! -f ".env" ] || ! grep -q "^\s*CRYPTO_KEY\s*=" .env; then \
			echo "CRYPTO_KEY is not set as environment variable and not set in .env file"; \
			exit 1; \
		fi \
	fi

upgrade-ubuntu:
	sudo apt update
	sudo apt upgrade
	sudo reboot

prepare-dev:
	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash &&\
	source ~/.bashrc &&\
	nvm install 20 &&\
	nvm use 20 &&\
	curl -fsSL https://bun.sh/install | bash -s "bun-v1.2.1" &&\
	source ~/.bashrc &&\
	bun i