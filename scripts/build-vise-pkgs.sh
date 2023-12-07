#!/bin/bash

# build vise tools packages
pnpm -F "@vise-ssr/shared" run build
pnpm -F "./packages/*" -F "!@vise-ssr/shared" run build
