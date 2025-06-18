export interface UPIApp {
  id: string;
  name: string;
  shortName?: string;
  icon?: string;
  category: 'public' | 'private' | 'payment' | 'small-finance' | 'foreign' | 'regional-rural';
  description: string;
  available: boolean; // Whether the app is available for analysis
  bankCode?: string; // Added for bank identification
}

export const UPI_APPS: UPIApp[] = [
  // Public Sector Banks
  {
    id: 'sbi',
    name: 'State Bank of India',
    shortName: 'SBI',
    description: 'India\'s largest public sector bank',
    category: 'public',
    available: true,
    bankCode: 'SBI'
  },
  {
    id: 'bob',
    name: 'Bank of Baroda',
    shortName: 'BOB',
    description: 'Leading public sector bank',
    category: 'public',
    available: true,
    bankCode: 'BARB'
  },
  {
    id: 'pnb',
    name: 'Punjab National Bank',
    shortName: 'PNB',
    description: 'One of India\'s oldest public sector banks',
    category: 'public',
    available: true,
    bankCode: 'PUNB'
  },
  {
    id: 'canara',
    name: 'Canara Bank',
    description: 'Major public sector bank',
    category: 'public',
    available: true,
    bankCode: 'CNRB'
  },

  // Private Sector Banks
  {
    id: 'hdfc',
    name: 'HDFC Bank',
    description: 'India\'s largest private sector bank',
    category: 'private',
    available: true,
    bankCode: 'HDFC'
  },
  {
    id: 'icici',
    name: 'ICICI Bank',
    description: 'Leading private sector bank',
    category: 'private',
    available: true,
    bankCode: 'ICIC'
  },
  {
    id: 'axis',
    name: 'Axis Bank',
    description: 'Major private sector bank',
    category: 'private',
    available: true,
    bankCode: 'UTIB'
  },
  {
    id: 'kotak',
    name: 'Kotak Mahindra Bank',
    shortName: 'Kotak',
    description: 'Private sector banking and financial services',
    category: 'private',
    available: true,
    bankCode: 'KKBK'
  },

  // Payment Banks
  {
    id: 'paytm',
    name: 'Paytm Payments Bank',
    shortName: 'Paytm',
    description: 'Digital payments and banking services',
    category: 'payment',
    available: true,
    bankCode: 'PYTM'
  },
  {
    id: 'airtel',
    name: 'Airtel Payments Bank',
    shortName: 'Airtel',
    description: 'Digital banking services',
    category: 'payment',
    available: true,
    bankCode: 'AIRP'
  },
  {
    id: 'jio',
    name: 'Jio Payments Bank',
    shortName: 'Jio',
    description: 'Digital banking platform',
    category: 'payment',
    available: true,
    bankCode: 'JIOP'
  },

  // Small Finance Banks
  {
    id: 'ausfb',
    name: 'AU Small Finance Bank',
    shortName: 'AU Bank',
    description: 'Small finance banking services',
    category: 'small-finance',
    available: true,
    bankCode: 'AUBL'
  },
  {
    id: 'equitas',
    name: 'Equitas Small Finance Bank',
    shortName: 'Equitas',
    description: 'Small finance banking services',
    category: 'small-finance',
    available: true,
    bankCode: 'ESFB'
  },

  // Foreign Banks
  {
    id: 'citi',
    name: 'Citibank',
    description: 'International banking services',
    category: 'foreign',
    available: true,
    bankCode: 'CITI'
  },
  {
    id: 'hsbc',
    name: 'HSBC Bank',
    description: 'Global banking and financial services',
    category: 'foreign',
    available: true,
    bankCode: 'HSBC'
  },

  // Additional Payment Apps
  {
    id: 'phonepe',
    name: 'PhonePe',
    description: 'Digital payments platform',
    category: 'payment',
    available: true
  },
  {
    id: 'gpay',
    name: 'Google Pay',
    description: 'Google\'s payment service',
    category: 'payment',
    available: true
  },
  {
    id: 'bhim',
    name: 'BHIM',
    description: 'Government\'s UPI payment app',
    category: 'payment',
    available: true
  }
];

export const getAppsByCategory = (category?: UPIApp['category'], onlyAvailable: boolean = false) => {
  let apps = UPI_APPS;
  
  if (onlyAvailable) {
    apps = apps.filter(app => app.available);
  }
  
  if (category) {
    return apps.filter(app => app.category === category);
  }
  
  return apps;
};

export const findAppById = (id: string) => {
  return UPI_APPS.find(app => app.id === id);
};

export const findAppByName = (name: string): UPIApp | undefined => {
  return UPI_APPS.find(app => 
    app.name.toLowerCase() === name.toLowerCase() || 
    app.shortName?.toLowerCase() === name.toLowerCase()
  );
};

export const searchApps = (query: string): UPIApp[] => {
  const searchTerms = query.toLowerCase().trim().split(/\s+/);
  
  return UPI_APPS.filter(app => {
    const searchableText = [
      app.name.toLowerCase(),
      app.shortName?.toLowerCase() || '',
      app.description.toLowerCase(),
      app.bankCode?.toLowerCase() || '',
      // Add common bank terms for better matching
      ['public', 'private', 'small-finance', 'regional-rural'].includes(app.category) ? [
        'bank',
        'banking',
        'upi',
        'mobile banking',
        'netbanking',
        'payment'
      ].join(' ') : '',
      // Add common wallet terms
      app.category === 'payment' ? [
        'wallet',
        'digital wallet',
        'money',
        'transfer'
      ].join(' ') : '',
      // Add common payment terms
      app.category === 'payment' ? [
        'upi',
        'payment',
        'transfer',
        'money',
        'digital payment'
      ].join(' ') : ''
    ].join(' ');

    // Match if any search term is found in the searchable text
    return searchTerms.every(term => searchableText.includes(term));
  });
};

// Helper function to get search suggestions
export const getSearchSuggestions = (query: string): string[] => {
  if (!query.trim()) return [];
  
  const results = searchApps(query);
  const suggestions: string[] = [];
  
  results.forEach(app => {
    suggestions.push(app.name);
    if (app.shortName) suggestions.push(app.shortName);
    
    // Add bank-specific suggestions
    if (['public', 'private', 'small-finance', 'regional-rural'].includes(app.category)) {
      suggestions.push(`${app.name} UPI`);
      suggestions.push(`${app.name} Mobile Banking`);
      if (app.bankCode) suggestions.push(app.bankCode);
    }
  });
  
  // Remove duplicates and sort
  return [...new Set(suggestions)]
    .sort((a, b) => a.length - b.length)
    .slice(0, 10); // Limit to top 10 suggestions
};

export const CATEGORY_TITLES = {
  public: 'Public Sector Banks',
  private: 'Private Sector Banks',
  payment: 'Payment Banks',
  'small-finance': 'Small Finance Banks',
  foreign: 'Foreign Banks',
  'regional-rural': 'Regional Rural Banks'
}; 