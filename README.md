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
So far, the UserPortal is under development.
User-friendly installation & setup will follow.

For early testing:

**Prerequisities:**

- Have the oVirt engine running at https://[ENGINE_URL]
    - example: https://engine.local/ovirt-engine 
- tested with npm version 3.10.8
    - known issue with missing dependencies with npm v2.15.9

**For Development:**

- update package.json to (see above):
    - `"proxy": "https://[ENGINE_URL]"`
    - example at the end of the package.json:
        - "proxy": "https://engine.local/ovirt-engine"

- alternatively using the `ENGINE_URL` environment variable
    - `ENGINE_URL=https://my.other.engine/ovirt-engine npm start`
    - when using both the `proxy` field in `package.json` and the `ENGINE_URL` environment
    variable, the environment setting takes precedence.

- `npm i`
- `HTTPS=true npm start`

**Quick run using Docker**

If you don't like to burden your system with all required Node.js dependencies,
a prebuilt docker image `matobet/userportal` is available for standalone usage with a running
oVirt engine instance.

Just specify where your oVirt engine is running and expose the port `3000` from the container. Example:

  `docker run --rm -it -e ENGINE_URL=https://my.ovirt.instance/ovirt-engine/ -p 3000:3000 matobet/userportal`

**Production Build**

- `npm i && npm run build`
- result is in UserPortal/build
- TODO: an RPM will be provided ...

## Technical Details  
- components maintained in [ovirt-ui-components](https://github.com/matobet/ovirt-ui-components) 
- based on React, Patternfly, Redux, Redux-Saga
- based on ejected [create-react-app](https://facebook.github.io/react/blog/2016/07/22/create-apps-with-no-configuration.html)

## Author(s)
Please send author(s) any feedback on the project.

- Marek Libra (mlibra@redhat.com) 
