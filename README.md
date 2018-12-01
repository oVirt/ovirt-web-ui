[![Build Status](https://travis-ci.org/oVirt/ovirt-web-ui.svg?branch=master)](https://travis-ci.org/oVirt/ovirt-web-ui)

# VM Portal for oVirt

Modern lightweight UI for standard (non-admin) oVirt users

![Alt text](https://github.com/oVirt/ovirt-web-ui/raw/master/doc/screenshots/v1.3.9_2018-May/01_vmList.png "Screenshot")

VM Portal allows non-admin oVirt users to access, start, stop, and create new virtual machines. It is not intended
to be a full-featured oVirt administration UI. Rather, its focus is on standard users with limited administration skills
and privileges.

For more screenshots, see the [doc/screenshots](https://github.com/oVirt/ovirt-web-ui/blob/master/doc/screenshots) directory.

## Try it!
If you install oVirt 4.1+ using dnf, VM Portal will automatically be included. You can access the application at:

    https://[ENGINE_FQDN]/ovirt-engine/web-ui

You can also run it standalone and connect to any oVirt 4.0+ setup using docker by running:

    docker run --rm -it -e ENGINE_URL=https://[ENGINE.FQDN]/ovirt-engine -p 3000:3000 ovirtwebui/ovirt-web-ui

and access the VM Portal at [http://localhost:3000](http://localhost:3000)

## Milestones
For the most current list of features, please refer to the [Milestones](https://github.com/oVirt/ovirt-web-ui/milestones)
or [Issues](https://github.com/oVirt/ovirt-web-ui/issues) GitHub sections.

Upcoming milestones:

### [v1.4.4](https://github.com/oVirt/ovirt-web-ui/milestone/13)
Highlights:
 - Enhanced error handling
 - bug fixes


## Goals
- fast UI responses and start-up
- improved usability and look & feel
- easy customization for your own oVirt UI implementation
- can be deployed as a self-standing lightweight app (docker image)
- integration with other components like Cockpit or ManageIQ
- code reusability, extensibility, and simplicity
- simplified maintenance and ongoing development

For more info, see [doc/goals.md](https://github.com/oVirt/ovirt-web-ui/blob/master/doc/goals.md)

## Development setup

### Prerequisites

- Have the **oVirt engine running** at https://[ENGINE_URL]
    - example: https://engine.local/ovirt-engine
- Have `yarn` installed
    - it's not strictly required but **suggested** to use ovirt-engine-\* JS packages:
    - from `ovirt/tested` yum repo [http://resources.ovirt.org/repos/ovirt/tested/master/rpm](http://resources.ovirt.org/repos/ovirt/tested/master/rpm) (see [BZ 1427045](https://bugzilla.redhat.com/show_bug.cgi?id=1427045))
        - `dnf install ovirt-engine-nodejs ovirt-engine-nodejs-modules ovirt-engine-yarn`
        - use: `export PATH=/usr/share/ovirt-engine-yarn/bin:/usr/share/ovirt-engine-nodejs/bin:$PATH`

**Standalone installation from RPM**

Please note: if you install ovirt-engine 4.1+ using dnf, VM Portal will be automatically included.

`yum install ovirt-web-ui` installs to `/usr/share/ovirt-web-ui` and a new *ovirt-web-ui.war* is added to the existing ovirt-engine.ear.

You can access the application at: `https://[ENGINE_URL]/ovirt-engine/web-ui`

The latest ovirt-web-ui RPM can be found in the [Copr build system](https://copr.fedorainfracloud.org/coprs/mlibra/ovirt-web-ui/) or [project's yum repository](http://people.redhat.com/mlibra/repos/ovirt-web-ui/).

### Quick run using Docker

A prebuilt docker image `ovirtwebui/ovirt-web-ui` is available for standalone usage
**with a running oVirt engine instance**.

Just specify where your oVirt engine is running, using one of the following examples:

  - **Latest released version** (see [Releases](https://github.com/oVirt/ovirt-web-ui/releases)):

    `docker run --rm -it -e ENGINE_URL=https://[OVIRT.ENGINE.FQDN]/ovirt-engine/ -p 3000:3000 ovirtwebui/ovirt-web-ui:latest`

  - **Most recent image**, built from master branch:

    `docker rmi ovirtwebui/ovirt-web-ui:master`

    `docker run --rm -it -e ENGINE_URL=https://[OVIRT.ENGINE.FQDN]/ovirt-engine/ -p 3000:3000 ovirtwebui/ovirt-web-ui:master`


Wait until the application is ready:

    The app is running at:

      http://localhost:3000/

VM Portal is then accessible at [http://localhost:3000](http://localhost:3000)

### Build

After `git clone` and meeting all **Prerequisities** above, you can build from source by:

    source /usr/share/ovirt-engine-nodejs-modules/setup-env.sh   # to set PATH and ./node_modules directory based on yarn offline cache
    ./autogen.sh

    export PATH=/usr/share/ovirt-engine-yarn/bin:/usr/share/ovirt-engine-nodejs/bin:$PATH    # please consider adding to ~/.bashrc

    make    # to create the 'build' directory
    # or
    make rpm    # to create (s)rpms under 'tmp.repos'

### Build and install to a local ovirt-engine

This allows you to run VM Portal deployed directly in an ovirt-engine development installation.

    ./autogen.sh --prefix=/usr --datarootdir=/share
    make all install-data-local DESTDIR=<path_to_engine_development_prefix>

### Development mode

A primary goal of VM Portal is a quick development cycle (change-build-deploy-check). The project uses [webpack-dev-server](http://webpack.github.io/docs/webpack-dev-server.html) to accomplish this. To start the server:

    ENGINE_URL=https://my.ovirt.instance/ovirt-engine/ yarn start

When asked, provide a valid username (in the form of `user@domain`) and password so
the application can start in the context of a logged in user.

### Redux Dev Tools
The Redux Dev Tools can significantly simplify debuging of the application.

For Chrome: [https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)

For Firefox: [https://addons.mozilla.org/en-us/firefox/addon/remotedev/](https://addons.mozilla.org/en-us/firefox/addon/remotedev/)

## Technical Details
- based on React, Patternfly, Redux, Redux-Saga
- based on ejected [create-react-app](https://facebook.github.io/react/blog/2016/07/22/create-apps-with-no-configuration.html)

## Issues
Please report issues and feature requests to the [GitHub issue tracker](https://github.com/oVirt/ovirt-web-ui/issues).

## Author(s)
- Marek Libra (mlibra@redhat.com)
- Bohdan Iakymets (biakymet@redhat.com)
- Jakub Niedermertl (jniederm@redhat.com)
- Scott Dickerson (sdickers@redhat.com)
- Greg Sheremeta (gshereme@redhat.com)
