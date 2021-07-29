#! /usr/bin/env bash
[[ -e package.json ]] || cd ../..
PATH=node_modules/.bin:$PATH

babel-node --presets @babel/env,@babel/flow scripts/intl/extract-messages.js

rip json2pot \
    'extra/to-zanata/messages.json' \
    -o 'extra/to-zanata/messages.pot'

rip json2pot \
    'extra/to-zanata/time-durations.json' \
    -o 'extra/to-zanata/time-durations.pot'
