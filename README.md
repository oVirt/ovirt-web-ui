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

For more info, see [doc/goals.md](https://github.com/mareklibra/userportal/blob/master/doc/goals.md)
 
## How To Run
**Prerequisities:**

- Have the oVirt engine running at https://[ENGINE_URL]
    - example: https://engine.local/ovirt-engine 
- known issue with missing dependencies with npm v2

**RPMs**

oVirt resources: look for ovirt-web-ui in [http://resources.ovirt.org/pub/ovirt-master-snapshot-static/rpm/](http://resources.ovirt.org/pub/ovirt-master-snapshot-static/rpm/)

Copr: [https://copr.fedorainfracloud.org/coprs/mlibra/ovirt-web-ui/](https://copr.fedorainfracloud.org/coprs/mlibra/ovirt-web-ui/)

**Build**

After _git clone_, run:

    ./autogen.sh
    make    # to create the 'build' directory 
    or
    make rpm    # to create (s)rpms under 'tmp.repos'

**RPM installation**

The rpm installs to `/user/share/ovirt-web-ui`.

New ovirt-web-ui.war is added to the existing ovirt-engine.ear.


**Quick run using Docker**

If you don't like to burden your system with all required Node.js dependencies,
a prebuilt docker image `matobet/userportal` is available for standalone usage with a running
oVirt engine instance.

Just specify where your oVirt engine is running and expose the port `3000` from the container. Example:

  `docker run --rm -it -e ENGINE_URL=https://my.ovirt.instance/ovirt-engine/ -p 3000:3000 matobet/userportal`


## Technical Details  
- components maintained in [ovirt-ui-components](https://github.com/matobet/ovirt-ui-components) 
- based on React, Patternfly, Redux, Redux-Saga
- based on ejected [create-react-app](https://facebook.github.io/react/blog/2016/07/22/create-apps-with-no-configuration.html)

## Author(s)
Please send author(s) any feedback on the project.

- Marek Libra (mlibra@redhat.com)

