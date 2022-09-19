# Release How To
## Versions ovirt-web-ui-X.Y.Z-R

- **X** to be **1**, higher numbers reserved for future incompatible changes
- **Y** important bigger changes in functionality
- **Z** sprint releases, bug fixes, and minor changes
- **R** release only, reserved for RPM rebuilds (source doesn't change)

## Procedure

**Please replace 1.5.2 with intended version number**

From most recent `master`:

- Update translations as a separate PR (only if there are translations to insert, e.g. GA time)
  - See [Internationalization How-To](https://github.com/oVirt/ovirt-web-ui/wiki/Internationalization#how-to)
  - Example PR: https://github.com/oVirt/ovirt-web-ui/pull/1433
  - To update translations: `yarn intl:extract && yarn intl:pull && yarn intl:apply`

- Prepare the pull request:
  - make a new branch: `git checkout -b release-1.5.2 -t upstream/master`
  - edit `configure.ac`
  - edit `ovirt-web-ui.spec.in`
    - Update the change log.  Reference all issues in the release.

  - stage changes: `git add -u`
  - commit changes: `git commit -m "release ovirt-web-ui 1.5.2"`
  - push to your fork: `git push origin release-1.5.2`

- Open pull request from your new branch, wait for CI, merge it

- At https://github.com/oVirt/ovirt-web-ui/releases create new release:
  - release name (tag): 1.5.2
  - title: ovirt-web-ui-1.5.2 (27-Mar-2019)
  - description: copy & paste from spec file

- Update oVirt compose with the new release
