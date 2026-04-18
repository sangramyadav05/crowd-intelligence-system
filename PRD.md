# PRD

## Project idea

The CrowdIntel project started with a simple goal: make crowd management easier during events by giving organizers and ground staff a live view of what is happening inside the venue.

The main discussion before development was not about building a huge system at once.  
It was about solving the most useful problems first:

- seeing crowd pressure in real time
- identifying risky zones early
- giving staff a clear way to respond
- sharing safe public information without confusion

## Main goals discussed before development

- show a live crowd density view of the venue
- raise alerts when a zone becomes too crowded
- support role-based access for admins and staff
- allow live updates instead of manual page refreshes
- add prediction support so bottlenecks can be noticed earlier

## Users we had in mind

- `Event organizers / admins`
  They need a full event view, control over settings, and quick emergency actions.

- `Ground staff / coordinators`
  They need simple access, clear incident flow, and direct visibility into what is happening on the ground.

- `Public users`
  They need a safe and easy public view, not the full internal dashboard.

## Planned core features

- real-time event and zone monitoring
- alerts for critical zones
- live data updates using sockets
- secure login and role-based access
- AI-supported predictions and recommendations
- a responsive interface that also works well on smaller screens

## Early technical direction

The original stack discussion focused on:

- React and Vite for the frontend
- Node.js and Express for the backend
- MongoDB for storing events, users, and crowd data
- Socket.IO for live updates
- JWT authentication for secure access

## Future scope discussed early

- CCTV or camera-based crowd detection
- stronger AI behavior analysis
- more advanced route planning and live signage support

In short, the PRD stage was about building a practical crowd intelligence system first, then leaving room for deeper surveillance and automation later.
