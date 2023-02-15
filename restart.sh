docker system prune -af
docker-compose build --no-cache back &&
docker-compose --env-file .env up --force-recreate --no-deps -d back