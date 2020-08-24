#! /usr/bin/env bash
[[ -e package.json ]] || cd ../..

JAVA_HOME=$(alternatives --list | grep 'jre_1.8.0[[:space:]]' | cut -f 3)

zanata-cli push \
    --errors \
    --push-type source \
    --locales de,es,fr,it,ja,ko,pt-BR,zh-CN,cs
