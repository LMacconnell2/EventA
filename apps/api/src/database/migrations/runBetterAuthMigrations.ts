import { getMigrations } from "better-auth/db/migration";

import { auth } from "../../auth/auth.js";

async function runBetterAuthMigrations(): Promise<void> {
  console.log(
    "Checking Better Auth database migrations...",
  );

  const {
    toBeCreated,
    toBeAdded,
    runMigrations,
  } = await getMigrations(auth.options);

  console.log(
    `Better Auth tables to create: ${toBeCreated.length}`,
  );

  console.log(
    `Better Auth columns to add: ${toBeAdded.length}`,
  );

  if (
    toBeCreated.length === 0 &&
    toBeAdded.length === 0
  ) {
    console.log(
      "Better Auth schema is already up to date.",
    );

    return;
  }

  await runMigrations();

  console.log(
    "Better Auth migrations completed successfully.",
  );
}

try {
  await runBetterAuthMigrations();
} catch (error) {
  console.error(
    "Better Auth migrations failed:",
    error,
  );

  process.exitCode = 1;
}