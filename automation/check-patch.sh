#!/bin/bash -xe

export PATH=/usr/share/ovirt-engine-nodejs/bin:${PATH}
./autogen.sh && make check-local

