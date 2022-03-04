#!/bin/bash
set -ev

# Environment variables.
NODE_ENV=${NODE_ENV:-development}
pushd $(dirname $0)

# Get external IP of localhost
if ! command -v ifconfig &> /dev/null
then
    IP=$(ip addr | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' -m1)
else
    IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' -m1)
fi


echo $IP
echo "EXTERNAL_HOST=$IP" >>.env

# Start the services and wait for it.
docker-compose up -d --build

popd
