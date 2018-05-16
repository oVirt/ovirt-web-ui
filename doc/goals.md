## Project Goals
The **ovirt-web-ui** project states following goals:

- Improved **User Experience** in comparison to recent GWT-based User Portal
    - **Faster**  
        - UI responses
        The user experiences faster responses to his actions
        - App loading time
        The user can see (at least partial) data swiftly
        
    - **Improved UI**
        - closer to recent standard
        - revised the data and actions to be displayed
    
- POC of the **Platform** for ongoing **oVirt UI** development
    - to simplify
        - maintenance
        - adding new features
    - Custom UI Development
      Adding UI enhancements are simpler.
      Upstream development and community contributions are easier .

- **Shareable**
  So the project or its parts can be reused in ManageIQ or 3rd party SW.
    
## Functional Requirements
First version of the project mimics recent GWT Basic User Portal from the functional perspective.

Ongoing development will lead to the refined scope of recent Extended User Portal.
Preferably, new integrating application will be introduced to implement the "Extended User Portal" scope while reusing recent code.
 
TBD: More detailed scope - both recent and future
    
## How to Meet the Goals

The web-based project is split into modules:

- The ovirt-web-ui project
  Integrates all parts together, provides application context and setup.
  Acts as a how-to example for other integrating projects.
  In particular, it provides:
    - oVirt REST API adapter
    - Redux store
    - top-level webpage composition              
  
Implementation is not specific to particular provider, recently oVirt REST API and ManageIQ are taken into consideration.
An API is used to abstract from particular provider's specifics.

Both modules are built on:

- Recent Patternfly version (v3)
    - (recent GWT UserPortal is built on v1)
    - updates to recent UXD Group output     
    - improves User Experience
- React, Redux, Redux-Saga
    - Recently one of the standards how to build JS applications
    - large community providing sufficient level of experience, documentation, updates and especially interest from developers 

For completeness, missing connection to recent GWT-based User Portal code brings potential to reduce the volume of recent oVirt UI code base in the future.
    
### Shorter Reaction Time
Recent GWT User Portal suffers in response time the user experiences for both the application loading and the user action calls.
Implementation of recent GWT User Portal project contains ineffective chains of asynchronous calls, started on-demand. 
As a consequence, the user experiences significant delay between his action and system response.
Scaling in terms of parallel users count becomes more challenging with the increasing number of server requests each action consists from.

As a part of the project, the data flows are revised, so the count of data-retrieval calls is reduced (significantly).

As much as reasonable and safe, the data are being cached on the client, so the second/next start of the application is faster.

- at start-up, entities are reused from the last application run till they are asynchronously reloaded, so user experiences faster application start
    - leverage LocalStorage
    - entities eligible for caching will be selected gradually as the project grows, recently:
        - icons, templates, hosts
- entity refresh appears less often
    
### oVirt REST API Limitations    
The oVirt REST API brings challenge in terms of amount of data being transferred.
Recently just a limited capability to reduce the provided set of data/meta-data is available in the API.

Network traffic can be successfully reduced by data compression (text-based data with often repetition), but expensive client-side parsing of unneeded data still needs to be performed. 

Resources (like the 'VM') or their collections are returned with their complete property set, incl. the meta-data. 
Recently there's no way how to reduce the set of provided data for particular resource.
Lack of this feature leads to higher transferred data amount with negative consequences on client-side processing.

On the other hand, accessing sub-resource collection requires another one or more requests.
Multiple strategies are possible to resolve this 'n+1 issue':

- read all "sub-"resources at once (or leverage paging), handle links, accept increased memory requirements
- cache the once received sub-resources (both at runtime and persistently in Local Storage)
    - refresh on-demand
     
At the time of writing this document, following promising options needs to be evaluated to address these API limitation:
 
- Resource collection paging support
- Resource queries are supported but their benefit for this project's use-case is so far unclear
 
### High Level Data Flow
**App Start:**

- Login (SSO)
- Load from Local Storage [icons, templates, ... TBD]
- [PAGING LOOP] GET /api/vms [up to 25 items per response for faster processing and rendering]
    - vms list is repeatedly rendered with so far available data (both loaded or cached)
    - all vms need to retrieved so the sorting/filtering works properly and swiftly; not much data
- [LOOP per unique iconId] GET /api/icons/[ID] [icons shared among VMs, up to one call per icon]
- [LOOP ALL VMS]
    - GET /api/vms/[ID]/diskattachments
    - [LOOP per DiskAttachment]
        - GET /api/disks/[ID]
- [PAGING LOOP] GET /api/templates [up to 25 items per response]
- Save to Local Storage

The page is rendered gradually as data arrives (thanks to React/Redux), the user sees first reasonable data subset with the delay of a single /api/vms request and details appears as they arrive.

**Active Action** (i.e. VM Start, ...):

- POST /api/[...action...]
    - error response is processed
    - schedule delayed partial refresh [delay per action type, partial = i.e. for a single VM]
    
**Recurrent Refresh**

- The 'Full Refresh' button for immediate reload - same as at startup 
- \[ON EVERY MINUTE\] Shallow Autorefresh of /api/vms (no subresources except unknown icons)
- \[ON EVERY 5 MINUTES\] Autorefresh of selected resources (templates, hosts)
- \[ON VM DETAIL SELECT\] Immediately render available data and call deep single-VM refresh followed by rerendering

    
### To Be Answered

- really prefetch everything?
    - i.e. VM Details strictly on demand? Fetching of sub-resources is costly - consider disks
- fetch disks separately or as a part of VMs?
    - In other words: is disk management planed?
        - yes: fetch and cache all disks at once, handle relations
        - no: disks are part of the VM details
- TBD: dialogs (new VM, refresh of templates)

#### Transferred Data Volume
TBD: size and expected data examples

### Christmas Wish
- oVirt REST API (or a wrapper) provides dynamically defined
    - subset of resource properties
    - sub-resources in a single call      
- Events from oVirt
  so polling would not be needed  

## Links

- [oVirt web-ui project on Github](https://github.com/oVirt/ovirt-web-ui)

