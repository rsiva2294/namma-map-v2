import RBush from 'rbush';
import type { 
  GisFeatureCollection, 
  PostalOffice, 
  HealthManifest,
  GisFeature
} from '../../types/gis';

export interface SpatialItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  feature: GisFeature;
}

export const pincodesIndex = new RBush<SpatialItem>();
export const districtsIndex = new RBush<SpatialItem>();
export const tnebIndex = new RBush<SpatialItem>();
export const stateBoundaryIndex = new RBush<SpatialItem>();
export const acIndex = new RBush<SpatialItem>();
export const pcIndex = new RBush<SpatialItem>();
export const policeBoundariesIndex = new RBush<SpatialItem>();
export const policeStationsIndex = new RBush<SpatialItem>();
export const pdsIndexes = new Map<string, RBush<SpatialItem>>();
export const pdsStatewideIndex = new RBush<SpatialItem>();

export const localBodyIndexes = {
  CORPORATION: new RBush<SpatialItem>(),
  MUNICIPALITY: new RBush<SpatialItem>(),
  TOWN_PANCHAYAT: new RBush<SpatialItem>(),
  VILLAGE_PANCHAYAT: new RBush<SpatialItem>()
};

export const loadedVillagePanchayats: Map<string, GisFeatureCollection> = new Map();
export const postalOfficesIndex: Map<string, PostalOffice[]> = new Map();
export const loadedPds: Map<string, GisFeatureCollection> = new Map();
export const loadedHealthDistricts: Map<string, GisFeatureCollection> = new Map();
export const loadedPostalDistricts: Map<string, PostalOffice[]> = new Map();
export const loadedPoliceDistricts: Map<string, { boundaries: GisFeatureCollection, stations: GisFeatureCollection }> = new Map();
export const loadedTnebDistricts: Map<string, { boundaries: GisFeatureCollection, offices: GisFeatureCollection }> = new Map();
export const healthDistrictIndexes: Map<string, RBush<SpatialItem>> = new Map();

export let districtsGeoJson: GisFeatureCollection | null = null;
export let stateBoundaryGeoJson: GisFeatureCollection | null = null;
export let pdsIndex: [string, string, string, string, number, number][] | null = null;
export let pincodesGeoJson: GisFeatureCollection | null = null;
export let tnebOffices: GisFeatureCollection | null = null;
export let acGeoJson: GisFeatureCollection | null = null;
export let pcGeoJson: GisFeatureCollection | null = null;
export let policeBoundariesGeoJson: GisFeatureCollection | null = null;
export let policeStationsGeoJson: GisFeatureCollection | null = null;
export let healthManifest: HealthManifest | null = null;
export let healthPriorityGeoJson: GisFeatureCollection | null = null;
export let healthSearchIndex: any[][] | null = null;
export let tnebSearchIndex: any[][] | null = null;
export let policeSearchIndex: any[][] | null = null;
export let pdsManifest: any[] | null = null;
export let policeCrosswalk: Record<string, string> | null = null;
export let policeValidation: Record<string, { status: string; error: string }> | null = null;

export const setDistrictsGeoJson = (val: GisFeatureCollection | null) => { districtsGeoJson = val; };
export const setStateBoundaryGeoJson = (val: GisFeatureCollection | null) => { stateBoundaryGeoJson = val; };
export const setPdsIndex = (val: [string, string, string, string, number, number][] | null) => { pdsIndex = val; };
export const setPincodesGeoJson = (val: GisFeatureCollection | null) => { pincodesGeoJson = val; };
export const setTnebOffices = (val: GisFeatureCollection | null) => { tnebOffices = val; };
export const setAcGeoJson = (val: GisFeatureCollection | null) => { acGeoJson = val; };
export const setPcGeoJson = (val: GisFeatureCollection | null) => { pcGeoJson = val; };
export const setPoliceBoundariesGeoJson = (val: GisFeatureCollection | null) => { policeBoundariesGeoJson = val; };
export const setPoliceStationsGeoJson = (val: GisFeatureCollection | null) => { policeStationsGeoJson = val; };
export const setHealthManifest = (val: HealthManifest | null) => { healthManifest = val; };
export const setHealthPriorityGeoJson = (val: GisFeatureCollection | null) => { healthPriorityGeoJson = val; };
export const setHealthSearchIndex = (val: any[][] | null) => { healthSearchIndex = val; };
export const setTnebSearchIndex = (val: any[][] | null) => { tnebSearchIndex = val; };
export const setPoliceSearchIndex = (val: any[][] | null) => { policeSearchIndex = val; };
export const setPdsManifest = (val: any[] | null) => { pdsManifest = val; };
export const setPoliceCrosswalk = (val: Record<string, string> | null) => { policeCrosswalk = val; };
export const setPoliceValidation = (val: Record<string, { status: string; error: string }> | null) => { policeValidation = val; };
