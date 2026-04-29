import * as topojson from 'topojson-client';
import RBush from 'rbush';
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
  PostalOffice,
  HealthFacilityProperties
} from '../types/gis';
import type { SpatialItem } from './gis/state';
import { 
  getCacheDB, 
  fetchWithRetry, 
  CACHE_STORE 
} from './gis/db';
import { 
  getBBox, 
  isPointInPolygon, 
  extractPoliceCode, 
  getDistance, 
  getCentroid,
  getScore,
  resolveDistrictIdentity
} from './gis/utils';
import { 
  fetchGoogleGeocode, 
  type ScoredSuggestion 
} from './gis/search';
import { 
  findFeatureAt, 
  handleLocalBodyV2Resolution, 
  flagPostalOutliers, 
  resolvePoliceStation 
} from './gis/resolvers';
import { 
  pincodesIndex, 
  districtsIndex, 
  pdsIndexes, 
  acIndex, 
  pcIndex, 
  policeBoundariesIndex, 
  policeStationsIndex, 
  tnebIndex,
  pdsStatewideIndex,
  stateBoundaryIndex,
  localBodyIndexes,
  districtsGeoJson,
  stateBoundaryGeoJson,
  pdsIndex,
  pincodesGeoJson,
  tnebOffices,
  acGeoJson,
  pcGeoJson,
  policeBoundariesGeoJson,
  policeStationsGeoJson,
  healthManifest,
  healthPriorityGeoJson,
  healthSearchIndex,
  tnebSearchIndex,
  policeSearchIndex,
  pdsManifest,
  policeValidation,
  setDistrictsGeoJson,
  setStateBoundaryGeoJson,
  setPdsIndex,
  setPincodesGeoJson,
  setTnebOffices,
  setAcGeoJson,
  setPcGeoJson,
  setPoliceBoundariesGeoJson,
  setPoliceStationsGeoJson,
  setHealthManifest,
  setHealthPriorityGeoJson,
  setHealthSearchIndex,
  setTnebSearchIndex,
  setPoliceSearchIndex,
  setPdsManifest,
  setPoliceValidation,
  postalOfficesIndex,
  loadedPds,
  loadedHealthDistricts,
  loadedPostalDistricts,
  loadedPoliceDistricts,
  loadedTnebDistricts,
  healthDistrictIndexes
} from './gis/state';
import { resolveChennaiPolice } from '../utils/resolvers/chennaiPoliceResolver';
import { extractCoordinatesFromUrl } from '../utils/urlParser';

// --- Message Handling ---

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'SET_VERSION':
      try {
        const { version } = payload;
        const db = await getCacheDB();
        const stored = await db.get(CACHE_STORE, 'app-version');
        if (stored && stored.data !== version) {
          await db.clear(CACHE_STORE);
          console.log('[Worker] App version changed. Cache cleared.');
        }
        await db.put(CACHE_STORE, { url: 'app-version', data: version, expiresAt: Infinity });
      } catch (e) {
        console.warn('[Worker] Version sync failed', e);
      }
      break;
    
    case 'INIT_DB':
      self.postMessage({ type: 'READY' });
      break;

    case 'LOAD_DISTRICTS':
      try {
        if (!districtsGeoJson) {
          const data = await fetchWithRetry('/data/tn_districts.topojson');
          const objectName = Object.keys(data.objects)[0];
          const feature = topojson.feature(data, data.objects[objectName]) as unknown as GisFeature | GisFeatureCollection;
          const fc: GisFeatureCollection = feature.type === 'FeatureCollection' ? (feature as GisFeatureCollection) : { type: 'FeatureCollection' as const, features: [feature as GisFeature] };
          setDistrictsGeoJson(fc);

          // Indexing with safety filters
          const items: SpatialItem[] = fc.features
            .filter(f => f.geometry && f.geometry.coordinates)
            .map((f: GisFeature) => {
              const bbox = getBBox(f.geometry);
              return {
                minX: bbox[0], minY: bbox[1], maxX: bbox[2], maxY: bbox[3],
                feature: f
              };
            });
          districtsIndex.load(items);
        }
        self.postMessage({ type: 'DISTRICTS_LOADED', payload: districtsGeoJson });
      } catch (err) {
        console.error('[Worker] Error loading districts:', err);
        self.postMessage({ type: 'ERROR', payload: 'Failed to load district data' });
      }
      break;

    case 'LOAD_STATE_BOUNDARY':
      try {
        if (!stateBoundaryGeoJson) {
          const data = await fetchWithRetry('/data/tn_state_boundary.topojson');
          const objectName = Object.keys(data.objects)[0];
          const feature = topojson.feature(data, data.objects[objectName]) as unknown;
          if (feature && typeof feature === 'object' && 'type' in feature && (feature as any).type === 'FeatureCollection') {
            setStateBoundaryGeoJson(feature as GisFeatureCollection);
          } else {
            setStateBoundaryGeoJson({ type: 'FeatureCollection', features: [feature as GisFeature] });
          }

          // Indexing with safety filters
          const items: SpatialItem[] = stateBoundaryGeoJson!.features
            .filter(f => f.geometry && f.geometry.coordinates)
            .map((f: GisFeature) => {
              const bbox = getBBox(f.geometry);
              return { minX: bbox[0], minY: bbox[1], maxX: bbox[2], maxY: bbox[3], feature: f };
            });
          stateBoundaryIndex.load(items);
        }
        self.postMessage({ type: 'STATE_BOUNDARY_LOADED', payload: stateBoundaryGeoJson });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        self.postMessage({ type: 'ERROR', payload: `Failed to load state boundary: ${message}` });
      }
      break;

    case 'LOAD_PDS_INDEX':
      try {
        if (!pdsIndex) setPdsIndex(await fetchWithRetry('/data/pds_index.json'));
        if (!pdsManifest) setPdsManifest(await fetchWithRetry('/data/pds_manifest.json'));

        // Build statewide spatial index for PDS shops
        if (pdsIndex && pdsStatewideIndex.all().length === 0) {
          const items: SpatialItem[] = pdsIndex.map(shop => ({
            minX: shop[5], minY: shop[4], maxX: shop[5], maxY: shop[4],
            feature: {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [shop[5], shop[4]] },
              properties: {
                shop_code: shop[0],
                name: shop[1],
                taluk: shop[2],
                district: shop[3]
              }
            } as GisFeature
          }));
          pdsStatewideIndex.load(items);
        }

        self.postMessage({ type: 'PDS_INDEX_LOADED' });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        self.postMessage({ type: 'ERROR', payload: `Failed to load PDS assets: ${message}` });
      }
      break;

    case 'LOAD_TNEB_STATEWIDE':
      try {
        if (!tnebSearchIndex) {
          setTnebSearchIndex(await fetchWithRetry('/data/tneb_index.json'));
        }
        self.postMessage({ type: 'TNEB_STATEWIDE_LOADED' });
      } catch (err) {
        console.error('[Worker] Error loading TNEB search index:', err);
        self.postMessage({ type: 'ERROR', payload: 'Failed to load TNEB search index' });
      }
      break;

    case 'LOAD_TNEB_DISTRICT':
      try {
        const { district } = payload;
        if (!district) return;

        if (!loadedTnebDistricts.has(district)) {
          const [dataBound, dataOff] = await Promise.all([
            fetchWithRetry(`/data/tneb_by_district/${district}_boundaries.json`),
            fetchWithRetry(`/data/tneb_by_district/${district}_offices.json`)
          ]);

          const boundaries = dataBound as GisFeatureCollection;
          const offices = dataOff as GisFeatureCollection;

          loadedTnebDistricts.set(district, { boundaries, offices });

          // Index boundaries for spatial resolution
          const items: SpatialItem[] = boundaries.features
            .filter(f => f.geometry && f.geometry.coordinates)
            .map((f: GisFeature) => {
              const bbox = getBBox(f.geometry);
              return { minX: bbox[0], minY: bbox[1], maxX: bbox[2], maxY: bbox[3], feature: f };
            });
          tnebIndex.load(items);

          // Merge offices into the statewide collection if not already there (for metadata fallbacks)
          const currentOffices = tnebOffices || { type: 'FeatureCollection' as const, features: [] };
          offices.features.forEach((f: GisFeature) => {
            if (!currentOffices.features.some(o => o.properties.section_co === f.properties.section_co && o.properties.circle_cod === f.properties.circle_cod)) {
              currentOffices.features.push(f);
            }
          });
          setTnebOffices(currentOffices);
        }

        const { boundaries, offices } = loadedTnebDistricts.get(district)!;
        self.postMessage({ type: 'TNEB_DISTRICT_LOADED', payload: { district, boundaries, offices } });
      } catch (err) {
        console.error('[Worker] Error loading TNEB district:', err);
        self.postMessage({ type: 'ERROR', payload: `Failed to load TNEB data for ${payload.district}` });
      }
      break;

    case 'RESOLVE_LOCATION': {
      const { lat, lng, layer, keepSelection, pincode: pincodeOverride } = payload;

      let found: GisFeature | null = null;
      if (layer === 'TNEB') {
        if (tnebIndex.all().length === 0 || !findFeatureAt([lng, lat], tnebIndex)) {
          const distFeature = findFeatureAt([lng, lat], districtsIndex);
          const districtName = (distFeature?.properties.district_n || distFeature?.properties.district)?.toString();

          if (districtName && !loadedTnebDistricts.has(districtName)) {
            try {
              const [dataBound, dataOff] = await Promise.all([
                fetchWithRetry(`/data/tneb_by_district/${districtName}_boundaries.json`),
                fetchWithRetry(`/data/tneb_by_district/${districtName}_offices.json`)
              ]);

              const boundaries = dataBound as GisFeatureCollection;
              const offices = dataOff as GisFeatureCollection;

              loadedTnebDistricts.set(districtName, { boundaries, offices });

              const items: SpatialItem[] = boundaries.features
                .filter(f => f.geometry && f.geometry.coordinates)
                .map((f: GisFeature) => {
                  const bbox = getBBox(f.geometry);
                  return { minX: bbox[0], minY: bbox[1], maxX: bbox[2], maxY: bbox[3], feature: f };
                });
              tnebIndex.load(items);

              const currentOffices = tnebOffices || { type: 'FeatureCollection' as const, features: [] };
              offices.features.forEach((f: GisFeature) => {
                if (!currentOffices.features.some(o => o.properties.section_co === f.properties.section_co && o.properties.circle_cod === f.properties.circle_cod)) {
                  currentOffices.features.push(f);
                }
              });
              setTnebOffices(currentOffices);
            } catch (err) {
              console.error('[Worker] Error lazy loading TNEB district:', err);
            }
          }
        }

        found = findFeatureAt([lng, lat], tnebIndex);

        if (found) {
          const office = tnebOffices?.features.find((o: GisFeature) => {
            const sCoMatch = o.properties.section_co === found?.properties.section_co;
            const cCodMatch = o.properties.circle_cod === found?.properties.circle_cod;
            const rIdMatch = (o.properties.region_id || o.properties.region_cod) === (found?.properties.region_cod || found?.properties.region_id);
            return sCoMatch && cCodMatch && rIdMatch;
          });

          self.postMessage({
            type: 'RESOLUTION_RESULT',
            payload: {
              properties: { ...found.properties, office_location: office?.geometry.coordinates },
              geometry: found.geometry,
              layer: 'TNEB',
              keepSelection
            }
          });
        }
      } else if (layer === 'CONSTITUENCY') {
        const { constituencyType, pincode: pincodeOverride } = payload;

        if (pincodeOverride) {
          const pinFeature = pincodesGeoJson?.features.find(f => (f.properties.pin_code || f.properties.PIN_CODE || f.properties.pincode)?.toString() === pincodeOverride.toString());
          if (pinFeature) {
            const centroid = getCentroid(pinFeature.geometry);
            const resolvedConst = findFeatureAt(centroid as [number, number], constituencyType === 'PC' ? pcIndex : acIndex);

            if (resolvedConst) {
              self.postMessage({
                type: 'RESOLUTION_RESULT',
                payload: {
                  properties: { ...resolvedConst.properties, ...pinFeature.properties },
                  geometry: pinFeature.geometry,
                  layer: 'CONSTITUENCY',
                  constituencyType,
                  keepSelection
                }
              });
              return;
            } else {
              // Fallback to just pincode if no constituency found at centroid (unlikely but possible at borders)
              found = pinFeature;
            }
          }
        } else {
          found = findFeatureAt([lng, lat], constituencyType === 'PC' ? pcIndex : acIndex);
        }

        if (found) {
          self.postMessage({
            type: 'RESOLUTION_RESULT',
            payload: {
              properties: found.properties,
              geometry: found.geometry,
              layer: 'CONSTITUENCY',
              constituencyType,
              keepSelection
            }
          });
        }
      } else if (layer === 'POLICE') {
        const { stationCode } = payload;

        // Ensure district boundaries are loaded for this area
        const distFeature = findFeatureAt([lng, lat], districtsIndex);
        const districtName = (distFeature?.properties.district_n || distFeature?.properties.district)?.toString();

        const loadPoliceDistrict = async (name: string) => {
          if (!name || loadedPoliceDistricts.has(name)) return;
          try {
            const [dataBound, dataOff] = await Promise.all([
              fetchWithRetry(`/data/police_by_district/${name}_boundaries.json`),
              fetchWithRetry(`/data/police_by_district/${name}_stations.json`)
            ]);

            const boundaries = dataBound as GisFeatureCollection;
            const stations = dataOff as GisFeatureCollection;

            loadedPoliceDistricts.set(name, { boundaries, stations });

            const items: SpatialItem[] = boundaries.features
              .filter(f => f.geometry && f.geometry.coordinates)
              .map(f => {
                const bbox = getBBox(f.geometry);
                return { minX: bbox[0], minY: bbox[1], maxX: bbox[2], maxY: bbox[3], feature: f };
              });
            policeBoundariesIndex.load(items);

            const currentBoundaries = policeBoundariesGeoJson || { type: 'FeatureCollection' as const, features: [] };
            currentBoundaries.features.push(...boundaries.features);
            setPoliceBoundariesGeoJson(currentBoundaries);

            const currentStations = policeStationsGeoJson || { type: 'FeatureCollection' as const, features: [] };
            stations.features.forEach((f: GisFeature) => {
              f.properties.station_location = f.geometry.coordinates as Position;
              if (!currentStations.features.some(s => s.properties.ps_code === f.properties.ps_code && s.properties.ps_name === f.properties.ps_name)) {
                currentStations.features.push(f);
              }
            });
            setPoliceStationsGeoJson(currentStations);
          } catch (err) {
            console.error('[Worker] Error lazy loading police district:', err);
          }
        };

        const isChennai = districtName?.toUpperCase().includes('CHENNAI');

        if (isChennai) {
          // Special case: Chennai City Police covers parts of Tiruvallur and Chengalpattu
          await Promise.all([
            loadPoliceDistrict('Chennai'),
            loadPoliceDistrict('Tiruvallur'),
            loadPoliceDistrict('Chengalpattu')
          ]);
        } else if (districtName) {
          await loadPoliceDistrict(districtName);
        }

        if (stationCode && policeBoundariesGeoJson) {
          // Find all boundaries with this code (codes are not unique statewide)
          // Search across ALL loaded boundaries
          const candidates = policeBoundariesGeoJson.features.filter(f => {
            const code = (f.properties.police_s_1 || '').toString().trim().toUpperCase();
            return code === stationCode && f.geometry;
          });

          if (candidates.length > 0) {
            // Pick the one closest to the clicked coordinates or centroid
            found = candidates.sort((a, b) => {
              const da = getDistance([lng, lat], getCentroid(a.geometry));
              const db = getDistance([lng, lat], getCentroid(b.geometry));
              return da - db;
            })[0];
          }
        }

        if (!found) {
          found = findFeatureAt([lng, lat], policeBoundariesIndex);
        }

        // Proximity Fallback: If no exact containment, try a radial search (approx 200m)
        if (!found && !stationCode) {
          const proximityBuffer = 0.002;
          const candidates = policeBoundariesIndex.search({
            minX: lng - proximityBuffer,
            minY: lat - proximityBuffer,
            maxX: lng + proximityBuffer,
            maxY: lat + proximityBuffer
          });

          if (candidates.length > 0) {
            candidates.sort((a, b) => {
              const da = getDistance([lng, lat], getCentroid(a.feature.geometry));
              const db = getDistance([lng, lat], getCentroid(b.feature.geometry));
              return da - db;
            });
            found = candidates[0].feature;
          }
        }

        if (found && policeStationsGeoJson) {
          // If we have a stationCode, we want to make sure we resolve to THAT station specifically
          // even if the resolver thinks another station is better. 
          // Since codes are not unique, we filter and pick the closest one.
          const targetStation = (() => {
            if (!stationCode || !policeStationsGeoJson) return null;
            const stations = policeStationsGeoJson.features.filter(s => {
              const code = (s.properties.ps_code || extractPoliceCode((s.properties.ps_name || s.properties.name || '').toString())).toString().trim().toUpperCase();
              return code === stationCode && s.geometry;
            });
            if (stations.length > 1) {
              return [...stations].sort((a, b) => {
                const da = getDistance([lng, lat], a.geometry.coordinates as [number, number]);
                const db = getDistance([lng, lat], b.geometry.coordinates as [number, number]);
                return da - db;
              })[0];
            }
            return stations[0] || null;
          })();

          let result: PoliceResolutionResult;

          if (isChennai) {
            const chennaiRes = resolveChennaiPolice(
              [lng, lat],
              policeStationsGeoJson as GisFeatureCollection<Point, PoliceStationProperties>,
              policeBoundariesGeoJson as GisFeatureCollection<Polygon | MultiPolygon, PoliceBoundaryProperties>,
              true
            );

            if (chennaiRes) {
              result = {
                boundary: JSON.parse(JSON.stringify(chennaiRes.matchedBoundary!)),
                station: chennaiRes.primaryStation,
                isBoundaryValid: true,
                confidence: (chennaiRes.confidence >= 90 ? 'high' : chennaiRes.confidence >= 70 ? 'medium' : 'low') as any,
                reason: chennaiRes.matchType,
                debug: {
                  boundaryId: chennaiRes.matchedBoundary?.id?.toString() || 'chennai',
                  boundaryCode: (chennaiRes.matchedBoundary?.properties.police_s_1 || '').toString(),
                  boundaryAliases: [chennaiRes.matchedBoundary?.properties.police_sta || ''],
                  stationCode: chennaiRes.stationCode || undefined,
                  codeMatch: chennaiRes.confidence >= 75,
                  aliasMatchStrength: chennaiRes.confidence / 100,
                  isInsideBoundary: chennaiRes.insidePolygon,
                  distanceToClick: 0,
                  distanceToCentroid: chennaiRes.distanceKm,
                  overrideUsed: false,
                  confidence: (chennaiRes.confidence >= 90 ? 'high' : 'medium') as any,
                  reason: chennaiRes.matchType,
                  method: 'chennai-resolver'
                },
                chennaiResult: chennaiRes
              };
            } else {
              result = resolvePoliceStation(
                found as GisFeature<Polygon | MultiPolygon, PoliceBoundaryProperties>,
                policeStationsGeoJson as GisFeatureCollection<Point, PoliceStationProperties>,
                [lng, lat]
              );
            }
          } else {
            result = resolvePoliceStation(
              found as GisFeature<Polygon | MultiPolygon, PoliceBoundaryProperties>,
              policeStationsGeoJson as GisFeatureCollection<Point, PoliceStationProperties>,
              [lng, lat]
            );
          }

          if (targetStation) {
            result.station = targetStation as GisFeature<Point, PoliceStationProperties>;
            // Re-validate boundary for this specific target station
            const [stLng, stLat] = targetStation.geometry.coordinates as [number, number];
            const stCode = (targetStation.properties.ps_code || extractPoliceCode((targetStation.properties.ps_name || targetStation.properties.name || '').toString())).toString().trim().toUpperCase();
            const stationKey = `${stCode}|${stLat.toFixed(5)}|${stLng.toFixed(5)}`;
            const validation = policeValidation ? policeValidation[stationKey] : null;
            result.isBoundaryValid = !validation || validation.status === 'valid';
            result.validationError = validation?.error;

            // CRITICAL: If boundary is flagged as wrong or missing, nullify the geometry 
            // so the MapController doesn't "fly" to a wrong location.
            if (!result.isBoundaryValid && result.boundary) {
              (result.boundary.geometry as Geometry | null) = null;
            }
          }

          self.postMessage({
            type: 'RESOLUTION_RESULT',
            payload: {
              ...result,
              layer: 'POLICE',
              keepSelection
            }
          });
        } else if (stationCode && policeStationsGeoJson) {
          // Case where boundary is missing but we have the station
          const targetStation = (() => {
            const stations = policeStationsGeoJson.features.filter(s => {
              const code = (s.properties.ps_code || extractPoliceCode((s.properties.ps_name || s.properties.name || '').toString())).toString().trim().toUpperCase();
              return code === stationCode && s.geometry;
            });
            if (stations.length > 1) {
              return [...stations].sort((a, b) => {
                const da = getDistance([lng, lat], a.geometry.coordinates as [number, number]);
                const db = getDistance([lng, lat], b.geometry.coordinates as [number, number]);
                return da - db;
              })[0];
            }
            return stations[0] || null;
          })();

          if (targetStation) {
            const [stLng, stLat] = targetStation.geometry.coordinates as [number, number];
            const stCode = (targetStation.properties.ps_code || extractPoliceCode((targetStation.properties.ps_name || targetStation.properties.name || '').toString())).toString().trim().toUpperCase();
            const stationKey = `${stCode}|${stLat.toFixed(5)}|${stLng.toFixed(5)}`;
            const validation = policeValidation ? policeValidation[stationKey] : null;

            self.postMessage({
              type: 'RESOLUTION_RESULT',
              payload: {
                station: targetStation,
                boundary: { type: 'Feature', geometry: null, properties: {} },
                confidence: 'exact',
                reason: 'Direct station selection',
                isBoundaryValid: false,
                validationError: validation?.error || 'No boundary found for this station',
                layer: 'POLICE',
                keepSelection
              }
            });
          }
        }
      } else if (layer === 'HEALTH') {
        let pinFeature: GisFeature | null = null;
        if (pincodeOverride) {
          pinFeature = pincodesGeoJson?.features.find(f => (f.properties.pin_code || f.properties.PIN_CODE || f.properties.pincode)?.toString() === pincodeOverride.toString()) || null;
        } else {
          pinFeature = findFeatureAt([lng, lat], pincodesIndex);
        }

        const distFeature = pinFeature
          ? findFeatureAt(getCentroid(pinFeature.geometry) as [number, number], districtsIndex)
          : findFeatureAt([lng, lat], districtsIndex);

        self.postMessage({
          type: 'RESOLUTION_RESULT',
          payload: {
            properties: {
              ...(distFeature?.properties || {}),
              ...(pinFeature?.properties || {})
            },
            geometry: pinFeature?.geometry || distFeature?.geometry,
            layer: 'HEALTH',
            keepSelection
          }
        });
        return;
      } else if (layer === 'PINCODE' || layer === 'PDS') {
        if (pincodeOverride) {
          found = pincodesGeoJson?.features.find(f => (f.properties.pin_code || f.properties.PIN_CODE || f.properties.pincode)?.toString() === pincodeOverride.toString()) || null;
        } else {
          found = findFeatureAt([lng, lat], pincodesIndex);
        }

        if (found) {
          const pincode = (found.properties.pin_code || found.properties.PIN_CODE || found.properties.pincode)?.toString();
          const district = (found.properties.district || found.properties.DISTRICT || found.properties.NAME)?.toString();

          if (layer === 'PINCODE' && district && !loadedPostalDistricts.has(district)) {
            // Lazy load the district postal data
            const data = await fetchWithRetry(`/data/postal_by_district/${district}.json`) as PostalOffice[];
            loadedPostalDistricts.set(district, data);
            if (data) {
              data.forEach(po => {
                const pin = po.pincode.toString();
                if (!postalOfficesIndex.has(pin)) postalOfficesIndex.set(pin, []);
                const existing = postalOfficesIndex.get(pin)!;
                if (!existing.some(e => e.officename === po.officename)) {
                  existing.push(po);
                }
              });
            }
          }

          const offices = pincode ? postalOfficesIndex.get(pincode) || [] : [];
          const flaggedOffices = flagPostalOutliers(offices, found.geometry);

          self.postMessage({
            type: 'RESOLUTION_RESULT',
            payload: {
              properties: found.properties,
              geometry: found.geometry,
              layer: 'PINCODE',
              postalOffices: flaggedOffices,
              keepSelection
            }
          });
        }
      } else if (layer === 'LOCAL_BODIES_V2') {
        await handleLocalBodyV2Resolution(lat, lng, keepSelection);
        return;
      }

      if (!found) {
        const isInsideState = stateBoundaryGeoJson ? findFeatureAt([lng, lat], stateBoundaryIndex) : false;

        self.postMessage({
          type: 'RESOLUTION_RESULT',
          payload: { found: false, lat, lng, layer, isInsideState: !!isInsideState }
        });
      }
      break;
    }

    case 'LOAD_PINCODES':
      try {
        if (!pincodesGeoJson) {
          const data = await fetchWithRetry('/data/tn_pincodes.topojson');
          const objectName = Object.keys(data.objects)[0];
          const feature = topojson.feature(data, data.objects[objectName]) as unknown as GisFeature | GisFeatureCollection;
          const fc: GisFeatureCollection = feature.type === 'FeatureCollection' ? (feature as GisFeatureCollection) : { type: 'FeatureCollection' as const, features: [feature as GisFeature] };
          setPincodesGeoJson(fc);

          // Indexing with safety filters
          const items: SpatialItem[] = fc.features
            .filter(f => f.geometry && f.geometry.coordinates)
            .map((f: GisFeature) => {
              const bbox = getBBox(f.geometry);
              return {
                minX: bbox[0], minY: bbox[1], maxX: bbox[2], maxY: bbox[3],
                feature: f
              };
            });
          pincodesIndex.load(items);
        }
        self.postMessage({ type: 'PINCODES_LOADED' });
      } catch (err) {
        console.error('[Worker] Error loading pincodes:', err);
        self.postMessage({ type: 'ERROR', payload: 'Failed to load pincode data' });
      }
      break;

    case 'LOAD_POSTAL_DISTRICT':
      try {
        const { district } = payload;
        if (!district) return;

        if (!loadedPostalDistricts.has(district)) {
          const data = await fetchWithRetry(`/data/postal_by_district/${district}.json`) as PostalOffice[];
          loadedPostalDistricts.set(district, data);

          if (data) {
            data.forEach(po => {
              const pin = po.pincode.toString();
              if (!postalOfficesIndex.has(pin)) postalOfficesIndex.set(pin, []);
              // Avoid duplicates if loading multiple districts that share a pincode (rare but possible)
              const existing = postalOfficesIndex.get(pin)!;
              if (!existing.some(e => e.officename === po.officename)) {
                existing.push(po);
              }
            });
          }
        }
        self.postMessage({ type: 'POSTAL_DISTRICT_LOADED', payload: { district } });
      } catch (err) {
        console.error('[Worker] Error loading postal district:', err);
        self.postMessage({ type: 'ERROR', payload: `Failed to load postal data for ${payload.district}` });
      }
      break;

    case 'LOAD_HEALTH_MANIFEST':
      try {
        if (!healthManifest) {
          setHealthManifest(await fetchWithRetry('/data/health_manifest.json'));
        }
        self.postMessage({ type: 'HEALTH_MANIFEST_LOADED', payload: healthManifest });
      } catch (err) {
        console.error('[Worker] Error loading health manifest:', err);
        self.postMessage({ type: 'ERROR', payload: 'Failed to load health manifest' });
      }
      break;

    case 'LOAD_HEALTH_SEARCH_INDEX':
      try {
        if (!healthSearchIndex) {
          setHealthSearchIndex(await fetchWithRetry('/data/health_search_index.json'));
        }
        self.postMessage({ type: 'HEALTH_SEARCH_INDEX_LOADED' });
      } catch (err) {
        console.error('[Worker] Error loading health search index:', err);
        self.postMessage({ type: 'ERROR', payload: 'Failed to load health search index' });
      }
      break;

    case 'LOAD_HEALTH_PRIORITY':
      try {
        if (!healthPriorityGeoJson) {
          setHealthPriorityGeoJson(await fetchWithRetry('/data/health_statewide_priority.geojson'));
        }
        self.postMessage({ type: 'HEALTH_PRIORITY_LOADED', payload: healthPriorityGeoJson });
      } catch (err) {
        console.error('[Worker] Error loading health priority data:', err);
        self.postMessage({ type: 'ERROR', payload: 'Failed to load health priority data' });
      }
      break;

    case 'LOAD_HEALTH_DISTRICT':
      try {
        const { district, file_name } = payload;
        if (!loadedHealthDistricts.has(district)) {
          const data = await fetchWithRetry(`/data/health_by_district/${file_name}`) as GisFeatureCollection;
          loadedHealthDistricts.set(district, data);

          const index = new RBush<SpatialItem>();
          const items: SpatialItem[] = data.features
            .filter(f => f.geometry && f.geometry.coordinates)
            .map((f: GisFeature) => {
              const bbox = getBBox(f.geometry);
              return { minX: bbox[0], minY: bbox[1], maxX: bbox[2], maxY: bbox[3], feature: f };
            });
          index.load(items);
          healthDistrictIndexes.set(district, index);
        }
        self.postMessage({
          type: 'HEALTH_DISTRICT_LOADED',
          payload: { district, data: loadedHealthDistricts.get(district) }
        });
      } catch (err) {
        console.error('[Worker] Error loading health district:', err);
        self.postMessage({ type: 'ERROR', payload: 'Failed to load health district data' });
      }
      break;

    case 'FILTER_HEALTH': {
      try {
        const { scope, filters, district, pincode } = payload;
        let features: GisFeature[] = [];
        let activeDistrictData: GisFeatureCollection | null = null;

        if (scope === 'STATE') {
          features = healthPriorityGeoJson?.features || [];
        } else if (scope === 'DISTRICT' || scope === 'PINCODE') {
          if (!district) {
            self.postMessage({ type: 'ERROR', payload: 'District name required for drill-down' });
            return;
          }

          const distManifest = healthManifest?.districts.find(d =>
            d.district.toLowerCase().replace(/\s+/g, '') === district.toLowerCase().replace(/\s+/g, '')
          );
          if (!distManifest) {
            self.postMessage({ type: 'ERROR', payload: `Manifest entry not found for district: ${district}` });
            return;
          }

          if (!loadedHealthDistricts.has(district)) {
            activeDistrictData = await fetchWithRetry(`/data/health_by_district/${distManifest.file_name}`);
            if (activeDistrictData) {
              loadedHealthDistricts.set(district, activeDistrictData);

              // Also index it for spatial lookups
              const index = new RBush<SpatialItem>();
              const items: SpatialItem[] = activeDistrictData.features
                .filter((f: GisFeature) => f.geometry && f.geometry.coordinates)
                .map((f: GisFeature) => {
                  const bbox = getBBox(f.geometry);
                  return { minX: bbox[0], minY: bbox[1], maxX: bbox[2], maxY: bbox[3], feature: f };
                });
              index.load(items);
              healthDistrictIndexes.set(district, index);
            }
          } else {
            activeDistrictData = loadedHealthDistricts.get(district) || null;
          }

          if (!activeDistrictData) {
            self.postMessage({ type: 'ERROR', payload: 'Failed to load health district data' });
            return;
          }

          features = activeDistrictData.features;

          if (scope === 'PINCODE' && pincode) {
            const pinFeature = pincodesGeoJson?.features.find(f =>
              (f.properties.pin_code || f.properties.PIN_CODE || f.properties.pincode)?.toString() === pincode.toString()
            );
            if (pinFeature) {
              const distIndex = healthDistrictIndexes.get(district);
              if (distIndex) {
                const bboxArr = getBBox(pinFeature.geometry);
                const candidates = distIndex.search({ minX: bboxArr[0], minY: bboxArr[1], maxX: bboxArr[2], maxY: bboxArr[3] });

                features = candidates.filter(item => {
                  const pt = item.feature.geometry.coordinates as [number, number];
                  if (pinFeature!.geometry.type === 'Polygon') {
                    return isPointInPolygon(pt, (pinFeature!.geometry as Polygon).coordinates);
                  } else if (pinFeature!.geometry.type === 'MultiPolygon') {
                    return (pinFeature!.geometry as MultiPolygon).coordinates.some(poly => isPointInPolygon(pt, poly));
                  }
                  return false;
                }).map(item => item.feature);
              }
            }
          }
        }

        // Capability check helper
        const isTrue = (val: any) => val === 1 || val === '1' || (typeof val === 'string' && val.trim().length > 0 && val !== '0' && val !== 'null');

        // Apply Filters
        const filtered = features.filter(f => {
          const p = f.properties;

          // 1. Mandatory Filters (AND)

          // Facility Type
          if (!filters.facilityTypes.includes(p.facility_t)) return false;

          // Location Type
          if (filters.locationType === 'Urban' && p.location_t !== 'Urban') return false;
          if (filters.locationType === 'Rural' && p.location_t !== 'Rural') return false;

          // 2. Capability Filters (OR)
          // If no capability filters are active, we don't filter by them (passes through)
          // If any are active, the facility must match AT LEAST ONE of the active filters

          const capabilityCriteria: { key: string; check: (p: HealthFacilityProperties) => boolean }[] = [
            { key: 'isHwc', check: (p) => isTrue(p.hwc) },
            { key: 'hasDelivery', check: (p) => isTrue(p.delivery_p) },
            { key: 'isFru', check: (p) => !!p.fru },
            { key: 'is24x7', check: (p) => String(p.timing_of_ || '').includes('24x7') },
            { key: 'hasBloodBank', check: (p) => isTrue(p.blood_bank) },
            { key: 'hasBloodStorage', check: (p) => isTrue(p.blood_stor) },
            { key: 'hasSncu', check: (p) => isTrue(p.sncu) },
            { key: 'hasNbsu', check: (p) => isTrue(p.nbsu) },
            { key: 'hasDeic', check: (p) => isTrue(p.deic) },
            { key: 'hasCt', check: (p) => isTrue(p.ct) },
            { key: 'hasMri', check: (p) => isTrue(p.mri) },
            { key: 'hasDialysis', check: (p) => isTrue(p.dialysis_c) },
            { key: 'hasCbnaat', check: (p) => isTrue(p.cbnaat_sit) },
            { key: 'hasTeleConsultation', check: (p) => isTrue(p.tele_v_car) },
            { key: 'hasStemiHub', check: (p) => isTrue(p.stemi_hubs) },
            { key: 'hasStemiSpoke', check: (p) => isTrue(p.stemi_spok) },
            { key: 'hasCathLab', check: (p) => isTrue(p.cath_lab_m) }
          ];

          const activeCriteria = capabilityCriteria.filter(c => filters[c.key as keyof typeof filters] === true);

          if (activeCriteria.length > 0) {
            const matchesAny = activeCriteria.some(c => c.check(p as HealthFacilityProperties));
            if (!matchesAny) return false;
          }

          return true;
        });

        // Calculate Summary
        const countsByType: Record<string, number> = {};
        const countsByCapability: Record<string, number> = {
          hwc: 0, delivery: 0, fru: 0, t24x7: 0,
          blood_bank: 0, blood_stor: 0,
          sncu: 0, nbsu: 0, deic: 0,
          ct: 0, mri: 0, dialysis: 0, cbnaat: 0, tele: 0,
          stemi_hub: 0, stemi_spoke: 0, cath_lab: 0
        };

        filtered.forEach(f => {
          const p = f.properties;
          const t = String(p.facility_t || 'Unknown');
          countsByType[t] = (countsByType[t] || 0) + 1;

          if (isTrue(p.hwc)) countsByCapability.hwc++;
          if (isTrue(p.delivery_p)) countsByCapability.delivery++;
          if (p.fru) countsByCapability.fru++;
          if (String(p.timing_of_ || '').includes('24x7')) countsByCapability.t24x7++;
          if (isTrue(p.blood_bank)) countsByCapability.blood_bank++;
          if (isTrue(p.blood_stor)) countsByCapability.blood_stor++;
          if (isTrue(p.sncu)) countsByCapability.sncu++;
          if (isTrue(p.nbsu)) countsByCapability.nbsu++;
          if (isTrue(p.deic)) countsByCapability.deic++;
          if (isTrue(p.ct)) countsByCapability.ct++;
          if (isTrue(p.mri)) countsByCapability.mri++;
          if (isTrue(p.dialysis_c)) countsByCapability.dialysis++;
          if (isTrue(p.cbnaat_sit)) countsByCapability.cbnaat++;
          if (isTrue(p.tele_v_car)) countsByCapability.tele++;
          if (isTrue(p.stemi_hubs)) countsByCapability.stemi_hub++;
          if (isTrue(p.stemi_spok)) countsByCapability.stemi_spoke++;
          if (isTrue(p.cath_lab_m)) countsByCapability.cath_lab++;
        });

        const summary = {
          name: scope === 'STATE' ? 'Statewide (Priority)' : (scope === 'DISTRICT' ? (district || 'Selected District') : `Pincode ${pincode}`),
          scope,
          total: filtered.length,
          countsByType,
          countsByCapability,
          activeFilters: Object.entries(filters)
            .filter(([, v]) => v !== null && (Array.isArray(v) ? v.length > 0 : (v !== 'All' && v !== false)))
            .flatMap(([k, v]) => {
              if (k === 'facilityTypes' && Array.isArray(v)) return v;
              return [k];
            }),
          district,
          pincode
        };

        // Thinned Payload for Map
        const thinnedFeatures = filtered.map((f, idx) => ({
          type: 'Feature',
          id: f.id || idx,
          geometry: f.geometry,
          properties: {
            ogc_fid: f.properties.ogc_fid,
            nin_number: f.properties.nin_number || f.properties.nin,
            facility_n: f.properties.facility_n || f.properties.name,
            facility_t: f.properties.facility_t || f.properties.type,
            district_n: f.properties.district_n || f.properties.district,
            hwc: f.properties.hwc,
            delivery_p: f.properties.delivery_p
          }
        }));

        self.postMessage({
          type: 'HEALTH_FILTERED',
          payload: {
            features: thinnedFeatures,
            summary,
            scope
          }
        });
      } catch (err) {
        console.error('[Worker] Error filtering health:', err);
        self.postMessage({ type: 'ERROR', payload: 'Failed to filter health data' });
      }
      break;
    }



    case 'GET_SUGGESTIONS': {
      const { query, activeLayer } = payload;
      const q = (query || '').toLowerCase().trim();
      if (!q) {
        self.postMessage({ type: 'SUGGESTIONS_RESULT', payload: [] });
        return;
      }


      const allScored: ScoredSuggestion[] = [];

      // 0. Coordinate Detection
      // Check for raw coordinates: "lat, lng"
      const coordMatch = q.match(/^([-+]?\d+\.?\d*),\s*([-+]?\d+\.?\d*)$/);
      let detectedCoords: { lat: number; lng: number } | null = null;

      if (coordMatch) {
        detectedCoords = { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };
      } else {
        // Check for Google Maps URL
        detectedCoords = extractCoordinatesFromUrl(query); // Use raw query for URL parsing
      }

      if (detectedCoords && !isNaN(detectedCoords.lat) && !isNaN(detectedCoords.lng)) {
        allScored.push({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [detectedCoords.lng, detectedCoords.lat] },
          properties: {
            name: `${detectedCoords.lat.toFixed(6)}, ${detectedCoords.lng.toFixed(6)}`,
            lat: detectedCoords.lat,
            lng: detectedCoords.lng
          },
          score: 2000, // Top priority
          suggestionType: 'COORDINATES'
        } as ScoredSuggestion);
      }

      // 1. Search Districts
      if (districtsGeoJson) {
        districtsGeoJson.features.forEach((f: GisFeature) => {
          const props = f.properties;
          const name = (props.district || props.DISTRICT || props.NAME || props.district_n || '').toString();
          const score = getScore(name, q);
          if (score > 0) {
            allScored.push({ ...f, score: score + 10, suggestionType: 'DISTRICT' as const });
          }
        });
      }

      // 2. Search Pincodes
      if (pincodesGeoJson) {
        pincodesGeoJson.features.forEach((f: GisFeature) => {
          const pin = (f.properties.PIN_CODE || f.properties.pincode || '').toString();
          const office = (f.properties.search_string as string || f.properties.office_name as string || '');
          const pinScore = pin.startsWith(q) ? 90 : (pin.includes(q) ? 40 : 0);
          const officeScore = getScore(office, q);
          const finalScore = Math.max(pinScore, officeScore);
          if (finalScore > 0) {
            allScored.push({ ...f, score: finalScore, suggestionType: 'PINCODE' as const });
          }
        });
      }

      if (activeLayer === 'HEALTH') {
        if (healthSearchIndex) {
          const tierWeights: Record<string, number> = {
            'MCH': 1.5,
            'DH': 1.4,
            'SDH': 1.3,
            'CHC': 1.1,
            'PHC': 1.0,
            'HSC': 0.5
          };

          healthSearchIndex.forEach(facility => {
            const name = facility[0].toString();
            const type = facility[3].toString();
            const nin = (facility[8] || '').toString();

            let finalScore = getScore(name, q);
            const ninScore = nin === q ? 100 : (nin.includes(q) ? 70 : 0);
            finalScore = Math.max(finalScore, ninScore);

            if (finalScore > 0) {
              // Exact match bonus
              if (name.toLowerCase() === q) finalScore += 20;

              // Tier boost
              const boost = tierWeights[type] || 1.0;
              finalScore *= boost;

              // HSC suppression for broad/short queries
              if (type === 'HSC' && q.length < 4) {
                finalScore *= 0.2;
              }

              if (finalScore > 5) { // Filter out low quality matches
                allScored.push({
                  type: 'Feature' as const,
                  geometry: { type: 'Point' as const, coordinates: [facility[5], facility[4]] },
                  properties: {
                    facility_n: name,
                    district_n: facility[1],
                    facility_t: type,
                    nin_number: facility[8],
                    location_t: facility[6],
                    block_name: facility[2]
                  },
                  score: finalScore,
                  suggestionType: 'HEALTH_FACILITY' as const
                } as ScoredSuggestion);
              }
            }
          });
        }
      } else {
        // Search other layer-specific items
        // 3. Search TNEB Offices from Index
        if (activeLayer === 'TNEB' && tnebSearchIndex) {
          tnebSearchIndex.forEach(section => {
            const [name, sectionCode, circleCode, lat, lng, district] = section;
            const nameScore = getScore(name, q);
            const codeScore = sectionCode.toString().includes(q) ? 70 : 0;
            const finalScore = Math.max(nameScore, codeScore);

            if (finalScore > 0) {
              allScored.push({
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [lng, lat] },
                properties: {
                  section_na: name,
                  section_co: sectionCode,
                  circle_cod: circleCode,
                  district,
                  office_location: [lng, lat] as [number, number]
                },
                score: finalScore + 5,
                suggestionType: 'TNEB_SECTION' as const
              } as ScoredSuggestion);
            }
          });
        }

        // 4. Search PDS Shops from Index
        if (activeLayer === 'PDS' && pdsIndex) {
          // Optimization: If query is short, don't scan all 30k shops
          // Unless it's a numeric shop code
          const isNumeric = /^\d+$/.test(q);
          const minLen = isNumeric ? 3 : 4;
          
          if (q.length >= minLen) {
            pdsIndex.forEach(shop => {
              const shopCode = shop[0].toString();
              const name = shop[1].toString();
              
              // Shop codes are high priority
              if (isNumeric && shopCode.startsWith(q)) {
                allScored.push({
                  type: 'Feature' as const,
                  geometry: { type: 'Point' as const, coordinates: [shop[5], shop[4]] },
                  properties: { shop_code: shop[0], name: shop[1], taluk: shop[2], district: shop[3], office_location: [shop[5], shop[4]] as [number, number] },
                  score: 95,
                  suggestionType: 'PDS_SHOP' as const
                } as ScoredSuggestion);
                return;
              }

              const nameScore = getScore(name, q);
              if (nameScore > 0) {
                allScored.push({
                  type: 'Feature' as const,
                  geometry: { type: 'Point' as const, coordinates: [shop[5], shop[4]] },
                  properties: { shop_code: shop[0], name: shop[1], taluk: shop[2], district: shop[3], office_location: [shop[5], shop[4]] as [number, number] },
                  score: nameScore,
                  suggestionType: 'PDS_SHOP' as const
                } as ScoredSuggestion);
              }
            });
          }
        }

        // 5. Search Constituencies
        if (activeLayer === 'CONSTITUENCY') {
          if (acGeoJson) {
            acGeoJson.features.forEach((f: GisFeature) => {
              const name = (f.properties.assembly_c as string || '');
              const score = getScore(name, q);
              if (score > 0) {
                allScored.push({ ...f, score: score + 2, suggestionType: 'CONSTITUENCY' as const });
              }
            });
          }
          if (pcGeoJson) {
            pcGeoJson.features.forEach((f: GisFeature) => {
              const name = (f.properties.parliame_1 as string || '');
              const score = getScore(name, q);
              if (score > 0) {
                allScored.push({ ...f, score: score + 1, suggestionType: 'CONSTITUENCY' as const });
              }
            });
          }
        }

        // 6. Search Police Stations from Index
        if (activeLayer === 'POLICE' && policeSearchIndex) {
          policeSearchIndex.forEach(station => {
            const [name, psCode, lat, lng, district] = station;
            const nameScore = getScore(name, q);
            const codeScore = psCode.toString().includes(q) ? 90 : 0;
            const finalScore = Math.max(nameScore, codeScore);

            if (finalScore > 0) {
              // Infer code if empty (common in Chennai data)
              const finalCode = psCode || extractPoliceCode(name);

              allScored.push({
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates: [lng, lat] },
                properties: {
                  name,
                  ps_name: name,
                  ps_code: finalCode,
                  district,
                  station_location: [lng, lat] as [number, number]
                },
                score: finalScore + 8,
                suggestionType: 'POLICE_STATION' as const
              } as ScoredSuggestion);
            }
          });
        }
      }

      // 7. Global Fallback (only if local results are low or query is complex)
      if (q.length > 3 && allScored.length < 10) {
        const globalResults = await fetchGoogleGeocode(query);
        globalResults.forEach(res => allScored.push(res as any));
      }

      // Final sort and limit
      const finalSuggestions = allScored
        .sort((a, b) => b.score - a.score)
        .slice(0, 15); // Show more results now that we have categories

      self.postMessage({ type: 'SUGGESTIONS_RESULT', payload: finalSuggestions });
      break;
    }

    case 'SELECT_SUGGESTION': {
      const { suggestion, layer } = payload;
      if (layer === 'LOCAL_BODIES_V2' && suggestion.geometry) {
        // Resolve via centroid for any suggestion type (PINCODE, DISTRICT, etc.)
        const centroid = getCentroid(suggestion.geometry);
        await handleLocalBodyV2Resolution(centroid[1], centroid[0], false);
      }
      break;
    }

    case 'LOAD_PDS': {
      const { district, boundary } = payload;
      const identity = resolveDistrictIdentity(district, pdsManifest);

      if (!identity) {
        console.warn(`[Worker] Unresolved district identity for: "${district}"`);
        self.postMessage({
          type: 'ERROR',
          payload: `Could not resolve district: ${district}. Please verify the manifest aliases.`
        });
        return;
      }

      const districtId = identity.id;
      const pdsFileName = identity.pds_file;

      const processAndSendPds = (data: GisFeatureCollection) => {
        let filteredFeatures = data.features;
        if (boundary) {
          // Use R-tree for filtering PDS shops within boundary
          const districtIndex = pdsIndexes.get(districtId);
          if (districtIndex) {
            const bboxArr = getBBox(boundary);
            const candidates = districtIndex.search({ minX: bboxArr[0], minY: bboxArr[1], maxX: bboxArr[2], maxY: bboxArr[3] });

            filteredFeatures = candidates.filter(item => {
              const point = item.feature.geometry.coordinates as Position;
              if (boundary.type === 'Polygon') {
                return isPointInPolygon(point, (boundary as Polygon).coordinates);
              } else if (boundary.type === 'MultiPolygon') {
                return (boundary as MultiPolygon).coordinates.some((poly: Position[][]) => isPointInPolygon(point, poly));
              }
              return false;
            }).map(item => item.feature);
          }
        }
        self.postMessage({
          type: 'PDS_LOADED',
          payload: {
            district: identity.display_name,
            district_id: districtId,
            data: { ...data, features: filteredFeatures }
          }
        });
      };

      if (loadedPds.has(districtId)) {
        processAndSendPds(loadedPds.get(districtId)!);
        return;
      }
      try {
        const data = await fetchWithRetry(`/data/pds_by_district/${pdsFileName}.json`) as GisFeatureCollection;

        // Build R-tree for this district
        const districtIndex = new RBush<SpatialItem>();
        const items: SpatialItem[] = data.features.map((f: GisFeature) => {
          const [lng, lat] = f.geometry.coordinates as Position;
          return {
            minX: lng, minY: lat, maxX: lng, maxY: lat,
            feature: f
          };
        });
        districtIndex.load(items);
        pdsIndexes.set(districtId, districtIndex);

        loadedPds.set(districtId, data);
        processAndSendPds(data);
      } catch (err) {
        console.warn(`[Worker] Failed to load PDS for ${districtId} (file: ${pdsFileName}.json):`, err);
        self.postMessage({ type: 'ERROR', payload: `Failed to load PDS data for ${identity.display_name}` });
      }
      break;
    }

    case 'LOAD_CONSTITUENCIES':
      try {
        if (!acGeoJson || !pcGeoJson) {
          const [dataAc, dataPc] = await Promise.all([
            fetchWithRetry('/data/tn_assembly_constituencies.topojson'),
            fetchWithRetry('/data/tn_parliamentary_constituencies.topojson')
          ]);

          const acFC = topojson.feature(dataAc, dataAc.objects.tamilnadu_assemply_constituency) as unknown as GisFeatureCollection;
          const pcFC = topojson.feature(dataPc, dataPc.objects.tamilnadu_parliament_constituency) as unknown as GisFeatureCollection;
          setAcGeoJson(acFC);
          setPcGeoJson(pcFC);

          // Indexing with safety filters
          acIndex.load(
            acFC.features
              .filter(f => f.geometry && f.geometry.coordinates)
              .map(f => {
                const bbox = getBBox(f.geometry);
                return { minX: bbox[0], minY: bbox[1], maxX: bbox[2], maxY: bbox[3], feature: f };
              })
          );
          pcIndex.load(
            pcFC.features
              .filter(f => f.geometry && f.geometry.coordinates)
              .map(f => {
                const bbox = getBBox(f.geometry);
                return { minX: bbox[0], minY: bbox[1], maxX: bbox[2], maxY: bbox[3], feature: f };
              })
          );
        }
        self.postMessage({ type: 'CONSTITUENCIES_LOADED', payload: { ac: acGeoJson, pc: pcGeoJson } });
      } catch (err) {
        console.error('[Worker] Error loading constituencies:', err);
        self.postMessage({ type: 'ERROR', payload: 'Failed to load constituency data' });
      }
      break;

    case 'LOAD_POLICE':
      try {
        if (!policeSearchIndex) {
          const [indexData, resVal] = await Promise.all([
            fetchWithRetry('/data/police_index.json'),
            fetch('/data/police_validation.json').catch(() => null)
          ]);

          setPoliceSearchIndex(indexData);

          if (resVal && resVal.ok) {
            const contentType = resVal.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              setPoliceValidation(await resVal.json());
            }
          }

          if (!policeStationsGeoJson) {
            setPoliceStationsGeoJson({ type: 'FeatureCollection', features: [] });
          }

          // Build RBush from index for statewide proximity search
          policeStationsIndex.load(
            policeSearchIndex!.map(s => ({
              minX: s[3], minY: s[2], maxX: s[3], maxY: s[2],
              feature: {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [s[3], s[2]] },
                properties: { ps_name: s[0], ps_code: s[1], district: s[4], station_location: [s[3], s[2]] }
              } as GisFeature
            }))
          );
        }
        self.postMessage({ type: 'POLICE_LOADED', payload: { boundaries: policeBoundariesGeoJson, stations: policeStationsGeoJson } });
      } catch (err) {
        console.error('[Worker] Error loading Police index:', err);
        self.postMessage({ type: 'ERROR', payload: 'Failed to load police data' });
      }
      break;

    case 'AUDIT_POLICE':
      if (policeBoundariesGeoJson && policeStationsGeoJson) {
        console.log('[Audit] Starting Police Resolution Audit...');
        const results = policeBoundariesGeoJson.features.map(f =>
          resolvePoliceStation(
            f as GisFeature<Polygon | MultiPolygon, PoliceBoundaryProperties>,
            policeStationsGeoJson as GisFeatureCollection<Point, PoliceStationProperties>
          )
        );

        const summary = {
          total: results.length,
          exact: results.filter(r => r.confidence === 'exact').length,
          high: results.filter(r => r.confidence === 'high').length,
          medium: results.filter(r => r.confidence === 'medium').length,
          low: results.filter(r => r.confidence === 'low').length,
          unresolved: results.filter(r => r.confidence === 'unresolved').length,
          mismatchedCodes: results.filter(r => r.station && r.station.properties.ps_code && r.station.properties.ps_code !== r.boundary.properties.police_s_1).length,
          outsidePolygon: results.filter(r => r.station && !r.debug.isInsideBoundary).length
        };

        console.table(summary);
        self.postMessage({ type: 'AUDIT_RESULT', payload: { summary, details: results } });
      }
      break;

    case 'RESOLVE_HEALTH_FACILITY': {
      const { id, nin, district } = payload;
      let found: GisFeature | null = null;

      if (district && loadedHealthDistricts.has(district)) {
        found = loadedHealthDistricts.get(district)!.features.find(f =>
          (f.id === id) || (f.properties.nin_number === nin) || (f.properties.ogc_fid === id)
        ) || null;
      }

      if (!found && healthPriorityGeoJson) {
        found = healthPriorityGeoJson.features.find(f =>
          (f.id === id) || (f.properties.nin_number === nin) || (f.properties.ogc_fid === id)
        ) || null;
      }

      self.postMessage({ type: 'HEALTH_FACILITY_RESOLVED', payload: found });
      break;
    }

    case 'LOAD_LOCAL_BODIES_V2':
      try {
        console.log('[Worker] Loading Local Bodies V2 base layers...');
        const [corpRaw, muniRaw, tpRaw] = await Promise.all([
          fetchWithRetry('/data/local_bodies/corporation.json'),
          fetchWithRetry('/data/local_bodies/municipality.json'),
          fetchWithRetry('/data/local_bodies/town_panchayat.json')
        ]);

        // All three files are TopoJSON — convert to GeoJSON before indexing
        const corpGeoJson = topojson.feature(corpRaw, corpRaw.objects.Corporation) as unknown as GisFeatureCollection;
        const muniGeoJson = topojson.feature(muniRaw, muniRaw.objects.Municipality) as unknown as GisFeatureCollection;
        const tpGeoJson = topojson.feature(tpRaw, tpRaw.objects.Town_Panchayat) as unknown as GisFeatureCollection;

        const loadToLayer = (data: GisFeatureCollection, index: RBush<SpatialItem>) => {
          const items: SpatialItem[] = data.features
            .filter(f => f.geometry && f.geometry.coordinates)
            .map((f: GisFeature) => {
              const bbox = getBBox(f.geometry);
              return { minX: bbox[0], minY: bbox[1], maxX: bbox[2], maxY: bbox[3], feature: f };
            });
          index.clear();
          index.load(items);
        };

        loadToLayer(corpGeoJson, localBodyIndexes.CORPORATION);
        loadToLayer(muniGeoJson, localBodyIndexes.MUNICIPALITY);
        loadToLayer(tpGeoJson, localBodyIndexes.TOWN_PANCHAYAT);

        console.log(`[Worker] Corp: ${localBodyIndexes.CORPORATION.all().length}, Muni: ${localBodyIndexes.MUNICIPALITY.all().length}, TP: ${localBodyIndexes.TOWN_PANCHAYAT.all().length}`);
        self.postMessage({ type: 'LOCAL_BODIES_V2_LOADED' });
        console.log('[Worker] Local Bodies V2 base layers indexed.');
      } catch (err) {
        console.error('[Worker] Error loading Local Bodies V2:', err);
        self.postMessage({ type: 'ERROR', payload: 'Failed to load local body data' });
      }
      break;

    case 'PREFETCH':
      if (payload && Array.isArray(payload.urls)) {
        payload.urls.forEach((url: string) => {
          fetchWithRetry(url).catch(err => console.warn(`[Worker] Prefetch failed for ${url}:`, err));
        });
      }
      break;

    default:
      console.warn('[Worker] Unknown message type:', type);
  }
};

export { };
