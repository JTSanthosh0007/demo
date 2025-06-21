'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

const PaytmClientPage = () => {
    const router = useRouter()
    const [file, setFile] = useState(null);
    
    return (
        <div className="min-h-screen bg-black text-white">
            <header className="p-4 flex items-center border-b border-zinc-800">
                <button onClick={() => router.back()} className="p-2 mr-2">
                    <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <h1 className="text-xl font-semibold">Paytm Bank</h1>
            </header>

            <main className="p-4">
                <div className="bg-zinc-900 rounded-lg p-6">
                    <h2 className="text-lg font-bold mb-4">Upload Paytm Bank Statement</h2>
                    <p className="text-zinc-400 mb-6">
                        To get your statement, open the Paytm app, go to 'Paytm Bank', then 'Download Statement', select a date range, and download the PDF.
                    </p>

                    <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center">
                        <input
                            type="file"
                            id="statement-upload"
                            className="hidden"
                            onChange={(e: any) => setFile(e.target.files[0])}
                            accept=".pdf"
                        />
                        <label htmlFor="statement-upload" className="cursor-pointer">
                            <svg className="mx-auto h-12 w-12 text-zinc-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="mt-2 block text-sm font-semibold text-white">
                                {file ? (file as any).name : 'Click to upload statement'}
                            </span>
                            <span className="mt-1 block text-xs text-zinc-400">PDF up to 10MB</span>
                        </label>
                    </div>

                    <button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg mt-6 disabled:bg-zinc-600"
                        disabled={!file}
                    >
                        Analyze Statement
                    </button>
                </div>
            </main>
        </div>
    );
};

export default PaytmClientPage; 