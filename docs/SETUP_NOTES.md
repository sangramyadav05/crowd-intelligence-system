# Setup Notes

## Before you run it

Make sure these are available on the machine:

- Node.js
- MongoDB
- npm

## Project structure

The project is split into two main parts:

- `client/` for the React frontend
- `server/` for the Express and MongoDB backend

## Install

From the root folder:

```bash
npm run install-all
```

This installs root, server, and client dependencies.

## Environment setup

### Server

Create a `.env` file inside `server/`.

Typical values:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/crowd_intelligence
JWT_SECRET=your-secret
ADMIN_EMAIL=admin@crowdintelligence.com
ADMIN_PASSWORD=admin12345
NODE_ENV=development
```

### Client

Create a `.env` file inside `client/`.

Example:

```env
VITE_API_URL=http://localhost:5002/api
VITE_SOCKET_URL=http://localhost:5002
```

Important:

- the client API URL should point to the backend port you are actually using
- if the backend port changes, update the client env too

## Run the project

To run both sides together from the root:

```bash
npm run dev
```

Or run them separately:

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

## First run notes

- the server seeds a default admin user on startup
- it also seeds a default demo event if the database is empty
- MongoDB must be running before the server starts

## Useful checks

Frontend production build:

```bash
cd client
npm run build
```

Server syntax check:

```bash
node --check server/index.js
```

## Common issues

- If the client loads but API calls fail, the frontend `.env` is usually pointing to the wrong backend port.
- If the server does not start, the configured port may already be in use.
- If login works but live event data looks empty, check whether MongoDB is running and the seeded setup finished properly.
