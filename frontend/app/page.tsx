'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StatementAnalysis from './components/StatementAnalysis'

export default function Home() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null) // Removed <string | null>
  const [success, setSuccess] = useState(false)
  const [favorites, setFavorites] = useState(new Set())
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const toggleFavorite = (appName: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(appName)) {
        newFavorites.delete(appName)
      } else {
        newFavorites.add(appName)
      }
      return newFavorites
    })
  }

  const apps = [
    {
      name: 'PhonePe',
      description: 'Analyze your PhonePe statements',
      color: '#5f259f',
      route: '/phonepe',
      logo: 'Pe'
    },
    {
      name: 'Kotak Mahindra Bank',
      description: 'Analyze your Kotak Bank statements',
      color: '#EF3E23',
      route: '/kotak',
      logo: 'KB'
    },
    {
      name: 'PDF Unlocker',
      description: 'Unlock password-protected PDF statements',
      color: '#2563eb',
      route: '/pdf-unlocker',
      logo: 'PU'
    }
  ];

  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAppClick = (route: string) => {
    setIsSearchOpen(false);
    router.push(route);
  };

  return (
    <main className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <header className="bg-[#1E1E1E] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">JA</span>
          </div>
          <div>
            <p className="text-sm text-gray-400">Welcome back,</p>
            <h1 className="text-white font-medium">Hello, John</h1>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full bg-zinc-800/80 flex items-center justify-center" aria-label="Notifications">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
      </header>

      <div className="p-4">
        {/* Ad Space */}
        <div className="bg-[#1C1C1E] rounded-2xl p-4 mb-6 min-h-[160px] flex items-center justify-center">
          {/* Google Ads will be placed here */}
        </div>

        {/* Available Apps */}
        <div>
          <h2 className="text-base font-medium text-white mb-4">Available Apps</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-4">
              {apps.map((app) => (
                <div 
                  key={app.name}
                  onClick={() => router.push(app.route)}
                  className="group bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800/50 hover:bg-zinc-800/80 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden">
                      <div 
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: app.color }}
                      >
                        <span className="text-white text-sm font-bold">{app.logo}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{app.name}</h3>
                      <p className="text-sm text-zinc-400 mt-0.5">{app.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/banks')}
                  className="flex-1 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800/50 hover:bg-zinc-800/80 transition-all duration-300"
                >
                  <span className="text-white">View All Banks</span>
                </button>
                <button
                  onClick={() => router.push('/upi-apps')}
                  className="flex-1 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800/50 hover:bg-zinc-800/80 transition-all duration-300"
                >
                  <span className="text-white">View All UPI Apps</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
          <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-[#1E1E1E] rounded-2xl p-4">
            <div className="flex items-center gap-2 bg-zinc-900 rounded-xl p-3 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search apps..."
                className="bg-transparent border-none outline-none text-white w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            {/* Search Results */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {filteredApps.length === 0 ? (
                <div className="text-center text-zinc-400 py-4">
                  No apps found matching "{searchQuery}"
                </div>
              ) : (
                filteredApps.map((app) => (
                  <div 
                    key={app.name}
                    onClick={() => handleAppClick(app.route)}
                    className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800/50 hover:bg-zinc-800/80 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: app.color }}
                      >
                        <span className="text-white text-sm font-bold">{app.logo}</span>
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{app.name}</h3>
                        <p className="text-sm text-zinc-400 mt-0.5">{app.description}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery('');
              }}
              className="absolute top-2 right-2 text-zinc-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
          <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-[#1E1E1E] rounded-2xl p-4">
            <h2 className="text-xl font-semibold text-white mb-4">Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white">Dark Mode</span>
                <div className="w-12 h-6 bg-zinc-700 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white">Notifications</span>
                <div className="w-12 h-6 bg-zinc-700 rounded-full relative">
                  <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-2 right-2 text-zinc-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#1E1E1E] border-t border-zinc-800/50">
        <div className="flex justify-around p-4">
          <button className="text-white opacity-60 hover:opacity-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </button>
          <button 
            onClick={() => router.push('/search')}
            className="text-white opacity-60 hover:opacity-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button className="text-white opacity-60 hover:opacity-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
          <button 
            onClick={() => router.push('/settings')}
            className="text-white opacity-60 hover:opacity-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </nav>
    </main>
  );
}