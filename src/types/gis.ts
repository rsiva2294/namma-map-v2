export type ServiceLayer = 'PINCODE' | 'PDS' | 'TNEB';

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
  suggestionType?: 'PINCODE' | 'PDS_SHOP' | 'TNEB_SECTION';
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
