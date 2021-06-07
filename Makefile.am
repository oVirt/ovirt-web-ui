#    Copyright 2016 Red Hat Inc.
#
#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.

OVIRT_CACHE_DIR	?= $(HOME)/ovirt-cache
USER_PORTAL_DIR = $(datarootdir)/ovirt-web-ui
OVIRT_ENGINE_DIR = $(datarootdir)/ovirt-engine

SHELL := /bin/bash
export PATH := /usr/share/ovirt-engine-nodejs/bin:../node_modules/.bin:$(PATH)

EXTRA_DIST = \
	autogen.sh \
	ovirt-web-ui.spec \
	ovirt-web-ui.spec.in \
	README.md \
	LICENSE \
	branding \
	src \
	config \
	doc \
	scripts \
	packaging \
	package.json \
	static \
	yarn.lock \
	.flowconfig

DISTCLEANFILES = $(PACKAGE)-$(VERSION).tar.gz \
	aclocal.m4 \
	configure \
	install-sh \
	missing \
	Makefile.in \
	.bash_history \
	mocker-*.cfg

DISTCLEANDIRS = autom4te.cache \
	engine-plugin \
	tmp.repos \
	build \
	extra \
	.zanata-cache \
	dockerbuild \
	.node-gyp \
	exported-artifacts \
	rpmbuild \
	node_modules

TMPREPOS = tmp.repos
RPMBUILD_ARGS :=
RPMBUILD_ARGS += --define="_topdir `pwd`/$(TMPREPOS)"
RPMBUILD_ARGS += $(if $(RELEASE_SUFFIX), --define="release_suffix $$RELEASE_SUFFIX")

srpm:	dist
	rm -fr "$(TMPREPOS)"
	mkdir -p $(TMPREPOS)/{SPECS,RPMS,SRPMS,SOURCES}
	$(RPMBUILD) $(RPMBUILD_ARGS) -ts "$(PACKAGE_TARNAME)-$(PACKAGE_VERSION).tar.gz"
	@echo
	@echo "srpm available at '$(TMPREPOS)'"
	@echo

rpm:	srpm
	$(RPMBUILD) $(RPMBUILD_ARGS) --rebuild "$(TMPREPOS)"/SRPMS/*.src.rpm
	@echo
	@echo "rpm(s) available at '$(TMPREPOS)'"
	@echo

snapshot-rpm: SNAPSHOT_DATE = $(shell date --utc +%Y%m%d)
snapshot-rpm: SNAPSHOT_COMMIT ?= $(shell git log -1 --pretty=format:%h)
snapshot-rpm:
	make rpm RELEASE_SUFFIX=".$(SNAPSHOT_DATE).git$(SNAPSHOT_COMMIT)"

publish:
	mkdir -p $(OVIRT_CACHE_DIR)
	rsync -aq $(TMPREPOS)/ $(OVIRT_CACHE_DIR)/ovirt
	createrepo $(OVIRT_CACHE_DIR)/ovirt

distclean-local:
	rm -rf ${DISTCLEANDIRS}

.PHONY: srpm rpm snapshot-rpm publish ovirt-web-ui

all: ovirt-web-ui

ovirt-web-ui:
	node --version
	$(YARN) --version
	NODE_OPTIONS=--max_old_space_size=4096 $(YARN) run build
	cp -rpv packaging/* build/
	mv build/static build/index.jsp build/ovirt-web-ui.config build/ovirt-web-ui.war/

#
# Do the work of installing ovirt-web-ui to an ovirt-engine instance:
#    install share/ovirt-web-ui/ovirt-web-ui.war/
#    install share/ovirt-web-ui/branding/
#    link etc/ovirt-web-ui/branding/00-ovirt.brand -> share/ovirt-web-ui/branding
#    link share/ovirt-engine/ovirt-web-ui.war -> share/ovirt-web-ui/ovirt-web-ui.war
#    install etc/ovirt-engine/engine.conf.d/*
#
install-data-local: dest_web-ui = $(DESTDIR)$(USER_PORTAL_DIR)
install-data-local: dest_engine = $(DESTDIR)$(OVIRT_ENGINE_DIR)
install-data-local: dest_etc = $(DESTDIR)$(sysconfdir)
install-data-local:
	[[ -e "$(dest_web-ui)" ]] || install -d -m 0755 "$(dest_web-ui)"
	cp -rpv build/ovirt-web-ui.war "$(dest_web-ui)"
	cp -rpv build/branding "$(dest_web-ui)"

	[[ -e "$(dest_etc)/ovirt-web-ui/branding" ]] || install -d -m 0755 "$(dest_etc)/ovirt-web-ui/branding"
	ln -sfrn "$(dest_web-ui)/branding" "$(dest_etc)/ovirt-web-ui/branding/00-ovirt.brand"

	[[ -e "$(dest_engine)" ]] || install -d -m 0755 "$(dest_engine)"
	ln -sfrn "$(dest_web-ui)/ovirt-web-ui.war" "$(dest_engine)/ovirt-web-ui.war"

	cp -rpv build/etc/* "$(dest_etc)"

check-local:
	$(YARN) test
