import { useMapStore } from '../store/useMapStore';

export const translations = {
  en: {
    // Sidebar Labels
    ESSENTIALS: 'ESSENTIALS',
    CIVIC: 'CIVIC',
    SAFETY: 'SAFETY',
    UTILITIES: 'UTILITIES',
    SETTINGS: 'SETTINGS',
    
    // Layers
    PINCODE: 'Post Offices',
    PDS: 'Ration Shops',
    HEALTH: 'Health Facilities',
    LOCAL_BODIES_V2: 'Local Bodies',
    CONSTITUENCY: 'Constituencies',
    POLICE: 'Police Jurisdictions',
    TNEB: 'TNEB',
    CORPORATION: 'Municipal Corporation',
    MUNICIPALITY: 'Municipality',
    TOWN_PANCHAYAT: 'Town Panchayat',
    VILLAGE_PANCHAYAT: 'Village Panchayat',
    UNKNOWN_LOCAL_BODY: 'Local Body',
    
    // UI Elements
    ABOUT_LEGAL: 'About & Legal',
    DARK_MODE: 'Dark Mode',
    LIGHT_MODE: 'Light Mode',
    LOCATING: 'Locating...',
    LOCATE_ME: 'Locating you...',
    SEARCH_PLACEHOLDER: 'Search Districts, Pincodes, or Offices...',
    EXPERIMENTAL: 'EXPERIMENTAL',
    
    // Search Specifics
    SEARCH_HEALTH: 'Search Hospitals, Districts, or Pincodes...',
    SEARCH_PDS: 'Search Ration Shops, Districts, or Pincodes...',
    SEARCH_TNEB: 'Search TNEB Offices, Districts, or Pincodes...',
    SEARCH_POLICE: 'Search Police Stations, Districts, or Pincodes...',
    SEARCH_CONSTITUENCY: 'Search Constituencies, Districts, or Pincodes...',
    
    // Actions
    DIRECTIONS: 'GET DIRECTIONS',
    REPORT_ISSUE: 'Report an Issue',
    CLOSE: 'Close',
    CANCEL: 'Cancel',
    SEND: 'Send',
    COPY: 'Copy',
    VIEW_DETAILS: 'VIEW DETAILS',

    // Administrative Labels
    DISTRICT: 'District',
    TALUK: 'Taluk',
    BLOCK: 'Block',
    VILLAGE: 'Village',
    CATEGORY: 'Category',
    DIVISION: 'Division',
    CIRCLE: 'Circle',
    REGION: 'Region',
    STATE: 'State',
    AREA: 'Area',
    JURISDICTION: 'Jurisdiction',
    PIN_CODE: 'PIN Code',
    OFFICE_TYPE: 'Office Type',
    ABOUT_OFFICE: 'About this office',
    MORE_INFO: 'More Info',
    SHOP_CODE: 'Shop Code',
    CARE_LEVEL: 'Care Level',
    LOCAL_OFFICES: 'Local Offices',

    // Postal Specific Values
    HO: 'Head Post Office',
    SO: 'Sub Post Office',
    BO: 'Branch Post Office',
    DELIVERY: 'Delivery Office',
    NON_DELIVERY: 'Non-Delivery Office',
    POSTAL_DESC_DELIVERY: 'This post office delivers letters and parcels to nearby homes.',
    POSTAL_DESC_NON_DELIVERY: 'This office provides counter services but does not deliver mail directly.',

    // Facility Types
    MCH: 'Medical College Hospital',
    DH: 'District Hospital',
    SDH: 'Sub-District Hospital',
    CHC: 'Community Health Centre',
    PHC: 'Primary Health Centre',
    HSC: 'Health Sub-Centre',

    // Status & Instructions
    STATUS: 'Status',
    VERIFIED: 'Verified',
    UNAVAILABLE: 'Unavailable',
    INSTRUCTION: 'Instruction',
    NEXT_STEP: 'Next Step',
    MESSAGE: 'Message',
    NOTE: 'Note',
    REASON: 'Reason',
    HIGHLIGHTS: 'Highlights',
    ACTIVE_FILTERS: 'Active Filters',

    // Health/Postal Filters
    EMERGENCY: 'Emergency',
    DELIVERY_SERVICE: 'Delivery',
    DIAGNOSTICS: 'Diagnostics',
    STATEWIDE: 'Statewide',

    // Modals & Legal
    PRIVACY: 'Privacy',
    TERMS: 'Terms',
    DEVELOPER_INFO: 'Developer Information',
    CORRECTION_DETAILS: 'Correction Details',
    TECHNICAL_DETAILS: 'Technical Details',
    UPDATING: 'Updating...',

    // Legal & About Content
    DISCLAIMER: 'About & Disclaimer',
    NON_GOVT_TITLE: 'Non-Government Association',
    NON_GOVT_DESC: 'NammaMap is an independent, non-commercial research project. It is NOT affiliated with, endorsed by, or in any way officially connected to the Government of Tamil Nadu, the Government of India, or any of their agencies.',
    DATA_SOURCE_DESC: 'All data displayed on this portal is aggregated from publicly available government datasets, open data initiatives, and public records. While we strive for precision, the boundaries and locations should be used for informational purposes only.',
    ZERO_DATA_TITLE: 'Zero-Data Policy',
    ZERO_DATA_DESC: 'NammaMap respects your privacy. We do not collect, store, or sell any Personal Identifiable Information (PII).',
    LOCATION_PRIVACY: 'When you use "Locate Me", your coordinates are processed locally in your browser. We never store your GPS history.',
    ACCEPTABLE_USE_TITLE: 'Acceptable Use',
    ACCEPTABLE_USE_DESC: 'By using NammaMap, you agree to use the service for lawful purposes. You may not attempt to scrape or disrupt the application infrastructure.',
    UNDERSTAND: 'I Understand',
  },
  ta: {
    // Sidebar Labels
    ESSENTIALS: 'அவசியமானவை',
    CIVIC: 'குடிமை',
    SAFETY: 'பாதுகாப்பு',
    UTILITIES: 'பயன்பாடுகள்',
    SETTINGS: 'அமைப்புகள்',
    
    // Layers
    PINCODE: 'அஞ்சல் நிலையங்கள்',
    PDS: 'நியாயவிலைக் கடைகள்',
    HEALTH: 'சுகாதார மையங்கள்',
    LOCAL_BODIES_V2: 'உள்ளாட்சி அமைப்புகள்',
    CONSTITUENCY: 'தொகுதிகள்',
    POLICE: 'காவல் எல்லைகள்',
    TNEB: 'மின்சார வாரியம்',
    CORPORATION: 'மாநகராட்சி',
    MUNICIPALITY: 'நகராட்சி',
    TOWN_PANCHAYAT: 'பேரூராட்சி',
    VILLAGE_PANCHAYAT: 'கிராம ஊராட்சி',
    UNKNOWN_LOCAL_BODY: 'உள்ளாட்சி அமைப்பு',
    
    // UI Elements
    ABOUT_LEGAL: 'விவரங்கள் & சட்டவிதிகள்',
    DARK_MODE: 'இருண்ட பயன்முறை',
    LIGHT_MODE: 'ஒளி பயன்முறை',
    LOCATING: 'கண்டறியப்படுகிறது...',
    LOCATE_ME: 'உங்கள் இருப்பிடம் கண்டறியப்படுகிறது...',
    SEARCH_PLACEHOLDER: 'மாவட்டங்கள், பின்கோட்கள் அல்லது அலுவலகங்களைத் தேடுங்கள்...',
    EXPERIMENTAL: 'சோதனை முயற்சி',
    
    // Search Specifics
    SEARCH_HEALTH: 'மருத்துவமனைகள், மாவட்டங்கள் அல்லது பின்கோட்களைத் தேடுங்கள்...',
    SEARCH_PDS: 'ரேஷன் கடைகள், மாவட்டங்கள் அல்லது பின்கோட்களைத் தேடுங்கள்...',
    SEARCH_TNEB: 'மின்சார வாரிய அலுவலகங்கள், மாவட்டங்கள் அல்லது பின்கோட்களைத் தேடுங்கள்...',
    SEARCH_POLICE: 'காவல் நிலையங்கள், மாவட்டங்கள் அல்லது பின்கோட்களைத் தேடுங்கள்...',
    SEARCH_CONSTITUENCY: 'தொகுதிகள், மாவட்டங்கள் அல்லது பின்கோட்களைத் தேடுங்கள்...',
    
    // Actions
    DIRECTIONS: 'வழிசெலுத்தல்',
    REPORT_ISSUE: 'பிழையைத் தெரிவி',
    CLOSE: 'மூடு',
    CANCEL: 'ரத்து செய்',
    SEND: 'அனுப்பு',
    COPY: 'நகலெடு',
    VIEW_DETAILS: 'விவரங்களைக் காண்க',

    // Administrative Labels
    DISTRICT: 'மாவட்டம்',
    TALUK: 'தாலுகா',
    BLOCK: 'ஒன்றியம்',
    VILLAGE: 'கிராமம்',
    CATEGORY: 'வகை',
    DIVISION: 'கோட்டம்',
    CIRCLE: 'வட்டம்',
    REGION: 'மண்டலம்',
    STATE: 'மாநிலம்',
    AREA: 'பகுதி',
    JURISDICTION: 'எல்லை',
    PIN_CODE: 'அஞ்சல் குறியீடு',
    OFFICE_TYPE: 'அலுவலக வகை',
    ABOUT_OFFICE: 'அலுவலகம் பற்றி',
    MORE_INFO: 'கூடுதல் விவரங்கள்',
    SHOP_CODE: 'கடை குறியீடு',
    CARE_LEVEL: 'பராமரிப்பு நிலை',
    LOCAL_OFFICES: 'உள்ளூர் அலுவலகங்கள்',

    // Postal Specific Values
    HO: 'தலைமை அஞ்சலகம்',
    SO: 'துணை அஞ்சலகம்',
    BO: 'கிளை அஞ்சலகம்',
    DELIVERY: 'விநியோக அலுவலகம்',
    NON_DELIVERY: 'விநியோகம் இல்லாத அலுவலகம்',
    POSTAL_DESC_DELIVERY: 'இந்த அஞ்சல் அலுவலகம் அருகிலுள்ள வீடுகளுக்கு கடிதங்கள் மற்றும் பார்சல்களை விநியோகம் செய்கிறது.',
    POSTAL_DESC_NON_DELIVERY: 'இந்த அலுவலகம் கவுண்டர் சேவைகளை வழங்குகிறது, ஆனால் கடிதங்களை நேரடியாக விநியோகம் செய்யாது.',

    // Facility Types
    MCH: 'மருத்துவக் கல்லூரி மருத்துவமனை',
    DH: 'மாவட்ட மருத்துவமனை',
    SDH: 'தாலுகா மருத்துவமனை',
    CHC: 'சமூக சுகாதார மையம்',
    PHC: 'ஆரம்ப சுகாதார மையம்',
    HSC: 'சுகாதார துணை மையம்',

    // Status & Instructions
    STATUS: 'நிலை',
    VERIFIED: 'சரிபார்க்கப்பட்டது',
    UNAVAILABLE: 'கிடைக்கவில்லை',
    INSTRUCTION: 'அறிவுறுத்தல்',
    NEXT_STEP: 'அடுத்த கட்டம்',
    MESSAGE: 'செய்தி',
    NOTE: 'குறிப்பு',
    REASON: 'காரணம்',
    HIGHLIGHTS: 'சிறப்பம்சங்கள்',
    ACTIVE_FILTERS: 'செயலில் உள்ள வடிகட்டிகள்',

    // Health/Postal Filters
    EMERGENCY: 'அவசர நிலை',
    DELIVERY_SERVICE: 'விநியோகம்',
    DIAGNOSTICS: 'கண்டறிதல்',
    STATEWIDE: 'மாநிலம் தழுவிய',

    // Modals & Legal
    PRIVACY: 'தனியுரிமை',
    TERMS: 'விதிமுறைகள்',
    DEVELOPER_INFO: 'உருவாக்கியவர் விவரம்',
    CORRECTION_DETAILS: 'திருத்த விவரங்கள்',
    TECHNICAL_DETAILS: 'தொழில்நுட்ப விவரங்கள்',
    UPDATING: 'புதுப்பிக்கப்படுகிறது...',

    // Legal & About Content
    DISCLAIMER: 'விவரங்கள் & பொறுப்புத் துறப்பு',
    NON_GOVT_TITLE: 'அரசு சாரா அமைப்பு',
    NON_GOVT_DESC: 'நம்ம மேப் (NammaMap) என்பது ஒரு சுதந்திரமான, வணிக நோக்கமற்ற ஆராய்ச்சி திட்டமாகும். இது தமிழ்நாடு அரசு, இந்திய அரசு அல்லது அவற்றின் எந்தவொரு முகமைகளுடனும் (TNEB, PDS போன்றவை) அதிகாரப்பூர்வமாக இணைக்கப்படவில்லை.',
    DATA_SOURCE_DESC: 'இந்தத் தளத்தில் காட்டப்படும் அனைத்துத் தரவுகளும் பொதுவில் கிடைக்கக்கூடிய அரசுத் தரவுத்தொகுப்புகள் மற்றும் பொதுப் பதிவுகளிலிருந்து சேகரிக்கப்பட்டவை. துல்லியத்திற்காக நாங்கள் முயற்சி செய்தாலும், எல்லைகள் மற்றும் இடங்கள் தகவல் நோக்கங்களுக்காக மட்டுமே பயன்படுத்தப்பட வேண்டும்.',
    ZERO_DATA_TITLE: 'பூஜ்ஜியத் தரவுக் கொள்கை',
    ZERO_DATA_DESC: 'நம்ம மேப் உங்கள் தனியுரிமையை மதிக்கிறது. நாங்கள் தனிப்பட்ட முறையில் அடையாளம் காணக்கூடிய எந்தத் தகவலையும் சேகரிக்கவோ, சேமிக்கவோ அல்லது விற்கவோ மாட்டோம்.',
    LOCATION_PRIVACY: '"என்னைத் தேடு" அம்சத்தைப் பயன்படுத்தும்போது, உங்கள் இருப்பிடம் உங்கள் உலாவியிலேயே செயல்படுத்தப்படுகிறது. உங்கள் இருப்பிட வரலாற்றை நாங்கள் ஒருபோதும் சேமிப்பதில்லை.',
    ACCEPTABLE_USE_TITLE: 'ஏற்கத்தக்க பயன்பாடு',
    ACCEPTABLE_USE_DESC: 'நம்ம மேப்-ஐப் பயன்படுத்துவதன் மூலம், சேவையைச் சட்டப்பூர்வ நோக்கங்களுக்காகப் பயன்படுத்த ஒப்புக்கொள்கிறீர்கள். பயன்பாட்டின் உள்கட்டமைப்பை சீர்குலைக்க நீங்கள் முயற்சிக்கக்கூடாது.',
    UNDERSTAND: 'எனக்கு புரிகிறது',
  }
};

export type TranslationKey = keyof typeof translations.en;

export const useTranslation = () => {
  const language = useMapStore(state => state.language);
  
  const t = (key: TranslationKey): string => {
    return (translations[language] as any)[key] || (translations.en as any)[key] || key;
  };
  
  return { t, language };
};
