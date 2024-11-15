#!/bin/bash
echo "ready to rock, hit the enter"
read

speak() {
  local text="$1"
  echo "$text"
  say "$text"
  read
}

speak "show me all assets"
speak "first category"
speak "show them on the map"
speak "run diagnostic test for all assets of the first category"
speak "run the test for the first one"
speak "run the same test for the first asset with airflow 500, energy usage 5 and temperature 85"
speak "show me the alarm for this asset"
speak "show me all inventory"
speak "find me in the inventory the spare part for this issue"
speak "create me a work order for this asset and put in the description what needs to be done"
speak "assign this work order to me"
speak "send me an email with all that info too"
exit 0