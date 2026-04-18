# Architecture

## System design

CrowdIntel uses a simple full-stack architecture with two main parts:

- `client` for the user interface
- `server` for API logic, realtime updates, and database access

This split keeps the project easy to understand and easy to present.

## Frontend structure

The frontend is built with React and organized by responsibility:

- `pages/` contains the main screens like landing page, login, event dashboard, public view, coordinator portal, and admin dashboard
- `components/` contains reusable UI pieces and route guards
- `lib/` contains API and socket helpers
- `store/` contains auth state management

The most important working pages are:

- `LandingPage.jsx`
- `AccessPortal.jsx`
- `Login.jsx`
- `Register.jsx`
- `UserDashboard.jsx`
- `EventDetails.jsx`
- `PublicView.jsx`
- `StaffDashboard.jsx`
- `AdminDashboard.jsx`

`EventDetails.jsx` is the main operational page. It brings together surveillance, heatmap, seating, zones, predictions, alerts, geofence, and venue plan.

## Backend structure

The backend is built with Express and MongoDB. It is divided into:

- `routes/` for feature endpoints
- `models/` for MongoDB schemas
- `services/` for prediction, geofence, and surveillance logic
- `middleware/` for auth and role protection
- `utils/` and `config/` for support code

Main route groups:

- `auth.routes.js`
- `event.routes.js`
- `crowd.routes.js`
- `public.routes.js`
- `staff.routes.js`
- `admin.routes.js`
- `venue-plan.routes.js`
- `seating.routes.js`
- `operations.routes.js`
- `surveillance.routes.js`

## Core data models

Important models used in the system:

- `User` for crowd managers, admins, and coordinator-linked users
- `Event` for event details, zones, access codes, and coordinator mapping
- `CrowdData` for crowd history
- `Alert` for warning and critical signals
- `Prediction` for forecasted crowd states
- `SeatingLayout` for seat status and layouts
- `VenuePlan` for blueprint image, zone geometry, and flow arrows
- `OperationUpdate` for command and operations feed style updates
- `EventMessage` for public questions and coordinator answers

## Realtime design

Socket.IO is used to make the system feel live.

Namespaces:

- `/admin`
- `/public`
- `/staff`

Room design:

- each event joins an event room like `event-<eventId>`
- public users, coordinators, and admins can listen in the same event room
- live updates such as density changes, instructions, alerts, and answers are emitted into that room

## Venue heatmap design

The venue heatmap uses a shared source of truth:

1. the crowd manager uploads a venue blueprint
2. the blueprint is stored in `VenuePlan`
3. the same `VenuePlan` is used by surveillance view
4. the same `VenuePlan` is used by public view

This keeps both internal and public heatmaps consistent.

## Workflow

### Crowd manager workflow

1. Register or log in
2. Create an event
3. Add zones and capacities
4. Upload the venue blueprint
5. Monitor the event dashboard
6. Watch alerts, surveillance, predictions, seating, and zone status

### Coordinator workflow

1. Log in with event-specific coordinator ID
2. Open coordinator portal
3. Receive public questions
4. Report incidents
5. Send answers back to public live feed

### Public workflow

1. Enter the public access code
2. Open public crowd view
3. See zone status and heatmap
4. Ask a question
5. Receive coordinator answers in the live feed

## Why this design works

The current design is strong because it is practical:

- simple enough to explain clearly
- modular enough to extend later
- realtime enough to feel like a working system
- visual enough to show the venue condition directly

It is not overly complex, and that is actually a strength for a project like this.
