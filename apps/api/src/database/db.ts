import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not defined in environment variables.");
}

export const db = new Pool({
    connectionString,
});

export async function testDatabaseConnection() {
    const client = await db.connect();

    try {
        await client.query("SELECT NOW();");
        console.log("Database connection successful.");
    } finally {
        client.release();
    }
}

export async function closeDatabaseConnection() {
    await db.end();
}