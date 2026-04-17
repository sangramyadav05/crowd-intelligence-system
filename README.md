# Crowd Intelligence System

Crowd Intelligence System is a unified full-stack platform for monitoring, analyzing, and managing crowd activity across large venues and events. It is structured as one cohesive product with a React frontend and Express backend prepared for real-time data flow and future prediction modules.

## Problem Statement

Managing crowds at large events is difficult because organizers often lack timely visibility into where congestion is forming and how movement patterns are changing. This can lead to overcrowding, delayed responses, safety risks, and poor use of available space.

Without a connected system for live monitoring and operational feedback, teams struggle to respond early, redirect people safely, and plan ahead for crowd surges before they become incidents.

## Features

- Real-time crowd density monitoring
- Predictive analysis for near-term crowd movement
- Alert system for congestion and overcrowding
- Visualization dashboard for operators
- Smart crowd management and redirection support

## Tech Stack

- Frontend: React + Tailwind CSS
- Backend: Node.js + Express
- Database: MongoDB (planned)
- Real-time: Socket.IO (planned)

## Architecture Overview

The system is organized as a single product with two coordinated layers:

- `frontend/` provides the dashboard UI and is prepared to consume backend APIs.
- `backend/` provides the API layer and simulated crowd data endpoints.

The frontend is already wired to request crowd data from `http://localhost:5000/api/crowd`, which establishes the base integration pattern for future live streams, alerts, and prediction services.

## Project Structure

```text
crowd-intelligence-system/
|-- frontend/
|-- backend/
|-- docs/
|   `-- architecture.md
|-- package.json
|-- README.md
`-- .gitignore
```

## Development

Install dependencies in the root, frontend, and backend as already configured, then run the full system from the root:

```powershell
npm run dev
```

Useful scripts:

- `npm run dev` starts frontend and backend together
- `npm run client` starts the React frontend
- `npm run server` starts the Express backend
- `npm run build` builds the frontend for production

## Hackathon Note

This project is being built from scratch during a 24-hour hackathon with continuous commits.
