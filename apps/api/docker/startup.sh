#!/bin/sh
set -e

cd /app

echo "Running Better Auth migration..."
node dist/database/migrations/runBetterAuthMigrations.js

echo "Setting up database..."
node dist/database/setup.js

echo "Seeding Database"
node dist/database/seed.js
node dist/database/seedUser.js

echo "Starting API"
exec node dist/server.js

echo "Done."