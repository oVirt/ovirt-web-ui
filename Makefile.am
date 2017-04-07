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
	src \
	config \
	doc \
	scripts \
	packaging \
	package.json \
	index.html \
  index.jsp \
	index.jsp.template \
	yarn.lock
	

DISTCLEANFILES = $(PACKAGE)-$(VERSION).tar.gz \
	aclocal.m4 \
	configure \
	install-sh \
	missing \
	Makefile.in

DISTCLEANDIRS = autom4te.cache \
	engine-plugin \
	tmp.repos \
	build

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

snapshot-rpm:
	make rpm RELEASE_SUFFIX=".$$(date --utc +%Y%m%d).git$$(git rev-parse --short HEAD)"

publish:
	mkdir -p $(OVIRT_CACHE_DIR)
	rsync -aq $(TMPREPOS)/ $(OVIRT_CACHE_DIR)/ovirt
	createrepo $(OVIRT_CACHE_DIR)/ovirt

distclean-local:
	rm -rf ${DISTCLEANDIRS}

.PHONY: rpms publish srpms

all: ovirt-web-ui

ovirt-web-ui:
	$(YARN) run build
	cp -rpv packaging/* build/
	cp index.jsp build/
	awk 'BEGIN{getline l < "index.jsp.template"}/<div id="replace_with_index_jsp_template"\/>/{gsub("<div id=\"replace_with_index_jsp_template\"/>",l)}1' build/index.html >> build/index.jsp
	rm build/index.html
	mv build/static build/index.jsp build/favicon.ico build/ovirt-web-ui.config build/ovirt-web-ui.war/

install-data-local:
	$(MKDIR_P) $(DESTDIR)$(USER_PORTAL_DIR)
	$(MKDIR_P) $(DESTDIR)$(OVIRT_ENGINE_DIR)
	cp -rpv build/ovirt-web-ui.war $(DESTDIR)$(USER_PORTAL_DIR)
	cp -rpv build/etc $(DESTDIR)/$(sysconfdir)
	echo "ln -s" $(DESTDIR)$(USER_PORTAL_DIR)/ovirt-web-ui.war $(DESTDIR)$(OVIRT_ENGINE_DIR)/ovirt-web-ui.war
	ln -s ../ovirt-web-ui/ovirt-web-ui.war $(DESTDIR)$(OVIRT_ENGINE_DIR)/ovirt-web-ui.war

check-local: 
	$(YARN) test

# vim: ts=2
