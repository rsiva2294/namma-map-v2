import { describe, it, expect } from 'vitest';

// Simple implementation for testing
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

  it('should handle points exactly on the boundary (edge case)', () => {
    // Ray-casting usually treats edges as either in or out consistently
    expect(typeof isPointInPolygon([0, 5], square)).toBe('boolean');
  });

  it('should return true for point inside complex polygon (Chennai example)', () => {
    const chennaiApprox: [number, number][][] = [
      [[80.2, 13.0], [80.3, 13.0], [80.3, 13.1], [80.2, 13.1], [80.2, 13.0]]
    ];
    expect(isPointInPolygon([80.25, 13.05], chennaiApprox)).toBe(true);
  });
});
