[![Build Status](https://travis-ci.org/oVirt/ovirt-web-ui.svg?branch=master)](https://travis-ci.org/oVirt/ovirt-web-ui)

# VM Portal - Developer information


## Bugs and Enhancements
Please report bugs and feature requests to the [GitHub issue tracker](https://github.com/oVirt/ovirt-web-ui/issues).


## Users Forum
  - Use the [oVirt Users forum / mailing list](https://lists.ovirt.org/archives/list/users@ovirt.org/) for general discussion or help.
  - Use the [oVirt Devel forum / mailing list](https://lists.ovirt.org/archives/list/devel@ovirt.org/) development discussion.


## Development setup

### Prerequisites
  - Have the **oVirt engine running** at https://[ENGINE_URL]
    - example: https://engine.local/ovirt-engine
  - Have packages `autoconf`, `automake` and `libtool` installed
  - Have `yarn` installed
  - Not strictly required but **suggested**, use the `ovirt-engine-*` packages
  - `git clone` the repository


#### ovirt-engine packages
Install `ovirt-engine-nodejs`, `ovirt-engine-nodejs-modules` from the `ovirt/tested`
yum repo for your platform to use the same packages that will be used by CI to build
the app.  (See [BZ 1427045](https://bugzilla.redhat.com/show_bug.cgi?id=1427045))

    REPO=fc28 # or the appropriate release and version for you
    dnf config-manager --add-repo http://resources.ovirt.org/repos/ovirt/tested/master/rpm/$REPO
    dnf install ovirt-engine-nodejs ovirt-engine-nodejs-modules

To set PATH and the project's `node_modules` directory based on yarn offline cache
and use these packages for development or building use:

    source /usr/share/ovirt-engine-nodejs-modules/setup-env.sh

If you want to stop using `yarn` offline, `yarn` will need to be reconfigured to remove
the offline mirror added by `setup-env.sh`:

    yarn config delete yarn-offline-mirror


**NOTE:** During development it is not necessary to limit your environment to the offline
yarn repo provided by `ovirt-engine-nodejs-modules`.  However, it is recommended to run a
full build to verify no dependency errors will be introduced by your change.


### Development mode
A primary goal of VM Portal is a quick development cycle (change-build-deploy-check). The
project uses [webpack-dev-server](http://webpack.github.io/docs/webpack-dev-server.html)
to accomplish this. To start the server:

    ENGINE_URL=https://my.ovirt.instance/ovirt-engine/ yarn start

When asked, provide a valid user name (in the form of `user@domain`) and password so
the application can start in the context of a logged in user.

When the dev server is started, it will attempt to open a new browser window/tab on
your system default browser to the app's running URL.  This behavior can be modified
by specifying the `BROWSER` environment variable.  Possible values are:
    BROWSER=none               # disable the feature
    BROWSER=google-chrome      # open a new tab in chrome on Linux
    BROWSER='google chrome'    # open a new tab in chrome on MacOS
    BROWSER=chrome             # open a new tab in chrome on Windows
    BROWSER=firefox            # open a new tab in firefox on Linux


### Build
You can build the static assets from source by:

    # skip if you don't want to use offline mode
    source /usr/share/ovirt-engine-nodejs-modules/setup-env.sh

    ./autogen.sh
    make


### Build and install to a local development ovirt-engine
This allows you to run VM Portal deployed directly in an ovirt-engine development installation.

    # skip if you don't want to use offline mode
    source /usr/share/ovirt-engine-nodejs-modules/setup-env.sh

    ./autogen.sh --prefix=/usr --datarootdir=/share
    make all install-data-local DESTDIR=<path_to_engine_development_prefix>


### Build RPM
There are at least 4 ways to build the RPM for the project:
  1. Manually with `make rpm`

    source /usr/share/ovirt-engine-nodejs-modules/setup-env.sh
    ./autogen.sh --prefix=/usr --datarootdir=/share
    make rpm

  2. Use [mock_runner](https://ovirt-infra-docs.readthedocs.io/en/latest/CI/Using_mock_runner/index.html)
     to run CI build artifacts locally (this method is cleanest since it runs in a chroot)

  3. Each pull request push will automatically have RPMs built (see `automation/build.sh`)
     by [oVirt infra STDCI](https://ovirt-infra-docs.readthedocs.io/en/latest/CI/Build_and_test_standards/index.html)

  4. Post the comment "`ci please build`" to the GitHub Pull Request for an on-demand
     CI build artifacts build


### RPM Installation
    yum install ovirt-web-ui

Installs the app to `/usr/share/ovirt-web-ui`. A new **ovirt-web-ui.war** is added to the existing **ovirt-engine.ear**.

You can access the application at: `https://[ENGINE_URL]/ovirt-engine/web-ui`

The latest ovirt-web-ui RPM can be found in the [Copr build system](https://copr.fedorainfracloud.org/coprs/ovirtwebui/ovirt-web-ui/).


## Browser Developer Tools
A pair of extensions are recommended to simplify debugging of the application:
  - [Redux DevTools Extension](http://extension.remotedev.io/)
  - [React Developer Tools](https://github.com/facebook/react-devtools)


## Technical Details
- based on React, Patternfly, Redux, Redux-Saga
- based on ejected [create-react-app](https://facebook.github.io/react/blog/2016/07/22/create-apps-with-no-configuration.html)


## Goals
- fast UI responses and start-up
- improved usability and look & feel
- easy customization for your own oVirt UI implementation
- can be deployed as a self-standing lightweight app (docker image)
- integration with other components like Cockpit or ManageIQ
- code reusability, extensibility, and simplicity
- simplified maintenance and ongoing development

For more info, see [doc/goals.md](https://github.com/oVirt/ovirt-web-ui/blob/master/doc/goals.md)


## Author(s)
- Marek Libra (mlibra@redhat.com)
- Bohdan Iakymets (biakymet@redhat.com)
- Jakub Niedermertl (jniederm@redhat.com)
- Scott Dickerson (sdickers@redhat.com)
- Greg Sheremeta (gshereme@redhat.com)
