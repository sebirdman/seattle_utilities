# seattle_utilities


A set of utilities with the end goal of liberating seattle utility data for consumption and eventually getting data into homeassistant

currently only does power consumption and has only been tested on one user login with one account. the code is bad.

# Building

yarn install
yarn run tsc

# running

node build/index.js "USERNAME" "PASSWORD"

will currently send an mqtt message at the end if you've got a home assistant platform setup with some bogus credentials