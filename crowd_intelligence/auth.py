import sqlite3

from flask import Blueprint, flash, redirect, render_template, request, session, url_for
from werkzeug.security import check_password_hash, generate_password_hash

from .db import get_db_connection


auth_bp = Blueprint("auth", __name__)


def _verify_password(stored_password, raw_password):
    if stored_password == raw_password:
        return True, generate_password_hash(raw_password)

    try:
        if check_password_hash(stored_password, raw_password):
            return True, None
    except ValueError:
        return False, None

    return False, None


@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "").strip()

        if not email or not password:
            flash("Email and password are required.", "error")
        else:
            try:
                with get_db_connection() as connection:
                    connection.execute(
                        "INSERT INTO users (email, password) VALUES (?, ?)",
                        (email, generate_password_hash(password)),
                    )
                    connection.commit()
                flash("Registration complete. You can log in now.", "success")
                return redirect(url_for("auth.login"))
            except sqlite3.IntegrityError:
                flash("A user with that email already exists.", "error")

    return render_template("register.html")


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "").strip()

        with get_db_connection() as connection:
            user = connection.execute(
                "SELECT id, email, password FROM users WHERE email = ?",
                (email,),
            ).fetchone()

            if user:
                is_valid, upgraded_password = _verify_password(user["password"], password)

                if is_valid:
                    if upgraded_password:
                        connection.execute(
                            "UPDATE users SET password = ? WHERE id = ?",
                            (upgraded_password, user["id"]),
                        )
                        connection.commit()

                    session["user_id"] = user["id"]
                    session["user_email"] = user["email"]
                    flash("Logged in successfully.", "success")
                    return redirect(url_for("events.dashboard"))

        flash("Invalid email or password.", "error")

    return render_template("login.html")


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    flash("You have been logged out.", "success")
    return redirect(url_for("auth.login"))
