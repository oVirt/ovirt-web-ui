#! /usr/bin/env bash
[[ -e package.json ]] || cd ../..

ZANATA_LOCALES=${ZANATA_LOCALES:-de,es,fr,it,ja,ko,pt-BR,zh-CN,cs}

mvn \
    at.porscheinformatik.zanata:zanata-maven-plugin:4.7.8:push \
    -Dzanata.pushType="source" \
    -Dzanata.locales="$ZANATA_LOCALES"
