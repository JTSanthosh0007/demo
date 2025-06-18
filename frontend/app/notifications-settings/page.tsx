'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NotificationsSettingsPage() {
  const router = useRouter()
  const [pushEnabled, setPushEnabled] = useState(false)

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
        <button 
          onClick={() => router.back()}
          className="text-zinc-400 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold">Notifications</h1>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* General Section */}
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4">General</h2>
          <div className="bg-zinc-900 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Push Notifications</h3>
                <p className="text-sm text-zinc-400">Receive push notifications on your device</p>
              </div>
              <button
                onClick={() => setPushEnabled(!pushEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                  pushEnabled ? 'bg-blue-500' : 'bg-zinc-700'
                }`}
                role="switch"
                aria-checked={pushEnabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                    pushEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 