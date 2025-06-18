'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import PdfUnlocker from '../components/PdfUnlocker'

export default function PdfUnlockerPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-[#1E1E1E] p-4 flex items-center gap-3">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-800 rounded-full"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold">PDF Unlocker</h1>
      </header>

      <div className="p-4">
        <PdfUnlocker />
      </div>
    </main>
  )
} 