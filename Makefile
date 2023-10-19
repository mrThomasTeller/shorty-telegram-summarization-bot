all: deploy

deploy:
	git pull && make build && make start-detached

build:
	docker compose build

start: check-env
	docker compose up

start-detached: check-env
	docker compose up --detach

stop:
	docker compose stop

bash:
	docker exec -it summarize-tg-bot-app bash

app-log:
	docker compose logs app -f

all-logs:
	docker compose logs -f

prepare:
	echo 'unset HISTFILE' >> /etc/profile.d/disable.history.sh
	docker || (curl -fsSL https://get.docker.com | sh)

check-env:
	@if [ -z "$$CRYPTO_KEY" ]; then \
		if [ ! -f ".env" ] || ! grep -q "^\s*CRYPTO_KEY\s*=" .env; then \
			echo "CRYPTO_KEY is not set as environment variable and not set in .env file"; \
			exit 1; \
		fi \
	fi
