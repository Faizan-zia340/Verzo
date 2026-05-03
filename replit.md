# Project Overview

Node.js web application with a React frontend and Express backend, using Drizzle ORM for PostgreSQL access and Tailwind CSS for styling.

## Architecture

- **Frontend**: React 18 + Vite (port 5000), React Router v6, Tailwind CSS
- **Backend**: Express (port 3001), proxied via Vite's `/api` proxy
- **Database**: PostgreSQL via Drizzle ORM (`pg` driver)
- **Styling**: Tailwind CSS v3 with PostCSS + Autoprefixer

## Project Structure

```
├── index.html               # HTML entry point
├── vite.config.js           # Vite config (port 5000, /api proxy to :3001)
├── tailwind.config.js       # Tailwind config
├── postcss.config.js        # PostCSS config
├── drizzle.config.js        # Drizzle Kit config (schema, migrations)
├── .env.example             # Example environment variables
├── src/
│   ├── main.jsx             # React entry point
│   ├── index.css            # Tailwind directives
│   ├── App.jsx              # Root component with router
│   └── pages/
│       └── Home.jsx         # Home page
└── server/
    ├── index.js             # Express server (port 3001)
    ├── db/
    │   ├── index.js         # Drizzle db instance (pg Pool)
    │   └── schema.js        # Drizzle table definitions
    └── routes/
        └── users.js         # Example CRUD routes for /api/users
```

## Environment Variables

| Variable       | Description                         |
|----------------|-------------------------------------|
| `DATABASE_URL` | PostgreSQL connection string        |
| `PORT`         | Express server port (default 3001)  |

## Workflows

- **Start application**: `npm run dev` — starts the Vite dev server on port 5000

## Scripts

| Script         | Description                          |
|----------------|--------------------------------------|
| `npm run dev`  | Start Vite frontend dev server       |
| `npm start`    | Start Express backend server         |
| `npm run db:push` | Push schema changes to the DB    |
| `npm run db:studio` | Open Drizzle Studio UI         |

## Database

Schema is defined in `server/db/schema.js`. Run `npm run db:push` after setting `DATABASE_URL` to apply the schema.
