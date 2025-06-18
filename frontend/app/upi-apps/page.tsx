'use client';

import { useState, useEffect } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UPIAppsPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [selectedApp, setSelectedApp] = useState('');

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('upiAppFavorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  const toggleFavorite = (e: React.MouseEvent, appName: string) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(appName)) {
        newFavorites.delete(appName);
      } else {
        newFavorites.add(appName);
      }
      // Save to localStorage
      localStorage.setItem('upiAppFavorites', JSON.stringify([...newFavorites]));
      return newFavorites;
    });
  };

  const handleAppClick = (appName: string) => {
    if (appName === 'PhonePe') {
      router.push('/phonepe');
    } else {
      setSelectedApp(appName);
      setShowComingSoon(true);
    }
  };

  const upiApps = [
    {
      name: 'PhonePe',
      logo: 'PP',
      color: '#5f259f',
      description: 'Digital payments & financial services',
      category: 'Popular',
      bankPartners: ['Yes Bank', 'ICICI Bank', 'Axis Bank']
    },
    {
      name: 'Google Pay',
      logo: 'GPay',
      color: '#4285F4',
      description: 'Google\'s UPI payment service',
      category: 'Popular',
      bankPartners: ['Axis Bank', 'HDFC Bank', 'ICICI Bank', 'SBI']
    },
    {
      name: 'Paytm',
      logo: 'paytm',
      color: '#00B9F1',
      description: 'Digital payments & commerce',
      category: 'Popular',
      bankPartners: ['Yes Bank', 'Axis Bank', 'HDFC Bank', 'SBI'],
      isSpecialLogo: true
    },
    {
      name: 'WhatsApp Pay',
      logo: 'WA',
      color: '#25D366',
      description: 'WhatsApp\'s UPI payments',
      category: 'Popular',
      bankPartners: ['ICICI Bank', 'Axis Bank', 'HDFC Bank', 'SBI']
    },
    {
      name: 'Amazon Pay',
      logo: 'Pay',
      color: '#FF9900',
      description: 'Amazon\'s payment service',
      category: 'Popular',
      bankPartners: ['Axis Bank', 'Yes Bank', 'RBL Bank']
    },
    {
      name: 'CRED',
      logo: 'CRED',
      color: '#000000',
      description: 'Credit card payments & rewards',
      category: 'Finance',
      bankPartners: ['Axis Bank', 'Yes Bank']
    },
    {
      name: 'Flipkart',
      logo: 'FK',
      color: '#2874F0',
      description: 'Flipkart\'s UPI payment service',
      category: 'Shopping',
      bankPartners: ['Axis Bank']
    },
    {
      name: 'MobiKwik',
      logo: 'MK',
      color: '#232C65',
      description: 'Digital wallet & payments',
      category: 'Finance',
      bankPartners: ['HDFC Bank']
    },
    {
      name: 'Jupiter Money',
      logo: 'JM',
      color: '#5D3FD3',
      description: 'Banking & payments app',
      category: 'Finance',
      bankPartners: ['Axis Bank']
    },
    {
      name: 'Groww',
      logo: 'GW',
      color: '#5367FF',
      description: 'Investment & payments platform',
      category: 'Finance',
      bankPartners: ['Yes Bank']
    },
    {
      name: 'Tata Neu',
      logo: 'TN',
      color: '#FF0000',
      description: 'Tata\'s super app with payments',
      category: 'Shopping',
      bankPartners: ['ICICI Bank']
    },
    {
      name: 'Samsung Pay',
      logo: 'SP',
      color: '#1428A0',
      description: 'Samsung\'s payment service',
      category: 'Tech',
      bankPartners: ['Axis Bank']
    },
    {
      name: 'Bajaj Finserv',
      logo: 'BF',
      color: '#00A3E0',
      description: 'Financial services & payments',
      category: 'Finance',
      bankPartners: ['Axis Bank']
    },
    {
      name: 'Fi Money',
      logo: 'Fi',
      color: '#8A2BE2',
      description: 'Neo-banking & payments',
      category: 'Finance',
      bankPartners: ['Federal Bank']
    },
    {
      name: 'Navi',
      logo: 'NV',
      color: '#7B68EE',
      description: 'Financial services platform',
      category: 'Finance',
      bankPartners: ['Axis Bank']
    }
  ];

  const categories = ['all', 'Popular', 'Finance', 'Shopping', 'Tech'];
  
  const filteredApps = selectedCategory === 'all' 
    ? upiApps 
    : upiApps.filter(app => app.category === selectedCategory);

  const favoriteApps = upiApps.filter(app => favorites.has(app.name));

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <button 
          onClick={() => router.push('/')}
          className="text-white hover:text-zinc-300 transition-colors"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-medium text-white">UPI Apps</h1>
      </div>

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-2xl max-w-sm w-full mx-4">
            <h3 className="text-white text-lg font-medium mb-2">{selectedApp}</h3>
            <p className="text-zinc-400 mb-4">Coming Soon! This feature is under development.</p>
            <button
              onClick={() => setShowComingSoon(false)}
              className="w-full bg-white text-black py-2 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="px-4 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-white text-black'
                  : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
            >
              {category === 'all' ? 'All Apps' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Favorites Section */}
      {favoriteApps.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-white font-medium mb-3">Favorites</h2>
          <div className="grid grid-cols-1 gap-4">
            {favoriteApps.map((app) => (
              <div 
                key={app.name}
                onClick={() => handleAppClick(app.name)}
                className="group bg-zinc-800/80 p-4 rounded-2xl border border-zinc-700/50 hover:bg-zinc-700/80 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden"
                       style={{ backgroundColor: app.isSpecialLogo ? 'white' : app.color }}>
                    {app.isSpecialLogo ? (
                      <div className="flex flex-col items-center">
                        <span style={{ color: app.color }} className="text-sm font-bold leading-none">pay</span>
                        <span style={{ color: app.color }} className="text-[7px] font-bold leading-none mt-0.5">tm</span>
                      </div>
                    ) : (
                      <span className="text-white text-sm font-bold">{app.logo}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{app.name}</h3>
                    <p className="text-sm text-zinc-400 mt-0.5">{app.description}</p>
                    <p className="text-xs text-zinc-500 mt-1">Partners: {app.bankPartners.join(', ')}</p>
                  </div>
                  <button
                    onClick={(e) => toggleFavorite(e, app.name)}
                    className="text-white"
                  >
                    <Star className="w-5 h-5 fill-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Apps */}
      <div className="p-4">
        <h2 className="text-white font-medium mb-3">{selectedCategory === 'all' ? 'All Apps' : selectedCategory}</h2>
        <div className="grid grid-cols-1 gap-4">
          {filteredApps.map((app) => (
            <div 
              key={app.name}
              onClick={() => handleAppClick(app.name)}
              className="group bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800/50 hover:bg-zinc-800/80 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden"
                     style={{ backgroundColor: app.isSpecialLogo ? 'white' : app.color }}>
                  {app.isSpecialLogo ? (
                    <div className="flex flex-col items-center">
                      <span style={{ color: app.color }} className="text-sm font-bold leading-none">pay</span>
                      <span style={{ color: app.color }} className="text-[7px] font-bold leading-none mt-0.5">tm</span>
                    </div>
                  ) : (
                    <span className="text-white text-sm font-bold">{app.logo}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">{app.name}</h3>
                  <p className="text-sm text-zinc-400 mt-0.5">{app.description}</p>
                  <p className="text-xs text-zinc-500 mt-1">Partners: {app.bankPartners.join(', ')}</p>
                </div>
                <button
                  onClick={(e) => toggleFavorite(e, app.name)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <Star className={`w-5 h-5 ${favorites.has(app.name) ? 'fill-white text-white' : ''}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 