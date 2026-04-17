const LEGACY_GRID_GUTTER = 4;
const CIRCLE_POINT_COUNT = 24;

const FALLBACK_ANCHORS = [
  { x: 24, y: 24 },
  { x: 24, y: 72 },
  { x: 74, y: 28 },
  { x: 74, y: 74 },
  { x: 50, y: 52 },
  { x: 50, y: 24 },
  { x: 50, y: 80 },
  { x: 22, y: 50 },
  { x: 78, y: 52 }
];

const getCircleRadius = (total) => {
  if (total <= 2) return 15;
  if (total <= 4) return 13;
  if (total <= 6) return 11;
  if (total <= 8) return 9;
  return 7;
};

const roundPoint = (value) => Number(value.toFixed(2));

const buildCirclePolygon = (centerX, centerY, radius, points = CIRCLE_POINT_COUNT) => (
  Array.from({ length: points }, (_, index) => {
    const angle = (Math.PI * 2 * index) / points;
    return {
      x: roundPoint(centerX + radius * Math.cos(angle)),
      y: roundPoint(centerY + radius * Math.sin(angle))
    };
  })
);

const buildLegacyGridPolygon = (index, total) => {
  const safeTotal = Math.max(total || 1, 1);
  const columns = Math.ceil(Math.sqrt(safeTotal));
  const rows = Math.ceil(safeTotal / columns);
  const usableWidth = 100 - LEGACY_GRID_GUTTER * (columns + 1);
  const usableHeight = 100 - LEGACY_GRID_GUTTER * (rows + 1);
  const cellWidth = usableWidth / columns;
  const cellHeight = usableHeight / rows;
  const column = index % columns;
  const row = Math.floor(index / columns);
  const x = LEGACY_GRID_GUTTER + column * (cellWidth + LEGACY_GRID_GUTTER);
  const y = LEGACY_GRID_GUTTER + row * (cellHeight + LEGACY_GRID_GUTTER);

  return [
    { x: roundPoint(x), y: roundPoint(y) },
    { x: roundPoint(x + cellWidth), y: roundPoint(y) },
    { x: roundPoint(x + cellWidth), y: roundPoint(y + cellHeight) },
    { x: roundPoint(x), y: roundPoint(y + cellHeight) }
  ];
};

const getFallbackAnchor = (index, total) => {
  if (index < FALLBACK_ANCHORS.length) {
    return FALLBACK_ANCHORS[index];
  }

  const extraIndex = index - FALLBACK_ANCHORS.length;
  const ring = Math.floor(extraIndex / 6) + 1;
  const step = extraIndex % 6;
  const radius = Math.min(16 + ring * 7, 34);
  const angle = -Math.PI / 2 + (Math.PI * 2 * step) / 6;

  return {
    x: roundPoint(50 + radius * Math.cos(angle)),
    y: roundPoint(50 + radius * Math.sin(angle))
  };
};

const pointsRoughlyEqual = (first = [], second = [], tolerance = 0.15) => {
  if (first.length !== second.length) return false;

  return first.every((point, index) => (
    Math.abs(Number(point?.x || 0) - Number(second[index]?.x || 0)) <= tolerance
    && Math.abs(Number(point?.y || 0) - Number(second[index]?.y || 0)) <= tolerance
  ));
};

const isLegacyAutoPolygon = (polygon = [], index, total) => (
  polygon.length === 4 && pointsRoughlyEqual(polygon, buildLegacyGridPolygon(index, total))
);

export const buildDefaultPolygon = (index, total) => {
  const anchor = getFallbackAnchor(index, total);
  const radius = getCircleRadius(total);
  return buildCirclePolygon(anchor.x, anchor.y, radius);
};

export const buildVenuePlanZones = (eventZones = [], existingZones = []) => (
  eventZones.map((zone, index) => {
    const zoneId = String(zone._id);
    const existingZone = existingZones.find((item) => item.zoneId === zoneId);
    const shouldRefreshAutoLayout = !existingZone?.polygon?.length
      || isLegacyAutoPolygon(existingZone.polygon, index, eventZones.length);

    return {
      zoneId,
      name: zone.name,
      polygon: shouldRefreshAutoLayout
        ? buildDefaultPolygon(index, eventZones.length)
        : existingZone.polygon,
      maxCapacity: zone.capacity,
      congestionThreshold: existingZone?.congestionThreshold ?? 80,
      flowStatus: existingZone?.flowStatus ?? 'free',
      areaSqm: existingZone?.areaSqm ?? 0,
      exitWidthMeters: existingZone?.exitWidthMeters ?? 3,
      staffPoints: existingZone?.staffPoints ?? [],
      emergencyExitOnly: existingZone?.emergencyExitOnly ?? false
    };
  })
);
