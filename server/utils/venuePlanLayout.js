const GRID_GUTTER = 4;

export const buildDefaultPolygon = (index, total) => {
  const safeTotal = Math.max(total || 1, 1);
  const columns = Math.ceil(Math.sqrt(safeTotal));
  const rows = Math.ceil(safeTotal / columns);
  const usableWidth = 100 - GRID_GUTTER * (columns + 1);
  const usableHeight = 100 - GRID_GUTTER * (rows + 1);
  const cellWidth = usableWidth / columns;
  const cellHeight = usableHeight / rows;
  const column = index % columns;
  const row = Math.floor(index / columns);
  const x = GRID_GUTTER + column * (cellWidth + GRID_GUTTER);
  const y = GRID_GUTTER + row * (cellHeight + GRID_GUTTER);

  return [
    { x, y },
    { x: x + cellWidth, y },
    { x: x + cellWidth, y: y + cellHeight },
    { x, y: y + cellHeight }
  ];
};

export const buildVenuePlanZones = (eventZones = [], existingZones = []) => (
  eventZones.map((zone, index) => {
    const zoneId = String(zone._id);
    const existingZone = existingZones.find((item) => item.zoneId === zoneId);

    return {
      zoneId,
      name: zone.name,
      polygon: existingZone?.polygon?.length ? existingZone.polygon : buildDefaultPolygon(index, eventZones.length),
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
