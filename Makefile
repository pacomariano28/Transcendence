COMPOSE= docker compose
COMPOSE_FILE= ./srcs/compose.yaml
DEV_FILE= ./srcs/compose.dev.yaml


UP= $(COMPOSE) -f $(COMPOSE_FILE) up -d --build

DEV= $(COMPOSE) -f $(COMPOSE_FILE) -f $(DEV_FILE) up -d --build

DOWN= $(COMPOSE) -f $(COMPOSE_FILE) -f $(DEV_FILE) down -v

LOGS= $(COMPOSE) -f $(COMPOSE_FILE) logs -f

all: up

up:
	$(UP)

dev:
	$(DEV)

down: 
	$(DOWN)

fclean: down
#	$(COMPOSE) -f $(COMPOSE_FILE) -f $(DEV_FILE) rm --volumes
	docker system prune -af

re: fclean dev

logs:
	$(LOGS)

env:
	echo -n "IP_ADDR=" > srcs/.env
	echo "$$(ip -4 -brief addr | awk '/wlp4s0/ {if (NR!=1) { print substr($$3, 0, length($$3) - 3) }}')" >> srcs/.env

.PHONY: all up dev down fclean re logs env
