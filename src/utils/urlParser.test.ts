import { describe, expect, it } from 'vitest';
import { extractCoordinatesFromUrl } from './urlParser';

describe('urlParser', () => {
  it('parses raw latitude and longitude pairs', () => {
    expect(extractCoordinatesFromUrl('13.082700,80.270700')).toEqual({
      lat: 13.0827,
      lng: 80.2707
    });
  });

  it('parses coordinate pairs inside a URL parameter value', () => {
    expect(extractCoordinatesFromUrl('https://example.com/?f=13.082700,80.270700')).toEqual({
      lat: 13.0827,
      lng: 80.2707
    });
  });
});
