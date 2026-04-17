import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "crowd-intelligence-secret-key")
    DATABASE = os.environ.get("DATABASE_PATH", str(BASE_DIR / "database.db"))
    TESTING = False
