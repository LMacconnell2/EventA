import { execSync } from "node:child_process";

try {
    console.log("Resetting database...");
    execSync("pnpm db:reset", { stdio: "inherit" });

    console.log("Resetting Auth...");
    execSync("npx @better-auth/cli migrate", { stdio: "inherit" });

    console.log("Creating tables...");
    execSync("pnpm db:setup", { stdio: "inherit" });

    console.log("Seeding database...");
    execSync("pnpm db:seed", { stdio: "inherit" });

    console.log("Seeding admin user...");
    execSync("pnpm db:seed-user", { stdio: "inherit" });

    console.log("Database rebuilt successfully.");
} catch (_error) {
    console.error("Database rebuild failed.");
    process.exit(1);
}