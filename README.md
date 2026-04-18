# CrowdIntel

CrowdIntel is a crowd monitoring and crowd management project for events and venues.  
It helps organizers create events, divide them into zones, watch live crowd movement, predict possible crowd pressure, and share safer public guidance.

## What this project can do

- create and manage events
- define zones with capacities
- show live zone status
- generate crowd alerts and simple AI-style predictions
- give coordinators event-specific access
- give the public a separate event code for live status
- show venue blueprints as heatmaps in both surveillance and public view

## Tech used

### Frontend

- React
- Vite
- Tailwind CSS
- Framer Motion

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- Socket.IO

## Quick start

### 1. Install dependencies

```bash
npm run install-all
```

### 2. Add environment files

Inside `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/crowd_intelligence
JWT_SECRET=your-secret
ADMIN_EMAIL=admin@crowdintelligence.com
ADMIN_PASSWORD=admin12345
NODE_ENV=development
```

Inside `client/.env`:

```env
VITE_API_URL=http://localhost:5002/api
VITE_SOCKET_URL=http://localhost:5002
```

Important: make sure the client points to the same backend port you are actually running.

### 3. Start MongoDB

Run MongoDB locally, or use an Atlas connection string in the server env.

### 4. Run the app

```bash
npm run dev
```

You can also run the client and server separately from their own folders if needed.

## Default access

- Admin login comes from the seeded setup in the server
- Crowd managers register from the app
- Coordinators log in with the coordinator ID generated for each event
- Public users use the public event code

## Project structure

- `client/` contains the frontend
- `server/` contains the API, database logic, and realtime updates
- `docs/` contains short project notes and architecture notes

## Extra notes

This project is now more than a basic demo. It includes event-based access flow, blueprint-backed heatmaps, public view syncing, and real-time room updates across admin, staff, and public clients.

It is still a practical prototype, not a full production surveillance platform, but the current version is solid and usable as a complete project.

## Docs

- [Project Documentation](docs/PROJECT_DOCUMENTATION.md)
- [Setup Notes](docs/SETUP_NOTES.md)
- [Architecture Notes](docs/ARCHITECTURE_NOTES.md)
