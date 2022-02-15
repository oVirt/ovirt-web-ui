.PHONY: installdeps srpm

# requirements for automation/build.sh (see also ../ovirt-web-ui.spec.in)
installdeps:
	dnf -y install git jq rpmlint rpm-build autoconf automake

srpm: installdeps
	./automation/build.sh copr
	cp exported-artifacts/*.src.rpm $(outdir)
