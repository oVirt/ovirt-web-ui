# Release How To
## Versions ovirt-web-ui-X.Y.Z-R

- **X** to be **0 or 1**, higher numbers reserved for future incompatible changes
- **Y** important bigger changes in functionality
- **Z** bi-weekly sprint releases, bug fixes, and minor changes
- **R** release only, reserved for RPM rebuilds (source doesn't change)

## Procedure
**Please replace 1.4.1 with intended version number**
**
From most recent `master`:

- update translations as a separate PR
  - https://github.com/oVirt/ovirt-web-ui/wiki/Internationalization#how-to
  - yarn run intl:extract && yarn run intl:pull && yarn run intl:apply

- git checkout -b release-1.4.1
  - edit `configure.ac`
  - edit `ovirt-web-ui.spec.in`
    - reference all Bugzilla tickets
    - otherwise empty section for changes (list will be on Github)

  - generate release notes:
    - gren changelog --generate --changelog-filename=RELEASE_NOTES.md --token=[YOUR_GITHUB_TOKEN] --tags=1.4.0..1.4.1

  - git add -u
  - git commit with
    - "ovirt-web-ui 1.4.1"
    - Bug-Url: https://bugzilla.redhat.com/show_bug.cgi?id=.....    (for release notes) (?)
  - git push --set-upstream origin release-1.4.1
- open pull request and wait for merge

- at https://github.com/oVirt/ovirt-web-ui/releases create new release:
  - tag: 1.4.1
  - title: ovirt-web-ui-1.4.1
  - description: copy&pate diff from spec file
  - include Release notes from gren

- Copr build: https://copr.fedorainfracloud.org/coprs/mlibra/ovirt-web-ui/
- publish rpms to yum repo http://people.redhat.com/mlibra/repos/ovirt-web-ui/
- create releng-tools patch for ovirt compose. Example: https://gerrit.ovirt.org/#/c/90640/

- Docker builds
    - ./tools/docker.buildAndPush.sh release # or: "gittag ovirt-web-ui-1.4.1"
    - docker push mareklibra/ovirt-web-ui:latest
    or:
    - ./tools/docker.buildAndPush.sh master
    - docker push mareklibra/ovirt-web-ui:master
