#!/bin/bash -xe

if [[ "${1:-foo}" != "copr" ]] ; then
# Force updating nodejs-modules so any pre-seed update to rpm wait is minimized
PACKAGER=$(command -v dnf >/dev/null 2>&1 && echo 'dnf' || echo 'yum')
REPOS=$(sed -e '/^#/d' -e '/^[ \t]*$/d' automation/build.repos | cut -f 1 -d ',' | paste -s -d,)

${PACKAGER} --disablerepo='*' --enablerepo="${REPOS}" clean metadata
${PACKAGER} -y install ovirt-engine-nodejs-modules

# Clean the artifacts directory:
rm -rf exported-artifacts
fi

# create the artifacts directory:
mkdir -p exported-artifacts
rm -rf tmp.repos
rm -f ./*tar.gz

# Resolve the release version (is this a snapshot build?)
version_release="$(grep -m1 VERSION_RELEASE configure.ac | cut -d ' ' -f2 | sed 's/[][)]//g')"

# Run the build
export PATH="/usr/share/ovirt-engine-nodejs/bin:/usr/share/ovirt-engine-nodejs-modules/bin:${PATH}"

if [[ "${1:-foo}" == "copr" ]] ; then
  # Hardcoding release suffix for copr build or it will be lost on src.rpm rebuild in mock
  sed -i -e "s:%{?release_suffix}:.$(date --utc +%Y%m%d).git$(git log -1 --pretty=format:%h):" ovirt-web-ui.spec.in
fi

./autogen.sh --prefix=/usr --datarootdir=/share
if [[ "${version_release}" == "0" ]]; then
  IFS='|' read -ra HEAD  <<< $(git log -1 --pretty=tformat:"%H|%ce|%s" )
  IFS='|' read -ra HEAD_ <<< $(git log -1 --pretty=tformat:"%H|%ce|%s" --skip=1)

  pr_merge_email="noreply@github.com"
  pr_merge_commit="^Merge ${HEAD_[0]} into [0-9a-f]{40}$"
  if [[ ${HEAD[1]} == $pr_merge_email ]] && [[ ${HEAD[2]} =~ $pr_merge_commit ]]; then
    export SNAPSHOT_COMMIT="${HEAD_[0]:0:7}"
  fi
  if [[ "${1:-foo}" != "copr" ]] ; then
    make snapshot-rpm
  else
    make srpm
  fi
else
  if [[ "${1:-foo}" != "copr" ]] ; then
    make rpm
  else
    make srpm
  fi
fi

# Store any relevant artifacts in exported-artifacts for the ci system to
# archive
[[ -d exported-artifacts ]] || mkdir -p exported-artifacts
find tmp.repos -iname \*rpm -exec mv "{}" exported-artifacts/ \;
mv ./*tar.gz exported-artifacts/
