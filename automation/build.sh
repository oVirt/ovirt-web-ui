#!/bin/bash -xe

[[ "${1:-foo}" == "copr" ]] && source_build=1 || source_build=0
[[ ${OFFLINE_BUILD:-1} -eq 1 ]] && use_nodejs_modules=1 || use_nodejs_modules=0
[[ ${MOVE_ARTIFACTS:-1} -eq 1 ]] && use_exported_artifacts=1 || use_exported_artifacts=0

# During a full, offline build, install build dependencies
if [[ $source_build -eq 0 && $use_nodejs_modules -eq 1 ]] ; then
  dnf -y install ovirt-engine-nodejs-modules
fi

# Clean the artifacts directory:
test -d exported-artifacts && rm -rf exported-artifacts || :
rm -rf tmp.repos
rm -f ./*tar.gz

# Create the artifacts directory:
mkdir -p exported-artifacts

# If version_release is 0, consider the build to be a snapshot build
version_release="$(grep -m1 VERSION_RELEASE configure.ac | cut -d ' ' -f2 | sed 's/[][)]//g')"
if [[ "${version_release}" == "0" ]]; then
  # Figure out the latest non-merge commit hash to use with the snapshot name
  IFS='|' read -ra HEAD  <<< $(git log -1 --pretty=tformat:"%H|%ce|%s" )
  IFS='|' read -ra HEAD_ <<< $(git log -1 --pretty=tformat:"%H|%ce|%s" --skip=1)

  pr_merge_email="noreply@github.com"
  pr_merge_commit="^Merge ${HEAD_[0]} into [0-9a-f]{40}$"
  if [[ ${HEAD[1]} == $pr_merge_email ]] && [[ ${HEAD[2]} =~ $pr_merge_commit ]]; then
    export SNAPSHOT_COMMIT="${HEAD_[0]:0:7}"
  else
    export SNAPSHOT_COMMIT="${HEAD[0]:0:7}"
  fi

  # For a source only build, setup PACKAGE_RPM_SUFFIX for configure.ac to directly embed
  # the snapshot suffix in the spec file.  This is necessary when the suffix info cannot
  # be passed via command line, specifically during a copr style pure chroot rpmbuild srpm
  # and rpm rebuild.
  if [[ $source_build -eq 1 ]] ; then
    export SNAPSHOT_DATE=$(date --utc +%Y%m%d%H%M%S)
    export PACKAGE_RPM_SUFFIX=".$SNAPSHOT_DATE.git$SNAPSHOT_COMMIT"
  fi

  target_prefix=snapshot-
else
  if [[ $source_build -eq 1 ]] ; then
    echo 'release source build'
  fi
fi

# Configure the build
./autogen.sh --prefix=/usr --datarootdir=/share

# Make sure the rpmspec file is valid (specifically that the changelog dates won't kill the build)
spec_file=ovirt-web-ui.spec
SPECLINT=$(rpmlint ${spec_file} 2>&1) || linterror=$?
if [[ $linterror -ne 0 ]]; then
    echo "Error or warning in '${spec_file}':"
    echo "$SPECLINT"
    exit 6
fi

# Run the build
if [[ $source_build -eq 1 ]] ; then
  make ${target_prefix}srpm
else
  make ${target_prefix}rpm
fi

# Store any relevant artifacts in exported-artifacts for the ci system to archive
if [[ $use_exported_artifacts -eq 1 ]] ; then
  [[ -d exported-artifacts ]] || mkdir -p exported-artifacts
  find tmp.repos -iname \*rpm -exec mv "{}" exported-artifacts/ \;
  mv ./*tar.gz exported-artifacts/
fi
