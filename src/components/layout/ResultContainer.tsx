import React from 'react';
import { ShoppingCart, Zap, MapPin, AlertCircle, Landmark, Shield } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useMapStore } from '../../store/useMapStore';
import ResultCard from '../ResultCard';
import type { Position, TnebSection } from '../../types/gis';

const ResultContainer: React.FC = () => {
  const activeLayer = useMapStore(state => state.activeLayer);
  const selectedPdsShop = useMapStore(state => state.selectedPdsShop);
  const setSelectedPdsShop = useMapStore(state => state.setSelectedPdsShop);
  const searchResult = useMapStore(state => state.searchResult);
  const jurisdictionDetails = useMapStore(state => state.jurisdictionDetails);
  const setJurisdictionDetails = useMapStore(state => state.setJurisdictionDetails);
  const policeResolution = useMapStore(state => state.policeResolution);
  const setPoliceResolution = useMapStore(state => state.setPoliceResolution);
  const setReportModal = useMapStore(state => state.setReportModal);
  const noDataFound = useMapStore(state => state.noDataFound);
  const lastClickedPoint = useMapStore(state => state.lastClickedPoint);
  const setNoDataFound = useMapStore(state => state.setNoDataFound);
  const clearSearch = useMapStore(state => state.clearSearch);
  const selectedPostalOffices = useMapStore(state => state.selectedPostalOffices);
  const selectedPostalOffice = useMapStore(state => state.selectedPostalOffice);
  const setSelectedPostalOffice = useMapStore(state => state.setSelectedPostalOffice);

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
    }

    setReportModal(true, { type, data: importantData });
  };

  return (
    <AnimatePresence mode="wait">
      {/* PDS Shop Detail */}
      {activeLayer === 'PDS' && selectedPdsShop && (
        <ResultCard
          key="pds-detail"
          themeColor="red"
          title={selectedPdsShop.properties.name || 'PDS Shop'}
          icon={<ShoppingCart size={20} />}
          data={[
            { label: 'Shop Code', value: selectedPdsShop.properties.shop_code || 'N/A', isPill: true },
            { label: 'Village', value: selectedPdsShop.properties.village || 'N/A' },
            { label: 'Taluk', value: selectedPdsShop.properties.taluk || 'N/A' },
            { label: 'District', value: selectedPdsShop.properties.district || 'N/A' }
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
             { label: 'Status', value: 'Displaying all local shops', isPill: true },
             { label: 'Instruction', value: 'Click a shop marker on the map to view detailed information.' }
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
              label: 'Sub-Division', 
              value: jurisdictionDetails.subdivisio || jurisdictionDetails.sub_division || 'N/A',
              subValue: jurisdictionDetails.subdivis_1?.toString() || jurisdictionDetails.sub_div_co?.toString()
            },
            { 
              label: 'Division', 
              value: jurisdictionDetails.division_n || jurisdictionDetails.division || 'N/A',
              subValue: jurisdictionDetails.division_c?.toString() || jurisdictionDetails.div_cod?.toString()
            },
            { 
              label: 'Circle', 
              value: jurisdictionDetails.circle_nam || jurisdictionDetails.circle || 'N/A',
              subValue: jurisdictionDetails.circle_cod?.toString()
            },
            { 
              label: 'Region', 
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
           title="Find TNEB Section"
           icon={<Zap size={20} />}
           data={[
             { label: 'Area', value: searchResult.properties.office_name || searchResult.properties.district || 'N/A' },
             { label: 'Next Step', value: 'Click your exact location on the map to resolve the section.' }
           ]}
           onClose={clearSearch}
         />
      )}

      {activeLayer === 'PINCODE' && searchResult && !selectedPostalOffice && (
        <ResultCard
          key="pincode-info"
          themeColor="blue"
          title={searchResult.properties.office_name || searchResult.properties.district || searchResult.properties.NAME || 'Post Office Area'}
          icon={<MapPin size={20} />}
          data={[
            { label: 'Pincode', value: (searchResult.properties.PIN_CODE || searchResult.properties.pincode || 'N/A').toString(), isPill: true },
            { label: 'District', value: searchResult.properties.district || 'N/A' },
            { label: 'Region', value: (searchResult.properties.region_nam as string) || 'N/A' },
            ...(selectedPostalOffices && selectedPostalOffices.length > 0 ? [
              { 
                label: 'Local Offices', 
                value: `${selectedPostalOffices.length} found`,
                subValue: selectedPostalOffices.slice(0, 3).map(o => o.officename).join(', ') + (selectedPostalOffices.length > 3 ? '...' : '')
              }
            ] : [])
          ]}
          onClose={clearSearch}
          onDirections={selectedPostalOffices && selectedPostalOffices.length > 0 ? () => {
             const mainOffice = selectedPostalOffices.find(o => o.officetype === 'HO' || o.officetype === 'SO') || selectedPostalOffices[0];
             window.open(`https://www.google.com/maps/dir/?api=1&destination=${mainOffice.latitude},${mainOffice.longitude}`, '_blank');
          } : undefined}
          onReport={() => handleReport('Pincode Area', searchResult.properties)}
        />
      )}

      {/* Specific Post Office Detail */}
      {activeLayer === 'PINCODE' && selectedPostalOffice && (
        <ResultCard
          key="postal-detail"
          themeColor="red"
          title={selectedPostalOffice.officename}
          icon={<MapPin size={20} />}
          data={[
            { label: 'Pincode', value: selectedPostalOffice.pincode, isPill: true },
            { label: 'Type', value: `${selectedPostalOffice.officetype} - ${selectedPostalOffice.delivery}` },
            { label: 'Division', value: selectedPostalOffice.divisionname },
            { label: 'District', value: selectedPostalOffice.district }
          ]}
          onClose={() => setSelectedPostalOffice(null)}
          onDirections={() => {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedPostalOffice.latitude},${selectedPostalOffice.longitude}`, '_blank');
          }}
          onReport={() => handleReport('Post Office', selectedPostalOffice as unknown as Record<string, unknown>)}
        />
      )}

      {/* Constituency Info */}
      {activeLayer === 'CONSTITUENCY' && searchResult && (
        <ResultCard
          key="constituency-info"
          themeColor="indigo"
          title={(searchResult.properties.assembly_c || searchResult.properties.parliame_1 || 'Constituency') as string}
          icon={<Landmark size={20} />}
          data={searchResult.properties.assembly_c ? [
            { label: 'AC Number', value: searchResult.properties.assembly_1?.toString() || 'N/A', isPill: true },
            { label: 'District', value: searchResult.properties.district_n as string || 'N/A' },
            { label: 'Parliamentary', value: searchResult.properties.parliame_1 as string || 'N/A' },
          ] : [
            { label: 'PC Number', value: searchResult.properties.parliament?.toString() || 'N/A', isPill: true },
            { label: 'State', value: 'Tamil Nadu' }
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
              label: 'Station Name', 
              value: policeResolution.station?.properties.ps_name || policeResolution.boundary.properties.police_sta || 'N/A',
              subValue: policeResolution.station?.properties.ps_code ? `Code: ${policeResolution.station.properties.ps_code}` : undefined
            },
            { 
              label: 'Boundary Status', 
              value: policeResolution.isBoundaryValid ? 'VERIFIED' : 'UNAVAILABLE', 
              isPill: true,
              subValue: policeResolution.isBoundaryValid 
                ? `Jurisdiction Code: ${policeResolution.boundary.properties.police_s_1}` 
                : (policeResolution.validationError || 'Official boundary data for this station is currently being updated.')
            },
            ...(policeResolution.isBoundaryValid ? [
               {
                 label: 'Jurisdiction',
                 value: policeResolution.boundary.properties.police_sta || 'N/A',
                 subValue: `${policeResolution.boundary.properties.district_n || ''} District`
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

      {/* Police Layer Instruction */}
      {activeLayer === 'POLICE' && searchResult && !policeResolution && !noDataFound && (
          <ResultCard
            key="police-instruction"
            themeColor="slate"
            title="Find Police Jurisdiction"
            icon={<Shield size={20} />}
            data={[
              { label: 'Area', value: searchResult.properties.office_name || searchResult.properties.district || 'N/A' },
              { label: 'Next Step', value: 'Click your location on the map to find the responsible police station.' }
            ]}
            onClose={clearSearch}
          />
       )}

      {/* Police Layer General Instruction */}
      {activeLayer === 'POLICE' && !searchResult && !policeResolution && !noDataFound && (
        <ResultCard
          key="police-general-instruction"
          themeColor="slate"
          title="Police Jurisdictions"
          icon={<Shield size={20} />}
          data={[
            { label: 'Status', value: 'Station-First Discovery', isPill: true },
            { label: 'Instruction', value: 'Click any police station marker to view its jurisdictional boundary and details.' }
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
            { label: 'Status', value: 'Data Unavailable', isPill: true },
            { label: 'Message', value: 'We don\'t have specific jurisdictional data for this exact coordinate yet.' },
            { label: 'Location', value: lastClickedPoint ? `${lastClickedPoint.lat.toFixed(4)}, ${lastClickedPoint.lng.toFixed(4)}` : 'Unknown' }
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
  );
};

export default ResultContainer;
