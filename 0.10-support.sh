#!/usr/bin/env bash
NODE_VERSION="$(node -v)"

if [[ $NODE_VERSION == v0.1* ]];
then
    echo "Upgradeing NPM..."
    npm -g install npm@latest-2
    echo "Downgrading bcrypt for Node < 4..."
    npm install bcrypt@0.7.8 --save;
fi