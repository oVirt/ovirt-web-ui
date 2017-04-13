#!/bin/bash

ERROR_WRONG_ROOT_DIR=1
ERROR_PARAMS=2

GIT_REPO=oVirt/ovirt-web-ui
GIT_URL=https://github.com/oVirt/ovirt-web-ui.git
LATEST_RELEASE=https://github.com/oVirt/ovirt-web-ui/releases/latest
DOCKER_BUILD_DIR=./dockerbuild

DOCKER_BASE_TAG=ovirt-web-ui
DOCKER_TAG=mareklibra/${DOCKER_BASE_TAG}

DATE=`date +%Y_%m_%d`
echo Build ovirt-web-ui docker image and push to Docker Hub

function usage {
  echo $0 master \# git clone recent master and build build ovirt-web-ui:master
  echo $0 release \# download latest official release and build ovirt-web-ui:lastest
  echo $0 gittag [TAG]
  echo $0 pr [PULL_REQUEST_NUMBER] \# github pull-request to be applied on top of recent master
  echo $0 actual \# to build from recent sources
}

function clean {
  rm -rf ${DOCKER_BUILD_DIR} 2>/dev/null
}

function checkRootDir {
  if [ ! -f ./Dockerfile ]; then
    echo Please run the script from root project directory by
    echo '  ./tools/docker.buildPush [params]'
    exit ${ERROR_WRONG_ROOT_DIR}
  fi
}

function getLatestReleaseName {
  curl --silent "https://api.github.com/repos/${GIT_REPO}/releases/latest" | # Get latest release from GitHub api
    grep '"tag_name":' |                                                     # Get tag line
    sed -E 's/.*"([^"]+)".*/\1/'                                             # JSON value
}

function downloadLatestRelease {
  RELNAME=`getLatestReleaseName`
  LATEST=https://github.com/oVirt/ovirt-web-ui/archive/${RELNAME}.tar.gz
  echo Latest release found: ${LATEST}
  
  clean
  mkdir ${DOCKER_BUILD_DIR}
  cd ${DOCKER_BUILD_DIR}

  curl --silent -L ${LATEST} > ${RELNAME}.tar.gz
  tar -xzf ${RELNAME}.tar.gz
  cd ${DOCKER_BASE_TAG}-${RELNAME}

  pwd # for debug only
}


function clone {
  clean
  mkdir ${DOCKER_BUILD_DIR}
  cd ${DOCKER_BUILD_DIR}
  git clone ${GIT_URL}
  cd ovirt-web-ui
}

function dockerBuild {
  echo Building docker image: $1
  ./autogen.sh
  docker build -t $1 .
  docker images

  dockerPush $1
}

function dockerPush {
  echo To push the image to Docker Hub, type
  echo "  "docker push $1
}

function master {
  echo Build from recent master

  clone
  pwd
  dockerBuild ${DOCKER_TAG}:master
}

function actual {
  echo Build from recent sources

  pwd
  dockerBuild ${DOCKER_BASE_TAG}:devel_${DATE}
}

function release {
  echo Build from latest release ${LATEST_RELEASE}

  downloadLatestRelease
  dockerBuild ${DOCKER_TAG}:latest
}

function gittag {
  echo Build from git tag: $1

  clone
  pwd
  git checkout tags/$1
  dockerBuild ${DOCKER_TAG}:$1
}

function pr {
  echo Build from pull request: $1

  clone
  pwd
  git pull --no-edit origin pull/$1/head
  dockerBuild ${DOCKER_TAG}:pullrequest_$1
}

######################
checkRootDir

case "$1" in
    master)
      master
    ;;
    release)
      release
    ;;
    actual)
      actual
    ;;
    gittag)
      gittag $2
    ;;
    pr)
      pr $2
    ;;
    *)
      usage
      exit ${ERROR_PARAMS}
    ;;
esac
