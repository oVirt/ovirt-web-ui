#!/bin/bash

ERROR_WRONG_ROOT_DIR=1
ERROR_PARAMS=2

GIT_URL=https://github.com/oVirt/ovirt-web-ui.git
DOCKER_BUILD_DIR=./dockerbuild

DOCKER_BASE_TAG=ovirt-web-ui
DOCKER_TAG=mareklibra/${DOCKER_BASE_TAG}

DATE=`date +%Y_%m_%d`
echo Build ovirt-web-ui docker image and push to Docker Hub

function usage {
  echo $0 master 
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

function clone {
  clean
  mkdir ${DOCKER_BUILD_DIR}
  cd ${DOCKER_BUILD_DIR}
  git clone ${GIT_URL}
  cd ovirt-web-ui
}

function dockerBuild {
  echo Building docker image: $1
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
