/**
 * Translation keys for post office types and statuses
 */

export const getOfficeTypeLabelKey = (type: string): string => {
  // Use existing translation keys directly
  const mapping: Record<string, string> = {
    'HO': 'HO',
    'SO': 'SO',
    'BO': 'BO',
    'PO': 'PO'
  };
  return mapping[type] || type;
};

export const getDeliveryLabelKey = (status: string): string => {
  if (status?.toLowerCase().includes('non')) {
    return 'NON_DELIVERY';
  }
  return 'DELIVERY';
};

export const getOfficeExplanationKey = (type: string, delivery: string): string => {
  if (type === 'HO') {
    return 'HO_EXPLANATION';
  }
  
  if (delivery?.toLowerCase().includes('non')) {
    return 'NON_DELIVERY_EXPLANATION';
  }
  
  return 'POSTAL_DESC_DELIVERY';
};
