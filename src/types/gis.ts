export type ServiceLayer = 'PINCODE' | 'PDS' | 'TNEB';

export interface GisFeature {
  type: 'Feature';
  geometry: {
    type: string;
    coordinates: any;
  };
  properties: {
    [key: string]: any;
    district?: string;
    office_name?: string;
    PIN_CODE?: string;
    pincode?: string;
  };
  suggestionType?: 'PINCODE' | 'PDS_SHOP' | 'TNEB_SECTION';
}

export interface PdsShop extends GisFeature {
  properties: {
    shop_code: string;
    name: string;
    village: string;
    taluk: string;
    district: string;
    coords: [number, number];
  };
}

export interface TnebSection {
  section_na?: string;
  section_office?: string;
  subdivisio?: string;
  sub_division?: string;
  division_n?: string;
  division?: string;
  circle_nam?: string;
  circle?: string;
  region_nam?: string;
  region?: string;
  office_location?: [number, number];
}
