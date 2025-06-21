'use client'

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BanknotesIcon, ArrowLeftIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { KotakAnalysisView } from './KotakAnalysis';
import { AnalysisResult, AnalysisState, View } from '../types/analysis';

export default function StatementAnalysis() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>('upload');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setSelectedFile(null);
    setAnalysisState('upload');
    setAnalysisResults(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleViewChange = (view: View) => {
    resetState();
    setCurrentView(view);
  };

  const analyzeStatement = useCallback(async (file: File, bank: 'kotak' | 'phonepe') => {
    if (!file) return;

    setAnalysisState('analyzing');
    setErrorMessage(null);

    console.log(`Starting analysis for ${bank} file:`, file.name);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bank', bank);

    const apiEndpoint = process.env.NEXT_PUBLIC_API_URL || 'https://demo-bl6p.onrender.com';
    const url = `${apiEndpoint}/analyze`; // Always use the unified /analyze endpoint
    console.log(`Making POST request to ${url}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      console.log('Received response from API:', response.status);
      const data = await response.json();

      if (!response.ok) {
        console.error('API Error Response:', data);
        const errorDetail = data.detail || `HTTP error! status: ${response.status}`;
        throw new Error(errorDetail);
      }

      console.log('API Response Data:', data);
      setAnalysisResults(data);
      setAnalysisState('results');
    } catch (error: any) {
      console.error('An error occurred during analysis:', error);
      const message = error.message || 'An unknown error occurred during analysis.';
      setErrorMessage(message);
      setAnalysisState('upload'); // Go back to upload screen on error
    }
  }, []);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (currentView === 'kotak' || currentView === 'phonepe')) {
      setSelectedFile(file);
      await analyzeStatement(file, currentView);
    }
  }, [currentView, analyzeStatement]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && (currentView === 'kotak' || currentView === 'phonepe')) {
      setSelectedFile(file);
      await analyzeStatement(file, currentView);
    }
  }, [currentView, analyzeStatement]);

  const renderHomeView = () => (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white text-center mb-8">Select a service</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <ServiceCard
          icon={BanknotesIcon}
          title="Kotak Bank"
          description="Analyze your PDF statement"
          onClick={() => handleViewChange('kotak')}
        />
        <ServiceCard
          icon={CreditCardIcon}
          title="PhonePe"
          description="Analyze your statement"
          onClick={() => handleViewChange('phonepe')}
          disabled={true} // Re-enable when PhonePe component is ready
        />
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return renderHomeView();
      case 'kotak':
        return (
          <KotakAnalysisView
            setCurrentView={handleViewChange}
            selectedFile={selectedFile}
            analysisState={analysisState}
            analysisResults={analysisResults}
            handleFileSelect={handleFileSelect}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            errorMessage={errorMessage}
            setErrorMessage={setErrorMessage}
          />
        );
      case 'phonepe':
        // Placeholder for the PhonePe component
        return (
          <div className="p-4">
            <button onClick={() => handleViewChange('home')} className="p-2 mb-4">
              <ArrowLeftIcon className="w-6 h-6 text-white" />
            </button>
            <h2 className="text-xl font-bold text-white text-center">PhonePe Analysis is coming soon.</h2>
          </div>
        );
      default:
        return renderHomeView();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

interface ServiceCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ icon: Icon, title, description, onClick, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="bg-zinc-900/80 p-6 rounded-2xl border border-zinc-800/50 hover:bg-zinc-800/90 hover:border-zinc-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
  >
    <Icon className="w-10 h-10 text-blue-500 mb-4 transition-transform duration-300 group-hover:scale-110" />
    <h3 className="text-xl font-semibold text-white mb-1">{title}</h3>
    <p className="text-zinc-400">{description}</p>
  </button>
);