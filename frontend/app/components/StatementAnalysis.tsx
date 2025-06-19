'use client'

import { useMemo, useState, useEffect, useCallback, useRef, memo, Suspense } from 'react'
import { HomeIcon, ChartBarIcon, FolderIcon, Cog6ToothIcon, PlusIcon, ArrowLeftIcon, DocumentTextIcon, ArrowUpTrayIcon, DocumentIcon, WalletIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
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

export type View = 'home' | 'settings' | 'phonepe-analysis' | 'kotak-analysis' | 'more-upi-apps' | 'more-banks' | 'profile' | 'notifications' | 'notifications-settings' | 'report-issue' | 'signin' | 'banks' | 'upi-apps' | 'account-settings' | 'refer-and-and-earn' | 'favorites' | 'history';

export type AnalysisState = 'upload' | 'analyzing' | 'results'

interface DetailedCategory {
  category: string;
  amount: number;
  count: number;
  percentage: number;
  transactions: Transaction[];
}

export interface AnalysisResult {
  transactions: Transaction[];
  summary: {
    totalReceived: number;
    totalSpent: number;
    balance: number;
    creditCount: number;
    debitCount: number;
    totalTransactions: number;
  };
  detailedCategoryBreakdown: DetailedCategory[];
  pageCount: number;
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
            onClick={() => setCurrentView('kotak-analysis')}
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

const AccountSettingsView: React.FC<AccountSettingsViewProps> = ({ setCurrentView, profile }) => {
  const [name, setName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone_number || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveChanges = async () => {
    if (!profile || !profile.email) {
      setError('User not logged in.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Profile updated successfully (simulated).');
    } catch (err: any) {
      console.error('Error saving profile:', err.message);
      setError(`Failed to save changes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

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
          <button className="w-full bg-zinc-800/50 p-4 rounded-lg text-left text-white flex items-center justify-between hover:bg-zinc-800 transition-colors">
            <span>Change Password</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

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

    const handleAboutClick = () => {
      // Implement about page navigation
    };

    return (
      <div className="p-4 space-y-4">
        <h2 className="text-xl font-bold text-white">Settings</h2>
        
        <div className="bg-zinc-800 rounded-lg p-4">
          <button onClick={() => setCurrentView('account-settings')} className="w-full text-left text-white">Account</button>
          <hr className="border-zinc-700 my-2" />
          <button onClick={handlePrivacyClick} className="w-full text-left text-white">Privacy & Security</button>
          <hr className="border-zinc-700 my-2" />
          <button onClick={() => setCurrentView('notifications-settings')} className="w-full text-left text-white">Notifications</button>
        </div>

        <div className="bg-zinc-800 rounded-lg p-4">
          <button onClick={handleHelpSupportClick} className="w-full text-left text-white">Help & Support</button>
          <hr className="border-zinc-700 my-2" />
          <button onClick={handleAboutClick} className="w-full text-left text-white">About</button>
        </div>

        <button 
          onClick={onLogout}
          className="w-full bg-red-600 text-white py-2 rounded-lg"
        >
          Logout
        </button>
      </div>
    );
};

const FavoritesView: React.FC<FavoritesViewProps & { favorites: Set<string>; toggleFavorite: (appName: string) => void }> = ({ setCurrentView, setIsSearchOpen, favorites, toggleFavorite }) => {
    const favoriteApps = UPI_APPS.filter(app => favorites.has(app.name));

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold text-white mb-4">Favorites</h2>
            {favoriteApps.length > 0 ? (
                <UPIAppGrid apps={favoriteApps} favorites={favorites} toggleFavorite={toggleFavorite} />
            ) : (
                <p className="text-zinc-400">No favorites added yet.</p>
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

const ResultsView: React.FC<{ analysisResults: AnalysisResult; setCurrentView: (view: View) => void }> = ({ analysisResults, setCurrentView }) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  const { summary, transactions, detailedCategoryBreakdown, pageCount } = analysisResults
  const recentTransactions = [...transactions].reverse().slice(0, 5)

  const dateRange = useMemo(() => {
    if (transactions.length === 0) return null;
    const dates = transactions.map(t => new Date(t.date));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    return {
      start: minDate.toLocaleDateString('en-GB', options),
      end: maxDate.toLocaleDateString('en-GB', options)
    };
  }, [transactions]);

  const chartData = useMemo(() => {
    const labels = detailedCategoryBreakdown.map(item => item.category);
    const data = detailedCategoryBreakdown.map(item => item.amount);
    
    return {
      labels,
      datasets: [
        {
          label: 'Amount Spent',
          data,
          backgroundColor: [
            '#4A90E2', '#F5A623', '#F8E71C', '#8B572A', '#7ED321',
            '#417505', '#BD10E0', '#9013FE', '#4A4A4A', '#D0021B'
          ],
          borderColor: '#1C1C1E',
          borderWidth: 2,
        },
      ],
    };
  }, [detailedCategoryBreakdown]);

  const categoryColors: { [key: string]: string } = {
    bills: 'bg-blue-500',
    entertainment: 'bg-red-500',
    food: 'bg-green-500',
    shopping: 'bg-pink-500',
    travel: 'bg-blue-400',
    transfer: 'bg-orange-500',
    health: 'bg-yellow-500',
    education: 'bg-indigo-500',
    default: 'bg-gray-500'
  }

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category)
  }

  return (
    <div className="p-4 bg-black text-white min-h-screen">
      <button onClick={() => setCurrentView('home')} className="mb-4 text-white">
        <ArrowLeftIcon className="h-6 w-6" />
      </button>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">Analysis Results</h2>
        {dateRange && (
          <p className="text-sm text-zinc-400">
            UPI Statement from {dateRange.start} to {dateRange.end}
          </p>
        )}
        {pageCount > 0 && (
            <p className="text-xs text-zinc-500 mt-1">
                Based on {pageCount} page(s) in the PDF
            </p>
        )}
      </div>

      {/* Transaction Summary */}
      <div className="bg-zinc-800 rounded-xl p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Transaction Summary</h3>
        <div className="bg-zinc-900 rounded-lg p-3 text-center">
          <p className="text-sm text-zinc-400">Total CR+DR</p>
          <p className={`text-xl font-bold ${summary.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ₹{summary.balance.toLocaleString('en-IN')}
          </p>
          <div className="flex justify-around text-xs mt-1">
            <span className="text-green-500">CR: ₹{summary.totalReceived.toLocaleString('en-IN')} ({summary.creditCount} trans)</span>
            <span className="text-red-500">DR: ₹{Math.abs(summary.totalSpent).toLocaleString('en-IN')} ({summary.debitCount} trans)</span>
          </div>
          <p className="text-xs text-zinc-500 mt-2">Total {summary.totalTransactions} transactions</p>
        </div>
      </div>
      
      {/* Spending Analysis Charts */}
      <div className="bg-zinc-800 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Spending Analysis</h3>
            <div className="flex space-x-2 bg-zinc-900 p-1 rounded-lg">
                <button 
                    onClick={() => setChartType('pie')}
                    className={`px-3 py-1 text-sm rounded-md ${chartType === 'pie' ? 'bg-blue-600 text-white' : 'text-zinc-400'}`}
                >
                    Pie
                </button>
                <button 
                    onClick={() => setChartType('bar')}
                    className={`px-3 py-1 text-sm rounded-md ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'text-zinc-400'}`}
                >
                    Bar
                </button>
            </div>
        </div>
        <div className="h-64 flex justify-center items-center">
          {chartType === 'pie' ? (
            <Chart data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: true, position: 'right' } } }} />
          ) : (
            <Bar data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          )}
        </div>
      </div>

      {/* Detailed Category Breakdown */}
      <div className="bg-zinc-800 rounded-xl p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Detailed Category Breakdown</h3>
        <div className="space-y-3">
          {detailedCategoryBreakdown.map((item) => (
            <div key={item.category} className="bg-zinc-900 rounded-lg p-3">
              <div onClick={() => toggleCategory(item.category)} className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${categoryColors[item.category.toLowerCase()] || categoryColors.default}`}></span>
                  <p className="font-semibold">{item.category}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold">₹{item.amount.toLocaleString('en-IN')}</p>
                  {expandedCategory === item.category ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                </div>
              </div>
              <div className="text-sm text-zinc-400 mt-2">
                <p>Portion of spending: {item.percentage}%</p>
                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                  <div className={`${categoryColors[item.category.toLowerCase()] || categoryColors.default} h-1.5 rounded-full`} style={{ width: `${item.percentage}%` }}></div>
                </div>
                <p className="mt-1">{item.count} transactions</p>
              </div>
              {expandedCategory === item.category && (
                <div className="mt-4 space-y-2">
                  {item.transactions.map((t, i) => (
                    <div key={i} className="flex justify-between items-center text-sm border-t border-zinc-700 pt-2">
                      <div>
                        <p className="font-medium text-white">{t.description}</p>
                        <p className="text-xs text-zinc-500">{new Date(t.date).toLocaleDateString('en-GB')}</p>
                      </div>
                      <p className="font-semibold text-red-500">₹{Math.abs(t.amount).toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-zinc-800 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-white mb-2">Recent Transactions</h3>
        <div className="space-y-3">
          {recentTransactions.map((t, i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{t.description}</p>
                <p className="text-xs text-zinc-400">{new Date(t.date).toLocaleDateString('en-GB')}</p>
              </div>
              <p className={`text-sm font-semibold ${t.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {t.amount >= 0 ? `₹${t.amount.toLocaleString()}` : `-₹${Math.abs(t.amount).toLocaleString()}`}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Note Section */}
      <div className="bg-zinc-800 rounded-xl p-4 mt-6">
        <h3 className="text-md font-semibold text-white mb-2">Note:</h3>
        <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1">
            <li>Self transfer payments are not included in the total money paid and money received calculations.</li>
            <li>Payments that you might have hidden on payment history page will not be included in this statement.</li>
        </ul>
      </div>

    </div>
  )
}

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
  const renderContent = () => {
    switch (analysisState) {
      case 'upload':
        return (
          <div 
            className="flex flex-col items-center justify-center h-[calc(100vh-150px)] border-2 border-dashed border-zinc-700 rounded-3xl m-4"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <ArrowUpTrayIcon className="w-12 h-12 text-zinc-500 mb-4" />
            <p className="text-zinc-400 mb-2">Drag & drop your PhonePe statement here</p>
            <p className="text-zinc-600 text-sm mb-4">or</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Browse Files
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf"
            />
          </div>
        );
      case 'analyzing':
        return (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-150px)]">
            <LoadingSpinner />
            <p className="text-zinc-400 mt-4">Analyzing your statement...</p>
            <p className="text-zinc-500 text-sm">This may take a moment.</p>
          </div>
        );
      case 'results':
        if (!analysisResults) {
          return <div>Error: Analysis results are not available.</div>
        }
        return <ResultsView analysisResults={analysisResults} setCurrentView={setCurrentView} />
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-4 bg-zinc-900 flex items-center gap-4">
        <button onClick={() => setCurrentView('home')} className="p-2">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">PhonePe Statement Analysis</h1>
      </div>
        {renderContent()}
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
  const renderContent = () => {
    switch (analysisState) {
      case 'upload':
        return (
          <div 
            onDragOver={handleDragOver} 
            onDrop={handleDrop}
            className="p-4 space-y-4"
          >
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-600 rounded-2xl p-8 text-center cursor-pointer hover:bg-zinc-800 transition-colors"
            >
              <ArrowUpTrayIcon className="w-12 h-12 mx-auto text-zinc-400" />
              <p className="mt-2 text-white">Drag & drop your Kotak statement or click to select</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept=".pdf" 
              />
            </div>
          </div>
        );
      case 'analyzing':
        return (
          <div className="flex flex-col items-center justify-center p-8">
            <LoadingSpinner />
            <p className="mt-4 text-white">Analyzing your statement...</p>
          </div>
        );
      case 'results':
        if (!analysisResults) {
          return <div>Error: Analysis results are not available.</div>
        }
        return <ResultsView analysisResults={analysisResults} setCurrentView={setCurrentView} />
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="p-4 bg-zinc-900 flex items-center gap-4">
        <button onClick={() => setCurrentView('home')} className="p-2">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Kotak Bank Statement Analysis</h1>
      </div>
      {renderContent()}
    </div>
  );
};

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

const ReferAndEarnView: React.FC<{ setCurrentView: (view: View) => void }> = ({ setCurrentView }) => {
  const [friendEmail, setFriendEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    try {
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

          {showSuccess && (
            <div className="mt-4 p-4 bg-green-500/20 rounded-xl">
              <p className="text-green-500 text-center text-sm">
                Invitation sent successfully!
              </p>
            </div>
          )}
        </div>

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
  favorites = new Set<string>(),
  toggleFavorite = (appName: string) => {},
  navigate = (path: string) => {}
}: { 
  favorites?: Set<string>;
  toggleFavorite?: (appName: string) => void;
  navigate?: (path: string) => void;
}) {
  const [currentView, setCurrentView] = useState<View>('home');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState<Profile | undefined>(undefined);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>('upload');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const toggleSearchModal = useCallback(() => {
    setIsSearchOpen(prev => !prev);
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
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
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      await analyzeStatement(file);
    } else {
      alert('Please drop a valid PDF file');
      setAnalysisState('upload');
    }
  };

  const analyzeStatement = async (file: File) => {
    setAnalysisState('analyzing');
    const formData = new FormData();
    formData.append('file', file);
    
    let platform = '';
    if (currentView === 'phonepe-analysis') {
      platform = 'phonepe';
    } else if (currentView === 'kotak-analysis') {
      platform = 'kotak';
    } else {
        // Fallback or default platform
        platform = 'phonepe'
    }
    formData.append('platform', platform);

    try {
      const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, "");
      const response = await fetch(`${backendUrl}/analyze`, {
        method: 'POST',
        body: formData,
      });

      const results = await response.json();

      if (!response.ok) {
        throw new Error(results.detail || 'Failed to analyze statement');
      }

      setAnalysisResults(results);
      setAnalysisState('results');
    } catch (error) {
      console.error(error);
      alert(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setAnalysisState('upload');
    }
  };

  const renderCurrentView = () => {
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
      case 'kotak-analysis':
        const ViewComponent = currentView === 'phonepe-analysis' ? PhonePeAnalysisView : KotakAnalysisView;
        return <ViewComponent
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
          profile={profile}
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
  }

  if (!mounted) {
    return (
      <div className="min-h-screen w-full max-w-4xl mx-auto flex items-center justify-center bg-black">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-4xl mx-auto">
      {renderCurrentView()}
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