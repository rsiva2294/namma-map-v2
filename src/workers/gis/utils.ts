import type { Geometry, Position, BBox } from '../../types/gis';

export function getBBox(geometry: Geometry): BBox {
  if (geometry.type === 'Point') {
    const [lng, lat] = geometry.coordinates as Position;
    return [lng, lat, lng, lat];
  }
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const coords = geometry.coordinates as any;
  
  const processPoints = (points: Position[]) => {
    points.forEach(([lng, lat]) => {
      minX = Math.min(minX, lng);
      minY = Math.min(minY, lat);
      maxX = Math.max(maxX, lng);
      maxY = Math.max(maxY, lat);
    });
  };

  if (geometry.type === 'Polygon') {
    coords.forEach((ring: Position[]) => processPoints(ring));
  } else if (geometry.type === 'MultiPolygon') {
    coords.forEach((poly: Position[][]) => poly.forEach(ring => processPoints(ring)));
  }

  return [minX, minY, maxX, maxY];
}

export function isPointInPolygon(point: Position, polygon: Position[][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon[0].length - 1; i < polygon[0].length; j = i++) {
    const xi = polygon[0][i][0], yi = polygon[0][i][1];
    const xj = polygon[0][j][0], yj = polygon[0][j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function getCentroid(geometry: Geometry): Position {
  if (geometry.type === 'Point') return geometry.coordinates as Position;
  const bbox = getBBox(geometry);
  return [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
}

export function getDistance(p1: Position, p2: Position): number {
  return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
}

export function normalizePoliceName(name: string): string {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function extractPoliceCode(name: string): string {
  if (!name) return '';
  const match = name.match(/\(([A-Z0-9]+)\)/);
  return match ? match[1] : '';
}

export function stripCodePrefix(name: string): string {
  if (!name) return '';
  return name.replace(/^[A-Z0-9]+\s*-\s*/, '').trim();
}

export function normalizeDistrictName(name: string): string {
  if (!name) return '';
  return name.trim().toUpperCase().replace(/[^A-Z]/g, '');
}

export function getScore(target: string, query: string): number {
  if (!target || !query) return 0;
  const t = target.toLowerCase();
  const q = query.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 40;
  return 0;
}

export interface DistrictIdentity {
  id: string;
  display_name: string;
  pds_file: string;
  aliases: string[];
}

export const resolveDistrictIdentity = (rawName: string, pdsManifest: DistrictIdentity[] | null): DistrictIdentity | null => {
  if (!rawName || !pdsManifest) return null;

  const normalized = rawName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/\s+/g, '');

  // 1. Try exact alias match
  const match = pdsManifest.find(d =>
    d.aliases.some(alias => alias.toUpperCase().replace(/[^A-Z0-9]/g, '') === normalized)
  );

  if (match) return match;

  // 2. Try partial match if no exact match found
  return pdsManifest.find(d =>
    d.id.toUpperCase().replace(/[^A-Z0-9]/g, '') === normalized ||
    d.display_name.toUpperCase().replace(/[^A-Z0-9]/g, '') === normalized
  ) || null;
};
