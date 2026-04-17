from functools import wraps

from flask import abort, flash, jsonify, redirect, session, url_for

from .db import get_db_connection


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if "user_id" not in session:
            flash("Please log in to continue.", "warning")
            return redirect(url_for("auth.login"))
        return view(*args, **kwargs)

    return wrapped


def login_required_json(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Unauthorized"}), 401
        return view(*args, **kwargs)

    return wrapped


def get_event_for_user(connection, event_id, organizer_email):
    event = connection.execute(
        """
        SELECT id, name, event_code, organizer_email
        FROM events
        WHERE id = ? AND organizer_email = ?
        """,
        (event_id, organizer_email),
    ).fetchone()

    if not event:
        abort(404)

    return event


def get_zone_for_event(connection, zone_id, event_id):
    zone = connection.execute(
        """
        SELECT id, event_id, zone_name, capacity, current_count
        FROM zones
        WHERE id = ? AND event_id = ?
        """,
        (zone_id, event_id),
    ).fetchone()

    if not zone:
        abort(404)

    return zone


def fetch_dashboard_metrics(organizer_email):
    with get_db_connection() as connection:
        metrics = connection.execute(
            """
            SELECT
                COUNT(DISTINCT events.id) AS total_events,
                COUNT(zones.id) AS total_zones,
                SUM(CASE WHEN zones.current_count > zones.capacity THEN 1 ELSE 0 END) AS overcrowded_zones,
                SUM(
                    CASE
                        WHEN zones.current_count > zones.capacity * 0.7
                        AND zones.current_count <= zones.capacity
                        THEN 1
                        ELSE 0
                    END
                ) AS busy_zones
            FROM events
            LEFT JOIN zones ON zones.event_id = events.id
            WHERE events.organizer_email = ?
            """,
            (organizer_email,),
        ).fetchone()

    return {
        "total_events": metrics["total_events"] or 0,
        "total_zones": metrics["total_zones"] or 0,
        "overcrowded_zones": metrics["overcrowded_zones"] or 0,
        "busy_zones": metrics["busy_zones"] or 0,
    }


def get_organizer_status(current_count, capacity):
    if current_count > capacity:
        return {"label": "Overcrowded", "color": "red"}
    if capacity and current_count > capacity * 0.7:
        return {"label": "Getting crowded", "color": "orange"}
    return {"label": "Safe", "color": "green"}


def get_public_status(current_count, capacity):
    if current_count > capacity:
        return {"label": "Avoid", "color": "red"}
    if capacity and current_count > capacity * 0.7:
        return {"label": "Busy", "color": "orange"}
    return {"label": "Safe", "color": "green"}


def serialize_zones(zones):
    serialized = []

    for zone in zones:
        organizer_status = get_organizer_status(zone["current_count"], zone["capacity"])
        public_status = get_public_status(zone["current_count"], zone["capacity"])
        occupancy = 0

        if zone["capacity"] > 0:
            occupancy = round((zone["current_count"] / zone["capacity"]) * 100)

        serialized.append(
            {
                "id": zone["id"],
                "zone_name": zone["zone_name"],
                "capacity": zone["capacity"],
                "current_count": zone["current_count"],
                "occupancy_percent": max(0, occupancy),
                "organizer_alert": organizer_status["label"],
                "organizer_color": organizer_status["color"],
                "public_status": public_status["label"],
                "public_color": public_status["color"],
            }
        )

    return serialized
