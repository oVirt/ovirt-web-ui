FROM node:6

COPY index.html /
COPY scripts /scripts
COPY config /config
COPY package.json /
RUN yarn install
COPY src /src

ENTRYPOINT ["yarn", "start"]