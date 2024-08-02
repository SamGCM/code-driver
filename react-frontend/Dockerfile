FROM node:20.9.0-alpine

RUN apk add --no-cache bash

USER node

WORKDIR /home/node/app

COPY --chown=node:node .docker/entrypoint.sh /home/node/app/entrypoint.sh

RUN chmod +x /home/node/app/entrypoint.sh
