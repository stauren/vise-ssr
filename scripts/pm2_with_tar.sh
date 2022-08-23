#!/bin/bash

yarn install --pure-lockfile
cd ./packages/express-server
../../node_modules/.bin/pm2 startOrRestart ./pm2.config.cjs
