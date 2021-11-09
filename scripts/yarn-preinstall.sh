#!/bin/bash -xe

if [[ -e ./autogen.sh && ${SKIP_AUTOGEN:-0} -eq 0 ]]; then
  ./autogen.sh --prefix=/usr --datarootdir=/share
else
  echo "Skipped autogen phase of yarn install"
fi
