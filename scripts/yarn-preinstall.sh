#!/bin/bash -xe

#
# The yarn preinstall script needs to run the autogen.sh script to properly setup
# the repo for development or builds.  There are 3 scenarios to consider:
#
#   1. Standard developer build
#
#      Developers want `autogen.sh` to run every time they run a `yarn install`, typically
#      after a clone or rebase.  This keeps all of the autoconf managed 'config' files
#      up to date.
#
#   2. On demand, CI or build system (copr, stdci) builds
#
#      Builds running through `automation/build.sh` or managed by the spec file typically
#      run the autogen/configure before the `yarn install` and `yarn build`.  In this
#      scenario, there is no need for `yarn install` to run the setup again.  The env var
#      `SKIP_AUTOGEN` will have `yarn install` skip its autogen step since it has already
#      been done.
#
#   3. Inclusion is ovirt-engine-nodejs-modules
#
#      Since ovirt-engine-nodejs-modules builds based solely on a project's package.json
#      and yarn.lock, no preinstall scripts are available or should be run.  The test in
#      the preinstall script in package.json makes sure this bash script exists before
#      running it.
#

if [[ -e ./autogen.sh && ${SKIP_AUTOGEN:-0} -eq 0 ]]; then
  ./autogen.sh --prefix=/usr --datarootdir=/share
else
  echo "Skipped autogen phase of yarn install"
fi
