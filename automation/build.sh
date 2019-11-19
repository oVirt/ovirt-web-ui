#!/bin/bash -xe

# Force updating nodejs-modules so any pre-seed update to rpm wait is minimized
PACKAGER=$(command -v dnf >/dev/null 2>&1 && echo 'dnf' || echo 'yum')
REPOS=$(sed -e '/^#/d' -e '/^[ \t]*$/d' automation/build.repos | cut -f 1 -d ',' | paste -s -d,)

${PACKAGER} --disablerepo='*' --enablerepo="${REPOS}" clean metadata
${PACKAGER} -y install ovirt-engine-nodejs-modules

# Clean and then create the artifacts directory:
rm -rf exported-artifacts
mkdir -p exported-artifacts
rm -rf tmp.repos
rm -f ./*tar.gz

# Resolve the release version (is this a snapshot build?)
version_release="$(grep -m1 VERSION_RELEASE configure.ac | cut -d ' ' -f2 | sed 's/[][)]//g')"

# Run the build
export PATH="/usr/share/ovirt-engine-nodejs/bin:/usr/share/ovirt-engine-nodejs-modules/bin:${PATH}"

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
