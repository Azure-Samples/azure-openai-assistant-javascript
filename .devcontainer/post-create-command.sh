#! /bin/bash

sudo apt update
npm i -g npm@latest fuzz-run

# Azure Functions core tools
npm i -g azure-functions-core-tools@4 --unsafe-perm true