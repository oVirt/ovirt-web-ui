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
 
## How To Run
So far, the UserPortal is under development.
User-friendly installation & setup will follow.

For early testing:

**Prerequisities:**

- The oVirt engine running at https://[ENGINE_URL]
    - example: https://engine.local/ovirt-engine 

**For Development:**

- update package.json to (see above):
    - "proxy": "https://[ENGINE_URL]"
- WIP: check index.js for username/pwd 
    - so far hardcoded, proper Login functionality & SSO will follow

- npm i
- HTTPS=true npm start

**Production Build**

- npm i && npm run build
- TODO: an RPM will be provided ...

## Technical Details  
- components maintained in [ovirt-ui-components](https://github.com/matobet/ovirt-ui-components) 
- based on React, Patternfly, Redux, Redux-Saga

## Author(s)
Please send author(s) any feedback on the project.

- Marek Libra (mlibra@redhat.com) 
