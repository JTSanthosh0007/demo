'use client'

import React, { useRef } from 'react'
import { ArrowLeftIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from './LoadingSpinner'
import { ResultsView } from './ResultsView' // Assuming ResultsView is exported from its own file
import { AnalysisResult, AnalysisState, View } from '../types/analysis'

interface KotakAnalysisViewProps {
  setCurrentView: (view: View) => void;
  selectedFile: File | null;
  analysisState: AnalysisState;
  analysisResults: AnalysisResult | null;
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleDragOver: (event: React.DragEvent) => void;
  handleDrop: (event: React.DragEvent) => Promise<void>;
  errorMessage: string | null;
  setErrorMessage: (message: string | null) => void;
}

export const KotakAnalysisView: React.FC<KotakAnalysisViewProps> = ({
  setCurrentView,
  analysisState,
  analysisResults,
  handleFileSelect,
  handleDragOver,
  handleDrop,
  errorMessage,
  setErrorMessage
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const renderContent = () => {
    switch (analysisState) {
      case 'upload':
        return (
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="p-4"
          >
            <label 
              htmlFor="file-upload-kotak"
              className="border-2 border-dashed border-zinc-600 rounded-2xl p-8 text-center cursor-pointer hover:bg-zinc-800 transition-colors block"
            >
              <ArrowUpTrayIcon className="w-12 h-12 mx-auto text-zinc-400" />
              <p className="mt-2 text-white">Drag & drop your Kotak statement or click to select</p>
              <input
                type="file"
                id="file-upload-kotak"
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden"
                accept=".pdf"
              />
            </label>
            {errorMessage && (
              <div className="mt-4 p-3 bg-red-500/20 rounded-xl text-center">
                <p className="text-red-400 text-sm">{errorMessage}</p>
                <button onClick={() => setErrorMessage(null)} className="text-xs text-zinc-400 mt-1 underline">Dismiss</button>
              </div>
            )}
          </div>
        );
      case 'analyzing':
        return (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <LoadingSpinner />
            <p className="mt-4 text-white">Analyzing your statement...</p>
          </div>
        );
      case 'results':
        if (!analysisResults) {
          return <div className="p-4 text-center text-red-400">Error: Analysis results are not available.</div>
        }
        return <ResultsView analysisResults={analysisResults} setCurrentView={setCurrentView} />
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="p-4 bg-zinc-900 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => setCurrentView('home')} className="p-2">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Kotak Bank Statement Analysis</h1>
      </header>
      <main className="flex-grow">
        {renderContent()}
      </main>
    </div>
  );
}; 