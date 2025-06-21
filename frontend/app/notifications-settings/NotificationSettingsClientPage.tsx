'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

const NotificationSettingsClientPage = () => {
  const router = useRouter()

  // Example settings data - in a real app this would be fetched and updated
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: false,
    promotions: true
  })

  const handleToggle = (setting: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [setting]: !prev[setting] }))
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center">
        <button 
          onClick={() => router.back()}
          className="text-zinc-400 hover:text-white mr-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold">Notification Settings</h1>
      </div>

      {/* Settings List */}
      <div className="p-4">
        <ul className="divide-y divide-zinc-800">
          <li className="flex justify-between items-center py-4">
            <span>Push Notifications</span>
            <button
              onClick={() => handleToggle('pushNotifications')}
              className={`w-14 h-8 rounded-full flex items-center transition-colors ${
                settings.pushNotifications ? 'bg-blue-600' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                  settings.pushNotifications ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </li>
          <li className="flex justify-between items-center py-4">
            <span>Email Notifications</span>
            <button
              onClick={() => handleToggle('emailNotifications')}
              className={`w-14 h-8 rounded-full flex items-center transition-colors ${
                settings.emailNotifications ? 'bg-blue-600' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                  settings.emailNotifications ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </li>
          <li className="flex justify-between items-center py-4">
            <span>Promotions</span>
            <button
              onClick={() => handleToggle('promotions')}
              className={`w-14 h-8 rounded-full flex items-center transition-colors ${
                settings.promotions ? 'bg-blue-600' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                  settings.promotions ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default NotificationSettingsClientPage; 