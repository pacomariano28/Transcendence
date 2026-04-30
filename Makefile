COMPOSE= docker compose
COMPOSE_FILE= ./srcs/compose.dev.yaml

all: up

up:
	$(COMPOSE) -f $(COMPOSE_FILE) up -d

down: 
	$(COMPOSE) -f $(COMPOSE_FILE) down
	docker volume prune -f

start:
	$(COMPOSE) -f $(COMPOSE_FILE) start

stop:
	$(COMPOSE) -f $(COMPOSE_FILE) stop

nginx:
	$(COMPOSE) -f $(COMPOSE_FILE) rm -fsv nginx
	$(COMPOSE) -f $(COMPOSE_FILE) build --no-cache nginx
	$(COMPOSE) -f $(COMPOSE_FILE) up -d --force-recreate -V nginx

frontend:
	$(COMPOSE) -f $(COMPOSE_FILE) rm -fsv frontend
	$(COMPOSE) -f $(COMPOSE_FILE) build --no-cache frontend
	$(COMPOSE) -f $(COMPOSE_FILE) up -d --force-recreate -V frontend

api-gateway:
	$(COMPOSE) -f $(COMPOSE_FILE) rm -fsv api-gateway
	$(COMPOSE) -f $(COMPOSE_FILE) build --no-cache api-gateway
	$(COMPOSE) -f $(COMPOSE_FILE) up -d --force-recreate -V api-gateway

auth:
	$(COMPOSE) -f $(COMPOSE_FILE) rm -fsv auth-service
	$(COMPOSE) -f $(COMPOSE_FILE) build --no-cache auth-service
	$(COMPOSE) -f $(COMPOSE_FILE) up -d --force-recreate -V auth-service

content:
	$(COMPOSE) -f $(COMPOSE_FILE) rm -fsv content-service
	$(COMPOSE) -f $(COMPOSE_FILE) build --no-cache content-service
	$(COMPOSE) -f $(COMPOSE_FILE) up -d --force-recreate -V content-service

game:
	$(COMPOSE) -f $(COMPOSE_FILE) rm -fsv game-service
	$(COMPOSE) -f $(COMPOSE_FILE) build --no-cache game-service
	$(COMPOSE) -f $(COMPOSE_FILE) up -d --force-recreate -V game-service

postgres:
	$(COMPOSE) -f $(COMPOSE_FILE) rm -fs postgres
	docker volume rm songuess_postgres_data
	$(COMPOSE) -f $(COMPOSE_FILE) up -d --force-recreate -V postgres

redis:
	$(COMPOSE) -f $(COMPOSE_FILE) rm -fs redis
	docker volume rm songuess_redis_data
	$(COMPOSE) -f $(COMPOSE_FILE) up -d --force-recreate -V redis

nginx-logs:
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f nginx

frontend-logs:
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f frontend

api-gateway-logs:
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f api-gateway

auth-logs:
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f auth-service

content-logs:
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f content-service

game-logs:
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f game-service

postgres-logs:
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f postgres

redis-logs:
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f redis

logs:
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f

stop-all:
	@container=$$(docker container ls -q); \
	if [ "$$container" != "" ]; then \
	echo "Stopping all containers..."; \
	docker stop $$(docker container ls -q); \
	else \
	echo "No containers running"; \
	fi

fclean: stop-all
	docker container prune -f
	docker image prune -af
	docker volume prune -af
	docker network prune -f
	docker system prune -af

re: fclean all

.PHONY: all up down start stop stop-all fclean re logs \
	nginx frontend api-gateway auth content game \
	postgres redis \
	nginx-logs frontend-logs api-gateway-logs auth-logs \
	content-logs game-logs postgres-logs redis-logs logs \
