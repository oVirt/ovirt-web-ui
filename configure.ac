dnl
dnl   Copyright 2016 Red Hat Inc.
dnl
dnl   Licensed under the Apache License, Version 2.0 (the "License");
dnl   you may not use this file except in compliance with the License.
dnl   You may obtain a copy of the License at
dnl
dnl       http://www.apache.org/licenses/LICENSE-2.0
dnl
dnl   Unless required by applicable law or agreed to in writing, software
dnl   distributed under the License is distributed on an "AS IS" BASIS,
dnl   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
dnl   See the License for the specific language governing permissions and
dnl   limitations under the License.
dnl

AC_PREREQ(2.60)

define([VERSION_MAJOR], [1])
define([VERSION_MINOR], [9])
define([VERSION_FIX], [4])
define([VERSION_NUMBER], VERSION_MAJOR[.]VERSION_MINOR[.]VERSION_FIX)
define([VERSION_RELEASE], [0])

AC_INIT([ovirt-web-ui], VERSION_NUMBER, [gshereme@redhat.com])
PACKAGE_RPM_VERSION="VERSION_NUMBER"
PACKAGE_RPM_RELEASE="VERSION_RELEASE"
AC_SUBST([PACKAGE_RPM_VERSION])
AC_SUBST([PACKAGE_RPM_RELEASE])

AM_INIT_AUTOMAKE([-Wall -Werror foreign -Wno-portability tar-pax])

AC_ARG_VAR([RPMBUILD], [path to rpmbuild utility])
AC_CHECK_PROGS([RPMBUILD], [rpmbuild])

dnl TODO: Fail if rpmbuild is not present

PACKAGE_RPM_SUFFIX=${PACKAGE_RPM_SUFFIX:-"%{?release_suffix}"}
AC_ARG_VAR([PACKAGE_RPM_SUFFIX], [suffix to use on the rpm's release string])

AC_CONFIG_FILES([
	Makefile
	ovirt-web-ui.spec
	src/version.js
])

AC_OUTPUT
