#!/bin/bash

# build vise tools packages
bundleBase='./packages/express-server/bundles'
vueDestination="${bundleBase}/vue3-intro"
reactDestination="${bundleBase}/react-intro"
mkdir -p $bundleBase
rm -rf $vueDestination $reactDestination

cp -r ./playground/app-vue3-intro/dist $vueDestination
(cd $vueDestination && ln -s ../../../../playground/app-vue3-intro/node_modules ./node_modules)
cp -r ./playground/app-react-intro/dist $reactDestination
(cd $reactDestination && ln -s ../../../../playground/app-react-intro/node_modules ./node_modules)
