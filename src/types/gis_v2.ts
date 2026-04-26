import type { Geometry, GisFeature } from './gis';

export type LocalBodyV2Type = 
  | 'CORPORATION' 
  | 'MUNICIPALITY' 
  | 'TOWN_PANCHAYAT' 
  | 'VILLAGE_PANCHAYAT';

/**
 * Strict schema for Local Bodies V2.
 * All messy raw properties are normalized into this format in the worker.
 */
export interface LocalBodyV2Properties {
  [key: string]: any; // Relaxed index signature for normalization
  // Common normalized fields
  id: string;
  name: string;
  type: LocalBodyV2Type;
  district: string;
  
  // Optional hierarchical fields
  block?: string;
  taluk?: string;
  category?: string; // e.g. "Grade I", "Selection Grade"
  
  // Raw properties preserved for "Report" or debugging
  // We use any to bypass strict GisProperties constraint for the raw object
  raw?: any;
}

export type LocalBodyV2Feature = GisFeature<Geometry, LocalBodyV2Properties>;
