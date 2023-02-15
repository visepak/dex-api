FROM node:16.16.0-alpine3.15
RUN  apk update && apk add --no-cache python3 make g++
RUN npm install --location=global npm@9.2.0

WORKDIR /app
COPY .env .env
COPY package.json package.json
#COPY package-lock.json package-lock.json
COPY tsconfig.build.json tsconfig.build.json
COPY tsconfig.json tsconfig.json
COPY keys keys
COPY src src

RUN npm i
RUN npm run build
CMD npm run start:ci
