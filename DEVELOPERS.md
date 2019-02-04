[![Build Status](https://travis-ci.org/oVirt/ovirt-web-ui.svg?branch=master)](https://travis-ci.org/oVirt/ovirt-web-ui)

# VM Portal - Developer information

## Bugs and Enhancements
Please report bugs and feature requests to the [GitHub issue tracker](https://github.com/oVirt/ovirt-web-ui/issues).

## Users Forum
Use the [oVirt Users forum / mailing list](https://lists.ovirt.org/archives/list/users@ovirt.org/) for general discussion or help.
Use the [oVirt Devel forum / mailing list](https://lists.ovirt.org/archives/list/devel@ovirt.org/) development discussion.

## Development setup

### Prerequisites

- Have the **oVirt engine running** at https://[ENGINE_URL]
    - example: https://engine.local/ovirt-engine
- Have `yarn` installed
    - it's not strictly required but **suggested** to use ovirt-engine-\* JS packages:
    - from `ovirt/tested` yum repo [http://resources.ovirt.org/repos/ovirt/tested/master/rpm](http://resources.ovirt.org/repos/ovirt/tested/master/rpm) (see [BZ 1427045](https://bugzilla.redhat.com/show_bug.cgi?id=1427045))
        - `dnf install ovirt-engine-nodejs ovirt-engine-nodejs-modules ovirt-engine-yarn`
        - use: `export PATH=/usr/share/ovirt-engine-yarn/bin:/usr/share/ovirt-engine-nodejs/bin:$PATH`

**Alternate standalone installation using RPM**

`yum install ovirt-web-ui` installs to `/usr/share/ovirt-web-ui` and a new *ovirt-web-ui.war* is added to the existing ovirt-engine.ear.

You can access the application at: `https://[ENGINE_URL]/ovirt-engine/web-ui`

The latest ovirt-web-ui RPM can be found in the [Copr build system](https://copr.fedorainfracloud.org/coprs/ovirtwebui/ovirt-web-ui/).

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
