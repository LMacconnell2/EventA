#!/bin/sh
set -e

echo "Starting API"
exec node dist/server.js

echo "Done."