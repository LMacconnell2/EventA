# EventA - Event Management Platform

EventA is a full-stack event management and ticketing platform built
with React, Fastify, PostgreSQL, and Better Auth.

## Features

-   Event creation and management
-   Venues, organizers, sponsors, and categories
-   Ticket management
-   Attendee management
-   QR code ticket generation
-   Camera-based attendee check-in
-   Manual ticket code check-in
-   Check-out / check-in reversal
-   Role-based permissions
-   User profiles and settings
-   Dashboard and analytics (in progress)

## Technology Stack

### Frontend

-   React
-   TypeScript
-   Vite
-   TanStack Router
-   TanStack Query
-   Lucide React

### Backend

-   Fastify
-   TypeScript
-   PostgreSQL
-   Better Auth
-   Node.js

## Project Structure

``` text
etp-client/
    React frontend

etp-api/
    Fastify REST API

database/
    PostgreSQL schema and migrations
```

## Prerequisites

-   Node.js 20+
-   PostgreSQL
-   pnpm
-   Git

## Installation

``` bash
pnpm install
```

Start the frontend:

``` bash
pnpm dev
```

Start the API:

``` bash
pnpm dev
```

## Environment Variables

### API (.env)

``` env
DATABASE_URL=postgres://postgres:password@localhost:5432/eventa
CLIENT_URL=http://localhost:5173
API_URL=http://localhost:3000

BETTER_AUTH_SECRET=replace_with_long_random_secret
BETTER_AUTH_URL=http://localhost:3000
```

### Client (.env)

``` env
VITE_API_URL=http://localhost:3000
```

## Authentication

Authentication is provided by Better Auth.

Users authenticate through the Better Auth tables while
application-specific user information is stored in the `users` table. A
database hook automatically provisions a corresponding application user
when a new account is created.

## QR Check-In

Each attendee receives a unique ticket code.

Staff can:

-   Scan QR codes using a device camera.
-   Enter ticket codes manually.
-   Check attendees in.
-   Reverse erroneous check-ins.

Every check-in creates a historical record for auditing.

## Development Notes

Current implementation includes:

-   Better Auth authentication
-   Permission-based authorization
-   Event CRUD
-   Ticket CRUD
-   Sponsor management
-   Attendee management
-   QR generation
-   QR scanning
-   Check-in history

Future work includes:

-   Email notifications
-   Mobile-first staff interface
-   Public User Dashboard

## License

This project is intended for personal development by its author. (Logan MacConnell)