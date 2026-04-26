export type ServiceLayer = 'PINCODE' | 'PDS' | 'TNEB' | 'CONSTITUENCY' | 'POLICE' | 'HEALTH' | 'LOCAL_BODIES_V2';

export type Position = [number, number];
export type BBox = [number, number, number, number];

export interface Geometry {
  type: 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString' | 'Polygon' | 'MultiPolygon';
  coordinates: unknown;
}

export interface Point extends Geometry {
  type: 'Point';
  coordinates: Position;
}

export interface MultiPoint extends Geometry {
  type: 'MultiPoint';
  coordinates: Position[];
}

export interface LineString extends Geometry {
  type: 'LineString';
  coordinates: Position[];
}

export interface MultiLineString extends Geometry {
  type: 'MultiLineString';
  coordinates: Position[][];
}

export interface Polygon extends Geometry {
  type: 'Polygon';
  coordinates: Position[][];
}

export interface MultiPolygon extends Geometry {
  type: 'MultiPolygon';
  coordinates: Position[][][];
}

export interface GisProperties {
  [key: string]: string | number | boolean | null | undefined | Position;
  district?: string;
  office_name?: string;
  PIN_CODE?: string | number;
  pincode?: string | number;
  NAME?: string;
  office_typ?: string;
  region_nam?: string;
}

export interface GisFeature<G extends Geometry = Geometry, P = GisProperties> {
  type: 'Feature';
  geometry: G;
  properties: P;
  bbox?: BBox;
  id?: string | number;
  suggestionType?: 'PINCODE' | 'PDS_SHOP' | 'TNEB_SECTION' | 'DISTRICT' | 'CONSTITUENCY' | 'POLICE_STATION' | 'HEALTH_FACILITY';
}

export interface ConstituencyProperties extends GisProperties {
  district_n?: string; // For AC
  assembly_c?: string; // For AC name
  parliame_1?: string; // For both AC (parent) and PC (name)
}

export interface GisFeatureCollection<G extends Geometry = Geometry, P = GisProperties> {
  type: 'FeatureCollection';
  features: GisFeature<G, P>[];
  bbox?: BBox;
}

export interface PdsProperties extends GisProperties {
  shop_code: string;
  name: string;
  village: string;
  taluk: string;
  district: string;
  coords: Position;
}

export type PdsShop = GisFeature<Point, PdsProperties>;

export interface TnebProperties extends GisProperties {
  section_na?: string;
  section_office?: string;
  section_co?: string | number;
  subdivisio?: string;
  sub_division?: string;
  subdivis_1?: string | number;
  sub_div_co?: string | number;
  division_n?: string;
  division?: string;
  division_c?: string | number;
  div_cod?: string | number;
  circle_nam?: string;
  circle?: string;
  circle_cod?: string | number;
  region_nam?: string;
  region?: string;
  region_id?: string | number;
  region_cod?: string | number;
}

export interface TnebSection extends TnebProperties {
  office_location?: Position;
}

export interface PoliceBoundaryProperties extends GisProperties {
  police_s_1: string; // Key (PS Code)
  police_sta: string; // Name alias 1
  police_s_2?: string; // Name alias 2
  police_dis: string;
  taluk_name: string;
  district_n: string;
}

export type PoliceMatchConfidence = 'exact' | 'high' | 'medium' | 'low' | 'unresolved';

export interface PoliceMatchDebug {
  boundaryId: string; // ciprus_loc or derived
  boundaryCode: string;
  boundaryAliases: string[];
  stationCode?: string;
  stationAliases?: string[];
  inferredStationCode?: string;
  codeMatch: boolean;
  aliasMatchStrength: number;
  isInsideBoundary: boolean;
  distanceToClick: number;
  distanceToCentroid: number;
  overrideUsed: boolean;
  confidence: PoliceMatchConfidence;
  reason: string;
  method: string;
}

export interface PoliceResolutionResult {
  boundary: GisFeature<Polygon | MultiPolygon, PoliceBoundaryProperties>;
  station: GisFeature<Point, PoliceStationProperties> | null;
  confidence: PoliceMatchConfidence;
  reason: string;
  debug: PoliceMatchDebug;
  isBoundaryValid?: boolean;
  validationError?: string;
}

export interface PoliceStationProperties extends GisProperties {
  ps_code: string; // Key
  ps_name: string; // Name
  name: string;    // Full Name
  status: boolean;
  station_location?: Position;
  district?: string;
  taluk?: string;
}
export interface PostalOffice {
  circlename: string;
  regionname: string;
  divisionname: string;
  officename: string;
  pincode: string;
  officetype: string;
  delivery: string;
  district: string;
  statename: string;
  latitude: string | number;
  longitude: string | number;
  isOutlier?: boolean;
  outlierReason?: string;
}

export interface HealthFacilityProperties extends GisProperties {
  reference_?: string | number;
  facility_n: string;
  facility_t: string;
  nin_number?: string | number;
  district_n: string;
  sub_distri?: string;
  block_name?: string;
  location_t?: string;
  timing_of_?: string;
  phc_catego?: string;
  fru?: string;
  under_heal?: string;
  hwc?: string;
  kayakalp?: string;
  nqas?: string;
  delivery_p?: string;
  blood_bank?: string;
  blood_stor?: string;
  ct?: string;
  mri?: string;
  dialysis_c?: string;
  sncu?: string;
  nbsu?: string;
  deic?: string;
  cbnaat_sit?: string;
  tele_v_car?: string;
  stemi_hubs?: string;
  stemi_spok?: string;
  cath_lab_m?: string;
  prem_centr?: string;
  script_hub?: string;
  script_spo?: string;
}

export type HealthFacility = GisFeature<Point, HealthFacilityProperties>;

export interface HealthDistrictSummary {
  district: string;
  file_name: string;
  total: number;
  by_type: Record<string, number>;
  location: Record<string, number>;
  capabilities: Record<string, number>;
}

export interface HealthManifest {
  generated_at: string;
  total_facilities: number;
  district_count: number;
  priority_types: string[];
  capability_fields: string[];
  statewide: {
    by_type: Record<string, number>;
    location: Record<string, number>;
    capabilities: Record<string, number>;
    priority_total: number;
  };
  districts: HealthDistrictSummary[];
}
export type HealthScope = 'STATE' | 'DISTRICT' | 'PINCODE';

export interface HealthFilters {
  facilityTypes: string[]; // e.g., ['PHC', 'CHC', 'MCH', 'DH', 'SDH', 'HSC']
  locationType: 'Urban' | 'Rural' | 'All';
  isHwc: boolean | null;
  hasDelivery: boolean | null;
  isFru: boolean | null;
  is24x7: boolean | null;
  // Maternal / Emergency
  hasBloodBank: boolean | null;
  hasBloodStorage: boolean | null;
  // Child / Neonatal
  hasSncu: boolean | null;
  hasNbsu: boolean | null;
  hasDeic: boolean | null;
  // Diagnostics / Specialty
  hasCt: boolean | null;
  hasMri: boolean | null;
  hasDialysis: boolean | null;
  hasCbnaat: boolean | null;
  hasTeleConsultation: boolean | null;
  // Cardiac / Advanced
  hasStemiHub: boolean | null;
  hasStemiSpoke: boolean | null;
  hasCathLab: boolean | null;
}

export interface HealthSummary {
  name: string;
  scope: HealthScope;
  total: number;
  countsByType: Record<string, number>;
  countsByCapability: Record<string, number>;
  activeFilters: string[];
  district?: string;
  pincode?: string;
}
