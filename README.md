# Passkeys POC Project

This project is a Proof of Concept (POC) demonstrating the use of Passkeys for authentication.
It comprises a client-side application (built with Next.js/React) and a backend API (built with NestJS).

## Prerequisites

Before running this project, ensure you have the following installed:

*   Node.js (LTS version recommended)
*   npm or yarn
*   Git

## Getting Started

Follow these steps to get the project up and running on your local machine.

### 1. Clone the Repository

```bash
git clone <repository-url>
cd passkeys-poc
```

### 2. Environment Variables

Create a `.env` file in both the `client` and `server-with-db` directories based on the provided `.env.example` files

### 3. Database Setup (Neon)

This project uses PostgreSQL as its database, hosted on [Neon](https://neon.tech/).

1.  **Create a Neon Account:** If you don't have one, sign up at [Neon](https://neon.tech/).
2.  **Create a New Project:** In your Neon dashboard, create a new project.
3.  **Obtain Database Connection String:** Navigate to the "Connection Details" section of your project. Copy the PostgreSQL connection string. It will look something like `postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require`.
4.  **Update `.env`:** Paste this connection string into your `server-with-db/.env` file as the `DATABASE_URL`.

#### Running Migrations

Navigate to the `server-with-db` directory and install dependencies, then run Prisma migrations to set up your database schema:

```bash
cd server-with-db
npm install # or yarn install
npx prisma migrate dev --name init # Or a more descriptive name if you have existing migrations
```

### 4. Redis DB Setup (Upstash)

This project uses Redis for caching/session management, hosted on [Upstash](https://upstash.com/).

1.  **Create an Upstash Account:** If you don't have one, sign up at [Upstash](https://upstash.com/).
2.  **Create a New Database:** In your Upstash console, create a new Redis database.
3.  **Obtain Connection Details:** After creation, you will get a `REDIS_URL`, `REDIS_TOKEN` and `REDIS_PROTOCOL` looks like `redis://[name]:[pwd]@[url]:[port]`.
4.  **Update `.env`:** Add these values to your `server-with-db/.env` file.

### 5. Resend Setup

This project uses [Resend](https://resend.com/) for sending emails.

1.  **Create a Resend Account:** If you don't have one, sign up at [Resend](https://resend.com/).
2.  **Obtain API Key:** After creating your account and verifying your domain, generate an API Key from your Resend dashboard.
3.  **Update `.env`:** Add this API Key to your `server-with-db/.env` file as `RESEND_API_KEY`.

### 6. Run the Backend

Navigate to the `server-with-db` directory and start the NestJS backend:

```bash
cd server-with-db
npm run start:dev # or yarn start:dev
```

The backend should now be running, typically on `http://localhost:3001` (or the `PORT` you configured).

### 7. Run the Frontend

Navigate to the `client` directory and start the Next.js frontend:

```bash
cd client
npm install # or yarn install
npm run dev # or yarn dev
```

The frontend should now be running, typically on `http://localhost:3000`.

