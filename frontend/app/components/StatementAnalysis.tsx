'use client'

import { useMemo, useState, useEffect, useCallback, useRef, memo, Suspense } from 'react'
import { HomeIcon, ChartBarIcon, FolderIcon, Cog6ToothIcon, PlusIcon, ArrowLeftIcon, DocumentTextIcon, ArrowUpTrayIcon, DocumentIcon, WalletIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
// import { createClient } from '@supabase/supabase-js'
import { UPIApp, UPI_APPS } from '../constants/upiApps'
import UPIAppGrid from './UPIAppGrid'
import { Star } from 'lucide-react'
import dynamic from 'next/dynamic'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
} from 'chart.js'
import { useRouter } from 'next/navigation'
import AccountAnalysis from './AccountAnalysis'
import LoadingSpinner from './LoadingSpinner'

// Dynamically import Chart.js components with no SSR
const Chart = dynamic(() => import('react-chartjs-2').then(mod => mod.Pie), { ssr: false })
const Line = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { ssr: false })
const Bar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), { ssr: false })

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
)

// Add Supabase client initialization after imports
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL || '',
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
// );

type Transaction = {
  date: string
  amount: number
  description: string
  category: string
  icon?: string
}

type AnalysisData = {
  transactions: Transaction[]
  totalSpent: number
  totalReceived: number
  categoryBreakdown: Record<string, number>
  accounts?: {
    accountName: string
    bankLogo?: string
    accountNumber: string
    paymentsMade: {
      count: number
      total: number
    }
    paymentsReceived: {
      count: number
      total: number
    }
  }[]
}

export type View = 'home' | 'settings'  | 'phonepe-analysis' | 'more-upi-apps' | 'more-banks' | 'profile' | 'notifications' | 'report-issue' | 'signin' | 'banks' | 'upi-apps' | 'account-settings' | 'refer-and-and-earn' | 'favorites' | 'history';

export type AnalysisState = 'upload' | 'analyzing' | 'results'

export interface AnalysisResult {
  transactions: {
    date: string;
    amount: number;
    description: string;
    category: string;
  }[];
  summary: {
    totalReceived: number;
    totalSpent: number;
    balance: number;
    creditCount: number;
    debitCount: number;
    totalTransactions: number;
  };
  categoryBreakdown: Record<string, number>;
  accounts?: {
    accountName: string;
    bankLogo?: string;
    accountNumber: string;
    paymentsMade: {
      count: number;
      total: number;
    };
    paymentsReceived: {
      count: number;
      total: number;
    };
  }[];
  pageCount: number;
  chartData?: any;
}

// Add profile interface at the top with other interfaces
interface Profile {
  full_name: string;
  email: string;
  phone_number?: string; // Added phone_number
}

interface HomeViewProps {
  setCurrentView: (view: View) => void;
  setIsSearchOpen: (isOpen: boolean) => void;
  favorites: Set<string>;
  toggleFavorite: (appName: string) => void;
  navigate: (path: string) => void;
}

interface SettingsViewProps {
  setCurrentView: (view: View) => void;
  setIsSearchOpen: (isOpen: boolean) => void;
  profile?: Profile;
  onLogout: () => void;
}

interface FavoritesViewProps {
  setCurrentView: (view: View) => void;
  setIsSearchOpen: (isOpen: boolean) => void;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  groupedResults: Record<string, any[]>;
}

interface AccountSettingsViewProps {
  setCurrentView: (view: View) => void;
  profile?: Profile; // Pass profile data
  // supabase: any; // Pass Supabase client - uncomment when client is configured
}

const HomeView: React.FC<HomeViewProps> = ({
  setCurrentView,
  setIsSearchOpen,
  favorites,
  toggleFavorite,
  navigate,
}) => {
    return (
    <div className="min-h-screen bg-black">
      {/* Available Apps Section */}
      <div className="px-4">
        <h2 className="text-base font-medium text-white mb-4">Available Apps</h2>
        <div className="space-y-3">
          {/* PhonePe */}
          <div 
            onClick={() => setCurrentView('phonepe-analysis')}
            className="bg-[#1C1C1E] rounded-2xl p-4 cursor-pointer hover:bg-zinc-800/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl overflow-hidden flex items-center justify-center">
                <div className="w-8 h-8 bg-[#5f259f] rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">Pe</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">PhonePe</h3>
                <p className="text-xs text-zinc-500">Analyze your PhonePe statements</p>
              </div>
            </div>
          </div>

          {/* Kotak Mahindra Bank */}
          <div 
            onClick={() => setCurrentView('home')}
            className="bg-[#1C1C1E] rounded-2xl p-4 cursor-pointer hover:bg-zinc-800/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl overflow-hidden flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <span className="text-[#EF3E23] text-sm font-bold leading-none">KOTAK</span>
                  <span className="text-[#EF3E23] text-[8px] font-bold leading-none mt-0.5">BANK</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Kotak Mahindra Bank</h3>
                <p className="text-xs text-zinc-500">Analyze your Kotak Bank statements</p>
          </div>
        </div>
      </div>

      {/* PDF Unlocker */}
        <div 
          onClick={() => navigate('/pdf-unlocker')}
          className="bg-[#1C1C1E] rounded-2xl p-4 cursor-pointer hover:bg-zinc-800/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">PDF Unlocker</h3>
                <p className="text-xs text-zinc-500">Unlock password-protected PDF statements</p>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* View All Buttons */}
      <div className="px-4 mt-6 grid grid-cols-2 gap-3">
        {/* View All Banks */}
        <div
          onClick={() => navigate('/banks')}
          className="bg-zinc-800/50 rounded-xl p-4 text-center cursor-pointer hover:bg-zinc-800 transition-colors"
        >
          <h3 className="text-sm font-medium text-white">View All Banks</h3>
        </div>

        {/* View All UPI Apps */}
        <div
          onClick={() => navigate('/upi-apps')}
          className="bg-zinc-800/50 rounded-xl p-4 text-center cursor-pointer hover:bg-zinc-800 transition-colors"
        >
          <h3 className="text-sm font-medium text-white">View All UPI Apps</h3>
        </div>
      </div>
    </div>
  );
};

const AccountSettingsView: React.FC<AccountSettingsViewProps> = ({ setCurrentView, profile /*, supabase*/ }) => {
  const [name, setName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone_number || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveChanges = async () => {
    if (!profile || !profile.email /* || !supabase*/) { // Check for profile and supabase
      setError('User not logged in or Supabase client not available.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Replace 'profiles' with your actual Supabase table name for profiles
      // Replace 'id' with the correct column name for user ID in your profiles table
      // const { error: updateError } = await supabase
      //   .from('profiles')
      //   .update({
      //     full_name: name,
      //     email: email,
      //     phone_number: phone,
      //   })
      //   .eq('id', profile.email); // Assuming email is used as the unique identifier for simplicity here

      // if (updateError) {
      //   throw updateError;
      // }

      // Simulate successful save for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Profile updated successfully (simulated).');
      // Optionally show a success message or navigate back
      // setCurrentView('settings');

    } catch (err: any) {
      console.error('Error saving profile:', err.message);
      setError(`Failed to save changes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Use useEffect to update state if the profile prop changes (e.g., after fetching)
  useEffect(() => {
    if (profile) {
      setName(profile.full_name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone_number || '');
    }
  }, [profile]);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <button
          onClick={() => setCurrentView('settings')}
          className="text-white hover:text-zinc-300 transition-colors"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-medium text-white">Account Settings</h1>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Profile Photo Section */}
        <div className="bg-zinc-900/80 rounded-2xl p-6 mb-4 border border-zinc-800/50">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center">
              <span className="text-2xl text-white">{profile?.full_name?.charAt(0) || 'U'}</span>
            </div>
            <div>
              <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium">
                Change Photo
              </button>
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="bg-zinc-900/80 rounded-2xl p-6 mb-4 border border-zinc-800/50">
          <h2 className="text-white text-lg font-medium mb-4">Personal Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Additional Settings (Change Password) */}
        <div className="bg-zinc-900/80 rounded-2xl p-6 mb-4 border border-zinc-800/50">
          <h2 className="text-white text-lg font-medium mb-4">Additional Settings</h2>
          {/* Placeholder for Change Password - Implement navigation later */}
          <button className="w-full bg-zinc-800/50 p-4 rounded-lg text-left text-white flex items-center justify-between hover:bg-zinc-800 transition-colors">
            <span>Change Password</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {/* Save Button */}
        <button
          className={`w-full bg-blue-600 text-white font-medium p-4 rounded-xl hover:bg-blue-700 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleSaveChanges}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

const SettingsView: React.FC<SettingsViewProps> = ({ setCurrentView, setIsSearchOpen, profile, onLogout }) => {
    const handlePrivacyClick = () => {
      window.open('https://santhoshjt.netlify.app/', '_blank');
    };

    const handleHelpSupportClick = () => {
      window.open('https://santhoshjt.netlify.app/', '_blank');
    };

    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>
        <div className="bg-gray-800 p-4 rounded-lg mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-xl text-white">
                {profile?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{profile?.full_name || 'User'}</h2>
              <p className="text-gray-400">{profile?.email || 'No email set'}</p>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <button 
            onClick={() => setCurrentView('account-settings' as View)}
            className="w-full bg-gray-800 p-4 rounded-lg text-left text-white"
          >
            Account Settings
          </button>
          <button 
            onClick={handlePrivacyClick}
            className="w-full bg-gray-800 p-4 rounded-lg text-left text-white flex items-center justify-between"
          >
            <span>Privacy</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
          </button>
          <button 
            onClick={() => setCurrentView('refer-and-and-earn' as View)}
            className="w-full bg-gray-800 p-4 rounded-lg text-left text-white flex items-center justify-between"
          >
            <span>Refer & Earn</span>
            <span className="text-sm text-gray-400 bg-gray-700 px-2 py-1 rounded">New</span>
          </button>
          <button 
            onClick={handleHelpSupportClick}
            className="w-full bg-gray-800 p-4 rounded-lg text-left text-white flex items-center justify-between"
          >
            <span>Help & Support</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
          </button>
          <button 
            onClick={onLogout}
            className="w-full bg-red-600 p-4 rounded-lg text-center text-white mt-4"
          >
            Log Out
          </button>
        </div>
      </div>
    );
};

const FavoritesView: React.FC<FavoritesViewProps & { favorites: Set<string>; toggleFavorite: (appName: string) => void }> = ({ setCurrentView, setIsSearchOpen, favorites, toggleFavorite }) => {
    return (
    <div className="p-4 pb-20 bg-black">
      <h1 className="text-xl font-medium mb-8 flex items-center">
        <span className="text-white font-semibold tracking-tight">Favorite Apps</span>
      </h1>

      {favorites.size === 0 ? (
        <div className="bg-zinc-900/80 rounded-3xl p-10 text-center border border-zinc-800/50 backdrop-blur-sm">
          <Star className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-300 font-medium text-sm">No favorites yet</p>
          <p className="text-zinc-500 text-xs mt-2 tracking-wide">Star your favorite apps to see them here</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {Array.from(favorites).map((appName) => {
            let appConfig;
            switch (appName) {
              case 'PhonePe':
                appConfig = {
                  logo: (
                    <div className="w-8 h-8 bg-[#5f259f] rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-white">Pe</span>
      </div>
                  ),
                  description: 'Digital payments platform'
                };
                break;
              case 'Paytm':
                appConfig = {
                  logo: (
                    <div className="flex flex-col items-center">
                      <span className="text-[#00B9F1] text-sm font-bold leading-none">pay</span>
                      <span className="text-[#00B9F1] text-[8px] font-bold leading-none mt-0.5">tm</span>
    </div>
                  ),
                  description: 'Digital payments and banking'
                };
                break;
              case 'Canara Bank':
                appConfig = {
                  logo: (
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[#00573F] text-sm font-bold leading-none">CAN</span>
                      <span className="text-[#00573F] text-[8px] font-bold leading-none mt-0.5">BANK</span>
                    </div>
                  ),
                  description: 'Major public sector bank'
                };
                break;
              case 'Kotak Bank':
                appConfig = {
                  logo: (
                    <div className="flex flex-col items-center">
                      <span className="text-[#EF3E23] text-sm font-bold leading-none">KOTAK</span>
                      <span className="text-[#EF3E23] text-[8px] font-bold leading-none mt-0.5">BANK</span>
                    </div>
                  ),
                  description: 'Private sector banking'
                };
                break;
              default:
                appConfig = {
                  logo: <span className="text-lg font-bold">{appName[0]}</span>,
                  description: 'Financial service'
                };
            }

  return (
              <div key={appName} className="group cursor-pointer relative">
                <div className="relative bg-zinc-900/80 p-5 rounded-3xl border border-zinc-800/50 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:bg-zinc-800/80">
          <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(appName);
                    }}
                    className="absolute top-3 right-3 z-20 text-white hover:text-zinc-200 transition-colors duration-300"
                  >
                    <Star className="w-4 h-4 fill-white" />
          </button>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-white rounded-2xl overflow-hidden flex items-center justify-center group-hover:scale-105 transition-all duration-300">
                        {appConfig.logo}
        </div>
      </div>
                    <div>
                      <h3 className="text-sm font-medium text-white mb-1">{appName}</h3>
                      <p className="text-xs text-zinc-500">{appConfig.description}</p>
                    </div>
                    </div>
                  </div>
                    </div>
            );
          })}
          </div>
        )}
    </div>
  );
};

const ProfileView = memo(({ onBack, userId }: { onBack: () => void; userId: string }) => {
  return (
    <div className="min-h-screen bg-black">
      <div className="p-4 flex items-center gap-3">
        <button onClick={onBack} className="text-white hover:text-zinc-300 transition-colors">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-medium text-white">Profile</h1>
      </div>
      <div className="p-4">
        <p className="text-white">User ID: {userId}</p>
      </div>
    </div>
  );
});

const MoreUpiAppsView = memo(({ setCurrentView, toggleSearchModal }: { 
  setCurrentView: (view: View) => void;
  toggleSearchModal: () => void;
}) => {
  return (
    <div className="min-h-screen bg-black">
      <div className="p-4 flex items-center gap-3">
        <button 
          onClick={() => setCurrentView('home')}
          className="text-white hover:text-zinc-300 transition-colors"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-medium text-white">More UPI Apps</h1>
      </div>
      <div className="p-4">
        <button 
          onClick={toggleSearchModal}
          className="w-full bg-zinc-900/80 p-4 rounded-xl text-white text-left"
        >
          Search UPI Apps
        </button>
      </div>
    </div>
  );
});

const SearchModal = memo(({ isOpen, onClose, searchQuery, setSearchQuery, groupedResults }: {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  groupedResults: any;
}) => {
  const [filteredApps, setFilteredApps] = useState<UPIApp[]>([]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = UPI_APPS.filter(app => 
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.shortName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredApps(filtered);
    } else {
      setFilteredApps([]);
    }
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="bg-gray-900 w-full h-full overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center space-x-4 mb-6">
            <button onClick={onClose} className="text-white">
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search UPI apps..."
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            </div>

          <div className="space-y-4">
            {filteredApps.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {filteredApps.map(app => (
                  <div key={app.id} className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                        <span className="text-lg font-medium text-white">
                          {app.name.charAt(0)}
                        </span>
          </div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium">{app.name}</h3>
                        <p className="text-sm text-gray-400">{app.description}</p>
        </div>
                      <div className="text-sm text-gray-400 capitalize">
                        {app.category}
              </div>
                          </div>
                        </div>
                    ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-800 rounded-full mx-auto flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                <p className="text-gray-400">
                  {searchQuery ? 'No UPI apps found' : 'Start typing to search UPI apps and BANKS'}
                            </p>
                          </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export const PhonePeAnalysisView: React.FC<{ 
  setCurrentView: (view: View) => void;
  selectedFile: File | null;
  analysisState: AnalysisState;
  analysisResults: AnalysisResult | null;
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleDragOver: (event: React.DragEvent) => void;
  handleDrop: (event: React.DragEvent) => Promise<void>;
  fileInputRef: React.RefObject<HTMLInputElement>;
}> = ({
  setCurrentView,
  selectedFile,
  analysisState,
  analysisResults,
  handleFileSelect,
  handleDragOver,
  handleDrop,
  fileInputRef
}) => {
  const [selectedChartType, setSelectedChartType] = useState<'pie' | 'bar'>('pie');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderContent = () => {
    switch (analysisState) {
      case 'analyzing':
        return (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 border-4 border-zinc-600 border-t-white rounded-full animate-spin mb-4"></div>
            <p className="text-white text-lg font-medium">Analyzing your statement...</p>
            <p className="text-zinc-400 text-sm mt-2">This may take a few moments</p>
          </div>
        );

      case 'results':
        if (!analysisResults) {
          return (
            <div className="flex flex-col items-center justify-center p-8">
              <p className="text-white text-lg font-medium">No results to display.</p>
              <p className="text-zinc-400 text-sm mt-2">There was an issue fetching the analysis data.</p>
            </div>
          );
        }
        console.log('Rendering results with:', analysisResults);
        return (
          <div className="p-4 space-y-6">
            {/* Account Analysis Section */}
            {analysisResults.accounts && analysisResults.accounts.length > 0 && (
              <div className="bg-zinc-900/80 rounded-3xl p-6 border border-zinc-800/50">
                <h3 className="text-lg font-medium text-white mb-4">Account Analysis</h3>
                <AccountAnalysis accounts={analysisResults.accounts} />
              </div>
            )}

            {/* Summary Card */}
            {analysisResults.summary && (
              <div className="bg-zinc-900/80 rounded-3xl p-6 border border-zinc-800/50">
                <h3 className="text-lg font-medium text-white mb-4">Transaction Summary</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Total Received */}
                  <div className="bg-zinc-800/50 p-4 rounded-xl">
                    <p className="text-sm text-zinc-400">Total Received (CR)</p>
                    <p className="text-2xl font-semibold text-green-400 mt-1">₹{analysisResults.summary.totalReceived.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-zinc-500 mt-1">{analysisResults.summary.creditCount} transactions</p>
                  </div>
                  
                  {/* Total Spent */}
                  <div className="bg-zinc-800/50 p-4 rounded-xl">
                    <p className="text-sm text-zinc-400">Total Spent (DR)</p>
                    <p className="text-2xl font-semibold text-red-400 mt-1">₹{Math.abs(analysisResults.summary.totalSpent).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-zinc-500 mt-1">{analysisResults.summary.debitCount} transactions</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-zinc-800/50 rounded-2xl">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-sm text-zinc-400">Total Amount</p>
                            <p className="text-xs text-zinc-500 mt-1">Total {analysisResults.summary.totalTransactions} transactions</p>
                        </div>
                        <div className="text-right">
                            <p className={`text-2xl font-semibold ${(analysisResults.summary.balance) >= 0 ? 'text-white' : 'text-red-400'}`}>
                                ₹{(analysisResults.summary.totalReceived - Math.abs(analysisResults.summary.totalSpent)).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }).replace('₹', '₹ ')}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                                CR: ₹{analysisResults.summary.totalReceived.toLocaleString('en-IN')} DR: ₹{Math.abs(analysisResults.summary.totalSpent).toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>
                </div>
              </div>
            )}

            {/* Charts */}
            {mounted && analysisResults.chartData && analysisResults.categoryBreakdown && (
              <div className="bg-zinc-900/80 rounded-3xl p-6 border border-zinc-800/50">
                <h3 className="text-lg font-medium text-white mb-4">Spending Analysis</h3>
                <div className="flex space-x-2 mb-4">
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedChartType === 'pie' ? 'bg-blue-600 text-white' : 'bg-zinc-800/50 text-zinc-400'}`}
                    onClick={() => setSelectedChartType('pie')}
                  >
                    Pie Chart
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedChartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-zinc-800/50 text-zinc-400'}`}
                    onClick={() => setSelectedChartType('bar')}
                  >
                    Bar Chart
                  </button>
                </div>

                {selectedChartType === 'pie' ? (
                  <div className="bg-zinc-800/50 rounded-2xl p-4 mb-6">
                    <h4 className="text-sm font-medium text-zinc-400 mb-4">Spending by Category</h4>
                    <div className="h-64">
                      <Chart
                        data={analysisResults.chartData.data}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'right',
                              labels: {
                                color: 'white',
                                font: {
                                  size: 12
                                },
                                padding: 20
                              }
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  return `${context.label}: ${context.parsed.toFixed(1)}%`;
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-800/50 rounded-2xl p-4 mb-6">
                    <h4 className="text-sm font-medium text-zinc-400 mb-4">Spending by Category</h4>
                    <div className="h-64">
                       <Bar
                          data={{
                            labels: Object.keys(analysisResults.categoryBreakdown),
                            datasets: [{
                              label: 'Amount Spent',
                              data: Object.values(analysisResults.categoryBreakdown).map(amount => Math.abs(amount)),
                              backgroundColor: [ // Example colors, you might want to generate these dynamically
                                  'rgba(255, 99, 132, 0.8)',
                                  'rgba(54, 162, 235, 0.8)',
                                  'rgba(255, 206, 86, 0.8)',
                                  'rgba(75, 192, 192, 0.8)',
                                  'rgba(153, 102, 255, 0.8)',
                                  'rgba(255, 159, 64, 0.8)',
                                  'rgba(199, 199, 199, 0.8)',
                                  'rgba(83, 102, 255, 0.8)',
                                  'rgba(40, 159, 64, 0.8)',
                                  'rgba(210, 99, 132, 0.8)',
                              ],
                              borderColor: [ // Example colors
                                  'rgba(255, 99, 132, 1)',
                                  'rgba(54, 162, 235, 1)',
                                  'rgba(255, 206, 86, 1)',
                                  'rgba(75, 192, 192, 1)',
                                  'rgba(153, 102, 255, 1)',
                                  'rgba(255, 159, 64, 1)',
                                  'rgba(199, 199, 199, 1)',
                                  'rgba(83, 102, 255, 1)',
                                  'rgba(40, 159, 64, 1)',
                                  'rgba(210, 99, 132, 1)',
                              ],
                              borderWidth: 1,
                            }]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false, // Hide legend for bar chart if categories are on x-axis
                                labels: {
                                  color: 'white',
                                }
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  color: 'white'
                                },
                                grid: {
                                  color: 'rgba(255, 255, 255, 0.1)'
                                }
                              },
                              x: {
                                 ticks: {
                                  color: 'white'
                                },
                                grid: {
                                  color: 'rgba(255, 255, 255, 0.1)'
                                }
                              }
                            }
                          }}
                        />
                    </div>
                  </div>
                )}

                {/* Line Chart */}
                <div className="bg-zinc-800/50 rounded-2xl p-4">
                  <h4 className="text-sm font-medium text-zinc-400 mb-4">Monthly Trends</h4>
                  <div className="h-64">
                    <Line
                      data={{
                        labels: analysisResults.transactions.map(t => new Date(t.date).toLocaleDateString()),
                        datasets: [{
                          label: 'Transaction Amount',
                          data: analysisResults.transactions.map(t => t.amount),
                          borderColor: 'rgb(75, 192, 192)',
                          tension: 0.1
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              color: 'white'
                            }
                          }
                        },
                        scales: {
                          y: {
                            ticks: {
                              color: 'white'
                            },
                            grid: {
                              color: 'rgba(255, 255, 255, 0.1)'
                            }
                          },
                          x: {
                            ticks: {
                              color: 'white'
                            },
                            grid: {
                              color: 'rgba(255, 255, 255, 0.1)'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Category Breakdown */}
            {analysisResults.categoryBreakdown && (
              <div className="bg-zinc-900/80 rounded-3xl p-6 border border-zinc-800/50">
                <h3 className="text-lg font-medium text-white mb-4">Spending by Category</h3>
                <div className="space-y-4">
                  {Object.entries(analysisResults.categoryBreakdown).map(([category, amount]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-zinc-300">{category}</span>
                      <span className="text-zinc-400">₹{Math.abs(amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            {analysisResults.transactions && (
              <div className="bg-zinc-900/80 rounded-3xl p-6 border border-zinc-800/50">
                <h3 className="text-lg font-medium text-white mb-4">Recent Transactions</h3>
                <div className="space-y-4">
                  {analysisResults.transactions.slice(0, 5).map((transaction, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="text-zinc-300">{transaction.description}</p>
                        <p className="text-xs text-zinc-500">{new Date(transaction.date).toLocaleDateString()}</p>
                      </div>
                      <span className={`font-medium ${transaction.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ₹{Math.abs(transaction.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Banks Found Section -> UPI Statement Section */}
            {analysisResults.transactions && (
              <div className="bg-zinc-900/80 rounded-3xl p-6 border border-zinc-800/50">
                <div className="flex flex-col mb-4">
                  <h3 className="text-lg font-medium text-white">UPI Statement</h3>
                  {analysisResults.transactions.length > 0 && (
                    <p className="text-sm text-zinc-400 mt-1">
                      {new Date(Math.min(...analysisResults.transactions.map(t => new Date(t.date).getTime()))).toLocaleDateString()} 
                      {" to "} 
                      {new Date(Math.max(...analysisResults.transactions.map(t => new Date(t.date).getTime()))).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {(() => {
                    const bankConfigs = {
                      'SBI': {
                        color: '#2d5a27',
                        shortName: 'SBI',
                        fullName: 'State Bank of India'
                      },
                      'HDFC': {
                        color: '#004c8f',
                        shortName: 'HDFC',
                        fullName: 'HDFC Bank'
                      },
                      'ICICI': {
                        color: '#F58220',
                        shortName: 'ICICI',
                        fullName: 'ICICI Bank'
                      },
                      'AXIS': {
                        color: '#97144d',
                        shortName: 'AXIS',
                        fullName: 'Axis Bank'
                      },
                      'KOTAK': {
                        color: '#EF3E23',
                        shortName: 'KOTAK',
                        fullName: 'Kotak Mahindra Bank'
                      },
                      'YES BANK': {
                        color: '#00204E',
                        shortName: 'YES',
                        fullName: 'Yes Bank'
                      },
                      'CANARA': {
                        color: '#00573F',
                        shortName: 'CAN',
                        fullName: 'Canara Bank'
                      },
                      'PNB': {
                        color: '#4B266D',
                        shortName: 'PNB',
                        fullName: 'Punjab National Bank'
                      },
                      'BOB': {
                        color: '#004990',
                        shortName: 'BOB',
                        fullName: 'Bank of Baroda'
                      },
                      'UNION BANK': {
                        color: '#1F4E79',
                        shortName: 'UBI',
                        fullName: 'Union Bank of India'
                      }
                    };

                    const foundBanks = Array.from(new Set(analysisResults.transactions
                      .map(t => {
                        const description = t.description.toUpperCase();
                        return Object.keys(bankConfigs).find(bank => description.includes(bank));
                      })
                      .filter((bank): bank is keyof typeof bankConfigs => bank !== undefined)
                    ));

                    if (foundBanks.length === 0) {
                      return (
                        null // Return null instead of the message when no banks are found
                      );
                    }

                    // If banks are found, we don't display them based on user request.
                    return null; // Or an empty fragment <> </>

                  })()}
                </div>
              </div>
            )}

            {/* Important Notes Section */}
            <div className="bg-zinc-900/80 rounded-3xl p-6 border border-zinc-800/50">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Note:</h3>
                  <ul className="space-y-2 text-sm text-zinc-400">
                    <li className="flex items-start gap-2">
                      <span className="text-zinc-500">•</span>
                      <span>Self transfer payments are not included in the total money paid and money received calculations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-zinc-500">•</span>
                      <span>Payments that you might have hidden on payment history page will not be included in this statement</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4">
            <div className="bg-zinc-900/80 rounded-3xl p-8 border border-zinc-800/50">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-zinc-800 rounded-full flex items-center justify-center">
                  <DocumentTextIcon className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Upload Statement</h3>
                <p className="text-zinc-400 text-sm mb-6">Upload your bank statement to analyze your spending patterns</p>
                
                <div
                  className="border-2 border-dashed border-zinc-700 rounded-2xl p-8 text-center cursor-pointer hover:border-zinc-600 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('fileInput')?.click()}
                >
                  <input
                    type="file"
                    id="fileInput"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleFileSelect}
                  />
                  <ArrowUpTrayIcon className="w-8 h-8 text-zinc-400 mx-auto mb-4" />
                  <p className="text-zinc-300 mb-1">Drag and drop your statement here</p>
                  <p className="text-zinc-500 text-sm">or click to browse</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  const monthlyData = useMemo(() => {
    if (!analysisResults?.transactions) return { labels: [], datasets: [] };

    const monthlyTotals: { [key: string]: number } = {};

    analysisResults.transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;

      if (!monthlyTotals[monthYear]) {
        monthlyTotals[monthYear] = 0;
      }
      // Summing both credit and debit for net change
      monthlyTotals[monthYear] += transaction.amount;
    });

    const sortedMonths = Object.keys(monthlyTotals).sort((a, b) => {
      const [monthA, yearA] = a.split(' ');
      const [monthB, yearB] = b.split(' ');
      const dateA = new Date(`${monthA} 1, ${yearA}`);
      const dateB = new Date(`${monthB} 1, ${yearB}`);
      return dateA.getTime() - dateB.getTime();
    });

    const labels = sortedMonths;
    const data = sortedMonths.map(month => monthlyTotals[month]);

    return {
      labels: labels,
      datasets: [{
        label: 'Net Amount',
        data: data,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        pointBackgroundColor: 'white',
        pointBorderColor: 'rgb(75, 192, 192)',
        pointHoverBackgroundColor: 'rgb(75, 192, 192)',
        pointHoverBorderColor: 'white',
      }]
    };
  }, [analysisResults?.transactions]);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <button 
          onClick={() => setCurrentView('home')}
          className="text-white hover:text-zinc-300 transition-colors"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-medium text-white">PhonePe Statement Analysis</h1>
      </div>

      {/* Content */}
      <Suspense fallback={<LoadingSpinner />}>
        {renderContent()}
      </Suspense>
    </div>
  );
};

export const KotakAnalysisView: React.FC<{ 
  setCurrentView: (view: View) => void;
  selectedFile: File | null;
  analysisState: AnalysisState;
  analysisResults: AnalysisResult | null;
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleDragOver: (event: React.DragEvent) => void;
  handleDrop: (event: React.DragEvent) => Promise<void>;
  fileInputRef: React.RefObject<HTMLInputElement>;
}> = ({
  setCurrentView,
  selectedFile,
  analysisState,
  analysisResults,
  handleFileSelect,
  handleDragOver,
  handleDrop,
  fileInputRef
}) => {
  const [selectedChartType, setSelectedChartType] = useState<'pie' | 'bar'>('pie');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderContent = () => {
    switch (analysisState) {
      case 'analyzing':
        return (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 border-4 border-zinc-600 border-t-white rounded-full animate-spin mb-4"></div>
            <p className="text-white text-lg font-medium">Analyzing your statement...</p>
            <p className="text-zinc-400 text-sm mt-2">This may take a few moments</p>
          </div>
        );
      case 'results':
        if (!analysisResults) return null;
        return (
          <div className="p-4 space-y-6">
            {/* Summary Card */}
            {analysisResults.summary && (
              <div className="bg-zinc-900/80 rounded-3xl p-6 border border-zinc-800/50">
                <h3 className="text-lg font-medium text-white mb-4">Transaction Summary</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Total Received */}
                  <div className="bg-zinc-800/50 p-4 rounded-xl">
                    <p className="text-sm text-zinc-400">Total Received (CR)</p>
                    <p className="text-2xl font-semibold text-green-400 mt-1">₹{analysisResults.summary.totalReceived.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-zinc-500 mt-1">{analysisResults.summary.creditCount} transactions</p>
                  </div>
                  
                  {/* Total Spent */}
                  <div className="bg-zinc-800/50 p-4 rounded-xl">
                    <p className="text-sm text-zinc-400">Total Spent (DR)</p>
                    <p className="text-2xl font-semibold text-red-400 mt-1">₹{Math.abs(analysisResults.summary.totalSpent).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-zinc-500 mt-1">{analysisResults.summary.debitCount} transactions</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-zinc-800/50 rounded-2xl">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-sm text-zinc-400">Total Amount</p>
                            <p className="text-xs text-zinc-500 mt-1">Total {analysisResults.summary.totalTransactions} transactions</p>
                        </div>
                        <div className="text-right">
                            <p className={`text-2xl font-semibold ${(analysisResults.summary.balance) >= 0 ? 'text-white' : 'text-red-400'}`}>
                                ₹{(analysisResults.summary.totalReceived - Math.abs(analysisResults.summary.totalSpent)).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }).replace('₹', '₹ ')}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                                CR: ₹{analysisResults.summary.totalReceived.toLocaleString('en-IN')} DR: ₹{Math.abs(analysisResults.summary.totalSpent).toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>
                </div>
              </div>
            )}

            {/* Charts */}
            {mounted && analysisResults?.chartData && analysisResults?.categoryBreakdown && (
              <div className="bg-zinc-900/80 rounded-3xl p-6 border border-zinc-800/50">
                <h3 className="text-lg font-medium text-white mb-4">Spending Analysis</h3>
                <div className="flex space-x-2 mb-4">
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedChartType === 'pie' ? 'bg-blue-600 text-white' : 'bg-zinc-800/50 text-zinc-400'}`}
                    onClick={() => setSelectedChartType('pie')}
                  >
                    Pie Chart
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedChartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-zinc-800/50 text-zinc-400'}`}
                    onClick={() => setSelectedChartType('bar')}
                  >
                    Bar Chart
                  </button>
                </div>
                {selectedChartType === 'pie' ? (
                  <div className="bg-zinc-800/50 rounded-2xl p-4 mb-6">
                    <h4 className="text-sm font-medium text-zinc-400 mb-4">Spending by Category</h4>
                    <div className="h-64">
                      <Chart
                        data={analysisResults.chartData.data}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'right',
                              labels: {
                                color: 'white',
                                font: {
                                  size: 12
                                },
                                padding: 20
                              }
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  return `${context.label}: ${context.parsed.toFixed(1)}%`;
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-800/50 rounded-2xl p-4 mb-6">
                    <h4 className="text-sm font-medium text-zinc-400 mb-4">Spending by Category</h4>
                    <div className="h-64">
                      <Bar
                        data={analysisResults.chartData.data}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false,
                              labels: {
                                color: 'white',
                              }
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                color: 'white'
                              },
                              grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                              }
                            },
                            x: {
                              ticks: {
                                color: 'white'
                              },
                              grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Category Breakdown */}
            {analysisResults.categoryBreakdown && (
              <div className="bg-zinc-900/80 rounded-3xl p-6 border border-zinc-800/50">
                <h3 className="text-lg font-medium text-white mb-4">Spending by Category</h3>
                <div className="space-y-4">
                  {Object.entries(analysisResults.categoryBreakdown).map(([category, amount]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-zinc-300">{category}</span>
                      <span className="text-zinc-400">₹{Math.abs(amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Transactions */}
            {analysisResults.transactions && (
              <div className="bg-zinc-900/80 rounded-3xl p-6 border border-zinc-800/50">
                <h3 className="text-lg font-medium text-white mb-4">Recent Transactions</h3>
                <div className="space-y-4">
                  {analysisResults.transactions.slice(0, 5).map((transaction, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="text-zinc-300">{transaction.description}</p>
                        <p className="text-xs text-zinc-500">{new Date(transaction.date).toLocaleDateString()}</p>
                      </div>
                      <span className={`font-medium ${transaction.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ₹{Math.abs(transaction.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Important Notes Section */}
            <div className="bg-zinc-900/80 rounded-3xl p-6 border border-zinc-800/50">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-3">Note:</h3>
                  <ul className="space-y-2 text-sm text-zinc-400">
                    <li className="flex items-start gap-2">
                      <span className="text-zinc-500">•</span>
                      <span>Self transfer payments are not included in the total money paid and money received calculations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-zinc-500">•</span>
                      <span>Payments that you might have hidden on payment history page will not be included in this statement</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-4">
            <div className="bg-zinc-900/80 rounded-3xl p-8 border border-zinc-800/50">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-zinc-800 rounded-full flex items-center justify-center">
                  <DocumentTextIcon className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Upload Statement</h3>
                <p className="text-zinc-400 text-sm mb-6">Upload your Kotak bank statement to analyze your spending patterns</p>
                <div
                  className="border-2 border-dashed border-zinc-700 rounded-2xl p-8 text-center cursor-pointer hover:border-zinc-600 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('fileInput')?.click()}
                >
                  <input
                    type="file"
                    id="fileInput"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleFileSelect}
                  />
                  <ArrowUpTrayIcon className="w-8 h-8 text-zinc-400 mx-auto mb-4" />
                  <p className="text-zinc-300 mb-1">Drag and drop your statement here</p>
                  <p className="text-zinc-500 text-sm">or click to browse</p>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <button 
          onClick={() => setCurrentView('home')}
          className="text-white hover:text-zinc-300 transition-colors"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-medium text-white">Kotak Bank Statement Analysis</h1>
      </div>
      {renderContent()}
    </div>
  );
};

// Add UPIAppsView component
const UPIAppsView: React.FC<{ 
  setCurrentView: (view: View) => void;
  favorites: Set<string>;
  toggleFavorite: (appName: string) => void;
}> = ({ setCurrentView, favorites, toggleFavorite }) => {
  const upiApps = [
    {
      name: 'PhonePe',
      logo: 'Pe',
      color: '#5f259f',
      description: 'Digital payments & financial services',
      bgColor: 'white'
    },
    {
      name: 'Google Pay',
      logo: 'GPay',
      color: '#4285F4',
      description: 'Google\'s UPI payment service',
      bgColor: 'white'
    },
    {
      name: 'Paytm',
      logo: 'paytm',
      color: '#00B9F1',
      description: 'Digital payments & commerce',
      bgColor: 'white',
      isSpecialLogo: true
    },
    {
      name: 'Amazon Pay',
      logo: 'Pay',
      color: '#FF9900',
      description: 'Amazon\'s payment service',
      bgColor: '#232F3E'
    },
    {
      name: 'WhatsApp Pay',
      logo: 'WA',
      color: '#25D366',
      description: 'WhatsApp\'s UPI payments',
      bgColor: 'white'
    },
    {
      name: 'BHIM',
      logo: 'BHIM',
      color: '#00B2E3',
      description: 'Government\'s UPI app',
      bgColor: 'white'
    },
    {
      name: 'Mobikwik',
      logo: 'MK',
      color: '#232C65',
      description: 'Digital wallet & payments',
      bgColor: 'white'
    },
    {
      name: 'Samsung Pay',
      logo: 'SP',
      color: '#1428A0',
      description: 'Samsung\'s payment service',
      bgColor: 'white'
    },
    {
      name: 'Cred',
      logo: 'CRED',
      color: '#000000',
      description: 'Credit card payments & rewards',
      bgColor: 'white'
    },
    {
      name: 'Mi Pay',
      logo: 'Mi',
      color: '#FF6900',
      description: 'Xiaomi\'s UPI service',
      bgColor: 'white'
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <button 
          onClick={() => setCurrentView('home')}
          className="text-white hover:text-zinc-300 transition-colors"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-medium text-white">UPI Apps</h1>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="grid grid-cols-1 gap-4">
          {upiApps.map((app) => (
            <div 
              key={app.name}
              className="group bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800/50 hover:bg-zinc-800/80 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden"
                     style={{ backgroundColor: app.bgColor }}>
                  {app.isSpecialLogo ? (
                    <div className="flex flex-col items-center">
                      <span className={`text-[${app.color}] text-sm font-bold leading-none`}>pay</span>
                      <span className={`text-[${app.color}] text-[7px] font-bold leading-none mt-0.5`}>tm</span>
                    </div>
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: app.color }}
                    >
                      <span className="text-white text-sm font-bold">{app.logo}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">{app.name}</h3>
                  <p className="text-sm text-zinc-400 mt-0.5">{app.description}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(app.name);
                  }}
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
};

// Add BanksView component
const BanksView: React.FC<{ 
  setCurrentView: (view: View) => void;
  favorites: Set<string>;
  toggleFavorite: (appName: string) => void;
}> = ({ setCurrentView, favorites, toggleFavorite }) => {
  const banks = [
    {
      name: 'State Bank of India',
      shortName: 'SBI',
      logo: 'SBI',
      color: '#2d5a27',
      description: 'India\'s largest public sector bank'
    },
    {
      name: 'HDFC Bank',
      shortName: 'HDFC',
      logo: 'HDFC',
      color: '#004c8f',
      description: 'Leading private sector bank'
    },
    {
      name: 'ICICI Bank',
      shortName: 'ICICI',
      logo: 'ICICI',
      color: '#F58220',
      description: 'Major private sector bank'
    },
    {
      name: 'Axis Bank',
      shortName: 'AXIS',
      logo: 'AXIS',
      color: '#97144d',
      description: 'Private sector banking services'
    },
    {
      name: 'Kotak Mahindra Bank',
      shortName: 'KOTAK',
      logo: 'KOTAK',
      color: '#EF3E23',
      description: 'Private sector banking'
    },
    {
      name: 'Bank of Baroda',
      shortName: 'BOB',
      logo: 'BOB',
      color: '#004990',
      description: 'Major public sector bank'
    },
    {
      name: 'Punjab National Bank',
      shortName: 'PNB',
      logo: 'PNB',
      color: '#4B266D',
      description: 'Public sector banking'
    },
    {
      name: 'Canara Bank',
      shortName: 'CANARA',
      logo: 'CANARA',
      color: '#00573F',
      description: 'Public sector banking services'
    },
    {
      name: 'Union Bank of India',
      shortName: 'UBI',
      logo: 'UBI',
      color: '#1F4E79',
      description: 'Public sector bank'
    },
    {
      name: 'Yes Bank',
      shortName: 'YES',
      logo: 'YES',
      color: '#00204E',
      description: 'Private sector banking'
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <button 
          onClick={() => setCurrentView('home')}
          className="text-white hover:text-zinc-300 transition-colors"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-medium text-white">Banks</h1>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="grid grid-cols-1 gap-4">
          {banks.map((bank) => (
            <div 
              key={bank.shortName}
              className="group bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800/50 hover:bg-zinc-800/80 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center overflow-hidden">
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: bank.color }}
                  >
                    <span className="text-white text-sm font-bold">{bank.shortName}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">{bank.name}</h3>
                  <p className="text-sm text-zinc-400 mt-0.5">{bank.description}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(bank.name);
                  }}
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
};

// Add ReferAndEarnView component
const ReferAndEarnView: React.FC<{ setCurrentView: (view: View) => void }> = ({ setCurrentView }) => {
  const [friendEmail, setFriendEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    try {
      // Here you would integrate with your email sending service
      // For now, we'll simulate the email sending with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      setShowSuccess(true);
      setFriendEmail('');
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to send referral:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <button 
          onClick={() => setCurrentView('settings')}
          className="text-white hover:text-zinc-300 transition-colors"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-medium text-white">Refer & Earn</h1>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Referral Card */}
        <div className="bg-zinc-900/80 rounded-2xl p-6 mb-6 border border-zinc-800/50">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
          </div>
          <h2 className="text-white text-xl font-medium text-center mb-2">Invite Friends</h2>
          <p className="text-zinc-400 text-center text-sm mb-6">
            Share the app with your friends and help them manage their finances better!
          </p>
          
          {/* Referral Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Friend's Email</label>
              <input 
                type="email" 
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                placeholder="Enter your friend's email"
                className="w-full bg-zinc-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button 
              type="submit"
              disabled={isSending}
              className={`w-full bg-blue-600 text-white font-medium p-4 rounded-xl hover:bg-blue-700 transition-colors ${isSending ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSending ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </div>
              ) : 'Send Invitation'}
            </button>
          </form>

          {/* Success Message */}
          {showSuccess && (
            <div className="mt-4 p-4 bg-green-500/20 rounded-xl">
              <p className="text-green-500 text-center text-sm">
                Invitation sent successfully!
              </p>
            </div>
          )}
        </div>

        {/* Benefits Section */}
        <div className="space-y-4">
          <div className="bg-zinc-900/80 rounded-2xl p-4 border border-zinc-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
                  <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-medium">Rewards for Both</h3>
                <p className="text-zinc-400 text-sm">You and your friend both get rewards</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/80 rounded-2xl p-4 border border-zinc-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-medium">Instant Process</h3>
                <p className="text-zinc-400 text-sm">Quick and easy referral process</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function StatementAnalysis({ 
  data = { transactions: [], totalReceived: 0, totalSpent: 0, categoryBreakdown: {} },
  favorites = new Set<string>(),
  toggleFavorite = (appName: string) => {},
  navigate = (path: string) => {}
}: { 
  data?: AnalysisData;
  favorites?: Set<string>;
  toggleFavorite?: (appName: string) => void;
  navigate?: (path: string) => void;
}) {
  const [currentView, setCurrentView] = useState<View>('home');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState<Profile | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisState, setAnalysisState] = useState<'upload' | 'analyzing' | 'results'>('upload');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Memoize handlers to prevent recreation on each render
  const toggleSearchModal = useCallback(() => {
    setIsSearchOpen(prev => !prev);
  }, []);

  // Memoize expensive computations
  const processedData = useMemo(() => {
    // Move any expensive data processing here
    return data;
  }, [data]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('General File selected:', file?.name);
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      // Call analyzeStatement directly from here for any PDF selected via the general input
      console.log('Calling analyzeStatement from general handler.');
      await analyzeStatement(file);
    } else {
      alert('Please select a valid PDF file');
      setAnalysisState('upload');
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const file = event.dataTransfer.files?.[0];
    console.log('File dropped:', file?.name);
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      console.log('Calling analyzeStatement from drop handler.');
      await analyzeStatement(file);
    } else {
      alert('Please drop a valid PDF file');
      setAnalysisState('upload');
    }
  };

  const analyzeStatement = async (file: File) => {
    try {
      setAnalysisState('analyzing');
      console.log('Starting analysis for file:', file?.name);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('platform', 'phonepe');

      try {
        const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, "");
        console.log('Making POST request to /api/analyze-statement.');
        const response = await fetch(`${backendUrl}/analyze`, {
          method: 'POST',
          body: formData
        });
        console.log('Received response from API:', response.status);
        const data = await response.json();
        console.log('API Response Data:', data);

        if (!response.ok) {
          const errorMessage = data.details || data.error || 'Analysis failed';
          console.error('API returned an error:', errorMessage);
          throw new Error(errorMessage);
        }

        // CORRECTIVE FIX: Forcefully remap snake_case from backend to camelCase for frontend state.
        // This ensures the summary and chartData objects are always created correctly.
        const categoryBreakdown = data.categoryBreakdown || {};
        const transactions = data.transactions || [];
        const summary = {
          totalReceived: data.totalReceived || 0,
          totalSpent: data.totalSpent || 0,
          balance: (data.totalReceived || 0) + (data.totalSpent || 0),
          creditCount: transactions.filter((t: Transaction) => t.amount > 0).length,
          debitCount: transactions.filter((t: Transaction) => t.amount < 0).length,
          totalTransactions: transactions.length,
        };

        const chartData = {
          data: {
            labels: Object.keys(categoryBreakdown),
            datasets: [{
              data: Object.values(categoryBreakdown).map(v => Math.abs(v as number)),
              backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED', '#83E89E'],
              hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED', '#83E89E']
            }]
          }
        };
        
        const results: AnalysisResult = {
          transactions,
          summary,
          categoryBreakdown,
          chartData,
          accounts: data.accounts,
          pageCount: data.pageCount || 0,
        };

        console.log('Setting analysis results with correct structure:', results);
        setAnalysisResults(results);
        setAnalysisState('results');
        console.log('Analysis Results Transactions:', results.transactions);
        // The view change should happen here after successful analysis
         setCurrentView('phonepe-analysis');

      } catch (error: any) {
        console.error('Error analyzing statement:', error);
        const errorMessage = error.message.includes('No transactions found')
          ? 'No transactions could be found in this PDF. Please make sure this is a valid PhonePe statement and try again.'
          : 'Failed to analyze statement. Please make sure this is a valid PDF statement and try again.';
        alert(errorMessage);
        setAnalysisState('upload');
      }
    } catch (error: any) {
      console.error('Error analyzing statement:', error);
      const errorMessage = error.message.includes('No transactions found')
        ? 'No transactions could be found in this PDF. Please make sure this is a valid PhonePe statement and try again.'
        : 'Failed to analyze statement. Please make sure this is a valid PDF statement and try again.';
      alert(errorMessage);
      setAnalysisState('upload');
    }
  };

  console.log('Current View:', currentView);

  return (
    <div className="min-h-screen w-full max-w-4xl mx-auto">
      {mounted && (
        <>
          {(() => {
            switch (currentView) {
              case 'home':
                return <HomeView 
                  setCurrentView={setCurrentView} 
                  setIsSearchOpen={setIsSearchOpen} 
                  favorites={favorites} 
                  toggleFavorite={toggleFavorite} 
                  navigate={navigate}
                />;
              case 'phonepe-analysis':
                return <PhonePeAnalysisView
                  setCurrentView={setCurrentView}
                  selectedFile={selectedFile}
                  analysisState={analysisState}
                  analysisResults={analysisResults}
                  handleFileSelect={handleFileSelect}
                  handleDragOver={handleDragOver}
                  handleDrop={handleDrop}
                  fileInputRef={fileInputRef}
                />;
              case 'more-upi-apps':
                return <MoreUpiAppsView setCurrentView={setCurrentView} toggleSearchModal={toggleSearchModal} />;
              case 'more-banks':
                return <BanksView setCurrentView={setCurrentView} favorites={favorites} toggleFavorite={toggleFavorite} />;
              case 'settings':
                return <SettingsView setCurrentView={setCurrentView} setIsSearchOpen={setIsSearchOpen} profile={profile} onLogout={() => setCurrentView('home')} />;
              case 'account-settings':
                return <AccountSettingsView
                  setCurrentView={setCurrentView}
                  profile={profile} // Pass profile data
                  // supabase={supabase} // Pass Supabase client - uncomment when configured
                />;
              case 'refer-and-and-earn':
                return <ReferAndEarnView setCurrentView={setCurrentView} />;
              case 'banks':
                return <BanksView setCurrentView={setCurrentView} favorites={favorites} toggleFavorite={toggleFavorite} />;
              case 'upi-apps':
                return <UPIAppsView setCurrentView={setCurrentView} favorites={favorites} toggleFavorite={toggleFavorite} />;
              default:
                return <HomeView 
                  setCurrentView={setCurrentView} 
                  setIsSearchOpen={setIsSearchOpen} 
                  favorites={favorites} 
                  toggleFavorite={toggleFavorite} 
                  navigate={navigate}
                />;
            }
          })()}
        </>
      )}
        {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
          groupedResults={{}}
        />
    </div>
  );
}