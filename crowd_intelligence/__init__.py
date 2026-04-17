from flask import Flask

from .auth import auth_bp
from .config import Config
from .db import init_db
from .events import events_bp
from .public_routes import public_bp


def create_app(config_overrides=None):
    app = Flask(__name__, template_folder="../templates", static_folder="../static")
    app.config.from_object(Config)

    if config_overrides:
        app.config.update(config_overrides)

    init_db(app)

    @app.route("/")
    def home():
        return "Crowd Intelligence System is running."

    app.register_blueprint(auth_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(public_bp)
    return app
