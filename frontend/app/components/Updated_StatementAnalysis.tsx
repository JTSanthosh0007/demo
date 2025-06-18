'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { HomeIcon, ChartBarIcon, FolderIcon, Cog6ToothIcon, PlusIcon, ArrowLeftIcon, DocumentTextIcon, ArrowUpTrayIcon, DocumentIcon, ClockIcon, WalletIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

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
}

type View = 'home' | 'phonepe-analysis' | 'more-upi-apps' | 'more-banks' | 'settings' | 'profile' | 'history' | 'favorites'

type AnalysisState = 'upload' | 'analyzing' | 'results'

interface AnalysisResult {
  transactions: {
    date: string;
    amount: number;
    description: string;
    category: string;
  }[];
  totalReceived: number;
  totalSpent: number;
  categoryBreakdown: Record<string, number>;
}

const ProfileView = ({ onBack, userId }: { onBack: () => void; userId: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      setError('No user ID available');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      // Simulate saving profile data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success state briefly
      await new Promise(resolve => setTimeout(resolve, 1000));
      onBack();
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    async function loadProfile() {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Simulate loading profile data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock profile data
        setProfileData({
          full_name: 'Demo User',
          email: 'user@example.com',
          phone: '123-456-7890',
          date_of_birth: '1990-01-01',
          gender: 'prefer_not_to_say'
        });
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="px-4 py-6 border-b">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6 text-black" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-4 py-6 border-b">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6 text-black" />
          </button>
          <h1 className="text-xl font-semibold text-black">Profile</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
        {/* Profile Photo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-3xl font-medium text-gray-600">
              {profileData?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'}
            </span>
          </div>
          <button type="button" className="text-black font-medium">
            Change Photo
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={profileData.full_name}
              onChange={e => setProfileData({ ...profileData, full_name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={profileData.email}
              onChange={e => setProfileData({ ...profileData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              placeholder="Enter your phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              value={profileData.date_of_birth}
              onChange={e => setProfileData({ ...profileData, date_of_birth: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <select
              value={profileData.gender}
              onChange={e => setProfileData({ ...profileData, gender: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Save Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className={`w-full py-4 rounded-xl text-white font-medium transition-all
              ${isSaving ? 'bg-gray-400' : 'bg-black hover:bg-gray-900'}`}
          >
            {isSaving ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default function StatementAnalysis({ data }: { data: AnalysisData }) {
  const [mounted, setMounted] = useState(false);
  const [currentView, setCurrentView] = useState<View>('home')
  const [analysisState, setAnalysisState] = useState<AnalysisState>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userId] = useState<string>('demo-user-id');
  const [profile, setProfile] = useState<any>({
    full_name: 'Demo User',
    email: 'user@example.com'
  });
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // Add this state to track favorite apps
  const [favoriteApps, setFavoriteApps] = useState<{id: string, name: string, type: string}[]>([
    {id: '1', name: 'PhonePe', type: 'UPI App'},
    {id: '4', name: 'HDFC Bank', type: 'Bank'}
  ]);

  // Function to toggle an app as favorite
  const toggleAppFavorite = (appId: string, appName: string, appType: string) => {
    setFavoriteApps(prevFavorites => {
      const exists = prevFavorites.some(app => app.id === appId);
      if (exists) {
        return prevFavorites.filter(app => app.id !== appId);
      } else {
        return [...prevFavorites, {id: appId, name: appName, type: appType}];
      }
    });
  };

  // Format functions using useMemo to ensure consistent output
  const formatters = useMemo(() => ({
    currency: new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }),
    date: new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }), []);

  const formatCurrency = useCallback((amount: number) => {
    return formatters.currency.format(Math.abs(amount)).replace('₹', '₹ ');
  }, [formatters]);

  const formatDate = useCallback((dateString: string) => {
    return formatters.date.format(new Date(dateString));
  }, [formatters]);

  // Format values once and memoize them
  const formattedValues = useMemo(() => ({
    balance: formatCurrency(data.totalReceived - Math.abs(data.totalSpent)),
    budget: formatCurrency(50000),
    spent: formatCurrency(Math.abs(data.totalSpent))
  }), [data.totalReceived, data.totalSpent, formatCurrency]);

  // Define all searchable items
  const searchableItems = [
    // UPI Apps
    { name: 'PhonePe', category: 'UPI Apps', action: () => setCurrentView('phonepe-analysis') },
    { name: 'Google Pay', category: 'UPI Apps' },
    { name: 'Paytm', category: 'UPI Apps' },
    { name: 'BHIM', category: 'UPI Apps' },
    { name: 'Amazon Pay', category: 'UPI Apps' },
    { name: 'WhatsApp Pay', category: 'UPI Apps' },
    { name: 'Mobikwik', category: 'UPI Apps' },
    // Banks
    { name: 'State Bank of India (SBI)', category: 'Banks' },
    { name: 'HDFC Bank', category: 'Banks' },
    { name: 'ICICI Bank', category: 'Banks' },
    { name: 'Axis Bank', category: 'Banks' },
    { name: 'Kotak Mahindra Bank', category: 'Banks' },
    // Credit Cards
    { name: 'HDFC Credit Card', category: 'Credit Cards' },
    { name: 'SBI Credit Card', category: 'Credit Cards' },
    { name: 'ICICI Credit Card', category: 'Credit Cards' },
    // Debit Cards
    { name: 'SBI Debit Card', category: 'Debit Cards' },
    { name: 'HDFC Debit Card', category: 'Debit Cards' },
    { name: 'ICICI Debit Card', category: 'Debit Cards' }
  ];

  // Filter items based on search query
  const filteredItems = searchQuery
    ? searchableItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Group filtered items by category
  const groupedResults = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof searchableItems>);

  useEffect(() => {
    // Simulate authentication check
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-gray-100" suppressHydrationWarning />;
  }

  const PhonePeAnalysisView = ({ setCurrentView, toggleSearchModal }: { 
    setCurrentView: (view: View) => void;
    toggleSearchModal: () => void;
  }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleFileUpload = async (file: File) => {
      if (!file) {
        setError('Please select a file');
        return;
      }

      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Please upload a PDF file');
        return;
      }

      try {
        setIsUploading(true);
        setError(null);
        setAnalysisResult(null);

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/analyze-phonepe', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to analyze statement');
        }

        if (data.error) {
          throw new Error(data.error);
        }

        const result: AnalysisResult = {
          transactions: (data.transactions || []).map((tx: any) => ({
            date: tx.date || '',
            amount: Number(tx.amount) || 0,
            description: String(tx.description || ''),
            category: String(tx.category || 'Other')
          })),
          totalReceived: Math.abs(Number(data.totalReceived || 0)),
          totalSpent: Math.abs(Number(data.totalSpent || 0)),
          categoryBreakdown: Object.fromEntries(
            Object.entries(data.categoryBreakdown || {}).map(([category, amount]) => [
              category,
              Math.abs(Number(amount) || 0)
            ])
          )
        };

        setAnalysisResult(result);
      } catch (err) {
        console.error('Upload error:', err);
        setError(err instanceof Error ? err.message : 'Failed to analyze statement');
      } finally {
        setIsUploading(false);
      }
    };

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileUpload(e.dataTransfer.files[0]);
      }
    };

    return (
      <div className="flex flex-col min-h-screen bg-black" suppressHydrationWarning>
        {/* Header */}
        <div className="bg-black border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
            <button
              onClick={() => setCurrentView('home')}
              className="p-2 rounded-full hover:bg-gray-900 transition-all duration-200"
            >
              <ArrowLeftIcon className="w-6 h-6 text-white" />
            </button>
            <h2 className="text-xl font-semibold text-white">PhonePe Statement Analysis</h2>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8 w-full">
          {!analysisResult ? (
            <div className="max-w-2xl mx-auto">
              {/* Upload Section */}
              <div 
                className={`relative flex flex-col items-center p-8 border-2 border-dashed rounded-2xl transition-all duration-300 ease-in-out bg-gray-900
                  ${dragActive ? 'border-white border-opacity-50 bg-gray-800' : 'border-gray-700 hover:border-gray-500'}
                  ${isUploading ? 'opacity-75' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="mb-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700">
                    <DocumentIcon className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Upload PhonePe Statement</h3>
                  <p className="text-gray-400 text-lg">
                    Drag and drop your PDF statement here, or click to browse
                  </p>
                </div>

                <label className="relative cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file);
                      }
                    }}
                    disabled={isUploading}
                  />
                  <div 
                    className={`px-8 py-4 rounded-xl font-medium text-base transition-all duration-300
                      ${isUploading 
                        ? 'bg-gray-800 text-gray-400 cursor-not-allowed' 
                        : 'bg-white text-black hover:bg-gray-100 cursor-pointer'}`}
                  >
                    {isUploading ? (
                      <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent" />
                        <span>Analyzing...</span>
                      </div>
                    ) : (
                      'Select PDF File'
                    )}
                  </div>
                </label>

                {error && (
                  <div className="mt-6 p-4 bg-red-900/20 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-3 w-full max-w-md">
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}

                {isUploading && (
                  <div className="mt-6 text-blue-400 text-base text-center">
                    Processing your statement...
                  </div>
                )}

                <div className="mt-12 w-full max-w-md">
                  <h4 className="text-gray-400 font-medium mb-4 text-sm uppercase tracking-wider">How to get your statement:</h4>
                  <ol className="space-y-4">
                    <li className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl">
                      <span className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-medium border border-gray-700">1</span>
                      <span className="text-gray-300">Open the PhonePe app</span>
                    </li>
                    <li className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl">
                      <span className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-medium border border-gray-700">2</span>
                      <span className="text-gray-300">Go to Profile &gt; Statements</span>
                    </li>
                    <li className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl">
                      <span className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-medium border border-gray-700">3</span>
                      <span className="text-gray-300">Select the date range</span>
                    </li>
                    <li className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl">
                      <span className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-medium border border-gray-700">4</span>
                      <span className="text-gray-300">Download the PDF statement</span>
                    </li>
                    <li className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-xl">
                      <span className="w-8 h-8 rounded-full bg-gray-800 text-white flex items-center justify-center text-sm font-medium border border-gray-700">5</span>
                      <span className="text-gray-300">Upload it here for analysis</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Summary Cards */}
              <div className="space-y-4">
                <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                  <h3 className="text-lg font-semibold text-white mb-6">Transaction Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                      <div>
                        <p className="text-sm text-gray-400">Total Credit (CR)</p>
                        <p className="text-xl font-semibold text-white mt-1">₹ {formatCurrency(analysisResult.totalReceived)}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                      <div>
                        <p className="text-sm text-gray-400">Total Debit (DR)</p>
                        <p className="text-xl font-semibold text-white mt-1">₹ {formatCurrency(analysisResult.totalSpent)}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                        <p className="text-sm text-gray-400">Total Transactions</p>
                        <p className="text-xl font-semibold text-white mt-1">{analysisResult.transactions.length}</p>
                      </div>
                      <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                        <p className="text-sm text-gray-400">Total Volume</p>
                        <p className="text-xl font-semibold text-white mt-1">₹ {formatCurrency(analysisResult.totalReceived + analysisResult.totalSpent)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-6">Spending by Category</h3>
                <div className="space-y-6">
                  {Object.entries(analysisResult.categoryBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, amount]) => (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-300">{category}</span>
                          <span className="text-gray-400">₹ {formatCurrency(amount)}</span>
                        </div>
                        <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-500"
                            style={{
                              width: `${(amount / analysisResult.totalSpent * 100).toFixed(1)}%`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-6">Recent Transactions</h3>
                <div className="space-y-4">
                  {analysisResult.transactions
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 4)
                    .map((tx, index) => (
                      <div key={`${tx.date}-${tx.amount}-${index}`} 
                        className="p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors bg-gray-800/50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-200 line-clamp-1">{tx.description}</p>
                            <p className="text-sm text-gray-500 mt-1">{formatDate(tx.date)}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              ₹ {formatCurrency(tx.amount)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {tx.amount > 0 ? 'Credit' : 'Debit'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-6 py-2">
          <div className="flex justify-between items-center max-w-md mx-auto">
            <button 
              onClick={() => setCurrentView('home')}
              className="flex flex-col items-center p-2"
            >
              <HomeIcon className="w-6 h-6 text-gray-400" />
              <span className="text-xs mt-1 text-gray-400">Home</span>
            </button>

            <button 
              onClick={() => setIsSearchOpen(true)}
              className="flex flex-col items-center p-2"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-xs mt-1 text-gray-400">Search</span>
            </button>

            <button 
              onClick={() => setCurrentView('favorites')}
              className="flex flex-col items-center p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-black" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs mt-1 text-black">Favorites</span>
            </button>

            <button 
              onClick={() => setCurrentView('settings')}
              className="flex flex-col items-center p-2">
              <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs mt-1 text-gray-400">Settings</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const MoreUpiAppsView = ({ setCurrentView, toggleSearchModal }: { 
    setCurrentView: (view: View) => void;
    toggleSearchModal: () => void;
  }) => {
    const allUpiApps = [
      { id: '1', name: 'PhonePe', onClick: () => setCurrentView('phonepe-analysis') },
      { id: '2', name: 'Google Pay' },
      { id: '3', name: 'Paytm' },
      { id: '4', name: 'BHIM' },
      { id: '5', name: 'Amazon Pay' },
      { id: '6', name: 'WhatsApp Pay' },
      { id: '7', name: 'Mobikwik' },
      { id: '8', name: 'BankBazaar' },
      { id: '9', name: 'SBI Pay' },
      { id: '10', name: 'iMobile' },
      { id: '11', name: 'Axis Pay' },
      { id: '12', name: 'BOB UPI' },
      { id: '13', name: 'Freecharge' },
      { id: '14', name: 'PayZapp' },
      { id: '15', name: 'Kotak 811' },
      { id: '16', name: 'Pockets ICICI' },
      { id: '17', name: 'Uber' },
      { id: '18', name: 'Chillr' },
      { id: '19', name: 'Paytm Bank' }
    ];

    return (
      <div className="flex flex-col min-h-screen bg-white">
        {/* Header with modern design */}
        <div className="bg-black text-white">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentView('home')}
                className="p-2 rounded-full hover:bg-gray-900 transition-all duration-200"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-2xl font-bold">All UPI Apps</h2>
                <p className="text-gray-400 text-sm mt-1">Select an app to analyze transactions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="sticky top-0 bg-white border-b z-10 px-4 py-3">
          <div className="relative max-w-7xl mx-auto">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search UPI apps..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-300"
            />
          </div>
        </div>

        {/* Apps Grid with modern cards */}
        <div className="max-w-7xl mx-auto px-4 py-8 w-full">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {allUpiApps.map((app) => (
              <div
                key={app.id}
                className="group relative bg-white border border-gray-100 rounded-2xl p-6 hover:border-black transition-all duration-300"
              >
                {/* Favorite Button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAppFavorite(app.id, app.name, 'UPI App');
                  }}
                  className="absolute top-3 right-3 z-10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" 
                    className={`h-6 w-6 ${favoriteApps.some(favApp => favApp.id === app.id) ? 'text-yellow-400' : 'text-gray-300'}`} 
                    viewBox="0 0 20 20" 
                    fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>

                {/* App Button Content */}
                <button
                  onClick={app.onClick}
                  className="w-full"
                >
                  {/* App Icon with hover effect */}
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 bg-gray-100 rounded-2xl transform group-hover:scale-95 transition-transform duration-300"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-8 h-8 text-black transform group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* App Name with modern typography */}
                  <div className="text-center">
                    <h3 className="font-medium text-sm text-black group-hover:font-semibold transition-all duration-300">{app.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {app.name === 'PhonePe' ? 'Tap to analyze' : 'Coming soon'}
                    </p>
                  </div>

                  {/* Subtle hover effect overlay */}
                  <div className="absolute inset-0 rounded-2xl bg-black opacity-0 group-hover:opacity-[0.02] transition-opacity duration-300"></div>
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-2">
          <div className="flex justify-between items-center max-w-md mx-auto">
            <button 
              onClick={() => setCurrentView('home')}
              className="flex flex-col items-center p-2"
            >
              <HomeIcon className="w-6 h-6 text-gray-400" />
              <span className="text-xs mt-1 text-gray-400">Home</span>
            </button>

            <button 
              onClick={() => setIsSearchOpen(true)}
              className="flex flex-col items-center p-2"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-xs mt-1 text-gray-400">Search</span>
            </button>

            <button 
              onClick={() => setCurrentView('favorites')}
              className="flex flex-col items-center p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-black" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs mt-1 text-black">Favorites</span>
            </button>

            <button 
              onClick={() => setCurrentView('settings')}
              className="flex flex-col items-center p-2">
              <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs mt-1 text-gray-400">Settings</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const MoreBanksView = ({ setCurrentView, toggleSearchModal }: { 
    setCurrentView: (view: View) => void;
    toggleSearchModal: () => void;
  }) => {
    const [selectedCategory, setSelectedCategory] = useState('private');
    
    const bankCategories = {
      private: [
        { name: 'HDFC Bank', color: '#000000', tagline: 'We Understand Your World', logo: '🏦' },
        { name: 'ICICI Bank', color: '#000000', tagline: 'Hum Hai Na', logo: '🏦' },
        { name: 'Axis Bank', color: '#000000', tagline: 'Badhti Ka naam Zindagi', logo: '🏦' },
        { name: 'Kotak Mahindra', color: '#000000', tagline: 'Let\'s make money simple', logo: '🏦' },
        { name: 'IndusInd Bank', color: '#000000', tagline: 'We Make You Feel Richer', logo: '🏦' },
        { name: 'YES Bank', color: '#000000', tagline: 'Good People to Bank with', logo: '🏦' },
        { name: 'Federal Bank', color: 'black', tagline: '' },
        { name: 'IDFC FIRST', color: 'black', tagline: 'Banking Hatke' },
        { name: 'Bandhan Bank', color: 'black', tagline: 'Aapka Bhala, Sabki Bhalai' },
        { name: 'DCB Bank', color: 'black', tagline: '' },
        { name: 'CSB Bank', color: 'black', tagline: '' },
        { name: 'City Union Bank', color: 'black', tagline: '' },
        { name: 'Dhanlaxmi Bank', color: 'black', tagline: '' },
        { name: 'Jammu & Kashmir Bank', color: 'black', tagline: '' },
        { name: 'Karnataka Bank', color: 'black', tagline: '' },
        { name: 'Karur Vysya Bank', color: 'black', tagline: '' },
        { name: 'Nainital Bank', color: 'black', tagline: '' },
        { name: 'RBL Bank', color: 'black', tagline: '' },
        { name: 'South Indian Bank', color: 'black', tagline: '' },
        { name: 'Tamilnad Mercantile', color: 'black', tagline: '' }
      ],
      public: [
        { name: 'State Bank of India', color: '#000000', tagline: 'The Nation\'s banks on us', logo: '🏦' },
        { name: 'Bank of Baroda', color: 'black', tagline: 'India\'s International Bank', logo: '🏦' },
        { name: 'Punjab National Bank', color: 'black', tagline: 'The Name You Can Bank Upon', logo: '🏦' },
        { name: 'Canara Bank', color: 'black', tagline: 'Together we can', logo: '🏦' },
        { name: 'Union Bank', color: 'black', tagline: 'Good people to bank with', logo: '🏦' },
        { name: 'Bank of India', color: 'black', tagline: '' },
        { name: 'Indian Bank', color: 'black', tagline: 'Your Tech Friendly Bank', logo: '🏦' },
        { name: 'Central Bank', color: 'black', tagline: 'Build a Better Life Around Us', logo: '🏦' },
        { name: 'Bank of Maharashtra', color: 'black', tagline: '' },
        { name: 'Punjab & Sind Bank', color: 'black', tagline: '' },
        { name: 'Indian Overseas Bank', color: 'black', tagline: '' },
        { name: 'UCO Bank', color: 'black', tagline: 'Honors Your Trust', logo: '🏦' }
      ],
      small_finance: [
        { name: 'AU Small Finance', color: '#000000', tagline: 'Smart way to Bank', logo: '🏦' },
        { name: 'Capital Small Finance', color: 'black', tagline: '' },
        { name: 'Equitas Small Finance', color: '#000000', tagline: 'Beyond Banking', logo: '🏦' },
        { name: 'ESAF Small Finance', color: 'black', tagline: '' },
        { name: 'Suryoday Small Finance', color: 'black', tagline: '' },
        { name: 'Ujjivan Small Finance', color: 'black', tagline: '' },
        { name: 'Utkarsh Small Finance', color: 'black', tagline: '' },
        { name: 'North East Small Finance', color: 'black', tagline: '' },
        { name: 'Jana Small Finance', color: 'black', tagline: '' },
        { name: 'Shivalik Small Finance', color: 'black', tagline: '' },
        { name: 'Unity Small Finance', color: 'black', tagline: '' }
      ]
    };

    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Header with Back Button */}
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentView('home')}
                className="p-2 rounded-full hover:bg-gray-900 transition-all duration-200"
              >
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-xl font-semibold text-black">All Banks</h2>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex space-x-8">
              {[
                { id: 'private', label: 'Private Sector Banks' },
                { id: 'public', label: 'Public Sector Banks' },
                { id: 'small_finance', label: 'Small Finance Banks' }
              ].map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`py-4 relative ${
                    selectedCategory === category.id
                      ? 'text-black'
                      : 'text-gray-500 hover:text-black'
                  }`}
                >
                  <span className="text-sm font-medium">{category.label}</span>
                  {selectedCategory === category.id && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-black"></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Banks Grid */}
        <div className="max-w-7xl mx-auto px-4 py-8 w-full">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {bankCategories[selectedCategory].map((bank) => (
              <div
                key={bank.name}
                className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden"
              >
                {/* Bank Logo/Icon */}
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-2xl bg-gray-100"
                >
                  <span className="text-3xl">{bank.logo}</span>
                </div>

                {/* Bank Details */}
                <div className="space-y-1">
                  <h3 className="font-semibold text-black">{bank.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{bank.tagline}</p>
                </div>

                {/* Hover Effect */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-black"
                ></div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-2">
          <div className="flex justify-between items-center max-w-md mx-auto">
            <button 
              onClick={() => setCurrentView('home')}
              className="flex flex-col items-center p-2"
            >
              <HomeIcon className="w-6 h-6 text-gray-400" />
              <span className="text-xs mt-1 text-gray-400">Home</span>
            </button>

            <button 
              onClick={() => setIsSearchOpen(true)}
              className="flex flex-col items-center p-2"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-xs mt-1 text-gray-400">Search</span>
            </button>

            <button 
              onClick={() => setCurrentView('favorites')}
              className="flex flex-col items-center p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-black" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs mt-1 text-black">Favorites</span>
            </button>

            <button 
              onClick={() => setCurrentView('settings')}
              className="flex flex-col items-center p-2">
              <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs mt-1 text-gray-400">Settings</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SettingsView = ({ setCurrentView, toggleSearchModal }: { 
    setCurrentView: (view: View) => void;
    toggleSearchModal: () => void;
  }) => {
    const initials = profile?.full_name
      ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
      : '?';

    const handleLogout = () => {
      // Simply reset the view to home in demo mode
      setCurrentView('home');
    };

    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="px-4 py-6">
          <h1 className="text-2xl font-bold text-black">Settings</h1>
        </div>

        {/* Profile Section */}
        <div className="px-4">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              {profile?.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt={profile.full_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <span className="text-xl font-medium text-gray-600">{initials}</span>
              )}
            </div>
            <div>
              <h2 className="text-base font-medium text-black">{profile?.full_name || 'Loading...'}</h2>
              <p className="text-sm text-gray-500">{profile?.email || ''}</p>
            </div>
          </div>

          {/* Settings Menu */}
          <div className="space-y-px">
            <button 
              onClick={() => setCurrentView('profile')}
              className="w-full bg-gray-50 px-4 py-4 flex items-center justify-between"
            >
              <span className="text-base text-black">Profile</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button className="w-full bg-gray-50 px-4 py-4 flex items-center justify-between">
              <span className="text-base text-black">Bank Accounts</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button className="w-full bg-gray-50 px-4 py-4 flex items-center justify-between">
              <span className="text-base text-black">Notifications</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button className="w-full bg-gray-50 px-4 py-4 flex items-center justify-between">
              <span className="text-base text-black">Security</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button className="w-full bg-gray-50 px-4 py-4 flex items-center justify-between">
              <span className="text-base text-black">Help & Support</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Log Out Button */}
          <div className="px-4 mt-8">
            <button 
              onClick={handleLogout}
              className="w-full text-red-500 text-base">
              Log Out
            </button>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-2">
          <div className="flex justify-between items-center max-w-md mx-auto">
            <button 
              onClick={() => setCurrentView('home')}
              className="flex flex-col items-center p-2"
            >
              <HomeIcon className="w-6 h-6 text-gray-400" />
              <span className="text-xs mt-1 text-gray-400">Home</span>
            </button>

            <button 
              onClick={() => setIsSearchOpen(true)}
              className="flex flex-col items-center p-2"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-xs mt-1 text-gray-400">Search</span>
            </button>

            <button 
              onClick={() => setCurrentView('favorites')}
              className="flex flex-col items-center p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-black" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs mt-1 text-black">Favorites</span>
            </button>

            <button 
              onClick={() => setCurrentView('settings')}
              className="flex flex-col items-center p-2">
              <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs mt-1 text-gray-400">Settings</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SearchModal = ({ isOpen, onClose, searchQuery, setSearchQuery, groupedResults }: {
    isOpen: boolean;
    onClose: () => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    groupedResults: Record<string, any[]>;
  }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
        <div className="min-h-screen flex flex-col">
          {/* Search Header */}
          <div className="bg-black border-b border-gray-800">
            <div className="max-w-3xl mx-auto px-4 py-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search banks, UPI apps, cards..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-900 text-white border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent"
                    autoFocus
                  />
                </div>
                <button
                  onClick={onClose}
                  className="p-3 hover:bg-gray-900 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-6">
              {searchQuery === '' ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">Start typing to search...</p>
                </div>
              ) : Object.keys(groupedResults).length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">No results found</p>
                </div>
              ) : (
                Object.entries(groupedResults).map(([category, items]) => (
                  <div key={category} className="mb-8">
                    <h3 className="text-sm font-medium text-gray-400 mb-4">{category}</h3>
                    <div className="space-y-2">
                      {items.map((item, index) => (
                        <button
                          key={`${category}-${index}`}
                          onClick={() => {
                            if (item.action) {
                              item.action();
                              onClose();
                            }
                          }}
                          className="w-full p-4 bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-white">{item.name}</p>
                              <p className="text-sm text-gray-400">
                                {item.action ? 'Tap to analyze' : 'Coming soon'}
                              </p>
                            </div>
                          </div>
                          {item.action && (
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const HomeView = ({ setCurrentView, toggleSearchModal }: { 
    setCurrentView: (view: View) => void;
    toggleSearchModal: () => void;
  }) => {
    return (
      <div className="min-h-screen bg-black">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-white">Financial Overview</h1>
        </div>

        {/* Balance Card */}
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <div className="bg-gray-900 rounded-2xl p-6">
            <p className="text-gray-400 mb-2">Total Balance</p>
            <h2 className="text-3xl font-bold text-white">₹ {formattedValues.balance}</h2>
            <div className="mt-4 flex items-center gap-4">
              <div>
                <p className="text-sm text-gray-400">Monthly Budget</p>
                <p className="text-lg font-medium text-white">₹ {formattedValues.budget}</p>
              </div>
              <div className="w-px h-8 bg-gray-800"></div>
              <div>
                <p className="text-sm text-gray-400">Spent</p>
                <p className="text-lg font-medium text-white">₹ {formattedValues.spent}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Google AdMob Banner */}
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <div className="bg-gray-900 rounded-2xl p-6 flex items-center justify-center min-h-[200px]">
            {/* Add your Google AdMob component here */}
            <p className="text-gray-400">Advertisement Space</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setCurrentView('more-upi-apps')}
              className="bg-gray-900 rounded-2xl p-6 text-left hover:bg-gray-800 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-medium text-white mb-1">UPI Apps</h4>
              <p className="text-sm text-gray-400">View all UPI transactions</p>
            </button>

            <button 
              onClick={() => setCurrentView('more-banks')}
              className="bg-gray-900 rounded-2xl p-6 text-left hover:bg-gray-800 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h4 className="font-medium text-white mb-1">Banks</h4>
              <p className="text-sm text-gray-400">View all bank accounts</p>
            </button>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-6 py-2">
          <div className="flex justify-between items-center max-w-md mx-auto">
            <button className="flex flex-col items-center p-2 text-white">
              <HomeIcon className="w-6 h-6" />
              <span className="text-xs mt-1">Home</span>
            </button>

            <button 
              onClick={() => setIsSearchOpen(true)}
              className="flex flex-col items-center p-2"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-xs mt-1 text-gray-400">Search</span>
            </button>

            <button 
              onClick={() => setCurrentView('favorites')}
              className="flex flex-col items-center p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-black" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs mt-1 text-black">Favorites</span>
            </button>

            <button 
              onClick={() => setCurrentView('settings')}
              className="flex flex-col items-center p-2">
              <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs mt-1 text-gray-400">Settings</span>
            </button>
          </div>
        </div>

        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => {
            setIsSearchOpen(false);
            setSearchQuery('');
          }}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          groupedResults={groupedResults}
        />
      </div>
    );
  };

  const HistoryView = ({ setCurrentView, toggleSearchModal }: { 
    setCurrentView: (view: View) => void;
    toggleSearchModal: () => void;
  }) => {
    // Mock history data
    const analysisHistory = [
      {
        id: '1',
        app: 'PhonePe',
        filename: 'PhonePe_Statement_July2023.pdf',
        date: '2023-08-15T14:32:45',
        transactions: 57,
        totalAmount: 45750,
        isFavorite: true
      },
      {
        id: '2',
        app: 'PhonePe',
        filename: 'PhonePe_Statement_Aug2023.pdf',
        date: '2023-09-03T09:15:22',
        transactions: 63,
        totalAmount: 52300,
        isFavorite: false
      },
      {
        id: '3',
        app: 'Google Pay',
        filename: 'GPay_Statement_Aug2023.pdf',
        date: '2023-09-05T18:45:12',
        transactions: 42,
        totalAmount: 37800,
        isFavorite: false
      },
      {
        id: '4',
        app: 'HDFC Bank',
        filename: 'HDFC_Statement_Q2_2023.pdf',
        date: '2023-07-12T10:22:08',
        transactions: 126,
        totalAmount: 154200,
        isFavorite: true
      },
      {
        id: '5',
        app: 'PhonePe',
        filename: 'PhonePe_Statement_June2023.pdf',
        date: '2023-07-05T16:30:45',
        transactions: 48,
        totalAmount: 39250,
        isFavorite: false
      }
    ];

    // State to manage favorites
    const [history, setHistory] = useState(analysisHistory);

    // Toggle favorite status
    const toggleFavorite = (id: string) => {
      setHistory(prevHistory => 
        prevHistory.map(item => 
          item.id === id ? {...item, isFavorite: !item.isFavorite} : item
        )
      );
    };

    // Calculate how many times each app has been analyzed
    const appFrequency = history.reduce((acc, item) => {
      acc[item.app] = (acc[item.app] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="min-h-screen bg-black">
        {/* Header */}
        <div className="bg-black text-white px-4 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('home')}
              className="p-1"
            >
              <ArrowLeftIcon className="w-6 h-6 text-white" />
            </button>
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <h2 className="text-xl font-bold text-white">Favorites</h2>
            </div>
          </div>
          <button 
            onClick={() => setCurrentView('favorites')}
            className="bg-gray-800 px-3 py-1 rounded-full text-sm text-white flex items-center gap-1"
          >
            <ClockIcon className="h-4 w-4" />
            History
          </button>
        </div>

        {/* History List */}
        <div className="px-4 py-2">
          <div>
            {history.map((item) => (
              <div 
                key={item.id}
                className="bg-white rounded-xl p-4 mb-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 text-xl">₹</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-black">{item.filename}</h3>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <span>{item.app}</span>
                        <span className="mx-2">·</span>
                        <span>
                          {new Date(item.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric'
                          })}
                        </span>
                        <span className="mx-1">&nbsp;</span>
                        <span>
                          {new Date(item.date).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-black font-medium">₹ {item.totalAmount.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-500">{item.transactions} transactions</p>
                    <button 
                      onClick={() => toggleFavorite(item.id)}
                      className="mt-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" 
                        className={`h-6 w-6 ${item.isFavorite ? 'text-yellow-400' : 'text-gray-300'}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button className="text-sm text-gray-900 font-medium">
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-6 py-2">
          <div className="flex justify-between items-center max-w-md mx-auto">
            <button 
              onClick={() => setCurrentView('home')}
              className="flex flex-col items-center p-2"
            >
              <HomeIcon className="w-6 h-6 text-gray-400" />
              <span className="text-xs mt-1 text-gray-400">Home</span>
            </button>

            <button 
              onClick={() => setIsSearchOpen(true)}
              className="flex flex-col items-center p-2"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-xs mt-1 text-gray-400">Search</span>
            </button>

            <button 
              onClick={() => setCurrentView('favorites')}
              className="flex flex-col items-center p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-black" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs mt-1 text-black">Favorites</span>
            </button>

            <button 
              onClick={() => setCurrentView('settings')}
              className="flex flex-col items-center p-2">
              <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs mt-1 text-gray-400">Settings</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const toggleSearchModal = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setSearchQuery('');
    }
  };

  // Add FavoritesView component before toggleSearchModal function
  const FavoritesView = ({ setCurrentView, toggleSearchModal }: { 
    setCurrentView: (view: View) => void;
    toggleSearchModal: () => void;
  }) => {
    // Mock history data with favorites
    const analysisHistory = [
      {
        id: '1',
        filename: 'PhonePe Statement.pdf',
        app: 'PhonePe',
        date: '2023-06-15T10:30:00Z',
        totalAmount: 12500,
        transactions: 28,
        isFavorite: true
      },
      {
        id: '3',
        filename: 'HDFC Bank Statement.pdf',
        app: 'HDFC Bank',
        date: '2023-04-02T14:15:00Z',
        totalAmount: 45600,
        transactions: 32,
        isFavorite: true
      }
    ];

    // Initialize favoriteApps state
    const [favoriteApps, setFavoriteApps] = useState([
      { id: 'phonepe', name: 'PhonePe', type: 'upi' },
      { id: 'hdfc', name: 'HDFC Bank', type: 'bank' }
    ]);

    // Function to remove app from favorites
    const removeAppFromFavorites = (appId: string) => {
      setFavoriteApps(favoriteApps.filter(app => app.id !== appId));
    };

    return (
      <div className="min-h-screen bg-black">
        {/* Header */}
        <div className="max-w-7xl mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentView('home')}
              className="w-8 h-8 flex items-center justify-center"
            >
              <ArrowLeftIcon className="w-6 h-6 text-white" />
            </button>
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <h2 className="text-xl font-bold text-white">Favorites</h2>
            </div>
          </div>
        </div>

        {/* Favorites Content */}
        <div className="px-4 py-2">
          {favoriteApps.length === 0 && analysisHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600 mb-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <p className="text-gray-400 mb-3">No favorites yet</p>
              <button 
                onClick={() => setCurrentView('home')} 
                className="inline-flex items-center px-4 py-2 bg-gray-800 rounded-lg text-white"
              >
                Return to Home
              </button>
            </div>
          ) : (
            <div>
              {favoriteApps.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-white text-lg font-medium mb-4">Favorite Apps</h3>
                  <div className="space-y-4">
                    {favoriteApps.map(app => (
                      <div key={app.id} className="bg-gray-900 rounded-xl p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                            <span className="text-purple-400 text-xl">
                              {app.name.charAt(0)}
                            </span>
                          </div>
                          <span className="text-white font-medium">{app.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setCurrentView(app.type === 'upi' ? 'phonepe-analysis' : 'more-banks')}
                            className="text-sm text-purple-400"
                          >
                            Analyze
                          </button>
                          <button onClick={() => removeAppFromFavorites(app.id)}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysisHistory.length > 0 && (
                <div>
                  <h3 className="text-white text-lg font-medium mb-4">Favorite Statements</h3>
                  <div>
                    {analysisHistory.map((item) => (
                      <div 
                        key={item.id}
                        className="bg-gray-900 rounded-xl p-4 mb-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-900 rounded-full flex items-center justify-center">
                              <span className="text-purple-400 text-xl">₹</span>
                            </div>
                            <div>
                              <h3 className="font-medium text-white">{item.filename}</h3>
                              <div className="flex items-center text-xs text-gray-400 mt-1">
                                <span>{item.app}</span>
                                <span className="mx-2">·</span>
                                <span>
                                  {new Date(item.date).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <p className="text-white font-medium">₹ {item.totalAmount.toLocaleString('en-IN')}</p>
                            <p className="text-xs text-gray-400">{item.transactions} transactions</p>
                            <button 
                              onClick={() => {
                                const updatedHistory = analysisHistory.filter(h => h.id !== item.id);
                                // This would need proper state management in a real app
                                console.log('Removed from favorites:', item.id);
                              }}
                              className="mt-2"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" 
                                className="h-6 w-6 text-yellow-400" 
                                viewBox="0 0 20 20" 
                                fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex justify-end">
                          <button className="text-sm text-purple-400 font-medium">
                            View Details →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-6 py-2">
          <div className="flex justify-between items-center max-w-md mx-auto">
            <button 
              onClick={() => setCurrentView('home')}
              className="flex flex-col items-center p-2"
            >
              <HomeIcon className="w-6 h-6 text-gray-400" />
              <span className="text-xs mt-1 text-gray-400">Home</span>
            </button>

            <button 
              onClick={() => setIsSearchOpen(true)}
              className="flex flex-col items-center p-2"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-xs mt-1 text-gray-400">Search</span>
            </button>

            <button 
              onClick={() => setCurrentView('favorites')}
              className="flex flex-col items-center p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-black" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs mt-1 text-black">Favorites</span>
            </button>

            <button 
              onClick={() => setCurrentView('settings')}
              className="flex flex-col items-center p-2">
              <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs mt-1 text-gray-400">Settings</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full max-w-4xl mx-auto">
      {mounted && (
        <>
          {(() => {
            switch (currentView) {
              case 'home':
                return <HomeView setCurrentView={setCurrentView} toggleSearchModal={toggleSearchModal} />;
              case 'phonepe-analysis':
                return <PhonePeAnalysisView setCurrentView={setCurrentView} toggleSearchModal={toggleSearchModal} />;
              case 'more-upi-apps':
                return <MoreUpiAppsView setCurrentView={setCurrentView} toggleSearchModal={toggleSearchModal} />;
              case 'more-banks':
                return <MoreBanksView setCurrentView={setCurrentView} toggleSearchModal={toggleSearchModal} />;
              case 'settings':
                return <SettingsView setCurrentView={setCurrentView} toggleSearchModal={toggleSearchModal} />;
              case 'profile':
                return <ProfileView onBack={() => setCurrentView('settings')} userId={userId} />;
              case 'history':
                return <HistoryView setCurrentView={setCurrentView} toggleSearchModal={toggleSearchModal} />;
              case 'favorites':
                return <FavoritesView setCurrentView={setCurrentView} toggleSearchModal={toggleSearchModal} />;
              default:
                return <HomeView setCurrentView={setCurrentView} toggleSearchModal={toggleSearchModal} />;
            }
          })()}
        </>
      )}
      {/* ... existing code ... */}
    </div>
  )
}
