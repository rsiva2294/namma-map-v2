import { describe, it, expect } from 'vitest';
import { extractChennaiCode, normalizeStationName, scoreChennaiMatch } from './chennaiPoliceResolver';

describe('Chennai Police Resolver - Code Extraction', () => {
  it('should extract code from standard patterns', () => {
    expect(extractChennaiCode('R1. MAMBALAM')).toBe('R1');
    expect(extractChennaiCode('K10 KOYAMBEDU')).toBe('K10');
    expect(extractChennaiCode('W25 T.NAGAR AWPS')).toBe('W25');
    expect(extractChennaiCode('AB12 SAMPLE')).toBe('AB12');
  });

  it('should handle variations in spacing and punctuation', () => {
    expect(extractChennaiCode('R 1 MAMBALAM')).toBe('R1');
    expect(extractChennaiCode('J-2 ADYAR')).toBe('J2');
  });

  it('should return null if no code found', () => {
    expect(extractChennaiCode('MAMBALAM STATION')).toBe(null);
  });
});

describe('Chennai Police Resolver - Normalization', () => {
  it('should normalize station names correctly', () => {
    expect(normalizeStationName('R1. MAMBALAM')).toBe('r1 mambalam');
    expect(normalizeStationName('K-10 KOYAMBEDU')).toBe('k 10 koyambedu');
    expect(normalizeStationName('W25 (T.NAGAR)')).toBe('w25 t nagar');
  });
});

describe('Chennai Police Resolver - Scoring', () => {
  const mockBoundary = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[[80.2, 13.0], [80.3, 13.0], [80.3, 13.1], [80.2, 13.1], [80.2, 13.0]]]
    },
    properties: {
      police_s_1: 'R1',
      police_s_2: 'MAMBALAM',
      police_sta: 'R1 Mambalam PS'
    }
  } as any;

  it('should return 100 for code + name + spatial match', () => {
    const coords: [number, number] = [80.25, 13.05]; // Inside
    const { score } = scoreChennaiMatch(coords, 'R1', 'r1 mambalam', mockBoundary);
    expect(score).toBe(100);
  });

  it('should return 90 for code + spatial match without name match', () => {
    const coords: [number, number] = [80.25, 13.05]; // Inside
    const { score } = scoreChennaiMatch(coords, 'R1', 'random name', mockBoundary);
    expect(score).toBe(90);
  });

  it('should return 75 for code only match (outside)', () => {
    const coords: [number, number] = [80.4, 13.2]; // Outside
    const { score } = scoreChennaiMatch(coords, 'R1', 'random name', mockBoundary);
    expect(score).toBe(75);
  });

  it('should return 60 for spatial only match', () => {
    const coords: [number, number] = [80.25, 13.05]; // Inside
    const { score } = scoreChennaiMatch(coords, 'K10', 'koyambedu', mockBoundary);
    expect(score).toBe(60);
  });
});
