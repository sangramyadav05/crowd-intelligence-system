# Architecture Notes

## Overall shape

The project follows a simple split:

- `client` handles screens, navigation, and API calls
- `server` handles auth, business logic, database work, and realtime updates

It is not over-engineered, which is actually a good thing here.  
Most features are grouped by responsibility, so the project is still readable.

## Frontend side

The frontend is built with:

- React
- Vite
- Tailwind CSS
- Zustand
- Framer Motion

Main page groups include:

- landing and access pages
- user dashboard
- event details page
- admin dashboard
- staff dashboard
- public event view

The event details page is the main working screen for event-level operations.

## Backend side

The backend is built with:

- Express
- MongoDB with Mongoose
- Socket.IO

Main route groups:

- `auth.routes.js` for login and registration
- `event.routes.js` for event CRUD and event-level updates
- `crowd.routes.js` for crowd updates and simulation
- `ai.routes.js` for predictions and anomaly style outputs
- `public.routes.js` for public event lookup and public status
- `staff.routes.js` for coordinator actions
- `admin.routes.js` for admin controls
- `venue-plan.routes.js` for blueprint and zone plan data
- `surveillance.routes.js` and `get_zones.routes.js` for surveillance and simple live zone feeds

## Main data models

- `User`: app users, admins, and linked staff users
- `Event`: the core event record with zones and access codes
- `CrowdData`: crowd input history
- `Alert`: active warnings and safety signals
- `Prediction`: forecasted crowd states
- `SeatingLayout`: seating plan data
- `VenuePlan`: blueprint, zone geometry, and flow arrows
- `OperationUpdate`: action or feed style updates

## Realtime layer

The server uses Socket.IO namespaces and event rooms.

The main idea is:

- each event gets a shared room
- admin, public, and staff clients can join that room
- crowd changes, route updates, and notifications are pushed live

This is what makes the dashboards feel live instead of refresh-only.

## Venue blueprint flow

The venue blueprint flow now works like this:

1. a blueprint image is attached to an event
2. the image is stored in the venue plan
3. zone geometry is linked to that same venue plan
4. the surveillance page and the public view both read from the same saved source

That shared source is important because it keeps the public and internal heatmaps in sync.

## Current design choice

The project is using a practical architecture, not a heavy enterprise one.

That means:

- features are added as focused route and page modules
- the project is still easy to understand
- it is good for a college project, demo product, or strong prototype

If this ever grows further, the next natural step would be to separate the surveillance and prediction modules more formally, but for now the structure is clean enough and easy to maintain.
