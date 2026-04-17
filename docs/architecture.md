# Crowd Intelligence System Architecture

## System Architecture Diagram

```text
+-----------------------+
|      Frontend         |
| React Dashboard UI    |
+-----------+-----------+
            |
            v
+-----------------------+
|       Backend         |
| Express API Layer     |
| Socket.IO Ready       |
+-----------+-----------+
            |
            v
+-----------------------+
|   Data / Services     |
| Simulation / Storage  |
| Prediction Modules    |
+-----------------------+
```

## High-Level Overview

Crowd Intelligence System is designed as one integrated product with a dedicated UI layer and API layer. The frontend handles operator-facing dashboards and visual states, while the backend manages data generation, business endpoints, and future real-time communication channels.

This structure keeps the codebase modular without making it feel like two disconnected projects.

## Data Flow

Frontend -> Backend -> Data -> Frontend

- The frontend requests crowd data from backend endpoints.
- The backend simulates or processes crowd data and returns structured responses.
- The frontend renders the data in the dashboard and will later react to live updates.

## Current Integration

- Frontend API target: `http://localhost:5000/api/crowd`
- Backend API route: `GET /api/crowd`
- Unified root scripts coordinate both services from a single repository root

## Planned Modules

- Simulation engine
- Density estimation
- Alert system
- Prediction engine
