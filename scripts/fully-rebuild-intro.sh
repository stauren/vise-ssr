#!/bin/bash

# build vise tools packages
npm run build -w=packages/shared
npm run build -w=packages/vue3
npm run build -w=packages/react
npm run build -w=packages/core
npm run build -w=packages/express-server

# build vise intro Vue3 & react app
npm run build -w=packages/app-vue3-intro
npm run build -w=packages/app-react-intro

# deploy apps to express server bundles dir
bash ./scripts/deploy-to-express-server.sh

# start express server
(cd ./packages/express-server && ./bin/vise-express.js start -b ./bundles)
