/**
 * Translation keys for post office types and statuses
 */

export const getOfficeTypeLabelKey = (type: string): string => {
  const mapping: Record<string, string> = {
    'HO': 'MAIN_POST_OFFICE',
    'SO': 'SUB_POST_OFFICE',
    'BO': 'BRANCH_POST_OFFICE',
    'PO': 'POST_OFFICE'
  };
  return mapping[type] || type;
};

export const getDeliveryLabelKey = (status: string): string => {
  if (status?.toLowerCase().includes('non')) {
    return 'NO_HOME_DELIVERY';
  }
  return 'DELIVERY_AVAILABLE';
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
