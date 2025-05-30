[![Copr build status](https://copr.fedorainfracloud.org/coprs/ovirt/ovirt-master-snapshot/package/ovirt-web-ui/status_image/last_build.png)](https://copr.fedorainfracloud.org/coprs/ovirt/ovirt-master-snapshot/package/ovirt-web-ui/)

# VM Portal - Developer information


## Bugs and Enhancements
Please report bugs and feature requests to the [GitHub issue tracker](https://github.com/oVirt/ovirt-web-ui/issues).


## Users Forum
  - Use the [oVirt Users forum / mailing list](https://lists.ovirt.org/archives/list/users@ovirt.org/) for general discussion or help.
  - Use the [oVirt Devel forum / mailing list](https://lists.ovirt.org/archives/list/devel@ovirt.org/) development discussion.


## Development setup

### Prerequisites
  - Have a **oVirt engine running** at `[http scheme]://[ENGINE_FQDN]:[port]`
    - example: `https://engine.local:8443/ovirt-engine`
  - Base required packages: `autoconf`, `automake` and `libtool`
  - For online builds: `nodejs`, `yarn`
  - Enable `nodejs` at least version 14
  - For offline builds (not strictly required but **suggested**): `ovirt-engine-nodejs-modules`
  - `git clone` the repository


#### ovirt-engine packages
Install `ovirt-engine-nodejs-modules` from the [ovirt/ovirt-master-snapshot copr repo](https://copr.fedorainfracloud.org/coprs/ovirt/ovirt-master-snapshot/)
for your platform to use the same packages that will be used by CI to build the app.

For CentOS stream 9:

    dnf copr enable -y ovirt/ovirt-master-snapshot centos-stream-9
    dnf install -y ovirt-engine-nodejs-modules

For CentOS stream 10:

    dnf copr enable -y ovirt/ovirt-master-snapshot centos-stream-10
    dnf install -y ovirt-engine-nodejs-modules

After installing, the package may be for development or building.  It provides `yarn` itself
and a yarn offline cache.  Setup your shell to use it with the following:

    source /usr/share/ovirt-engine-nodejs-modules/setup-env.sh

If you want to stop using the `yarn` offline cache, `yarn` will need to be reconfigured to
remove the offline mirror added by `setup-env.sh`:

    yarn config delete yarn-offline-mirror

**NOTE:** During development it is not necessary to limit your environment to the offline
yarn repo provided by `ovirt-engine-nodejs-modules`.  However, it is recommended to run a
full build to verify no dependency errors will be introduced by your change.  The offline
build GitHub action checks will fail if `ovirt-engine-nodejs-modules` needs to be updated
with changes made to `package.json` or `yarn.lock` in a new pull request.


### Development mode
A primary goal of VM Portal is a quick development cycle (change-build-deploy-check). The
project uses [webpack-dev-server](https://webpack.js.org/)
to accomplish this. To start the server:

    ENGINE_URL=https://my.ovirt.instance:8443/ovirt-engine/ yarn start

When asked, provide a valid user name (in the form of `user@profile`) and password so
the application can start in the context of a logged in user.


#### Specifying environment variables via `.env.*` files
You can group environment variables using `.env.envname` files. For example, place a
a file `.env.local-dev` in the root of the project containing all related variables
for your local development target:


    ENGINE_URL=http://engine.local:8080/ovirt-engine
    BROWSER=none
    KEEP_ALIVE=30

    ENGINE_USER=admin@internal
    ENGINE_PASSWORD=password
    ENGINE_DOMAIN=internal-authz

The file should follow [dotenv](https://github.com/motdotla/dotenv) convention.
Then start the server with:

    ENGINE_ENV=local-dev yarn start


#### Credentials
User name and password can also be provided via shell variables or in the `dotenv` files:

    ENGINE_USER=user@profile
    ENGINE_PASSWORD=password
    ENGINE_DOMAIN=domain


#### Auto-Open browser
When the dev server is started, it will attempt to open a new browser window/tab on
your system default browser to the app's running URL. By default it will try to open a chromuim based browser.If there is no such browser available on the system the `yarn start` command will fail.
This behavior can be modified by specifying the `BROWSER` environment variable.  Possible values are:

    BROWSER=none               # disable the feature
    BROWSER=google-chrome      # open a new tab in chrome on Linux
    BROWSER='google chrome'    # open a new tab in chrome on MacOS
    BROWSER=chrome             # open a new tab in chrome on Windows
    BROWSER=firefox            # open a new tab in firefox on Linux


#### Alternative Branding
To test an alternative branding, the dev server may be started with the `BRANDING`
environment variable.  This variable allows specifying a location where alternative
branding file are located.  For example, if there is an alternative branding located
at `$HOME/new-branding`, start the dev server like this:

    ENGINE_URL=https://my.ovirt.instance/ovirt-engine \
    BRANDING=$HOME/new-branding \
    yarn start


#### Keep-alive
Under normal circumstances, the token generated when the dev server starts will
expire after non-use.  That interval is determined by setting on the ovirt-engine.  If
you do not want the dev server session to expire when the UI does the non-activity
logout, the `KEEP_ALIVE` environment variable may be used.  This will keep the dev
server's session alive by pining the rest api at the specified minute interval.  For
example, running the dev server like this will have it ping the rest api every 20 minutes,
keeping the session alive even if the UI is logged out or closed:

    ENGINE_URL=http://my.ovirt.instance:8080/ovirt-engine \
    KEEP_ALIVE=20 \
    yarn start


## Production Builds
All of the builds can either run offline, via `ovirt-engine-nodejs-modules` or can run
in an online mode downloading new packages as needed.  For offline builds, use this
command:

    source /usr/share/ovirt-engine-nodejs-modules/setup-env.sh

for online builds, use this command:

    yarn install

The examples below, substitute `$YARN_INSTALL` with one of the commands given above.


### Build static assets
You can build the static assets from source by:

    $YARN_INSTALL
    make

The outcome of the build will be in `build/`.


### Build and install to a local development ovirt-engine
This allows you to run VM Portal deployed directly in an ovirt-engine development installation.

    $YARN_INSTALL
    make all install-data-local DESTDIR=<path_to_engine_development_prefix>


### Build RPM
There are a number of different ways to build the RPM for the project:

  1. Manual **offline** build with `make rpm`:

    source /usr/share/ovirt-engine-nodejs-modules/setup-env.sh
    make rpm

  2. Manual **offline** build with `automation/build.sh`:

    ./automation/build.sh

  3. Manual **online** build with `automation/build.sh`:

    OFFLINE_BUILD=0 ./automation/build.sh

  4. Each pull request push will automatically have RPMs built as part of the GitHub action
     checks "run CI on PRs" job "test_el8_offline".  The generated artifact zip file will be
     accessible on the action run's summary page.


### RPM Installation

    dnf install ovirt-web-ui

Installs the app to `/usr/share/ovirt-web-ui`. A new **ovirt-web-ui.war** is added to the
existing **ovirt-engine.ear**.

You can access the application at: `https://[ENGINE_FQDN]/ovirt-engine/web-ui`

The latest master branch RPM can be found in the [ovirt/ovirt-master-snapshot
copr repository](https://copr.fedorainfracloud.org/coprs/ovirt/ovirt-master-snapshot).


## Browser Developer Tools
A pair of extensions are recommended to simplify debugging of the application:
  - [Redux DevTools Extension](http://extension.remotedev.io/)
  - [React Developer Tools](https://github.com/facebook/react-devtools)

## Translations

Translations are hosted on [Weblate](https://translate.ovirt.tech/projects/ovirt-web-ui/).

Currently supported languages are:
- Czech (Chzechia)
- German (Germany)
- English (United States)
- Spanish (Spain)
- French (France)
- Italian (Italy)
- Japanese (Japan)
- Korean (South Korea)
- Portuguese (Brazil)
- Simplified Chinese (China)
- Georgian (Georgia)

To add a new string to the project the following steps must be taken:

1. Add a new entry to intl/messages.js with a key and string value that is the base, a description is optional.
2. Add at least a translation to the en-US.json file.

After these steps the string will be available for translations on the weblate page. 

To see the current completion of the languages locally run `yarn intl:report`.


## Goals
- fast UI responses and start-up
- improved usability and look & feel
- easy customization for your own oVirt UI implementation
- code reusability, extensibility, and simplicity
- simplified maintenance and ongoing development

For more info, see [doc/goals.md](https://github.com/oVirt/ovirt-web-ui/blob/master/doc/goals.md)
