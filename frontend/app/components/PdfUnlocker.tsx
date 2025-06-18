'use client'

import React, { useState } from 'react'

export default function PdfUnlocker() {
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' })
  const [isLoading, setIsLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setStatus({ type: '', message: '' })
    }
  }

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !password) {
      setStatus({ type: 'error', message: 'Please select a file and enter a password.' })
      return
    }

    setIsLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('password', password)

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${backendUrl}/unlock-pdf`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to unlock PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name.replace('.pdf', '_unlocked.pdf')
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setStatus({ type: 'success', message: 'PDF unlocked successfully! Downloading...' })
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to unlock PDF. Please check your password and try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-[#1E1E1E] rounded-xl p-4" role="region" aria-label="PDF Unlocker Tool">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">PDF Unlocker</h2>
          <p className="text-sm text-gray-400">Unlock password-protected PDFs</p>
        </div>
      </div>
      
      <form onSubmit={handleUnlock} className="space-y-4">
        <div>
          <label htmlFor="pdf-file" className="block text-sm font-medium text-gray-300 mb-2">Select PDF file</label>
          <div className="relative">
            <input
              id="pdf-file"
              name="pdf-file"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Select a PDF file"
            />
            <button
              type="button"
              onClick={() => document.getElementById('pdf-file')?.click()}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Choose File
            </button>
            <span className="ml-3 text-gray-400">
              {file ? file.name : 'No file chosen'}
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="pdf-password" className="block text-sm font-medium text-gray-300 mb-2">Password</label>
          <input
            id="pdf-password"
            name="pdf-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-[#2A2A2A] rounded-lg text-white border border-gray-700 focus:border-purple-500 focus:outline-none"
            placeholder="Enter PDF password"
            aria-label="PDF password"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !file || !password}
          aria-label={isLoading ? "Unlocking PDF..." : "Unlock PDF"}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors
            ${isLoading || !file || !password
              ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
        >
          {isLoading ? 'Unlocking...' : 'Unlock PDF'}
        </button>

        {status.message && (
          <div 
            className={`p-3 rounded-lg ${
              status.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
            }`}
            role="alert"
            aria-live="polite"
          >
            {status.message}
          </div>
        )}
      </form>
    </div>
  )
} 