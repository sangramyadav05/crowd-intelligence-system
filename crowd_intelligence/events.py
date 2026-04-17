from flask import Blueprint, abort, flash, jsonify, redirect, render_template, request, session, url_for

from .db import get_db_connection
from .helpers import (
    fetch_dashboard_metrics,
    get_event_for_user,
    get_zone_for_event,
    login_required,
    login_required_json,
    serialize_zones,
)
from .simulation import (
    create_unique_event_code,
    get_zones_for_event,
    reset_event_counts,
    trigger_event_surge,
    update_zone_counts,
)


events_bp = Blueprint("events", __name__)


def _parse_capacity(value):
    try:
        capacity = int(value)
    except ValueError:
        return None, "Capacity must be a number."

    if capacity <= 0:
        return None, "Capacity must be greater than zero."

    return capacity, None


def _zone_name_exists(connection, event_id, zone_name, excluded_zone_id=None):
    query = """
        SELECT id
        FROM zones
        WHERE event_id = ? AND LOWER(zone_name) = LOWER(?)
    """
    params = [event_id, zone_name]

    if excluded_zone_id is not None:
        query += " AND id != ?"
        params.append(excluded_zone_id)

    return connection.execute(query, params).fetchone() is not None


@events_bp.route("/dashboard")
@login_required
def dashboard():
    with get_db_connection() as connection:
        events = connection.execute(
            """
            SELECT id, name, event_code
            FROM events
            WHERE organizer_email = ?
            ORDER BY id DESC
            """,
            (session["user_email"],),
        ).fetchall()

    return render_template(
        "dashboard.html",
        user_email=session["user_email"],
        events=events,
        metrics=fetch_dashboard_metrics(session["user_email"]),
    )


@events_bp.route("/create_event", methods=["GET", "POST"])
@login_required
def create_event():
    if request.method == "POST":
        event_name = request.form.get("name", "").strip()

        if not event_name:
            flash("Event name is required.", "error")
        else:
            with get_db_connection() as connection:
                event_code = create_unique_event_code(connection)
                connection.execute(
                    """
                    INSERT INTO events (name, event_code, organizer_email)
                    VALUES (?, ?, ?)
                    """,
                    (event_name, event_code, session["user_email"]),
                )
                connection.commit()

            flash("Event created successfully.", "success")
            return redirect(url_for("events.dashboard"))

    return render_template("event.html", event=None)


@events_bp.route("/event/<int:event_id>/edit", methods=["GET", "POST"])
@login_required
def edit_event(event_id):
    with get_db_connection() as connection:
        event = get_event_for_user(connection, event_id, session["user_email"])

        if request.method == "POST":
            event_name = request.form.get("name", "").strip()

            if not event_name:
                flash("Event name is required.", "error")
            else:
                connection.execute(
                    "UPDATE events SET name = ? WHERE id = ?",
                    (event_name, event_id),
                )
                connection.commit()
                flash("Event updated successfully.", "success")
                return redirect(url_for("events.dashboard"))

    return render_template("edit_event.html", event=event)


@events_bp.route("/event/<int:event_id>/delete", methods=["POST"])
@login_required
def delete_event(event_id):
    with get_db_connection() as connection:
        get_event_for_user(connection, event_id, session["user_email"])
        connection.execute("DELETE FROM events WHERE id = ?", (event_id,))
        connection.commit()

    flash("Event deleted.", "success")
    return redirect(url_for("events.dashboard"))


@events_bp.route("/event/<int:event_id>")
@login_required
def event_detail(event_id):
    with get_db_connection() as connection:
        event = get_event_for_user(connection, event_id, session["user_email"])
        zones = get_zones_for_event(connection, event_id)

    return render_template(
        "event_detail.html",
        event=event,
        initial_zones=serialize_zones(zones),
    )


@events_bp.route("/event/<int:event_id>/simulation", methods=["POST"])
@login_required
def event_simulation_action(event_id):
    action = request.form.get("action", "").strip()

    with get_db_connection() as connection:
        get_event_for_user(connection, event_id, session["user_email"])

        if action == "surge":
            trigger_event_surge(connection, event_id)
            flash("Surge simulation applied.", "success")
        elif action == "reset":
            reset_event_counts(connection, event_id)
            flash("Zone counts reset.", "success")
        else:
            abort(400)

    return redirect(url_for("events.event_detail", event_id=event_id))


@events_bp.route("/add_zone/<int:event_id>", methods=["GET", "POST"])
@login_required
def add_zone(event_id):
    with get_db_connection() as connection:
        event = get_event_for_user(connection, event_id, session["user_email"])

        if request.method == "POST":
            zone_name = request.form.get("zone_name", "").strip()
            capacity, error = _parse_capacity(request.form.get("capacity", "").strip())

            if not zone_name:
                flash("Zone name is required.", "error")
            elif error:
                flash(error, "error")
            elif _zone_name_exists(connection, event_id, zone_name):
                flash("Zone names must be unique within an event.", "error")
            else:
                connection.execute(
                    """
                    INSERT INTO zones (event_id, zone_name, capacity)
                    VALUES (?, ?, ?)
                    """,
                    (event_id, zone_name, capacity),
                )
                connection.commit()
                flash("Zone added successfully.", "success")
                return redirect(url_for("events.event_detail", event_id=event_id))

    return render_template("add_zone.html", event=event, zone=None)


@events_bp.route("/event/<int:event_id>/zone/<int:zone_id>/edit", methods=["GET", "POST"])
@login_required
def edit_zone(event_id, zone_id):
    with get_db_connection() as connection:
        event = get_event_for_user(connection, event_id, session["user_email"])
        zone = get_zone_for_event(connection, zone_id, event_id)

        if request.method == "POST":
            zone_name = request.form.get("zone_name", "").strip()
            capacity, error = _parse_capacity(request.form.get("capacity", "").strip())

            if not zone_name:
                flash("Zone name is required.", "error")
            elif error:
                flash(error, "error")
            elif _zone_name_exists(connection, event_id, zone_name, zone_id):
                flash("Zone names must be unique within an event.", "error")
            else:
                connection.execute(
                    """
                    UPDATE zones
                    SET zone_name = ?, capacity = ?, current_count = MIN(current_count, ?)
                    WHERE id = ? AND event_id = ?
                    """,
                    (zone_name, capacity, capacity, zone_id, event_id),
                )
                connection.commit()
                flash("Zone updated successfully.", "success")
                return redirect(url_for("events.event_detail", event_id=event_id))

    return render_template("edit_zone.html", event=event, zone=zone)


@events_bp.route("/event/<int:event_id>/zone/<int:zone_id>/delete", methods=["POST"])
@login_required
def delete_zone(event_id, zone_id):
    with get_db_connection() as connection:
        get_event_for_user(connection, event_id, session["user_email"])
        get_zone_for_event(connection, zone_id, event_id)
        connection.execute(
            "DELETE FROM zones WHERE id = ? AND event_id = ?",
            (zone_id, event_id),
        )
        connection.commit()

    flash("Zone deleted.", "success")
    return redirect(url_for("events.event_detail", event_id=event_id))


@events_bp.route("/api/update_crowd/<int:event_id>")
@login_required_json
def update_crowd(event_id):
    with get_db_connection() as connection:
        get_event_for_user(connection, event_id, session["user_email"])
        zones = update_zone_counts(connection, event_id)

    return jsonify({"zones": serialize_zones(zones)})


@events_bp.route("/api/get_zones/<int:event_id>")
@login_required_json
def get_zones(event_id):
    with get_db_connection() as connection:
        get_event_for_user(connection, event_id, session["user_email"])
        zones = get_zones_for_event(connection, event_id)

    return jsonify({"zones": serialize_zones(zones)})
