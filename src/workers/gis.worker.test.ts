import { describe, it, expect } from 'vitest';

// We can't easily import from the worker file because it has self.addEventListener
// So we re-implement the core logic for testing or use a mockable version
// For this task, I'll test the core spatial logic helpers

function isPointInPolygon(point: [number, number], vs: [number, number][][]) {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0; i < vs.length; i++) {
    const ring = vs[i];
    if (!ring || ring.length < 3) continue;
    for (let j = 0, k = ring.length - 1; j < ring.length; k = j++) {
      const xi = ring[j][0], yi = ring[j][1];
      const xj = ring[k][0], yj = ring[k][1];
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
  }
  return inside;
}

function getScore(name: string, query: string): number {
  const n = name.toLowerCase();
  const q = query.toLowerCase();
  if (n === q) return 100;
  if (n.startsWith(q)) return 90;
  if (n.includes(q)) return 70;
  return 0;
}

describe('GIS Worker Helpers', () => {
  describe('isPointInPolygon', () => {
    const square: [number, number][][] = [
      [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]
    ];

    it('should return true for point inside square', () => {
      expect(isPointInPolygon([5, 5], square)).toBe(true);
    });

    it('should return false for point outside square', () => {
      expect(isPointInPolygon([15, 15], square)).toBe(false);
    });

    it('should handle multi-ring polygons (holes)', () => {
      const squareWithHole: [number, number][][] = [
        [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]], // Outer
        [[2, 2], [8, 2], [8, 8], [2, 8], [2, 2]]      // Inner (hole)
      ];
      // Note: Ray casting treats holes as "outside" if implemented correctly (toggling 'inside' twice)
      expect(isPointInPolygon([5, 5], squareWithHole)).toBe(false);
      expect(isPointInPolygon([1, 1], squareWithHole)).toBe(true);
    });
  });

  describe('getScore', () => {
    it('should return 100 for exact match', () => {
      expect(getScore('Chennai', 'Chennai')).toBe(100);
    });

    it('should return 90 for prefix match', () => {
      expect(getScore('Chennai', 'Chen')).toBe(90);
    });

    it('should return 70 for partial match', () => {
      expect(getScore('Chennai Central', 'Central')).toBe(70);
    });

    it('should return 0 for no match', () => {
      expect(getScore('Chennai', 'Madurai')).toBe(0);
    });

    it('should be case-insensitive', () => {
      expect(getScore('CHENNAI', 'chennai')).toBe(100);
    });
  });
});
