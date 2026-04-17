import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const venueLayoutPath = path.join(__dirname, '..', 'data', 'VenueLayout.json');

const getVenueLayout = () => {
  const raw = fs.readFileSync(venueLayoutPath, 'utf8');
  return JSON.parse(raw);
};

const isPointInPolygon = (point, polygon) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersects = ((yi > point.y) !== (yj > point.y))
      && (point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + Number.EPSILON) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
};

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const findContainingZones = (point) => {
  const layout = getVenueLayout();
  return layout.zones.filter((zone) => isPointInPolygon(point, zone.boundary));
};

const getNearestEntryExit = (point) => {
  const layout = getVenueLayout();
  const nearestEntry = layout.entries.reduce((best, current) =>
    (!best || distance(point, current) < distance(point, best) ? current : best), null);
  const nearestExit = layout.exits.reduce((best, current) =>
    (!best || distance(point, current) < distance(point, best) ? current : best), null);

  return { nearestEntry, nearestExit };
};

export default {
  getVenueLayout,
  findContainingZones,
  getNearestEntryExit
};
