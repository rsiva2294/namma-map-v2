import React from 'react';
import { ShoppingCart, Zap, MapPin, AlertCircle, Landmark, Shield, Activity } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useMapStore } from '../../store/useMapStore';
import ResultCard from '../ResultCard';
import { HealthSummaryCard } from '../../features/health/HealthSummaryCard';
import { useGisWorker } from '../../hooks/useGisWorker';
import { LocalBodyV2Card } from '../../features/local_bodies_v2/components/LocalBodyV2Card';

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
            title={selectedPdsShop.properties.name || 'PDS Shop'}
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
               { label: t('STATUS'), value: 'Displaying all local shops', isPill: true },
               { label: t('INSTRUCTION'), value: 'Click a shop marker on the map to view detailed information.' }
             ]}
             onClose={clearSearch}
           />
        )}

        {/* TNEB Section Detail */}
        {activeLayer === 'TNEB' && jurisdictionDetails && (
          <ResultCard
            key="tneb-detail"
            themeColor="orange"
            title={`${jurisdictionDetails.section_na || jurisdictionDetails.section_office || 'TNEB Section'} (${jurisdictionDetails.section_co})`}
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
              title={language === 'ta' ? 'மின்சார வாரிய பிரிவைக் கண்டறியவும்' : 'Find TNEB Section'}
              icon={<Zap size={20} />}
              data={[
                { label: t('AREA'), value: translateDistrict(searchResult.properties.office_name || searchResult.properties.district || 'N/A', language) },
                { label: t('NEXT_STEP'), value: language === 'ta' ? 'மின்சார வாரிய அலுவலகத்தைக் கண்டறிய வரைபடத்தில் உங்கள் சரியான இடத்தை கிளிக் செய்யவும்.' : 'Click your exact location on the map to resolve the section.' }
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
              title={searchResult.properties.office_name || searchResult.properties.district || searchResult.properties.NAME || 'Post Office Area'}
              icon={<MapPin size={20} />}
              data={[
                { label: t('PIN_CODE'), value: (searchResult.properties.PIN_CODE || searchResult.properties.pincode || 'N/A').toString(), isPill: true },
                { label: t('DISTRICT'), value: translateDistrict(searchResult.properties.district, language) || 'N/A' },
                { label: t('REGION'), value: (searchResult.properties.region_nam as string) || 'N/A' },
                ...(validOffices.length > 0 ? [
                  { 
                    label: t('LOCAL_OFFICES'), 
                    value: `${validOffices.length} found`
                  }
                ] : []),
                ...(outlierOffices.length > 0 ? [
                  {
                    label: 'Potential Data Errors',
                    value: `${outlierOffices.length} offices misplaced`
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
            badges={selectedPostalOffice.isOutlier ? [{ label: 'Location Accuracy Warning', color: '#f97316', icon: <AlertCircle size={12} /> }] : []}
            data={[
              { label: `📍 ${t('PIN_CODE')}`, value: selectedPostalOffice.pincode, isPill: true },
              { label: `🏢 ${t('OFFICE_TYPE')}`, value: t(selectedPostalOffice.officetype as any) },
              { label: `💡 ${t('ABOUT_OFFICE')}`, value: t(`POSTAL_DESC_${selectedPostalOffice.delivery?.toLowerCase().includes('non') ? 'NON_DELIVERY' : 'DELIVERY'}` as any) },
              { label: `🗺️ ${t('DISTRICT')}`, value: translateDistrict(selectedPostalOffice.district, language) },
              { label: `ℹ️ ${t('MORE_INFO')}`, value: selectedPostalOffice.divisionname, subValue: `${t('DIVISION')}: ${selectedPostalOffice.divisionname} • ${t('REGION')}: ${selectedPostalOffice.regionname}` },
              ...(selectedPostalOffice.isOutlier ? [{ label: t('NOTE'), value: language === 'ta' ? 'அதிகாரப்பூர்வ பதிவேட்டில் உள்ள இந்த அலுவலக ஒருங்கிணைப்புகள் தவறாகத் தோன்றுகின்றன, எனவே வரைபடத்திலிருந்து மறைக்கப்பட்டுள்ளன.' : 'This office coordinates in the official registry appear to be incorrect and have been hidden from the map for clarity.' }] : [])
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
                Misplaced Data Found
              </div>
              {outlierOffices.map((off, idx) => (
                <ResultCard
                  key={`outlier-${idx}`}
                  themeColor="slate"
                  title={off.officename}
                  icon={<MapPin size={18} />}
                  data={[
                    { label: t('CATEGORY'), value: `${off.officetype} (${off.delivery})`, isPill: true },
                    { label: t('REASON'), value: 'Geographically misplaced in registry' }
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
            title={(searchResult.properties.assembly_c || searchResult.properties.parliame_1 || 'Constituency') as string}
            icon={<Landmark size={20} />}
            data={searchResult.properties.assembly_c ? [
              { label: language === 'ta' ? 'சட்டமன்றத் தொகுதி எண்' : 'AC Number', value: searchResult.properties.assembly_1?.toString() || 'N/A', isPill: true },
              { label: t('DISTRICT'), value: translateDistrict(searchResult.properties.district_n as string, language) || 'N/A' },
              { label: language === 'ta' ? 'நாடாளுமன்றத் தொகுதி' : 'Parliamentary', value: searchResult.properties.parliame_1 as string || 'N/A' },
            ] : [
              { label: language === 'ta' ? 'நாடாளுமன்றத் தொகுதி எண்' : 'PC Number', value: searchResult.properties.parliament?.toString() || 'N/A', isPill: true },
              { label: t('STATE'), value: language === 'ta' ? 'தமிழ்நாடு' : 'Tamil Nadu' }
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
            title={policeResolution.station?.properties.ps_name || policeResolution.boundary.properties.police_sta || 'Police Jurisdiction'}
            icon={<Shield size={20} />}
            data={[
              { 
                label: language === 'ta' ? 'காவல் நிலைய பெயர்' : 'Station Name', 
                value: policeResolution.station?.properties.ps_name || policeResolution.boundary.properties.police_sta || 'N/A',
                subValue: policeResolution.station?.properties.ps_code ? `${language === 'ta' ? 'குறியீடு' : 'Code'}: ${policeResolution.station.properties.ps_code}` : undefined
              },
              { 
                label: language === 'ta' ? 'எல்லை நிலை' : 'Boundary Status', 
                value: policeResolution.isBoundaryValid ? t('VERIFIED') : t('UNAVAILABLE'), 
                isPill: true,
                subValue: policeResolution.isBoundaryValid 
                  ? `${language === 'ta' ? 'எல்லைக் குறியீடு' : 'Jurisdiction Code'}: ${policeResolution.boundary.properties.police_s_1}` 
                  : (language === 'ta' ? 'இந்த நிலையத்திற்கான அதிகாரப்பூர்வ எல்லைத் தரவு தற்போது புதுப்பிக்கப்பட்டு வருகிறது.' : (policeResolution.validationError || 'Official boundary data for this station is currently being updated.'))
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
                  Resolving Local Body...
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
              title={language === 'ta' ? 'காவல் எல்லைப் பகுதியைக் கண்டறியவும்' : 'Find Police Jurisdiction'}
              icon={<Shield size={20} />}
              data={[
                { label: t('AREA'), value: searchResult.properties.office_name || searchResult.properties.district || 'N/A' },
                { label: t('NEXT_STEP'), value: language === 'ta' ? 'பொறுப்பான காவல் நிலையத்தைக் கண்டறிய வரைபடத்தில் உங்கள் இருப்பிடத்தைக் கிளிக் செய்யவும்.' : 'Click your location on the map to find the responsible police station.' }
              ]}
              onClose={clearSearch}
            />
         )}

        {/* Police Layer General Instruction */}
        {activeLayer === 'POLICE' && !searchResult && !policeResolution && !noDataFound && (
          <ResultCard
            key="police-general-instruction"
            themeColor="slate"
            title={language === 'ta' ? 'காவல் எல்லைகள்' : 'Police Jurisdictions'}
            icon={<Shield size={20} />}
            data={[
              { label: t('STATUS'), value: language === 'ta' ? 'முதலில் நிலையத் தேடல்' : 'Station-First Discovery', isPill: true },
              { label: t('INSTRUCTION'), value: language === 'ta' ? 'எந்தவொரு காவல் நிலைய அடையாளட்டியையும் கிளிக் செய்வதன் மூலம் அதன் அதிகார வரம்பு மற்றும் விவரங்களைக் காணலாம்.' : 'Click any police station marker to view its jurisdictional boundary and details.' }
            ]}
            onClose={() => {}}
          />
        )}

        {/* Health Facility Detail */}
        {activeLayer === 'HEALTH' && selectedHealthFacility && (
          <ResultCard
            key="health-detail"
            themeColor="rose"
            title={selectedHealthFacility.properties.facility_n || selectedHealthFacility.properties.NAME || 'Health Facility'}
            icon={<Activity size={20} />}
            badges={[
              ...(Number(selectedHealthFacility.properties.delivery_p) === 1 ? [{ label: language === 'ta' ? 'பிரசவ சேவைகள்' : 'Delivery Services', color: '#ec4899' }] : []),
              ...(String(selectedHealthFacility.properties.timing_of_ || '').includes('24x7') ? [{ label: language === 'ta' ? '24x7 அவசர சிகிச்சை' : '24x7 Emergency', color: '#f59e0b' }] : []),
              ...(selectedHealthFacility.properties.fru ? [{ label: language === 'ta' ? 'முதல் நிலை பரிந்துரை மையம்' : 'First Referral Unit', color: '#be123c' }] : []),
              ...(Number(selectedHealthFacility.properties.blood_bank) === 1 ? [{ label: language === 'ta' ? 'இரத்த வங்கி' : 'Blood Bank', color: '#ef4444' }] : []),
              ...(Number(selectedHealthFacility.properties.sncu) === 1 ? [{ label: language === 'ta' ? 'பச்சிளம் குழந்தை பராமரிப்பு' : 'Newborn Care', color: '#0ea5e9' }] : []),
              ...(Number(selectedHealthFacility.properties.dialysis_c) === 1 ? [{ label: language === 'ta' ? 'டயாலிசிஸ் மையம்' : 'Dialysis Center', color: '#8b5cf6' }] : [])
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
                label: language === 'ta' ? 'இடம்' : 'Location', 
                value: `${selectedHealthFacility.properties.block_name || 'Local Area'}, ${translateDistrict(selectedHealthFacility.properties.district_n || selectedHealthFacility.properties.district, language) || 'N/A'}`,
                subValue: `${language === 'ta' ? 'மாவட்டம்' : 'District'}: ${translateDistrict(selectedHealthFacility.properties.district_n || selectedHealthFacility.properties.district, language) || 'N/A'}`
              },
              { 
                label: 'Services Timing', 
                value: String(selectedHealthFacility.properties.timing_of_ || '').includes('24x7') 
                  ? 'Open 24 Hours' 
                  : (String(selectedHealthFacility.properties.timing_of_ || '').toLowerCase().includes('day') ? 'Day Services (General Hours)' : 'General Hours / Contact Facility')
              },
              { label: 'Facility ID (NIN)', value: (selectedHealthFacility.properties.nin_number || 'N/A').toString() }
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
             title="Health Discovery"
             icon={<Activity size={20} />}
             data={[
               { label: t('STATUS'), value: 'Statewide View', isPill: true },
               { label: t('NEXT_STEP'), value: 'Search for a district or pincode to explore local health facilities.' }
             ]}
             onClose={() => {}}
           />
        )}

        {/* No Data Found Card */}
        {noDataFound && (
          <ResultCard
            key="no-data"
            themeColor="blue"
            title="No Information Found"
            icon={<AlertCircle size={20} />}
            data={[
              { label: language === 'ta' ? 'நிலை' : 'Status', value: language === 'ta' ? 'தகவல் இல்லை' : 'Data Unavailable', isPill: true },
              { label: language === 'ta' ? 'செய்தி' : 'Message', value: language === 'ta' ? 'இந்த இடத்திற்கான குறிப்பிட்ட எல்லைத் தரவு இன்னும் எங்களிடம் இல்லை.' : 'We don\'t have specific jurisdictional data for this exact coordinate yet.' },
              { label: language === 'ta' ? 'இடம்' : 'Location', value: lastClickedPoint ? `${lastClickedPoint.lat.toFixed(4)}, ${lastClickedPoint.lng.toFixed(4)}` : 'Unknown' }
            ]}
            onClose={() => setNoDataFound(false)}
            actionLabel="CONTRIBUTE DATA"
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
