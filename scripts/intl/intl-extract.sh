#! /usr/bin/env bash
[[ -e package.json ]] || cd ../..
PATH=node_modules/.bin:$PATH

babel-node scripts/intl/extract-messages.js --presets env,flow

rip json2pot \
    'extra/to-zanata/messages.json' \
    -o 'extra/to-zanata/messages.pot'

rip json2pot \
    'extra/to-zanata/time-durations.json' \
    -o 'extra/to-zanata/time-durations.pot'
