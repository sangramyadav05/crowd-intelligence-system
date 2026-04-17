import os
import tempfile
import unittest

from crowd_intelligence import create_app
from crowd_intelligence.db import get_db_connection


class CrowdIntelligenceAppTests(unittest.TestCase):
    def setUp(self):
        self.db_handle = tempfile.NamedTemporaryFile(delete=False)
        self.db_handle.close()
        self.app = create_app(
            {
                "TESTING": True,
                "SECRET_KEY": "test-secret",
                "DATABASE": self.db_handle.name,
            }
        )
        self.client = self.app.test_client()

    def tearDown(self):
        os.unlink(self.db_handle.name)

    def register(self, email="organizer@example.com", password="password123"):
        return self.client.post(
            "/register",
            data={"email": email, "password": password},
            follow_redirects=True,
        )

    def login(self, email="organizer@example.com", password="password123"):
        return self.client.post(
            "/login",
            data={"email": email, "password": password},
            follow_redirects=True,
        )

    def create_event(self, name="Demo Event"):
        return self.client.post(
            "/create_event",
            data={"name": name},
            follow_redirects=True,
        )

    def add_zone(self, event_id, zone_name="Main Gate", capacity="120"):
        return self.client.post(
            f"/add_zone/{event_id}",
            data={"zone_name": zone_name, "capacity": capacity},
            follow_redirects=True,
        )

    def test_register_login_and_dashboard_access(self):
        response = self.register()
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Registration complete", response.data)

        response = self.login()
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Organizer Dashboard", response.data)

    def test_dashboard_requires_authentication(self):
        response = self.client.get("/dashboard", follow_redirects=False)
        self.assertEqual(response.status_code, 302)
        self.assertIn("/login", response.headers["Location"])

    def test_event_creation_zone_management_and_public_lookup(self):
        self.register()
        self.login()

        response = self.create_event()
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Demo Event", response.data)

        with self.app.app_context():
            with get_db_connection() as connection:
                event = connection.execute(
                    "SELECT id, event_code FROM events WHERE name = ?",
                    ("Demo Event",),
                ).fetchone()

        response = self.add_zone(event["id"])
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Main Gate", response.data)

        public_lookup = self.client.post(
            "/public",
            data={"event_code": event["event_code"]},
            follow_redirects=False,
        )
        self.assertEqual(public_lookup.status_code, 302)
        self.assertIn(f"/view/{event['id']}", public_lookup.headers["Location"])

    def test_zone_api_returns_expected_payload(self):
        self.register()
        self.login()
        self.create_event()

        with self.app.app_context():
            with get_db_connection() as connection:
                event = connection.execute(
                    "SELECT id FROM events WHERE organizer_email = ?",
                    ("organizer@example.com",),
                ).fetchone()

        self.add_zone(event["id"])
        response = self.client.get(f"/api/update_crowd/{event['id']}")
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertIn("zones", payload)
        self.assertEqual(payload["zones"][0]["zone_name"], "Main Gate")
        self.assertIn("organizer_alert", payload["zones"][0])


if __name__ == "__main__":
    unittest.main()
