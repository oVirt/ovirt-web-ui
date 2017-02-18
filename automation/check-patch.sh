#!/bin/bash -xe

# Force CI to get the latest version of these packages:
#dependencies="$(sed -e '/^[ \t]*$/d' -e '/^#/d' automation/packages.force)"
#yum clean metadata || dnf clean metadata
#yum -y install ${dependencies} || dnf -y install ${dependencies}

export PATH=/usr/share/ovirt-engine-nodejs/bin:/usr/share/ovirt-engine-yarn/bin:${PATH}
echo === In check-patch.sh: PATH=${PATH}
rpm -qa | grep ovirt-engine-nodejs
source /usr/share/ovirt-engine-nodejs-modules/setup-env.sh
./autogen.sh && make check-local

