import { betterAuth } from "better-auth";
import { Pool } from "pg";
import "dotenv/config";
import { db } from "../database/db";
import { admin } from "better-auth/plugins";

function extractFirstName(name?: string | null): string {
  const parts = name?.trim().split(/\s+/) ?? [];

  return parts[0] || "User";
}

function extractLastName(name?: string | null): string {
  const parts = name?.trim().split(/\s+/) ?? [];

  return parts.slice(1).join(" ") || "";
}

function createUsername(
  name: string | null | undefined,
  email: string,
): string {
  const nameBasedUsername = name
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");

  if (nameBasedUsername) {
    return nameBasedUsername;
  }

  return email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined.");
}

export const auth = betterAuth({
  database: new Pool({
    connectionString: DATABASE_URL,
  }),

  user: {
    modelName: "auth",
    changeEmail: {
      enabled: true,
      autoSignIn: false,
    },
  },

  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },

  plugins: [
    admin(),
  ],

  trustedOrigins: [
    "http://localhost:5173",
    "http://localhost:3000",
  ],

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const fallbackUsername = createUsername(
            user.name,
            user.email,
          );

          await db.query(
            `
              INSERT INTO users (
                auth_id,
                username,
                email,
                fname,
                lname,
                status_id,
                created_at,
                updated_at
              )
              VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                NOW(),
                NOW()
              )
              ON CONFLICT (auth_id) DO NOTHING;
            `,
            [
              user.id,
              fallbackUsername,
              user.email,
              extractFirstName(user.name),
              extractLastName(user.name),
              1,
            ],
          );
        },
      },
    },
  },
});