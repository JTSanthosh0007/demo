'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SearchPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const apps = {
    upiApps: [
      {
        name: 'PhonePe',
        description: 'Analyze your PhonePe statements',
        color: '#5f259f',
        route: '/phonepe',
        logo: 'Pe',
        category: 'UPI'
      },
      {
        name: 'Google Pay',
        description: 'Analyze your Google Pay statements',
        color: '#2DA94F',
        route: '/google-pay',
        logo: 'GP',
        category: 'UPI'
      },
      {
        name: 'Paytm',
        description: 'Analyze your Paytm statements',
        color: '#00B9F1',
        route: '/paytm',
        logo: 'PT',
        category: 'UPI'
      }
    ],
    banks: [
      {
        name: 'Kotak Mahindra Bank',
        description: 'Analyze your Kotak Bank statements',
        color: '#EF3E23',
        route: '/kotak',
        logo: 'KB',
        category: 'Bank'
      },
      {
        name: 'HDFC Bank',
        description: 'Analyze your HDFC Bank statements',
        color: '#004C8F',
        route: '/hdfc',
        logo: 'HD',
        category: 'Bank'
      },
      {
        name: 'ICICI Bank',
        description: 'Analyze your ICICI Bank statements',
        color: '#F58220',
        route: '/icici',
        logo: 'IC',
        category: 'Bank'
      },
      {
        name: 'SBI Bank',
        description: 'Analyze your SBI Bank statements',
        color: '#2d5ca6',
        route: '/sbi',
        logo: 'SB',
        category: 'Bank'
      }
    ]
  }

  const allApps = [...apps.upiApps, ...apps.banks]

  const filteredApps = allApps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const groupedFilteredApps = {
    upiApps: filteredApps.filter(app => app.category === 'UPI'),
    banks: filteredApps.filter(app => app.category === 'Bank')
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Back Button */}
      <button 
        onClick={() => router.back()}
        className="mb-6 text-zinc-400 hover:text-white flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>

      {/* Search Input */}
      <div className="sticky top-0 bg-black pb-4">
        <div className="flex items-center gap-2 bg-zinc-900 rounded-xl p-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search UPI apps or banks..."
            className="bg-transparent border-none outline-none text-white w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      {/* Search Results */}
      <div className="space-y-6 mt-4">
        {filteredApps.length === 0 ? (
          <div className="text-center text-zinc-400 py-4">
            No apps found matching "{searchQuery}"
          </div>
        ) : (
          <>
            {/* UPI Apps Section */}
            {groupedFilteredApps.upiApps.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-zinc-400 px-1">UPI Apps</h3>
                {groupedFilteredApps.upiApps.map((app) => (
                  <div 
                    key={app.name}
                    onClick={() => router.push(app.route)}
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
                ))}
              </div>
            )}

            {/* Banks Section */}
            {groupedFilteredApps.banks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-zinc-400 px-1">Banks</h3>
                {groupedFilteredApps.banks.map((app) => (
                  <div 
                    key={app.name}
                    onClick={() => router.push(app.route)}
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
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
} 