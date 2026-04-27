export const districtMap: Record<string, string> = {
  'Ariyalur': 'அரியலூர்',
  'Chengalpattu': 'செங்கல்பட்டு',
  'Chennai': 'சென்னை',
  'Coimbatore': 'கோயம்புத்தூர்',
  'Cuddalore': 'கடலூர்',
  'Dharmapuri': 'தர்மபுரி',
  'Dindigul': 'திண்டுக்கல்',
  'Erode': 'ஈரோடு',
  'Kallakurichi': 'கள்ளக்குறிச்சி',
  'Kanchipuram': 'காஞ்சீபுரம்',
  'Kanniyakumari': 'கன்னியாகுமரி',
  'Karur': 'கரூர்',
  'Krishnagiri': 'கிருஷ்ணகிரி',
  'Madurai': 'மதுரை',
  'Mayiladuthurai': 'மயிலாடுதுறை',
  'Nagapattinam': 'நாகப்பட்டினம்',
  'Namakkal': 'நாமக்கல்',
  'Nilgiris': 'நீலகிரி',
  'Perambalur': 'பெரம்பலூர்',
  'Pudukkottai': 'புதுக்கோட்டை',
  'Ramanathapuram': 'ராமநாதபுரம்',
  'Ranipet': 'ராணிப்பேட்டை',
  'Salem': 'சேலம்',
  'Sivaganga': 'சிவகாசி',
  'Tenkasi': 'தென்காசி',
  'Thanjavur': 'தஞ்சாவூர்',
  'Theni': 'தேனி',
  'Thoothukudi': 'தூத்துக்குடி',
  'Tiruchirappalli': 'திருச்சிராப்பள்ளி',
  'Tirunelveli': 'திருநெல்வேலி',
  'Tirupathur': 'திருப்பத்தூர்',
  'Tiruppur': 'திருப்பூர்',
  'Tiruvallur': 'திருவள்ளூர்',
  'Tiruvannamalai': 'திருவண்ணாமலை',
  'Tiruvarur': 'திருவாரூர்',
  'Vellore': 'வேலூர்',
  'Viluppuram': 'விழுப்புரம்',
  'Virudhunagar': 'விருதுநகர்'
};

/**
 * Translates a district name if a mapping exists.
 */
export const translateDistrict = (name: string | null | undefined, language: 'en' | 'ta'): string => {
  if (!name) return '';
  if (language === 'en') return name;
  
  // Try to find a match in the map (case-insensitive)
  const key = Object.keys(districtMap).find(
    k => k.toLowerCase() === name.toLowerCase().replace(/\s+/g, '') || 
         k.toLowerCase() === name.toLowerCase()
  );
  
  return key ? districtMap[key] : name;
};
