import random
import sqlite3
import string
from pathlib import Path

from flask import (
    Flask,
    abort,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)


BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "database.db"

app = Flask(__name__)
app.secret_key = "crowd-intelligence-secret-key"


def get_db_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def generate_event_code(length=6):
    characters = string.ascii_uppercase + string.digits
    return "".join(random.choices(characters, k=length))


def create_unique_event_code(connection):
    while True:
        event_code = generate_event_code()
        existing_event = connection.execute(
            "SELECT id FROM events WHERE event_code = ?",
            (event_code,),
        ).fetchone()

        if not existing_event:
            return event_code


def get_event_for_user(connection, event_id, organizer_email):
    return connection.execute(
        """
        SELECT id, name, event_code, organizer_email
        FROM events
        WHERE id = ? AND organizer_email = ?
        """,
        (event_id, organizer_email),
    ).fetchone()


def get_event_by_code(connection, event_code):
    return connection.execute(
        """
        SELECT id, name, event_code
        FROM events
        WHERE event_code = ?
        """,
        (event_code,),
    ).fetchone()


def get_public_event(connection, event_id):
    return connection.execute(
        """
        SELECT id, name, event_code
        FROM events
        WHERE id = ?
        """,
        (event_id,),
    ).fetchone()


def get_zones_for_event(connection, event_id):
    return connection.execute(
        """
        SELECT id, zone_name, capacity, current_count
        FROM zones
        WHERE event_id = ?
        ORDER BY id DESC
        """,
        (event_id,),
    ).fetchall()


def update_zone_counts(connection, event_id):
    zones = get_zones_for_event(connection, event_id)

    for zone in zones:
        simulated_count = random.randint(0, zone["capacity"] + 20)
        connection.execute(
            "UPDATE zones SET current_count = ? WHERE id = ?",
            (simulated_count, zone["id"]),
        )

    connection.commit()
    return get_zones_for_event(connection, event_id)


def init_db():
    with get_db_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                event_code TEXT NOT NULL UNIQUE,
                organizer_email TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS zones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER NOT NULL,
                zone_name TEXT NOT NULL,
                capacity INTEGER NOT NULL,
                current_count INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (event_id) REFERENCES events (id)
            )
            """
        )
        connection.commit()


init_db()


def require_login():
    return "user_id" in session


def get_organizer_status(current_count, capacity):
    if current_count > capacity:
        return {
            "label": "Overcrowded",
            "color": "red",
        }

    if capacity and current_count > capacity * 0.7:
        return {
            "label": "Getting crowded",
            "color": "orange",
        }

    return {
        "label": "Safe",
        "color": "green",
    }


def get_public_status(current_count, capacity):
    if current_count > capacity:
        return {
            "label": "Avoid",
            "color": "red",
        }

    if capacity and current_count > capacity * 0.7:
        return {
            "label": "Busy",
            "color": "orange",
        }

    return {
        "label": "Safe",
        "color": "green",
    }


def serialize_zones(zones):
    serialized_zones = []

    for zone in zones:
        organizer_status = get_organizer_status(zone["current_count"], zone["capacity"])
        public_status = get_public_status(zone["current_count"], zone["capacity"])

        serialized_zones.append(
            {
                "id": zone["id"],
                "zone_name": zone["zone_name"],
                "capacity": zone["capacity"],
                "current_count": zone["current_count"],
                "organizer_alert": organizer_status["label"],
                "organizer_color": organizer_status["color"],
                "public_status": public_status["label"],
                "public_color": public_status["color"],
            }
        )

    return serialized_zones


@app.route("/")
def home():
    return "Crowd Intelligence System is running."


@app.route("/register", methods=["GET", "POST"])
def register():
    error = None

    if request.method == "POST":
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "").strip()

        if not email or not password:
            error = "Email and password are required."
        else:
            try:
                with get_db_connection() as connection:
                    connection.execute(
                        "INSERT INTO users (email, password) VALUES (?, ?)",
                        (email, password),
                    )
                    connection.commit()
                return redirect(url_for("login"))
            except sqlite3.IntegrityError:
                error = "A user with that email already exists."

    return render_template("register.html", error=error)


@app.route("/login", methods=["GET", "POST"])
def login():
    error = None

    if request.method == "POST":
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "").strip()

        with get_db_connection() as connection:
            user = connection.execute(
                "SELECT id, email, password FROM users WHERE email = ?",
                (email,),
            ).fetchone()

        if user and user["password"] == password:
            session["user_id"] = user["id"]
            session["user_email"] = user["email"]
            return redirect(url_for("dashboard"))

        error = "Invalid email or password."

    return render_template("login.html", error=error)


@app.route("/create_event", methods=["GET", "POST"])
def create_event():
    if not require_login():
        return redirect(url_for("login"))

    error = None

    if request.method == "POST":
        event_name = request.form.get("name", "").strip()

        if not event_name:
            error = "Event name is required."
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

            return redirect(url_for("dashboard"))

    return render_template("event.html", error=error)


@app.route("/add_zone/<int:event_id>", methods=["GET", "POST"])
def add_zone(event_id):
    if not require_login():
        return redirect(url_for("login"))

    error = None

    with get_db_connection() as connection:
        event = get_event_for_user(connection, event_id, session["user_email"])

        if not event:
            abort(404)

        if request.method == "POST":
            zone_name = request.form.get("zone_name", "").strip()
            capacity_value = request.form.get("capacity", "").strip()

            if not zone_name or not capacity_value:
                error = "Zone name and capacity are required."
            else:
                try:
                    capacity = int(capacity_value)
                except ValueError:
                    error = "Capacity must be a number."
                else:
                    if capacity < 0:
                        error = "Capacity must be zero or greater."
                    else:
                        connection.execute(
                            """
                            INSERT INTO zones (event_id, zone_name, capacity)
                            VALUES (?, ?, ?)
                            """,
                            (event_id, zone_name, capacity),
                        )
                        connection.commit()
                        return redirect(url_for("event_detail", event_id=event_id))

    return render_template("add_zone.html", event=event, error=error)


@app.route("/public", methods=["GET", "POST"])
def public():
    error = None

    if request.method == "POST":
        event_code = request.form.get("event_code", "").strip().upper()

        if not event_code:
            error = "Event code is required."
        else:
            with get_db_connection() as connection:
                event = get_event_by_code(connection, event_code)

            if event:
                return redirect(url_for("public_view", event_id=event["id"]))

            error = "Event not found."

    return render_template("public.html", error=error)


@app.route("/view/<int:event_id>")
def public_view(event_id):
    with get_db_connection() as connection:
        event = get_public_event(connection, event_id)

        if not event:
            abort(404)

    return render_template("public_view.html", event=event)


@app.route("/event/<int:event_id>")
def event_detail(event_id):
    if not require_login():
        return redirect(url_for("login"))

    with get_db_connection() as connection:
        event = get_event_for_user(connection, event_id, session["user_email"])

        if not event:
            abort(404)

    return render_template("event_detail.html", event=event)


@app.route("/api/update_crowd/<int:event_id>")
def update_crowd(event_id):
    if not require_login():
        return redirect(url_for("login"))

    with get_db_connection() as connection:
        event = get_event_for_user(connection, event_id, session["user_email"])

        if not event:
            abort(404)

        updated_zones = update_zone_counts(connection, event_id)

    return jsonify({"zones": serialize_zones(updated_zones)})


@app.route("/api/get_zones/<int:event_id>")
def get_zones(event_id):
    if not require_login():
        return redirect(url_for("login"))

    with get_db_connection() as connection:
        event = get_event_for_user(connection, event_id, session["user_email"])

        if not event:
            abort(404)

        zones = get_zones_for_event(connection, event_id)

    return jsonify({"zones": serialize_zones(zones)})


@app.route("/api/public_zones/<int:event_id>")
def get_public_zones(event_id):
    with get_db_connection() as connection:
        event = get_public_event(connection, event_id)

        if not event:
            abort(404)

        updated_zones = update_zone_counts(connection, event_id)

    return jsonify({"zones": serialize_zones(updated_zones)})


@app.route("/dashboard")
def dashboard():
    if not require_login():
        return redirect(url_for("login"))

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
        user_email=session.get("user_email"),
        events=events,
    )


if __name__ == "__main__":
    app.run(debug=True)
