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
	docker container prune -f
	docker image prune -f
	docker volume prune -f
	docker network prune -f

re: fclean dev

logs:
	$(LOGS)

.PHONY: all up dev down fclean re logs
