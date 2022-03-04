#!/bin/bash
set -ev

# Environment variables.
NODE_ENV=${NODE_ENV:-development}

pushd `dirname $0`
docker-compose down
popd
