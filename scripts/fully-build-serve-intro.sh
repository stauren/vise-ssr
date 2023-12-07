#!/bin/bash

# build vise packages
bash ./scripts/build-vise-pkgs.sh

# build vise intro Vue3 & React app
pnpm -F "./playground/*" run build

# deploy apps to express server bundles dir
bash ./scripts/deploy-to-express-server.sh

# start express server
(cd ./packages/express-server && ./bin/vise-express.js start -b ./bundles)
