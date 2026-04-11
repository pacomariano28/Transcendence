COMPOSE= docker compose
COMPOSE_FILE= ./srcs/compose.dev.yaml
RECREATE= $(COMPOSE) -f $(COMPOSE_FILE) up -d --build --force-recreate

all: up

up:
	$(COMPOSE) -f $(COMPOSE_FILE) up -d --build

down: 
	$(COMPOSE) -f $(COMPOSE_FILE) down -v

start:
	$(COMPOSE) -f $(COMPOSE_FILE) start

stop:
	$(COMPOSE) -f $(COMPOSE_FILE) stop

fclean: down
	docker system prune -af

recreate-nginx:
	$(RECREATE) nginx

recreate-frontend:
	$(RECREATE) frontend

recreate-api-gateway:
	$(RECREATE) api-gateway

recreate-auth:
	$(RECREATE) auth-service

recreate-content:
	$(RECREATE) content-service

recreate-game:
	$(RECREATE) game-service

recreate-postgres:
	$(RECREATE) postgres

recreate-redis:
	$(RECREATE) redis

re: fclean all

logs:
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f

.PHONY: all up down fclean re logs
