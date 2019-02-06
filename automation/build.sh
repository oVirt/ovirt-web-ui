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
if [[ "${version_release}" == "0" ]]; then
    date="$(date --utc +%Y%m%d)"
    commit="$(git log --no-merges -1 --pretty=format:%h)"
    version_release="0.${date}git${commit}"
    # update configure.ac with this
    sed -i -r "s/define\(\[VERSION_RELEASE\], \[0\]\)/define([VERSION_RELEASE], [${version_release}])/" configure.ac
fi

# The "build.packages.force" file contains BuildRequires packages
# to be installed using their latest version.
# When reading the file, make sure to remove blank lines as well
# as lines starting with the "#" character:
build_requires="$(sed -e '/^[ \t]*$/d' -e '/^#/d' -e 's/^/BuildRequires: /' < \
    automation/build.packages.force | \
    sed ':a;N;$!ba;s/\n/\\n/g')"

# Force CI to get the latest version of these packages:
dependencies="$(sed -e '/^[ \t]*$/d' -e '/^#/d' automation/build.packages.force)"
${PACKAGER} clean metadata
${PACKAGER} -y install ${dependencies}

export PATH="/usr/share/ovirt-engine-nodejs/bin:/usr/share/ovirt-engine-yarn/bin:${PATH}"

./autogen.sh --prefix=/usr --datarootdir=/share
make rpm

# Store any relevant artifacts in exported-artifacts for the ci system to
# archive
[[ -d exported-artifacts ]] || mkdir -p exported-artifacts
find tmp.repos -iname \*rpm -exec mv "{}" exported-artifacts/ \;
mv ./*tar.gz exported-artifacts/
