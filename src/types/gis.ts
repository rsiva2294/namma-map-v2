export type ServiceLayer = 'PINCODE' | 'PDS' | 'TNEB' | 'CONSTITUENCY' | 'POLICE';

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
  suggestionType?: 'PINCODE' | 'PDS_SHOP' | 'TNEB_SECTION' | 'DISTRICT' | 'CONSTITUENCY' | 'POLICE_STATION';
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
}
