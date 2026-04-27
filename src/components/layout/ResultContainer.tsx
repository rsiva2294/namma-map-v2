import React from 'react';
import { ShoppingCart, Zap, MapPin, AlertCircle, Landmark, Shield, Activity } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useMapStore } from '../../store/useMapStore';
import ResultCard from '../ResultCard';
import { HealthSummaryCard } from '../../features/health/HealthSummaryCard';
import { useGisWorker } from '../../hooks/useGisWorker';
import { LocalBodyV2Card } from '../../features/local_bodies_v2/components/LocalBodyV2Card';
import { getOfficeTypeLabelKey, getOfficeExplanationKey } from '../../utils/postal';

import { useTranslation } from '../../i18n/translations';
import { translateDistrict } from '../../i18n/districts';
import type { Position, TnebSection, HealthFilters } from '../../types/gis';

const ResultContainer: React.FC = () => {
  const activeLayer = useMapStore(state => state.activeLayer);
  const theme = useMapStore(state => state.theme);
  const selectedPdsShop = useMapStore(state => state.selectedPdsShop);
  const setSelectedPdsShop = useMapStore(state => state.setSelectedPdsShop);
  const searchResult = useMapStore(state => state.searchResult);
  const jurisdictionDetails = useMapStore(state => state.jurisdictionDetails);
  const setJurisdictionDetails = useMapStore(state => state.setJurisdictionDetails);
  const policeResolution = useMapStore(state => state.policeResolution);
  const setPoliceResolution = useMapStore(state => state.setPoliceResolution);
  const setReportModal = useMapStore(state => state.setReportModal);
  const { t, language } = useTranslation();
  const noDataFound = useMapStore(state => state.noDataFound);
  const lastClickedPoint = useMapStore(state => state.lastClickedPoint);
  const setNoDataFound = useMapStore(state => state.setNoDataFound);
  const clearSearch = useMapStore(state => state.clearSearch);
  const selectedPostalOffices = useMapStore(state => state.selectedPostalOffices);
  const selectedPostalOffice = useMapStore(state => state.selectedPostalOffice);
  const setSelectedPostalOffice = useMapStore(state => state.setSelectedPostalOffice);
  const selectedHealthFacility = useMapStore(state => state.selectedHealthFacility);
  const setSelectedHealthFacility = useMapStore(state => state.setSelectedHealthFacility);
  const healthSummary = useMapStore(state => state.healthSummary);
  const healthScope = useMapStore(state => state.healthScope);
  const activeDistrict = useMapStore(state => state.activeDistrict);
  const selectedLocalBodyV2 = useMapStore(state => state.selectedLocalBodyV2);
  const isV2Loading = useMapStore(state => state.isV2Loading);
  const { filterHealth } = useGisWorker();


  const handleReport = (type: string, rawData: Record<string, unknown>) => {
    let importantData: Record<string, string | number> = {};
    
    if (type === 'PDS Shop') {
      importantData = {
        'Shop Name': rawData.name as string,
        'Shop Code': rawData.shop_code as string,
        'Taluk': rawData.taluk as string,
        'District': rawData.district as string,
      };
    } else if (type === 'TNEB Section') {
      const d = rawData as unknown as TnebSection;
      importantData = {
        'Section Name': d.section_na || d.section_office || 'N/A',
        'Section Code': d.section_co?.toString() || 'N/A',
        'Division': d.division_n || d.division || 'N/A',
        'Region': d.region_nam || d.region || 'N/A',
      };
    } else if (type === 'Pincode Area') {
      importantData = {
        'Pincode': (rawData.PIN_CODE || rawData.pincode || 'N/A') as string | number,
        'Office Name': (rawData.office_name as string) || 'N/A',
        'District': (rawData.district as string) || 'N/A',
      };
    } else if (type === 'Constituency') {
      importantData = {
        'Name': (rawData.assembly_c || rawData.parliame_1 || 'N/A') as string,
        'Number': (rawData.assembly_1 || rawData.parliament || 'N/A') as string | number,
        'Type': rawData.assembly_c ? 'Assembly' : 'Parliamentary',
        'District': (rawData.district_n || 'N/A') as string,
        'Parliamentary': (rawData.parliame_1 || 'N/A') as string,
      };
    } else if (type === 'Police Station') {
      importantData = {
        'Boundary Code': (rawData.boundaryCode || 'N/A') as string,
        'Station Name': (rawData.stationName || 'N/A') as string,
        'Station Code': (rawData.stationCode || 'N/A') as string,
        'Confidence': (rawData.confidence || 'N/A') as string,
        'Reason': (rawData.reason || 'N/A') as string,
      };
    } else if (type === 'Health Facility') {
      importantData = {
        'Facility Name': (rawData.facility_n || rawData.NAME) as string || 'N/A',
        'Type': (rawData.facility_t as string) || 'N/A',
        'District': (rawData.district_n || rawData.district) as string || 'N/A',
        'Block': (rawData.block_name as string) || 'N/A',
      };
    }

    setReportModal(true, { type, data: importantData });
  };

  const renderStructuredData = () => {
    if (activeLayer === 'PINCODE' && selectedPostalOffice) {
      const ld = {
        "@context": "https://schema.org",
        "@type": "GovernmentOffice",
        "name": selectedPostalOffice.officename,
        "address": {
          "@type": "PostalAddress",
          "postalCode": selectedPostalOffice.pincode,
          "addressLocality": selectedPostalOffice.district,
          "addressRegion": "Tamil Nadu",
          "addressCountry": "IN"
        },
        "description": `${selectedPostalOffice.officetype} - ${selectedPostalOffice.delivery} post office in ${selectedPostalOffice.district}`
      };
      return <script type="application/ld+json">{JSON.stringify(ld)}</script>;
    }

    if (activeLayer === 'HEALTH' && selectedHealthFacility) {
      const p = selectedHealthFacility.properties;
      const ld = {
        "@context": "https://schema.org",
        "@type": "Hospital",
        "name": p.facility_n || p.NAME,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": p.district_n || p.district,
          "addressRegion": "Tamil Nadu",
          "addressCountry": "IN"
        },
        "description": `${p.facility_t} level health facility providing ${p.timing_of_ || 'medical'} services.`
      };
      return <script type="application/ld+json">{JSON.stringify(ld)}</script>;
    }

    return null;
  };

  return (
    <div 
      className="result-cards-stack" 
      aria-live="polite" 
      aria-atomic="true"
    >
      <Helmet>
        {renderStructuredData()}
      </Helmet>
      <AnimatePresence mode="popLayout">
        {/* PDS Shop Detail */}
        {activeLayer === 'PDS' && selectedPdsShop && (
          <ResultCard
            key="pds-detail"
            themeColor="red"
            title={selectedPdsShop.properties.name || t('PDS')}
            icon={<ShoppingCart size={20} />}
            data={[
              { label: t('SHOP_CODE'), value: selectedPdsShop.properties.shop_code || 'N/A', isPill: true },
              { label: t('VILLAGE'), value: selectedPdsShop.properties.village || 'N/A' },
              { label: t('TALUK'), value: selectedPdsShop.properties.taluk || 'N/A' },
              { label: t('DISTRICT'), value: translateDistrict(selectedPdsShop.properties.district, language) || 'N/A' }
            ]}
            onClose={() => setSelectedPdsShop(null)}
            onDirections={() => {
              const coords = selectedPdsShop.geometry.coordinates as Position;
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`, '_blank');
            }}
            onReport={() => handleReport('PDS Shop', selectedPdsShop.properties)}
          />
        )}

        {/* PDS Layer Instruction */}
        {activeLayer === 'PDS' && searchResult && !selectedPdsShop && (
           <ResultCard
             key="pds-instruction"
             themeColor="red"
             title={`PDS Shops in ${searchResult.properties.office_name || searchResult.properties.district || ''}`}
             icon={<ShoppingCart size={20} />}
             data={[
               { label: t('STATUS'), value: t('DISPLAYING_LOCAL_SHOPS'), isPill: true },
               { label: t('INSTRUCTION'), value: t('CLICK_MARKER_INFO') }
             ]}
             onClose={clearSearch}
           />
        )}

        {/* TNEB Section Detail */}
        {activeLayer === 'TNEB' && jurisdictionDetails && (
          <ResultCard
            key="tneb-detail"
            themeColor="orange"
            title={`${jurisdictionDetails.section_na || jurisdictionDetails.section_office || t('TNEB')} (${jurisdictionDetails.section_co})`}
            icon={<Zap size={20} />}
            data={[
              { 
                label: t('BLOCK'), 
                value: jurisdictionDetails.subdivisio || jurisdictionDetails.sub_division || 'N/A',
                subValue: jurisdictionDetails.subdivis_1?.toString() || jurisdictionDetails.sub_div_co?.toString()
              },
              { 
                label: t('DIVISION'), 
                value: jurisdictionDetails.division_n || jurisdictionDetails.division || 'N/A',
                subValue: jurisdictionDetails.division_c?.toString() || jurisdictionDetails.div_cod?.toString()
              },
              { 
                label: t('CIRCLE'), 
                value: jurisdictionDetails.circle_nam || jurisdictionDetails.circle || 'N/A',
                subValue: jurisdictionDetails.circle_cod?.toString()
              },
              { 
                label: t('REGION'), 
                value: jurisdictionDetails.region_nam || jurisdictionDetails.region || 'N/A',
                subValue: (jurisdictionDetails.region_id || jurisdictionDetails.region_cod)?.toString()
              }
            ]}
            onClose={() => setJurisdictionDetails(null, null)}
            onDirections={jurisdictionDetails.office_location ? () => {
              const coords = jurisdictionDetails.office_location as Position;
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`, '_blank');
            } : undefined}
            onReport={() => handleReport('TNEB Section', jurisdictionDetails)}
          />
        )}

        {/* TNEB Layer Instruction */}
        {activeLayer === 'TNEB' && searchResult && !jurisdictionDetails && (
           <ResultCard
              key="tneb-instruction"
              themeColor="orange"
              title={t('FIND_TNEB_SECTION')}
              icon={<Zap size={20} />}
              data={[
                { label: t('AREA'), value: translateDistrict(searchResult.properties.office_name || searchResult.properties.district || 'N/A', language) },
                { label: t('NEXT_STEP'), value: t('CLICK_FIND_TNEB') }
              ]}
              onClose={clearSearch}
            />
        )}

        {activeLayer === 'PINCODE' && searchResult && !selectedPostalOffice && (() => {
          const validOffices = selectedPostalOffices?.filter(o => !o.isOutlier) || [];
          const outlierOffices = selectedPostalOffices?.filter(o => o.isOutlier) || [];
          
          return (
            <ResultCard
              key="pincode-info"
              themeColor="blue"
              title={searchResult.properties.office_name || searchResult.properties.district || searchResult.properties.NAME || t('CAT_PINCODE')}
              icon={<MapPin size={20} />}
              data={[
                { label: t('PIN_CODE'), value: (searchResult.properties.PIN_CODE || searchResult.properties.pincode || 'N/A').toString(), isPill: true },
                { label: t('DISTRICT'), value: translateDistrict(searchResult.properties.district, language) || 'N/A' },
                { label: t('REGION'), value: (searchResult.properties.region_nam as string) || 'N/A' },
                ...(validOffices.length > 0 ? [
                  { 
                    label: t('LOCAL_OFFICES'), 
                    value: `${validOffices.length} ${t('FOUND')}`
                  }
                ] : []),
                ...(outlierOffices.length > 0 ? [
                  {
                    label: t('POTENTIAL_DATA_ERRORS'),
                    value: `${outlierOffices.length} ${t('MISPLACED')}`
                  }
                ] : [])
              ]}
              onClose={clearSearch}
              onDirections={validOffices.length > 0 ? () => {
                 const mainOffice = validOffices.find(o => o.officetype === 'HO' || o.officetype === 'SO') || validOffices[0];
                 window.open(`https://www.google.com/maps/dir/?api=1&destination=${mainOffice.latitude},${mainOffice.longitude}`, '_blank');
              } : undefined}
              onReport={() => handleReport('Pincode Area', searchResult.properties)}
            />
          );
        })()}

        {/* Specific Post Office Detail */}
        {activeLayer === 'PINCODE' && selectedPostalOffice && (
          <ResultCard
            key="postal-detail"
            themeColor={selectedPostalOffice.isOutlier ? 'orange' : 'blue'}
            title={selectedPostalOffice.officename}
            icon={<MapPin size={20} />}
            badges={selectedPostalOffice.isOutlier ? [{ label: t('ACCURACY_WARNING'), color: '#f97316', icon: <AlertCircle size={12} /> }] : []}
            data={[
              { label: `📍 ${t('PIN_CODE')}`, value: selectedPostalOffice.pincode, isPill: true },
              { label: `🏢 ${t('OFFICE_TYPE')}`, value: t(getOfficeTypeLabelKey(selectedPostalOffice.officetype) as any) },
              { label: `💡 ${t('ABOUT_OFFICE')}`, value: t(getOfficeExplanationKey(selectedPostalOffice.officetype, selectedPostalOffice.delivery) as any) },
              { label: `🗺️ ${t('DISTRICT')}`, value: translateDistrict(selectedPostalOffice.district, language) },
              { label: `ℹ️ ${t('MORE_INFO')}`, value: selectedPostalOffice.divisionname, subValue: `${t('DIVISION')}: ${selectedPostalOffice.divisionname} • ${t('REGION')}: ${selectedPostalOffice.regionname}` },
              ...(selectedPostalOffice.isOutlier ? [{ label: t('NOTE'), value: t('POSTAL_ACCURACY_DESC') }] : [])
            ]}
            onClose={() => setSelectedPostalOffice(null)}
            onDirections={!selectedPostalOffice.isOutlier ? () => {
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedPostalOffice.latitude},${selectedPostalOffice.longitude}`, '_blank');
            } : undefined}
            onReport={() => handleReport('Post Office', selectedPostalOffice as unknown as Record<string, unknown>)}
          />
        )}

        {/* Outliers List Card */}
        {activeLayer === 'PINCODE' && searchResult && !selectedPostalOffice && (() => {
          const outlierOffices = selectedPostalOffices?.filter(o => o.isOutlier) || [];
          if (outlierOffices.length === 0) return null;
          
          return (
            <div key="outliers-group" className="result-card-group">
              <div className="result-card-group-label">
                <AlertCircle size={14} color="#f97316" />
                {t('MISPLACED_DATA_FOUND')}
              </div>
              {outlierOffices.map((off, idx) => (
                <ResultCard
                  key={`outlier-${idx}`}
                  themeColor="slate"
                  title={off.officename}
                  icon={<MapPin size={18} />}
                  data={[
                    { label: t('CATEGORY'), value: `${off.officetype} (${off.delivery})`, isPill: true },
                    { label: t('REASON'), value: t('GEOGRAPHICALLY_MISPLACED') }
                  ]}
                  actionLabel={t('VIEW_DETAILS')}
                  onAction={() => setSelectedPostalOffice(off)}
                  onClose={() => {}} 
                />
              ))}
            </div>
          );
        })()}

        {/* Constituency Info */}
        {activeLayer === 'CONSTITUENCY' && searchResult && (
          <ResultCard
            key="constituency-info"
            themeColor="indigo"
            title={(searchResult.properties.assembly_c || searchResult.properties.parliame_1 || t('CAT_CONSTITUENCY')) as string}
            icon={<Landmark size={20} />}
            data={searchResult.properties.assembly_c ? [
              { label: t('AC_NUMBER'), value: searchResult.properties.assembly_1?.toString() || 'N/A', isPill: true },
              { label: t('DISTRICT'), value: translateDistrict(searchResult.properties.district_n as string, language) || 'N/A' },
              { label: t('CAT_CONSTITUENCY'), value: searchResult.properties.parliame_1 as string || 'N/A' },
            ] : [
              { label: t('PC_NUMBER'), value: searchResult.properties.parliament?.toString() || 'N/A', isPill: true },
              { label: t('STATE'), value: t('TN') }
            ]}
            onClose={clearSearch}
            onReport={() => handleReport('Constituency', searchResult.properties)}
          />
        )}

        {/* Police Station Info */}
        {activeLayer === 'POLICE' && policeResolution && (
          <ResultCard
            key="police-detail"
            themeColor="slate"
            title={policeResolution.station?.properties.ps_name || policeResolution.boundary.properties.police_sta || t('CAT_POLICE')}
            icon={<Shield size={20} />}
            data={[
              { 
                label: t('STATION_NAME'), 
                value: policeResolution.station?.properties.ps_name || policeResolution.boundary.properties.police_sta || 'N/A',
                subValue: policeResolution.station?.properties.ps_code ? `${t('STATION_CODE')}: ${policeResolution.station.properties.ps_code}` : undefined
              },
              { 
                label: t('BOUNDARY_STATUS'), 
                value: policeResolution.isBoundaryValid ? t('VERIFIED') : t('UNAVAILABLE'), 
                isPill: true,
                subValue: policeResolution.isBoundaryValid 
                  ? `${t('JURISDICTION_CODE')}: ${policeResolution.boundary.properties.police_s_1}` 
                  : t('STATION_DATA_UPDATING')
              },
              ...(policeResolution.isBoundaryValid ? [
                 {
                   label: t('JURISDICTION'),
                   value: policeResolution.boundary.properties.police_sta || 'N/A',
                   subValue: `${translateDistrict(policeResolution.boundary.properties.district_n, language) || ''} ${t('DISTRICT')}`
                 }
              ] : []),
              ...(import.meta.env.DEV ? [
                { 
                  label: 'Match Confidence', 
                  value: policeResolution.confidence.toUpperCase(),
                  subValue: `Logic: ${policeResolution.debug.method} (${policeResolution.reason})` 
                }
              ] : [])
            ]}
            onClose={() => setPoliceResolution(null)}
            onDirections={policeResolution.station?.properties.station_location ? () => {
              const coords = policeResolution.station!.properties.station_location as Position;
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`, '_blank');
            } : undefined}
            onReport={() => handleReport('Police Station', {
              boundaryCode: policeResolution.boundary.properties.police_s_1,
              stationName: policeResolution.station?.properties.ps_name,
              stationCode: policeResolution.station?.properties.ps_code,
              confidence: policeResolution.confidence,
              reason: policeResolution.reason,
              method: policeResolution.debug.method
            })}
          />
        )}

        {/* Local Body V2 Info */}
        {activeLayer === 'LOCAL_BODIES_V2' && (isV2Loading || selectedLocalBodyV2) && (
          <div key="v2-card-wrapper" className="v2-card-wrapper" style={{ padding: '0 8px' }}>
            {isV2Loading ? (
              <div style={{
                background: theme === 'dark' ? '#1e293b' : '#ffffff',
                padding: '24px',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                <Activity className="animate-pulse" size={32} color="#6366f1" />
                <span style={{ 
                  fontWeight: 600, 
                  fontSize: '0.9rem',
                  color: theme === 'dark' ? '#94a3b8' : '#64748b' 
                }}>
                  {t('RESOLVING_LOCAL_BODY')}
                </span>
              </div>
            ) : selectedLocalBodyV2 && (
              <LocalBodyV2Card feature={selectedLocalBodyV2} />
            )}
          </div>
        )}

        {/* Police Layer Instruction */}
        {activeLayer === 'POLICE' && searchResult && !policeResolution && !noDataFound && (
            <ResultCard
              key="police-instruction"
              themeColor="slate"
              title={t('FIND_POLICE_JURISDICTION')}
              icon={<Shield size={20} />}
              data={[
                { label: t('AREA'), value: searchResult.properties.office_name || searchResult.properties.district || 'N/A' },
                { label: t('NEXT_STEP'), value: t('CLICK_FIND_POLICE') }
              ]}
              onClose={clearSearch}
            />
         )}

        {/* Police Layer General Instruction */}
        {activeLayer === 'POLICE' && !searchResult && !policeResolution && !noDataFound && (
          <ResultCard
            key="police-general-instruction"
            themeColor="slate"
            title={t('POLICE_JURISDICTIONS')}
            icon={<Shield size={20} />}
            data={[
              { label: t('STATUS'), value: t('STATION_FIRST_DISCOVERY'), isPill: true },
              { label: t('INSTRUCTION'), value: t('CLICK_STATION_BOUNDARY') }
            ]}
            onClose={() => {}}
          />
        )}

        {/* Health Facility Detail */}
        {activeLayer === 'HEALTH' && selectedHealthFacility && (
          <ResultCard
            key="health-detail"
            themeColor="rose"
            title={selectedHealthFacility.properties.facility_n || selectedHealthFacility.properties.NAME || t('CAT_HEALTH')}
            icon={<Activity size={20} />}
            badges={[
              ...(Number(selectedHealthFacility.properties.delivery_p) === 1 ? [{ label: t('DELIVERY_SERVICES'), color: '#ec4899' }] : []),
              ...(String(selectedHealthFacility.properties.timing_of_ || '').includes('24x7') ? [{ label: t('EMERGENCY_24X7'), color: '#f59e0b' }] : []),
              ...(selectedHealthFacility.properties.fru ? [{ label: t('FIRST_REFERRAL_UNIT'), color: '#be123c' }] : []),
              ...(Number(selectedHealthFacility.properties.blood_bank) === 1 ? [{ label: t('BLOOD_BANK'), color: '#ef4444' }] : []),
              ...(Number(selectedHealthFacility.properties.sncu) === 1 ? [{ label: t('NEWBORN_CARE'), color: '#0ea5e9' }] : []),
              ...(Number(selectedHealthFacility.properties.dialysis_c) === 1 ? [{ label: t('DIALYSIS_CENTER'), color: '#8b5cf6' }] : [])
            ].slice(0, 4)}
            data={[
              { 
                label: t('CARE_LEVEL'), 
                value: (({
                  'MCH': t('MCH'),
                  'DH': t('DH'),
                  'SDH': t('SDH'),
                  'CHC': t('CHC'),
                  'PHC': t('PHC'),
                  'HSC': t('HSC')
                } as any)[selectedHealthFacility.properties.facility_t || '']) || selectedHealthFacility.properties.facility_t || 'N/A',
                isPill: true 
              },
              { 
                label: t('LOCATION'), 
                value: `${selectedHealthFacility.properties.block_name || t('SUB_LOCAL_AREA')}, ${translateDistrict(selectedHealthFacility.properties.district_n || selectedHealthFacility.properties.district, language) || 'N/A'}`,
                subValue: `${t('DISTRICT')}: ${translateDistrict(selectedHealthFacility.properties.district_n || selectedHealthFacility.properties.district, language) || 'N/A'}`
              },
              { 
                label: t('TIMING'), 
                value: String(selectedHealthFacility.properties.timing_of_ || '').includes('24x7') 
                  ? t('OPEN_24_HOURS')
                  : (String(selectedHealthFacility.properties.timing_of_ || '').toLowerCase().includes('day') ? t('DAY_SERVICES') : t('GENERAL_HOURS_CONTACT'))
              },
              { label: t('FACILITY_ID'), value: (selectedHealthFacility.properties.nin_number || 'N/A').toString() }
            ]}
            onClose={() => setSelectedHealthFacility(null)}
            onDirections={() => {
              const coords = selectedHealthFacility.geometry.coordinates as [number, number];
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}`, '_blank');
            }}
            onReport={() => handleReport('Health Facility', selectedHealthFacility.properties)}
          />
        )}

        {/* Health Discovery Summary */}
        {activeLayer === 'HEALTH' && healthSummary && !selectedHealthFacility && (
          <HealthSummaryCard
            key="health-summary"
            summary={healthSummary}
            onClearFilters={() => {
              const emptyFilters: HealthFilters = {
                facilityTypes: [],
                locationType: 'All' as const,
                isHwc: null,
                hasDelivery: null,
                isFru: null,
                is24x7: null,
                hasBloodBank: null,
                hasBloodStorage: null,
                hasSncu: null,
                hasNbsu: null,
                hasDeic: null,
                hasCt: null,
                hasMri: null,
                hasDialysis: null,
                hasCbnaat: null,
                hasTeleConsultation: null,
                hasStemiHub: null,
                hasStemiSpoke: null,
                hasCathLab: null
              };
              const pincode = (searchResult?.properties?.PIN_CODE || searchResult?.properties?.pincode)?.toString();
              filterHealth(healthScope, emptyFilters, activeDistrict, pincode || null);
            }}
          />
        )}

        {/* Health Layer Instruction (when no summary yet) */}
        {activeLayer === 'HEALTH' && !healthSummary && !selectedHealthFacility && !noDataFound && (
           <ResultCard
             key="health-instruction"
             themeColor="blue"
             title={t('HEALTH_DISCOVERY')}
             icon={<Activity size={20} />}
             data={[
               { label: t('STATUS'), value: t('STATEWIDE_VIEW'), isPill: true },
               { label: t('NEXT_STEP'), value: t('SEARCH_EXPLORE_HEALTH') }
             ]}
             onClose={() => {}}
           />
        )}

        {/* No Data Found Card */}
        {noDataFound && (
          <ResultCard
            key="no-data"
            themeColor="blue"
            title={t('NO_INFO_FOUND')}
            icon={<AlertCircle size={20} />}
            data={[
              { label: t('STATUS'), value: t('DATA_UNAVAILABLE'), isPill: true },
              { label: t('NOTE'), value: t('NO_JURISDICTION_DATA') },
              { label: t('LOCATION'), value: lastClickedPoint ? `${lastClickedPoint.lat.toFixed(4)}, ${lastClickedPoint.lng.toFixed(4)}` : 'Unknown' }
            ]}
            onClose={() => setNoDataFound(false)}
            actionLabel={t('CONTRIBUTE_DATA')}
            onAction={() => handleReport('Missing Data', { 
              latitude: lastClickedPoint?.lat, 
              longitude: lastClickedPoint?.lng,
              layer: activeLayer 
            })}
            onDirections={lastClickedPoint ? () => {
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${lastClickedPoint.lat},${lastClickedPoint.lng}`, '_blank');
            } : undefined}
            onReport={() => handleReport('Missing Data', { 
              latitude: lastClickedPoint?.lat, 
              longitude: lastClickedPoint?.lng,
              layer: activeLayer 
            })}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResultContainer;
