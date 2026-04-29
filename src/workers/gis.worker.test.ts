import { describe, it, expect } from 'vitest';
import { isPointInPolygon, getScore, getBBox, normalizeDistrictName } from './gis/utils';
import type { Position, Geometry } from '../types/gis';

describe('GIS Worker Helpers', () => {
  describe('isPointInPolygon', () => {
    const square: Position[][] = [
      [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]
    ];

    it('should return true for point inside square', () => {
      expect(isPointInPolygon([5, 5], square)).toBe(true);
    });

    it('should return false for point outside square', () => {
      expect(isPointInPolygon([15, 15], square)).toBe(false);
    });

    it('should handle multi-ring polygons (holes)', () => {
      // Note: The current production implementation only checks the outer ring (polygon[0])
      // We should document this behavior or update it if holes become critical.
      const squareWithHole: Position[][] = [
        [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]], // Outer
        [[2, 2], [8, 2], [8, 8], [2, 8], [2, 2]]      // Inner (hole)
      ];
      
      // Point inside the hole should still return true because we only check the first ring
      expect(isPointInPolygon([5, 5], squareWithHole)).toBe(true);
      expect(isPointInPolygon([1, 1], squareWithHole)).toBe(true);
    });
  });

  describe('getScore', () => {
    it('should return 100 for exact match', () => {
      expect(getScore('Chennai', 'Chennai')).toBe(100);
    });

    it('should return 80 for prefix match', () => {
      expect(getScore('Chennai', 'Chen')).toBe(80);
    });

    it('should return 40 for partial match', () => {
      expect(getScore('Chennai Central', 'Central')).toBe(40);
    });

    it('should return 0 for no match', () => {
      expect(getScore('Chennai', 'Madurai')).toBe(0);
    });

    it('should be case-insensitive', () => {
      expect(getScore('CHENNAI', 'chennai')).toBe(100);
    });
  });

  describe('getBBox', () => {
    it('should calculate BBox for a Point', () => {
      const point: Geometry = { type: 'Point', coordinates: [1, 2] };
      expect(getBBox(point)).toEqual([1, 2, 1, 2]);
    });

    it('should calculate BBox for a Polygon', () => {
      const polygon: Geometry = {
        type: 'Polygon',
        coordinates: [[[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]]]
      };
      expect(getBBox(polygon)).toEqual([0, 0, 10, 10]);
    });
  });

  describe('normalizeDistrictName', () => {
    it('should uppercase and remove non-letters', () => {
      expect(normalizeDistrictName('Chennai')).toBe('CHENNAI');
      expect(normalizeDistrictName('The Nilgiris')).toBe('THENILGIRIS');
      expect(normalizeDistrictName('Kanchipuram-North')).toBe('KANCHIPURAMNORTH');
    });

    it('should handle empty input', () => {
      expect(normalizeDistrictName('')).toBe('');
    });
  });
});
