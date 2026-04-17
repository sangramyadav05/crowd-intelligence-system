import sqlite3
from contextlib import contextmanager

from flask import current_app


@contextmanager
def get_db_connection():
    connection = sqlite3.connect(current_app.config["DATABASE"])
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
    finally:
        connection.close()


def init_db(app):
    with app.app_context():
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
                    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
                )
                """
            )
            connection.execute(
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email)"
            )
            connection.execute(
                "CREATE UNIQUE INDEX IF NOT EXISTS idx_events_code ON events (event_code)"
            )
            connection.execute(
                "CREATE INDEX IF NOT EXISTS idx_zones_event_id ON zones (event_id)"
            )
            connection.execute(
                "CREATE INDEX IF NOT EXISTS idx_zones_event_name ON zones (event_id, zone_name)"
            )
            connection.commit()
