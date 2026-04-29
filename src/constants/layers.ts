import type { ServiceLayer } from '../types/gis';

export interface LayerConfig {
  slug: string;
  name: string;
  description: string;
}

export const LAYER_CONFIGS: Record<ServiceLayer, LayerConfig> = {
  'PINCODE': {
    slug: 'pincode',
    name: 'Post Offices',
    description: 'post offices and pincode boundaries'
  },
  'PDS': {
    slug: 'pds',
    name: 'Ration Shops',
    description: 'PDS ration shops and fair price shops'
  },
  'TNEB': {
    slug: 'tneb',
    name: 'Electricity Board (TNEB)',
    description: 'TNEB section offices and electricity distribution areas'
  },
  'CONSTITUENCY': {
    slug: 'constituency',
    name: 'Constituencies',
    description: 'Assembly and Parliamentary constituency boundaries'
  },
  'POLICE': {
    slug: 'police',
    name: 'Police Stations',
    description: 'police stations and jurisdictional boundaries'
  },
  'HEALTH': {
    slug: 'health',
    name: 'Health Facilities',
    description: 'government hospitals, PHCs, and health sub-centres'
  },
  'LOCAL_BODIES_V2': {
    slug: 'local-bodies',
    name: 'Local Bodies',
    description: 'corporations, municipalities, and village panchayats'
  }
};
