import { describe, it, expect } from 'vitest';
import { getLayerSlug, getLayerFromSlug, resolveRouteName } from './routeUtils';

describe('routeUtils', () => {
  describe('getLayerSlug', () => {
    it('should return local-bodies for LOCAL_BODIES_V2', () => {
      expect(getLayerSlug('LOCAL_BODIES_V2')).toBe('local-bodies');
    });

    it('should return pincode for PINCODE', () => {
      expect(getLayerSlug('PINCODE')).toBe('pincode');
    });

    it('should return health for HEALTH', () => {
      expect(getLayerSlug('HEALTH')).toBe('health');
    });
  });

  describe('getLayerFromSlug', () => {
    it('should return LOCAL_BODIES_V2 for local-bodies', () => {
      expect(getLayerFromSlug('local-bodies')).toBe('LOCAL_BODIES_V2');
    });

    it('should return LOCAL_BODIES_V2 for local_bodies_v2 (legacy)', () => {
      expect(getLayerFromSlug('local_bodies_v2')).toBe('LOCAL_BODIES_V2');
    });

    it('should return PINCODE for pincode', () => {
      expect(getLayerFromSlug('pincode')).toBe('PINCODE');
    });

    it('should return null for unknown slug', () => {
      expect(getLayerFromSlug('unknown')).toBeNull();
    });
  });

  describe('resolveRouteName', () => {
    it('should return Tamil display name when language is ta', () => {
      expect(resolveRouteName('PINCODE', 'ta')).toBe('அஞ்சல் நிலையங்கள்');
    });

    it('should return English display name when language is en', () => {
      expect(resolveRouteName('PINCODE', 'en')).toBe('Post Offices');
    });

    it('should return Tamil name for Local Bodies', () => {
      expect(resolveRouteName('LOCAL_BODIES_V2', 'ta')).toBe('உள்ளாட்சி அமைப்புகள்');
    });
  });
});
