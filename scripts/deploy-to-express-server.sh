#!/bin/bash

# build vise tools packages
bundleBase='./packages/express-server/bundles'
vueDestination="${bundleBase}/vue3-intro"
reactDestination="${bundleBase}/react-intro"
mkdir -p $bundleBase
rm -rf $vueDestination $reactDestination
cp -r ./packages/app-vue3-intro/dist $vueDestination
cp -r ./packages/app-react-intro/dist $reactDestination
