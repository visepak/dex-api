apt update && apt install nginx -y
rm /etc/nginx/sites-enabled/default
cp ./nginx/wcn.conf /etc/nginx/sites-enabled/wcn.conf
service nginx start

docker-compose rm --all &&
docker system prune -af
docker-compose pull &&
docker-compose build --no-cache &&
docker-compose --env-file .env up --force-recreate -d
