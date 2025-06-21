'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import PdfUnlocker from '../components/PdfUnlocker';

const PDFUnlockerClientPage = () => {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <div className="w-full max-w-md mx-auto">
        <div className="p-4 border-b border-zinc-800 flex items-center">
          <button 
            onClick={() => router.back()}
            className="text-zinc-400 hover:text-white mr-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold">Unlock PDF</h1>
        </div>
        <div className="p-4">
          <PdfUnlocker />
        </div>
      </div>
    </div>
  )
}

export default PDFUnlockerClientPage; 