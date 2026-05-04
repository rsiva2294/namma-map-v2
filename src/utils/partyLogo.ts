import { PARTY_COLORS } from '../types/gis';

export const getPartyAbbreviation = (partyName: string): string => {
  if (!partyName) return 'OTHERS';
  
  const normalized = partyName.toUpperCase().trim();
  
  // Direct match
  if (PARTY_COLORS[normalized]) return normalized;
  
  // Map full names to abbreviations
  const fullNameMap: Record<string, string> = {
    'ALL INDIA ANNA DRAVIDA MUNNETRA KAZHAGAM': 'ADMK',
    'AIADMK': 'ADMK',
    'AMMA MAKKAL MUNNETTRA KAZAGAM': 'AMMK',
    'BHARATIYA JANATA PARTY': 'BJP',
    'BAHUJAN SAMAJ PARTY': 'BSP',
    'COMMUNIST PARTY OF INDIA (MARXIST)': 'CPI(M)',
    'COMMUNIST PARTY OF INDIA': 'CPI',
    'DESIYA MURPOKKU DRAVIDA KAZHAGAM': 'DMDK',
    'DRAVIDA MUNNETRA KAZHAGAM': 'DMK',
    'INDIAN NATIONAL CONGRESS': 'INC',
    'INDIAN UNION MUSLIM LEAGUE': 'IUML',
    'NAAM TAMILAR KATCHI': 'NTK',
    'PATTALI MAKKAL KATCHI': 'PMK',
    'PUTHIYA TAMILAGAM': 'PT',
    'TAMILAGA VETTRI KAZHAGAM': 'TVK',
    'VIDUTHALAI CHIRUTHAIGAL KATCHI': 'VCK'
  };

  return fullNameMap[normalized] || 'OTHERS';
};

export const getPartyColor = (partyName: string): string => {
  const abbr = getPartyAbbreviation(partyName);
  return PARTY_COLORS[abbr] || PARTY_COLORS['OTHERS'];
};

export const getPartyLogo = (partyName: string): string | null => {
  if (!partyName) return null;
  
  const abbr = getPartyAbbreviation(partyName);
  
  const logoMap: Record<string, string> = {
    'ADMK': 'aiadmk.svg',
    'AMMK': 'ammk.webp',
    'BJP': 'bjp.svg',
    'BSP': 'bsp.webp',
    'CPI(M)': 'cpi-m.svg',
    'CPI': 'cpi.svg',
    'DMDK': 'dmdk.webp',
    'DMK': 'dmk.svg',
    'INC': 'inc.svg',
    'IUML': 'iuml.svg',
    'NTK': 'ntk.webp',
    'PMK': 'pmk.svg',
    'PT': 'pt.webp',
    'TVK': 'tvk.webp',
    'VCK': 'vck.webp'
  };

  const filename = logoMap[abbr];
  return filename ? `/parties/${filename}` : null;
};

