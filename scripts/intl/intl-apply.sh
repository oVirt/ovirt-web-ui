#! /usr/bin/env bash
[[ -e package.json ]] || cd ../..
PATH=node_modules/.bin:$PATH

rip po2json \
    'extra/from-zanata/messages/*.po' \
    -m 'extra/to-zanata/messages.json' \
    -o 'extra/from-zanata/translated-messages.json'

rip po2json \
    'extra/from-zanata/time-durations/*.po' \
    -m 'extra/to-zanata/time-durations.json' \
    -o 'extra/from-zanata/translated-time-durations.json'

babel-node scripts/intl/normalize-messages.js --presets env,flow
