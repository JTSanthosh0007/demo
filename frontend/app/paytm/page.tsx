'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function PaytmPage() {
  const router = useRouter()
  
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
        <h1 className="text-lg font-medium text-white">Paytm</h1>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="bg-zinc-900/80 rounded-2xl p-6 border border-zinc-800/50">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-white rounded-xl overflow-hidden flex items-center justify-center">
              <div className="flex flex-col items-center">
                <span className="text-[#00B9F1] text-xl font-bold leading-none">pay</span>
                <span className="text-[#00B9F1] text-sm font-bold leading-none mt-1">tm</span>
              </div>
            </div>
          </div>
          <h2 className="text-white text-xl font-medium text-center mb-2">Coming Soon</h2>
          <p className="text-zinc-400 text-center text-sm">
            Paytm integration is currently under development. Check back soon for updates!
          </p>
        </div>
      </div>
    </div>
  )
} 