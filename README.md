POC of new oVirt User Portal.

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
**Prerequisities:**

- Have the **oVirt engine running** at https://[ENGINE_URL]
    - example: https://engine.local/ovirt-engine 
- Have `yarn` installed
    - it's not strictly required but **suggested** to use ovirt-engine-\* JS packages:
    - from `ovirt/tested` yum repo [http://resources.ovirt.org/repos/ovirt/tested/master/rpm](http://resources.ovirt.org/repos/ovirt/tested/master/rpm) (see [BZ 1427045](https://bugzilla.redhat.com/show_bug.cgi?id=1427045))
        - `dnf install ovirt-engine-nodejs-6.9.4 ovirt-engine-nodejs-modules-1.0.4 ovirt-engine-yarn-0.19.1`

**RPMs**

oVirt resources: look for ovirt-web-ui in [http://resources.ovirt.org/repos/ovirt/tested/master/rpm](http://resources.ovirt.org/repos/ovirt/tested/master/rpm) yum repository.


**Build**

After _git clone_ and meeting all **Prerequisities**, run:

    source /usr/share/ovirt-engine-nodejs-modules/setup-env.sh   # to set PATH and ./node_modules directory
    ./autogen.sh
    make    # to create the 'build' directory 
    or
    make rpm    # to create (s)rpms under 'tmp.repos'

Please consider updating your PATH to:

    `export PATH=/usr/share/ovirt-engine-yarn/bin:/usr/share/ovirt-engine-nodejs/bin:$PATH`

**RPM installation**

The `yum install ovirt-web-ui` installs to `/user/share/ovirt-web-ui` and new *ovirt-web-ui.war* is added to the existing ovirt-engine.ear.

You can access the application at: `https://[ENGINE_URL]/web-ui`

**Development mode**

Please check, you can **build** the application (see above).

Then try:

    `ENGINE_URL=https://my.ovirt.instance/ovirt-engine/ yarn start`

When asked, provide valid username (in the form of `user@domain`) and password so
the application can start in the context of a logged in user.

**Redux Dev Tools**
The Redux Dev Tools can significantly simplify debuging of the application.

For Chrome: [https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)

For Firefox: [https://addons.mozilla.org/en-us/firefox/addon/remotedev/](https://addons.mozilla.org/en-us/firefox/addon/remotedev/)


**Quick run using Docker**

If you don't like to burden your system with all required Node.js dependencies,
a prebuilt docker image `matobet/userportal` is available for standalone usage with a running
oVirt engine instance.

Just specify where your oVirt engine is running and expose the port `3000` from the container. Example:

  `docker run --rm -it -e ENGINE_URL=https://my.ovirt.instance/ovirt-engine/ -p 3000:3000 matobet/ovirt-web-ui`


## Technical Details  
- components maintained in [ovirt-ui-components](https://github.com/matobet/ovirt-ui-components) 
- based on React, Patternfly, Redux, Redux-Saga
- based on ejected [create-react-app](https://facebook.github.io/react/blog/2016/07/22/create-apps-with-no-configuration.html)

## Author(s)
Please send author(s) any feedback on the project.

- Marek Libra (mlibra@redhat.com)

