import random
import string


def generate_event_code(length=6):
    alphabet = string.ascii_uppercase + string.digits
    return "".join(random.choices(alphabet, k=length))


def create_unique_event_code(connection):
    while True:
        event_code = generate_event_code()
        event = connection.execute(
            "SELECT id FROM events WHERE event_code = ?",
            (event_code,),
        ).fetchone()
        if not event:
            return event_code


def get_zones_for_event(connection, event_id):
    return connection.execute(
        """
        SELECT id, event_id, zone_name, capacity, current_count
        FROM zones
        WHERE event_id = ?
        ORDER BY id DESC
        """,
        (event_id,),
    ).fetchall()


def _simulate_next_count(zone):
    capacity = max(zone["capacity"], 1)
    swing = max(6, round(capacity * 0.12))
    drift = random.randint(-swing, swing)
    surge = 0

    if random.random() < 0.18:
        surge = random.randint(0, max(4, round(capacity * 0.18)))

    next_count = zone["current_count"] + drift + surge
    hard_limit = capacity + max(10, round(capacity * 0.35))
    return max(0, min(next_count, hard_limit))


def update_zone_counts(connection, event_id):
    zones = get_zones_for_event(connection, event_id)

    for zone in zones:
        connection.execute(
            "UPDATE zones SET current_count = ? WHERE id = ?",
            (_simulate_next_count(zone), zone["id"]),
        )

    connection.commit()
    return get_zones_for_event(connection, event_id)


def trigger_event_surge(connection, event_id):
    zones = get_zones_for_event(connection, event_id)

    for zone in zones:
        capacity = max(zone["capacity"], 1)
        boost = random.randint(max(5, round(capacity * 0.2)), max(12, round(capacity * 0.45)))
        next_count = min(
            zone["current_count"] + boost,
            capacity + max(10, round(capacity * 0.5)),
        )
        connection.execute(
            "UPDATE zones SET current_count = ? WHERE id = ?",
            (next_count, zone["id"]),
        )

    connection.commit()
    return get_zones_for_event(connection, event_id)


def reset_event_counts(connection, event_id):
    connection.execute(
        "UPDATE zones SET current_count = 0 WHERE event_id = ?",
        (event_id,),
    )
    connection.commit()
    return get_zones_for_event(connection, event_id)
