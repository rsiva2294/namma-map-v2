import React from 'react';
import { ShoppingBag, Zap, MapPin } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useMapStore } from '../../store/useMapStore';
import ResultCard from '../ResultCard';
import type { Position } from '../../types/gis';

const ResultContainer: React.FC = () => {
  const activeLayer = useMapStore(state => state.activeLayer);
  const selectedPdsShop = useMapStore(state => state.selectedPdsShop);
  const setSelectedPdsShop = useMapStore(state => state.setSelectedPdsShop);
  const searchResult = useMapStore(state => state.searchResult);
  const jurisdictionDetails = useMapStore(state => state.jurisdictionDetails);
  const setJurisdictionDetails = useMapStore(state => state.setJurisdictionDetails);
  const clearSearch = useMapStore(state => state.clearSearch);

  return (
    <AnimatePresence mode="wait">
      {/* PDS Shop Detail */}
      {activeLayer === 'PDS' && selectedPdsShop && (
        <ResultCard
          key="pds-detail"
          themeColor="red"
          title={selectedPdsShop.properties.name || 'PDS Shop'}
          icon={<ShoppingBag size={20} />}
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
        />
      )}

      {/* PDS Layer Instruction */}
      {activeLayer === 'PDS' && searchResult && !selectedPdsShop && (
         <ResultCard
           key="pds-instruction"
           themeColor="red"
           title={`PDS Shops in ${searchResult.properties.office_name || searchResult.properties.district || ''}`}
           icon={<ShoppingBag size={20} />}
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

      {/* Pincode Info */}
      {activeLayer === 'PINCODE' && searchResult && (
        <ResultCard
          key="pincode-info"
          themeColor="blue"
          title={searchResult.properties.office_name || searchResult.properties.district || searchResult.properties.NAME || 'Selected Area'}
          icon={<MapPin size={20} />}
          data={[
            { label: 'Pincode', value: (searchResult.properties.PIN_CODE || searchResult.properties.pincode || 'N/A').toString(), isPill: true },
            { label: 'District', value: searchResult.properties.district || 'N/A' },
            { label: 'Office Type', value: (searchResult.properties.office_typ as string) || 'N/A' },
            { label: 'Region', value: (searchResult.properties.region_nam as string) || 'N/A' }
          ]}
          onClose={clearSearch}
        />
      )}
    </AnimatePresence>
  );
};

export default ResultContainer;
