from flask import Blueprint, abort, flash, jsonify, redirect, render_template, request, url_for

from .db import get_db_connection
from .helpers import serialize_zones
from .simulation import get_zones_for_event, update_zone_counts


public_bp = Blueprint("public", __name__)


def _get_event_by_code(connection, event_code):
    return connection.execute(
        "SELECT id, name, event_code FROM events WHERE event_code = ?",
        (event_code,),
    ).fetchone()


def _get_public_event(connection, event_id):
    event = connection.execute(
        "SELECT id, name, event_code FROM events WHERE id = ?",
        (event_id,),
    ).fetchone()

    if not event:
        abort(404)

    return event


@public_bp.route("/public", methods=["GET", "POST"])
def public_lookup():
    if request.method == "POST":
        event_code = request.form.get("event_code", "").strip().upper()

        if not event_code:
            flash("Event code is required.", "error")
        else:
            with get_db_connection() as connection:
                event = _get_event_by_code(connection, event_code)

            if event:
                return redirect(url_for("public.public_view", event_id=event["id"]))

            flash("Event not found.", "error")

    return render_template("public.html")


@public_bp.route("/view/<int:event_id>")
def public_view(event_id):
    with get_db_connection() as connection:
        event = _get_public_event(connection, event_id)

    return render_template("public_view.html", event=event)


@public_bp.route("/api/public_zones/<int:event_id>")
def public_zones(event_id):
    with get_db_connection() as connection:
        _get_public_event(connection, event_id)
        zones = update_zone_counts(connection, event_id)

        if not zones:
            zones = get_zones_for_event(connection, event_id)

    return jsonify({"zones": serialize_zones(zones)})
