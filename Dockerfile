FROM node:6

COPY index.html /
COPY scripts /scripts
COPY config /config
COPY package.json /
RUN npm install
COPY src /src

ENTRYPOINT ["npm", "start"]
