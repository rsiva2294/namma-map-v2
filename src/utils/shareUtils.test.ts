import { describe, it, expect } from 'vitest';
import { getFeatureShareKey, getFeatureShareUrl } from './shareUtils';
import type { GisFeature } from '../types/gis';

describe('shareUtils', () => {
  const pincodeFeature = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [80.2707, 13.0827]
    },
    properties: {
      PIN_CODE: '600001',
      officename: 'Example Office',
      district: 'Chennai'
    }
  } as GisFeature;

  const pincodeOnlyFeature = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [80.2707, 13.0827]
    },
    properties: {
      officename: 'Example Office',
      district: 'Chennai'
    }
  } as GisFeature;

  const policeFeature = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [80.2707, 13.0827]
    },
    properties: {
      ps_code: 'R1',
      ps_name: 'Mambalam',
      district: 'Chennai'
    }
  } as GisFeature;

  const pdsFeature = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [80.2707, 13.0827]
    },
    properties: {
      shop_code: 'SHOP-101',
      district: 'Chennai'
    }
  } as GisFeature;

  const healthFeature = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [80.2707, 13.0827]
    },
    properties: {
      nin_number: 'NIN-9001',
      district_n: 'Chennai'
    }
  } as GisFeature;

  const policeBoundaryFeature = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [80.0, 13.0],
          [80.0, 13.2],
          [80.2, 13.2],
          [80.2, 13.0],
          [80.0, 13.0]
        ]
      ]
    },
    properties: {
      police_sta: 'Example Police Boundary',
      district_n: 'Chennai'
    }
  } as GisFeature;

  it('uses the pincode as the stable share key for pincode shares', () => {
    expect(getFeatureShareKey(pincodeFeature, 'PINCODE')).toBe('600001');
  });

  it('does not fall back to an unstable office name', () => {
    expect(getFeatureShareKey(pincodeOnlyFeature, 'PINCODE')).toBeNull();
  });

  it('uses coordinates for police shares', () => {
    expect(getFeatureShareKey(policeFeature, 'POLICE')).toBe('13.082700,80.270700');
  });

  it('uses coordinates for pds and health shares', () => {
    expect(getFeatureShareKey(pdsFeature, 'PDS')).toBe('13.082700,80.270700');
    expect(getFeatureShareKey(healthFeature, 'HEALTH')).toBe('13.082700,80.270700');
  });

  it('uses the boundary centroid when a police station feature is not point-based', () => {
    expect(getFeatureShareKey(policeBoundaryFeature, 'POLICE')).toBe('13.100000,80.100000');
  });

  it('builds a share url with the district path and coordinate query for point layers', () => {
    const policeUrl = getFeatureShareUrl(policeFeature, 'POLICE');
    expect(policeUrl).not.toBeNull();

    const policeParsed = new URL(policeUrl!);
    expect(policeParsed.pathname).toBe('/police/Chennai');
    expect(policeParsed.searchParams.get('f')).toBe('13.082700,80.270700');

    const pdsUrl = getFeatureShareUrl(pdsFeature, 'PDS');
    expect(pdsUrl).not.toBeNull();

    const pdsParsed = new URL(pdsUrl!);
    expect(pdsParsed.pathname).toBe('/pds/Chennai');
    expect(pdsParsed.searchParams.get('f')).toBe('13.082700,80.270700');
    expect(pdsParsed.searchParams.get('sid')).toBe('SHOP-101');

    const healthUrl = getFeatureShareUrl(healthFeature, 'HEALTH');
    expect(healthUrl).not.toBeNull();

    const healthParsed = new URL(healthUrl!);
    expect(healthParsed.pathname).toBe('/health/Chennai');
    expect(healthParsed.searchParams.get('f')).toBe('13.082700,80.270700');

    const url = getFeatureShareUrl(pincodeFeature, 'PINCODE');
    expect(url).not.toBeNull();

    const parsed = new URL(url!);
    expect(parsed.pathname).toBe('/pincode/Chennai');
    expect(parsed.searchParams.get('f')).toBe('600001');
  });
});
