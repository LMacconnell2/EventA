import {
  db,
  testDatabaseConnection,
  closeDatabaseConnection,
} from "./db.js";

async function resetDatabase(): Promise<void> {
  await testDatabaseConnection();

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    console.log("Dropping public schema...");

    await client.query(`
      DROP SCHEMA IF EXISTS public CASCADE;
    `);

    console.log("Recreating public schema...");

    await client.query(`
      CREATE SCHEMA public AUTHORIZATION CURRENT_USER;
    `);

    console.log("Restoring default permissions...");

    await client.query(`
      GRANT ALL ON SCHEMA public TO CURRENT_USER;
      GRANT USAGE ON SCHEMA public TO public;
    `);

    await client.query("COMMIT");

    console.log("Database reset complete.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

resetDatabase()
  .catch((error: unknown) => {
    console.error("Database reset failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabaseConnection();
  });