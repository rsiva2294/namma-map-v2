import type { GisFeature, Polygon, MultiPolygon } from './gis';

export interface LocalBodyV2Properties {
  id: string;
  name: string;
  type: 'CORPORATION' | 'MUNICIPALITY' | 'TOWN_PANCHAYAT' | 'VILLAGE_PANCHAYAT' | 'UNKNOWN_LOCAL_BODY';
  district: string;
  block?: string;
  taluk?: string;
  category?: string;
  pincode?: string;
  raw: Record<string, any>;
}

export type LocalBodyV2Feature = GisFeature<Polygon | MultiPolygon, LocalBodyV2Properties>;
