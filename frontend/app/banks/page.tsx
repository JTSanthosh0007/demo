'use client';

import { useState, useEffect } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BanksPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [selectedBank, setSelectedBank] = useState('');

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('bankFavorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  const toggleFavorite = (e: React.MouseEvent, bankName: string) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(bankName)) {
        newFavorites.delete(bankName);
      } else {
        newFavorites.add(bankName);
      }
      // Save to localStorage
      localStorage.setItem('bankFavorites', JSON.stringify([...newFavorites]));
      return newFavorites;
    });
  };

  const handleBankClick = (bankName: string) => {
    if (bankName === 'Kotak Mahindra Bank') {
      router.push('/kotak');
    } else {
      setSelectedBank(bankName);
      setShowComingSoon(true);
    }
  };

  const banks = [
    // Public Sector Banks
    {
      name: 'State Bank of India',
      shortName: 'SBI',
      color: '#2d5a27',
      description: 'India\'s largest public sector bank',
      category: 'Public Sector'
    },
    {
      name: 'Bank of Baroda',
      shortName: 'BOB',
      color: '#004990',
      description: 'Major public sector bank',
      category: 'Public Sector'
    },
    {
      name: 'Punjab National Bank',
      shortName: 'PNB',
      color: '#4B266D',
      description: 'Public sector banking',
      category: 'Public Sector'
    },
    {
      name: 'Canara Bank',
      shortName: 'CANARA',
      color: '#00573F',
      description: 'Public sector banking services',
      category: 'Public Sector'
    },
    {
      name: 'Union Bank of India',
      shortName: 'UBI',
      color: '#1F4E79',
      description: 'Public sector bank',
      category: 'Public Sector'
    },
    {
      name: 'Bank of India',
      shortName: 'BOI',
      color: '#0033A0',
      description: 'Public sector banking services',
      category: 'Public Sector'
    },
    {
      name: 'Indian Bank',
      shortName: 'IB',
      color: '#1E4CA0',
      description: 'Public sector bank',
      category: 'Public Sector'
    },
    {
      name: 'Central Bank of India',
      shortName: 'CBI',
      color: '#D40000',
      description: 'Public sector banking',
      category: 'Public Sector'
    },

    // Private Sector Banks
    {
      name: 'HDFC Bank',
      shortName: 'HDFC',
      color: '#004c8f',
      description: 'Leading private sector bank',
      category: 'Private Sector'
    },
    {
      name: 'ICICI Bank',
      shortName: 'ICICI',
      color: '#F58220',
      description: 'Major private sector bank',
      category: 'Private Sector'
    },
    {
      name: 'Axis Bank',
      shortName: 'AXIS',
      color: '#97144d',
      description: 'Private sector banking services',
      category: 'Private Sector'
    },
    {
      name: 'Kotak Mahindra Bank',
      shortName: 'KOTAK',
      color: '#EF3E23',
      description: 'Private sector banking',
      category: 'Private Sector'
    },
    {
      name: 'Yes Bank',
      shortName: 'YES',
      color: '#00204E',
      description: 'Private sector banking',
      category: 'Private Sector'
    },
    {
      name: 'IndusInd Bank',
      shortName: 'IIB',
      color: '#172B85',
      description: 'Private sector banking services',
      category: 'Private Sector'
    },
    {
      name: 'Federal Bank',
      shortName: 'FB',
      color: '#21409A',
      description: 'Private sector bank',
      category: 'Private Sector'
    },
    {
      name: 'IDFC FIRST Bank',
      shortName: 'IDFC',
      color: '#5A2D81',
      description: 'Private sector banking',
      category: 'Private Sector'
    },

    // Small Finance Banks
    {
      name: 'AU Small Finance Bank',
      shortName: 'AU',
      color: '#00A3E0',
      description: 'Small finance banking services',
      category: 'Small Finance'
    },
    {
      name: 'Equitas Small Finance Bank',
      shortName: 'ESFB',
      color: '#ED1C24',
      description: 'Small finance bank',
      category: 'Small Finance'
    },
    {
      name: 'Ujjivan Small Finance Bank',
      shortName: 'USFB',
      color: '#00A551',
      description: 'Small finance banking',
      category: 'Small Finance'
    },

    // Payment Banks
    {
      name: 'Paytm Payments Bank',
      shortName: 'PAYTM',
      color: '#00B9F1',
      description: 'Digital payments bank',
      category: 'Payments Bank'
    },
    {
      name: 'Airtel Payments Bank',
      shortName: 'AIRTEL',
      color: '#ED1C24',
      description: 'Telecom-led payments bank',
      category: 'Payments Bank'
    },
    {
      name: 'India Post Payments Bank',
      shortName: 'IPPB',
      color: '#24692D',
      description: 'Government payments bank',
      category: 'Payments Bank'
    }
  ];

  const categories = ['all', 'Public Sector', 'Private Sector', 'Small Finance', 'Payments Bank'];
  
  const filteredBanks = selectedCategory === 'all' 
    ? banks 
    : banks.filter(bank => bank.category === selectedCategory);

  const favoriteBanks = banks.filter(bank => favorites.has(bank.name));

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
        <h1 className="text-lg font-medium text-white">Banks</h1>
      </div>

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-2xl max-w-sm w-full mx-4">
            <h3 className="text-white text-lg font-medium mb-2">{selectedBank}</h3>
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
              {category === 'all' ? 'All Banks' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Favorites Section */}
      {favoriteBanks.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-white font-medium mb-3">Favorites</h2>
          <div className="grid grid-cols-1 gap-4">
            {favoriteBanks.map((bank) => (
              <div 
                key={bank.name}
                onClick={() => handleBankClick(bank.name)}
                className="group bg-zinc-800/80 p-4 rounded-2xl border border-zinc-700/50 hover:bg-zinc-700/80 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: bank.color }}
                  >
                    {bank.shortName}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{bank.name}</h3>
                    <p className="text-sm text-zinc-400 mt-0.5">{bank.description}</p>
                  </div>
                  <button
                    onClick={(e) => toggleFavorite(e, bank.name)}
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

      {/* All Banks */}
      <div className="p-4">
        <h2 className="text-white font-medium mb-3">{selectedCategory === 'all' ? 'All Banks' : selectedCategory}</h2>
        <div className="grid grid-cols-1 gap-4">
          {filteredBanks.map((bank) => (
            <div 
              key={bank.name}
              onClick={() => handleBankClick(bank.name)}
              className="group bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800/50 hover:bg-zinc-800/80 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: bank.color }}
                >
                  {bank.shortName}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">{bank.name}</h3>
                  <p className="text-sm text-zinc-400 mt-0.5">{bank.description}</p>
                </div>
                <button
                  onClick={(e) => toggleFavorite(e, bank.name)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <Star className={`w-5 h-5 ${favorites.has(bank.name) ? 'fill-white text-white' : ''}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 