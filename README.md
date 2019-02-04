[![Build Status](https://travis-ci.org/oVirt/ovirt-web-ui.svg?branch=master)](https://travis-ci.org/oVirt/ovirt-web-ui)

# VM Portal for oVirt

VM Portal is a modern lightweight UI for oVirt that allows oVirt users to create, start, stop, and use virtual machines.

![Dashboard](https://github.com/oVirt/ovirt-web-ui/raw/master/doc/screenshots/v1.5.0_2019-Feb/01_vm_dashboard.png)

## Installation
VM Portal is installed automatically when you [install oVirt using Cockpit](https://ovirt.org/download). Once oVirt is installed,
navigate to https://[ENGINE_FQDN]/ovirt-engine and click VM Portal.

## Bugs and Enhancements
Please report bugs and feature requests to the [GitHub issue tracker](https://github.com/oVirt/ovirt-web-ui/issues).

## Users Forum
Use the [oVirt Users forum / mailing list](https://lists.ovirt.org/archives/list/users@ovirt.org/) for general discussion or help.

## Docker container
VM Portal can run standalone in a container and connect to any oVirt 4.3 engine. This is useful for testing and debugging. Run:

    docker run --rm -it -e ENGINE_URL=https://[ENGINE.FQDN]/ovirt-engine -p 3000:3000 ovirtwebui/ovirt-web-ui:latest

and access VM Portal at [http://localhost:3000](http://localhost:3000)

## Technical Details
- based on React, Redux, Redux-Saga, and PatternFly
- bootstrapped with [create-react-app](https://facebook.github.io/react/blog/2016/07/22/create-apps-with-no-configuration.html) - [README_react](README_react.md)
- [Developer information](DEVELOPERS.md)
- For more screenshots, see the [doc/screenshots](https://github.com/oVirt/ovirt-web-ui/blob/master/doc/screenshots) directory.

## Author(s)
- Marek Libra (mlibra@redhat.com)
- Scott Dickerson (sdickers@redhat.com)
- Bohdan Iakymets (biakymet@redhat.com)
- Jakub Niedermertl
- Greg Sheremeta (gshereme@redhat.com)
