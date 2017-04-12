FROM node:6

COPY index.html package.json LICENSE yarn.lock /
COPY scripts /scripts
COPY config /config
COPY src /src
RUN yarn install

ENTRYPOINT ["yarn", "start"]
