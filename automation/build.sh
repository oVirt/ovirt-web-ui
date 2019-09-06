#!/bin/bash -xe

DISTVER="$(rpm --eval "%dist"|cut -c2-3)"
PACKAGER=""
if [[ "${DISTVER}" == "el" ]]; then
    PACKAGER=yum
else
    PACKAGER=dnf
fi

# Clean and then create the artifacts directory:
rm -rf exported-artifacts
mkdir -p exported-artifacts
rm -rf tmp.repos
rm -f ./*tar.gz

# Resolve the release version (is this a snapshot build?)
version_release="$(grep -m1 VERSION_RELEASE configure.ac | cut -d ' ' -f2 | sed 's/[][)]//g')"

# Force CI to get the latest version of these packages:
dependencies="$(sed -e '/^[ \t]*$/d' -e '/^#/d' automation/build.packages.force)"
${PACKAGER} clean metadata
${PACKAGER} -y install ${dependencies}

export PATH="/usr/share/ovirt-engine-nodejs/bin:/usr/share/ovirt-engine-nodejs-modules/bin:${PATH}"

# if yarn is not available, patch in the yarn-*.js from nodejs-modules
# (really only necessary until nodejs-modules makes a yarn executable available)
if [[ "$(type -t yarn)" == "" ]]; then
  export YARN="node $(find /usr/share/ovirt-engine-nodejs-modules -maxdepth 1 -name 'yarn-*.js')"
fi

./autogen.sh --prefix=/usr --datarootdir=/share
if [[ "${version_release}" == "0" ]]; then
  make snapshot-rpm
else
  make rpm
fi

# Store any relevant artifacts in exported-artifacts for the ci system to
# archive
[[ -d exported-artifacts ]] || mkdir -p exported-artifacts
find tmp.repos -iname \*rpm -exec mv "{}" exported-artifacts/ \;
mv ./*tar.gz exported-artifacts/
