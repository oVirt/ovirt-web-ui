.PHONY: installdeps srpm

installdeps:
	dnf -y install make autoconf automake git gcc dnf-plugins-core

srpm: installdeps
	./automation/build.sh copr
	cp exported-artifacts/*.src.rpm $(outdir)
