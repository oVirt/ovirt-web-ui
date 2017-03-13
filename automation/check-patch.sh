#!/bin/bash -xe

# Force CI to get the latest version of these packages:
dependencies="$(sed -e '/^[ \t]*$/d' -e '/^#/d' automation/packages.force)"
yum-deprecated clean metadata || yum clean metadata
yum-deprecated -y install ${dependencies} || yum -y install ${dependencies}

export PATH=/usr/share/ovirt-engine-nodejs/bin:/usr/share/ovirt-engine-yarn/bin:${PATH}
echo === In check-patch.sh: PATH=${PATH}
rpm -qa | grep ovirt-engine-nodejs
source /usr/share/ovirt-engine-nodejs-modules/setup-env.sh
./autogen.sh && make check-local

