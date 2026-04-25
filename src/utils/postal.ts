/**
 * Human-readable mappings for post office types and statuses
 */

export const getOfficeTypeLabel = (type: string): string => {
  const mapping: Record<string, string> = {
    'HO': 'Main Post Office',
    'SO': 'Sub Post Office',
    'BO': 'Branch Post Office',
    'PO': 'Post Office' // Generic fallback
  };
  return mapping[type] || type;
};

export const getDeliveryLabel = (status: string): string => {
  if (status?.toLowerCase().includes('non')) {
    return '❌ No Home Delivery';
  }
  return '📬 Delivery Available';
};

export const getOfficeExplanation = (type: string, delivery: string): string => {
  if (type === 'HO') {
    return 'This is a main post office with full postal and banking services.';
  }
  
  if (delivery?.toLowerCase().includes('non')) {
    return 'This post office does not deliver to homes. Visit here for counter services.';
  }
  
  return 'This post office delivers letters and parcels to nearby homes.';
};
