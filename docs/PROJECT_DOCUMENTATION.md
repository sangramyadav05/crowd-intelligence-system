# Project Documentation

## What this project is

CrowdIntel is a crowd monitoring and crowd management web app for events and venues.  
The idea is simple: create an event, divide it into zones, watch the crowd live, predict possible surges early, and guide both staff and the public with clearer information.

What started as a basic event dashboard has now grown into a more complete working system with:

- event creation and event dashboards
- zone-based crowd tracking
- AI-style prediction and anomaly checks
- alerts for crowd pressure
- public access view through an event code
- coordinator access through an event-specific coordinator ID
- venue blueprint based heatmap view
- seating and venue-plan support
- admin level monitoring and emergency controls

## Main user roles

- `Crowd Manager`: creates events, manages zones, uploads venue blueprint, and watches the full event dashboard
- `Coordinator`: logs in with the coordinator ID for a specific event and helps handle operations on the ground
- `Admin`: sees the wider system view and can send commands or trigger emergency actions
- `Public User`: uses the public event code to see live crowd guidance

## What is working in the current version

- event-based access flow is cleaned up and tied to each event
- public view and surveillance view both use the same saved venue blueprint
- live zone status can be seen in a simple and readable way
- blueprint heatmap is available for both internal and public view
- crowd alerts and predictions are shown in the event flow
- sockets are used for real-time updates

## Honest note about the current state

This version is much stronger than an early demo, but it is still not a full real-world surveillance product yet.

For example:

- the surveillance layer is still demo-oriented, not real camera ingestion
- AI prediction and anomaly logic are present, but they are lighter than a full production model
- zone placement can still be improved further with manual map editing

Still, as a project, it now feels like a proper end-to-end crowd intelligence system rather than only a concept screen.
