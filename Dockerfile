FROM node:8

RUN apt-get update -qq && apt-get install -qy libelf1

RUN mkdir -p /web-ui/static
COPY package.json LICENSE yarn.lock .flowconfig autogen.sh ovirt-web-ui.spec.in configure.ac Makefile.am /web-ui/
COPY static/index.hbs /web-ui/static/
COPY scripts /web-ui/scripts
COPY config /web-ui/config
COPY src /web-ui/src
COPY branding /web-ui/branding

WORKDIR /web-ui
RUN yarn install

ENTRYPOINT ["yarn", "start"]
