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
  }
};

export type TranslationKey = keyof typeof translations.en;

export const useTranslation = () => {
  const language = useMapStore(state => state.language);
  
  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };
  
  return { t, language };
};
