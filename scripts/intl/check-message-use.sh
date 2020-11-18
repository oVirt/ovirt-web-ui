#! /usr/bin/env bash
[[ -e package.json ]] || cd ../..

yarn intl:extract

keys_used=0
keys_enum=0
keys_unused=0

while read -ra intlKey; do
  grep -rq "msg.${intlKey}(" src/*
  if [[ $? -eq 0 ]]; then
    echo "Key \"${intlKey}\" is used!"
    (( keys_used++ ))

  elif [[ "${intlKey}" =~ ^enum_.*_.*$ ]]; then
    # account for enum_.* keys that are defined like "enum_enumId_enumType" and
    # used in code like "enumMsg('enumId', 'enumType')"
    echo "enum key -> \"${intlKey}\""
    (( keys_enum++ ))

  else
    echo "UNUSED KEY -> \"${intlKey}\""
    (( keys_unused++ ))

  fi
done < <( jq -r '.[] | .id' extra/to-zanata/messages.json )

echo ""
echo "Keys in use           : $keys_used"
echo "Keys part of 'enumMsg': $keys_enum"
echo "Keys NOT in use       : ${keys_unused}"
