[![Build Status](https://travis-ci.org/oVirt/ovirt-web-ui.svg?branch=master)](https://travis-ci.org/oVirt/ovirt-web-ui)

# User Portal for oVirt
Modern UI for standard (non-admin) oVirt users.

This project aims to be a drop-in replacement of the existing Basic User Portal which includes selected functionality of the Power User Portal.
Revised list of Extended User Portal features will be implemented to ideally replace it as well.

The application is built with performance in mind.

This project is not intended to be full-feature oVirt admin UI, its focus is on standard users with no or limited administration skills or privileges.

For screenshots, see the [doc/screenshots](https://github.com/oVirt/ovirt-web-ui/blob/master/doc/screenshots) directory.

## Milestones
For most current list of features please refer the [Milestones](https://github.com/oVirt/ovirt-web-ui/milestones) or [Issues](https://github.com/oVirt/ovirt-web-ui/issues) GitHub sections.

The upcoming milestones:

### [v1.0.0](https://github.com/oVirt/ovirt-web-ui/milestone/1)
With this release, majority of oVirt Basic User Portal functionality is supported, namely:

 - list of VMs (not pools)
 - basic operations (start, shut down, reboot, suspend)
 - take console
 - present VM details

### [v1.1.0](https://github.com/oVirt/ovirt-web-ui/milestone/2)
The release shall include all features of the Basic User Portal and selected functionality of the Power User Portal, namely:
 
 - add/edit VM (basic properties only)
 - VM pools

## Goals
- Built on reusable components
    - deploy User Portal as a self-standing app
    - integrate in ManageIQ
    - customize for your own oVirt UI 
- In comparison to recent GWT UserPortal:
    - improved usability and Look&Feel
    - simplified maintenance & ongoing development
    - faster UI responses (incl. start-up)      

For more info, see [doc/goals.md](https://github.com/oVirt/ovirt-web-ui/blob/master/doc/goals.md)
 
## How To Run
### Quick run using Docker

If you don't like to burden your system with all required Node.js dependencies,
a prebuilt docker image `mareklibra/ovirt-web-ui` is available for standalone usage 
**with a running oVirt engine instance**.

Just specify where your oVirt engine is running in one of following example:

  - **Most recent image**, built from (recent) master branch:

    `docker run --rm -it -e ENGINE_URL=https://[OVIRT.ENGINE.FQDN]/ovirt-engine/ -p 3000:3000 mareklibra/ovirt-web-ui:master`

  - **Latest officially released version** (see [Releases](https://github.com/oVirt/ovirt-web-ui/releases)):

    `docker run --rm -it -e ENGINE_URL=https://[OVIRT.ENGINE.FQDN]/ovirt-engine/ -p 3000:3000 mareklibra/ovirt-web-ui:latest`


Wait till following message is displayed:

    The app is running at:
    
      http://localhost:3000/
    
The ovirt-web-ui is then accessible on [http://localhost:3000](http://localhost:3000)


### Prerequisites

- Have the **oVirt engine running** at https://[ENGINE_URL]
    - example: https://engine.local/ovirt-engine 
- Have `yarn` installed
    - it's not strictly required but **suggested** to use ovirt-engine-\* JS packages:
    - from `ovirt/tested` yum repo [http://resources.ovirt.org/repos/ovirt/tested/master/rpm](http://resources.ovirt.org/repos/ovirt/tested/master/rpm) (see [BZ 1427045](https://bugzilla.redhat.com/show_bug.cgi?id=1427045))
        - `dnf install ovirt-engine-nodejs-6.9.4 ovirt-engine-nodejs-modules-1.0.4 ovirt-engine-yarn-0.19.1`
        - use: `export PATH=/usr/share/ovirt-engine-yarn/bin:/usr/share/ovirt-engine-nodejs/bin:$PATH`

**Installation from RPM**

The `yum install ovirt-web-ui` installs to `/user/share/ovirt-web-ui` and new *ovirt-web-ui.war* is added to the existing ovirt-engine.ear.

You can access the application at: `https://[ENGINE_URL]/web-ui`

Please note, starting ovirt-4.1, the ovirt-web-ui is installed with ovirt-engine by default.

Latest ovirt-web-ui RPM can be found in the [http://resources.ovirt.org/repos/ovirt/tested/master/rpm](http://resources.ovirt.org/repos/ovirt/tested/master/rpm) yum repository. 

### Build

After `git clone` and meeting all **Prerequisities** above, you can build from sources by:

    source /usr/share/ovirt-engine-nodejs-modules/setup-env.sh   # to set PATH and ./node_modules directory based on yarn offline cache
    ./autogen.sh
    
    export PATH=/usr/share/ovirt-engine-yarn/bin:/usr/share/ovirt-engine-nodejs/bin:$PATH    # please consider adding to ~/.bashrc
    
    make    # to create the 'build' directory 
    # or
    make rpm    # to create (s)rpms under 'tmp.repos'

### Development mode

Please check, you can **build** the application (see above).

Then to shorten development cycle (change-build-deploy-check), you can:

    ENGINE_URL=https://my.ovirt.instance/ovirt-engine/ yarn start

When asked, provide valid username (in the form of `user@domain`) and password so
the application can start in the context of a logged in user.

### Redux Dev Tools
The Redux Dev Tools can significantly simplify debuging of the application.

For Chrome: [https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)

For Firefox: [https://addons.mozilla.org/en-us/firefox/addon/remotedev/](https://addons.mozilla.org/en-us/firefox/addon/remotedev/)


## Technical Details  
- components maintained in [ovirt-ui-components](https://github.com/matobet/ovirt-ui-components) 
- based on React, Patternfly, Redux, Redux-Saga
- based on ejected [create-react-app](https://facebook.github.io/react/blog/2016/07/22/create-apps-with-no-configuration.html)

## Author(s)
Please send author(s) any feedback on the project.

- Marek Libra (mlibra@redhat.com)

