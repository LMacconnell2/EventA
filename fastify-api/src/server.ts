import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyRawBody from "fastify-raw-body";

import { auth } from "./auth/auth.js";
import { db, testDatabaseConnection, closeDatabaseConnection } from "./database/db.js";

import userRoutes from "./routes/userRoutes/userRoutes.js";
import settingsRoutes from "./routes/settingsRoutes/settingsRoutes.js";
import lookupRoutes from "./routes/lookupRoutes/lookupRoutes.js";
import venueRoutes from "./routes/venueRoutes/venueRoutes.js";
import eventRoutes from "./routes/eventRoutes/eventRoutes.js";
import publicEventRoutes from "./routes/eventRoutes/publicEvent.routes.js";
import tagRoutes from "./routes/utilRoutes/tagRoutes.js";
import sponsorRoutes from "./routes/sponsorRoutes/sponsorRoutes.js";
import eventSponsorRoutes from "./routes/sponsorRoutes/eventSponsorRoutes.js";
import sponsorTierRoutes from "./routes/sponsorRoutes/sponsorTierRoutes.js";
import ticketRoutes from "./routes/ticketRoutes/ticket.routes.js";
import publicTicketRoutes from "./routes/ticketRoutes/public-ticket.routes.js";
import attendeeRoutes from "./routes/attendeeRoutes/attendeeRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes/dashboardRoutes.js";
import commerceRoutes from "./routes/commerceRoutes/commerceRoutes.js";

const app = Fastify({
  logger: true,
});

app.decorateRequest("appUser", null);

async function addDependencies() {
  await app.register(cookie);

  await app.register(cors, {
    origin: "http://localhost:5173",
    credentials: true,
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "Idempotency-Key",
      ],
      methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
      ],
    });
}

app.get("/", async () => {
  return {
    message: "Fastify API is running",
  };
});

app.get("/test-db", async () => {
  const result = await db.query("SELECT NOW()");

  return {
    success: true,
    time: result.rows[0],
  };
});


app.all("/api/auth/*", async (request, reply) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  const headers = new Headers();

  for (const [key, value] of Object.entries(request.headers)) {
    if (value !== undefined) {
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
  }

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : JSON.stringify(request.body ?? {});

  const authRequest = new Request(url.toString(), {
    method: request.method,
    headers,
    body,
  });

  const response = await auth.handler(authRequest);

  reply.status(response.status);

  response.headers.forEach((value, key) => {
    reply.header(key, value);
  });

  return reply.send(response.body);
});

const start = async () => {
  try {
    await addDependencies();

    await app.register(multipart, {
      attachFieldsToBody: false,
    });

    await app.register(fastifyRawBody, {
      field: "rawBody",
      global: false,
      encoding: false,
      runFirst: true,
    });

    await app.register(userRoutes, {
      prefix: "/api/users",
    });

    await app.register(settingsRoutes, {
      prefix: "/api/settings",
    });

    await app.register(lookupRoutes, {
      prefix: "/api/lookups",
    });

    await app.register(venueRoutes, {
    });

    await app.register(eventRoutes, {
      prefix: "/api/events",
    });

    await app.register(publicEventRoutes, {
      prefix: "/api/public-events",
    });
    
    await app.register(tagRoutes, {
      prefix: "/api/tags",
    });

    await app.register(sponsorRoutes, {
    });

    await app.register(eventSponsorRoutes, {
    });

    await app.register(sponsorTierRoutes, {
    });

    await app.register(ticketRoutes, {
    });

    await app.register(publicTicketRoutes, {
      prefix: "/api/public",
    });

    await app.register(attendeeRoutes, {
    });

    await app.register(dashboardRoutes, {
    });

    await app.register(commerceRoutes, {
    });

    await testDatabaseConnection();

    await app.listen({
      port: 3000,
      host: "0.0.0.0",
    });

    console.log("Server running on port 3000");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

process.on("SIGINT", async () => {
  await closeDatabaseConnection();
  await app.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeDatabaseConnection();
  await app.close();
  process.exit(0);
});

start();