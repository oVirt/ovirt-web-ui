.PHONY: installdeps srpm

installdeps:
	dnf -y install make autoconf automake git gcc
	dnf --repofrompath=ovirt-master-snapshot,https://download.copr.fedorainfracloud.org/results/ovirt/ovirt-master-snapshot/fedora-34-x86_64/ install -y ovirt-engine-nodejs-modules

srpm: installdeps
	./automation/build.sh copr
	cp exported-artifacts/*.src.rpm $(outdir)
