# Release How To
## Versions ovirt-web-ui-X.Y.Z-R

- **X** to be **0 or 1**, higher numbers reserved for future incompatible changes
- **Y** important bigger changes in functionality
- **Z** bi-weekly sprint releases, bug fixes, and minor changes
- **R** release only, reserved for RPM rebuilds (source doesn't change)

## Procedure
**Please replace 1.5.2 with intended version number**
**
From most recent `master`:

- update translations as a separate PR (only if there are translations to insert, e.g. GA time)
  - https://github.com/oVirt/ovirt-web-ui/wiki/Internationalization#how-to
  - yarn run intl:extract && yarn run intl:pull && yarn run intl:apply

- git checkout -b release-1.5.2
  - edit `configure.ac`
  - edit `ovirt-web-ui.spec.in`
    - summarize what changed. You can reference all issues in the release.

  - git add -u
  - git commit
    - "ovirt-web-ui 1.5.2"
  - git push --set-upstream origin release-1.5.2
- open pull request, wait for CI, merge it

- at https://github.com/oVirt/ovirt-web-ui/releases create new release:
  - release name (tag): 1.5.2
  - title: ovirt-web-ui-1.5.2 (27-Mar-2019)
  - description: copy & paste from spec file

- create releng-tools patch for ovirt compose. Example: https://gerrit.ovirt.org/#/c/90640/

- Docker builds
    - go to Docker Hub project, https://cloud.docker.com/u/ovirtwebui/repository/docker/ovirtwebui/ovirt-web-ui
    - go to Builds
    - update the "latest" build-tag with the release tag (e.g. 1.5.2). The docker build will start
