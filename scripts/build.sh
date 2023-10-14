#!/bin/bash

pnpm --filter "*$1*" run build
