import type { 
  GisFeature, 
  GisFeatureCollection, 
  Geometry, 
  Position, 
  Point,
  Polygon, 
  MultiPolygon,
  PoliceBoundaryProperties,
  PoliceStationProperties,
  PoliceResolutionResult,
  PostalOffice
} from '../../types/gis';
import type { LocalBodyV2Properties } from '../../types/gis_v2';
import * as topojson from 'topojson-client';
import RBush from 'rbush';
import type { SpatialItem } from './state';
import { 
  localBodyIndexes, 
  districtsIndex, 
  loadedVillagePanchayats, 
  stateBoundaryGeoJson, 
  stateBoundaryIndex
} from './state';
import { fetchWithRetry } from './db';
import { 
  isPointInPolygon, 
  getBBox, 
  normalizeDistrictName, 
  getCentroid, 
  getDistance
} from './utils';

export function findFeatureAt(point: [number, number], index: RBush<SpatialItem>, buffer = 0.0001) {
  const [lng, lat] = point;
  const candidates = index.search({
    minX: lng - buffer,
    minY: lat - buffer,
    maxX: lng + buffer,
    maxY: lat + buffer
  });

  const foundItem = candidates.find(item => {
    const geometry = item.feature.geometry;
    if (!geometry) return false;
    if (geometry.type === 'Polygon') return isPointInPolygon([lng, lat], (geometry as Polygon).coordinates);
    if (geometry.type === 'MultiPolygon') return (geometry as MultiPolygon).coordinates.some((poly: Position[][]) => isPointInPolygon([lng, lat], poly));
    return false;
  });

  return foundItem ? foundItem.feature : null;
}

export async function handleLocalBodyV2Resolution(lat: number, lng: number, keepSelection: boolean = false) {
  let resolvedLocal: GisFeature | null = null;
  let resolvedType: string = '';

  resolvedLocal = findFeatureAt([lng, lat], localBodyIndexes.CORPORATION);
  if (resolvedLocal) resolvedType = 'CORPORATION';

  if (!resolvedLocal) {
    resolvedLocal = findFeatureAt([lng, lat], localBodyIndexes.MUNICIPALITY);
    if (resolvedLocal) resolvedType = 'MUNICIPALITY';
  }

  if (!resolvedLocal) {
    resolvedLocal = findFeatureAt([lng, lat], localBodyIndexes.TOWN_PANCHAYAT);
    if (resolvedLocal) resolvedType = 'TOWN_PANCHAYAT';
  }

  if (!resolvedLocal) {
    resolvedLocal = findFeatureAt([lng, lat], localBodyIndexes.VILLAGE_PANCHAYAT);
    if (resolvedLocal) {
      resolvedType = 'VILLAGE_PANCHAYAT';
    } else {
      const distFeature = findFeatureAt([lng, lat], districtsIndex);
      if (distFeature) {
        const districtName = (distFeature.properties.district_n || distFeature.properties.district || distFeature.properties.NAME || distFeature.properties.dist_name)?.toString();
        if (districtName) {
          const districtClean = normalizeDistrictName(districtName).replace(/\s+/g, '');

          if (!loadedVillagePanchayats.has(districtClean)) {
            try {
              // Map normalized name to actual filename (Sentence Case)
              let fileName = districtClean.charAt(0).toUpperCase() + districtClean.slice(1).toLowerCase();
              
              // Special Mappings for Village Panchayat directory
              const specialMappings: Record<string, string> = {
                'THENILGIRIS': 'The_Nilgiris',
                'NILGIRIS': 'The_Nilgiris',
                'TUTICORIN': 'Thoothukudi',
                'THOOTHUKUDI': 'Thoothukudi',
                'THIRUCHIRAPALLI': 'Tiruchirapalli',
                'TIRUCHIRAPPALLI': 'Tiruchirapalli',
                'TIRUPATTUR': 'Tirupathur',
                'VILUPPURAM': 'Villupuram',
                'CHENGALPET': 'Chengalpattu'
              };

              if (specialMappings[districtClean]) {
                fileName = specialMappings[districtClean];
              }

              console.log(`[Worker] Attempting to auto-load VP for ${districtClean} via ${fileName}.json`);
              const data = await fetchWithRetry(`/data/local_bodies/village_panchayat/${fileName}.json`);
              let vpFC: GisFeatureCollection;
              if (data.type === 'Topology') {
                vpFC = topojson.feature(data, data.objects[Object.keys(data.objects)[0]]) as unknown as GisFeatureCollection;
              } else {
                vpFC = data;
              }
              loadedVillagePanchayats.set(districtClean, vpFC);
            } catch (err) {
              console.warn(`[Worker] Auto-load VP failed: ${districtClean}`, err);
            }
          }

          const vpData = loadedVillagePanchayats.get(districtClean);
          if (vpData) {
            const scratchIndex = new RBush<SpatialItem>();
            const bboxItems = vpData.features.map((f: GisFeature) => {
               const bbox = getBBox(f.geometry);
               return { minX: bbox[0], minY: bbox[1], maxX: bbox[2], maxY: bbox[3], feature: f };
            });
            scratchIndex.load(bboxItems);
            resolvedLocal = findFeatureAt([lng, lat], scratchIndex);
            if (resolvedLocal) {
              resolvedType = 'VILLAGE_PANCHAYAT';
              localBodyIndexes.VILLAGE_PANCHAYAT.clear();
              localBodyIndexes.VILLAGE_PANCHAYAT.load(bboxItems);
            }
          }
        }
      }
    }
  }

  if (!resolvedLocal) {
    console.log(`[Worker] Local Body Resolution Failed at [${lat}, ${lng}]. Index sizes: Corp=${localBodyIndexes.CORPORATION.all().length}, Muni=${localBodyIndexes.MUNICIPALITY.all().length}, TP=${localBodyIndexes.TOWN_PANCHAYAT.all().length}`);
  }

  if (resolvedLocal) {
    let resolvedName = 'Unknown';
    if (resolvedType === 'CORPORATION') {
      resolvedName = (resolvedLocal.properties.Corporatio || resolvedLocal.properties.name || 'Unknown').toString();
    } else if (resolvedType === 'MUNICIPALITY') {
      resolvedName = (resolvedLocal.properties.Municipali || resolvedLocal.properties.name || 'Unknown').toString();
    } else if (resolvedType === 'TOWN_PANCHAYAT') {
      resolvedName = (resolvedLocal.properties.name || resolvedLocal.properties.p_name_rd || resolvedLocal.properties.tp_name || 'Unknown').toString();
    } else {
      resolvedName = (resolvedLocal.properties.panchayat_n || resolvedLocal.properties.panchayat || resolvedLocal.properties.name || resolvedLocal.properties.Village || 'Unknown').toString();
    }

    const normalized: LocalBodyV2Properties = {
      id: (resolvedLocal.properties.id || resolvedLocal.id || Date.now()).toString(),
      name: resolvedName,
      type: resolvedType as any,
      district: (resolvedLocal.properties.District || resolvedLocal.properties.district || resolvedLocal.properties.dist_name || 'Unknown').toString(),
      block: resolvedLocal.properties.Block?.toString() || resolvedLocal.properties.b_name?.toString(),
      taluk: resolvedLocal.properties.taluk?.toString() || resolvedLocal.properties.Taluk?.toString(),
      category: resolvedLocal.properties.type1?.toString(),
      raw: resolvedLocal.properties
    };

    self.postMessage({
      type: 'RESOLUTION_RESULT',
      payload: {
        found: true,
        properties: normalized,
        geometry: resolvedLocal.geometry,
        layer: 'LOCAL_BODIES_V2',
        keepSelection
      }
    });
  } else {
    const isInsideState = stateBoundaryGeoJson ? findFeatureAt([lng, lat], stateBoundaryIndex) : false;
    self.postMessage({
      type: 'RESOLUTION_RESULT',
      payload: { found: false, lat, lng, layer: 'LOCAL_BODIES_V2', isInsideState: !!isInsideState }
    });
  }
}

export function flagPostalOutliers(offices: PostalOffice[], boundary: Geometry): PostalOffice[] {
  if (!boundary || !offices.length) return offices;

  const centroid = getCentroid(boundary);
  if (!centroid) return offices;

  return offices.map(off => {
    const lat = parseFloat(off.latitude as string);
    const lng = parseFloat(off.longitude as string);

    if (isNaN(lat) || isNaN(lng)) {
      return { ...off, isOutlier: true, outlierReason: 'Invalid coordinates' };
    }

    const dist = getDistance(centroid, [lng, lat]);

    if (dist > 0.15) {
      return { ...off, isOutlier: true, outlierReason: 'Coordinates far from pincode area' };
    }

    return { ...off, isOutlier: false };
  });
}

export function resolvePoliceStation(
  boundary: GisFeature<Polygon | MultiPolygon, PoliceBoundaryProperties>,
  stations: GisFeatureCollection<Point, PoliceStationProperties>,
  clickPoint?: Position
): PoliceResolutionResult {
  const bCentroid = getCentroid(boundary.geometry);

  // Simple resolution logic for modularity
  let bestStation: GisFeature<Point, PoliceStationProperties> | null = null;
  let minDistance = Infinity;

  for (const s of stations.features) {
    const dist = getDistance(s.geometry.coordinates, bCentroid);
    if (dist < minDistance) {
      minDistance = dist;
      bestStation = s;
    }
  }

  return {
    boundary,
    station: bestStation,
    confidence: 'medium',
    reason: 'Proximity based resolution',
    debug: {
        boundaryId: 'unknown',
        confidence: 'medium',
        reason: 'Proximity',
        method: 'spatial',
        distanceToCentroid: minDistance,
        isInsideBoundary: false,
        boundaryCode: '',
        boundaryAliases: [],
        codeMatch: false,
        aliasMatchStrength: 0,
        distanceToClick: clickPoint ? getDistance(clickPoint, bCentroid) : 0,
        overrideUsed: false
    },
    isBoundaryValid: true
  };
}
