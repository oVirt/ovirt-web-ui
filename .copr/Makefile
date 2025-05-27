.PHONY: installdeps srpm

# requirements for automation/build.sh (see also ../ovirt-web-ui.spec.in)
installdeps:
	dnf -y install git jq rpm-build autoconf automake

# explicity mark the copr generated git repo directory (which is done prior to the mock
# call to the make_srpm and will be the current pwd) as safe for git commands
git-safe:
	git config --global --add safe.directory "$(shell pwd)"

srpm: installdeps git-safe
	./automation/build.sh copr
	cp exported-artifacts/*.src.rpm $(outdir)
