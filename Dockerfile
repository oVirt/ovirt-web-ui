FROM node:6

RUN apt-get update -qq && apt-get install -qy libelf1

RUN mkdir -p /web-ui
COPY index.html package.json LICENSE yarn.lock .flowconfig /web-ui/
COPY scripts /web-ui/scripts
COPY config /web-ui/config
COPY src /web-ui/src
COPY branding /web-ui/branding

WORKDIR /web-ui
RUN yarn install

ENTRYPOINT ["yarn", "start"]

