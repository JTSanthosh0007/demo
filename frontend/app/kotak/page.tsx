'use client';

import { useRouter } from 'next/navigation'
import { useState, useRef, useCallback } from 'react'
import { AnalysisState, AnalysisResult, View, KotakAnalysisView } from '../components/StatementAnalysis'

export default function KotakPage() {
  const router = useRouter()
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisState, setAnalysisState] = useState<AnalysisState>('upload');
  const [analysisResults, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeStatement = useCallback(async (file: File) => {
    try {
      setAnalysisState('analyzing');
      console.log('Starting analysis for Kotak file:', file?.name);

    const formData = new FormData();
    formData.append('file', file);

      const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, "");
      console.log('Making POST request to /api/analyze-kotak-statement.');
      const response = await fetch(`${backendUrl}/analyze-kotak-statement`, {
        method: 'POST',
        body: formData,
      });

      console.log('Received response from API:', response.status);
      const data = await response.json();
      console.log('API Response Data:', data);

      if (!response.ok) {
        let errorMessage = data.details || data.error || 'Analysis failed';
        if (errorMessage.includes('This does not appear to be a Kotak Bank statement')) {
          errorMessage = '';
        }
        setError(errorMessage);
        setAnalysisState('upload');
        setAnalysisResult(null);
        return;
      }

      const results: AnalysisResult = {
        ...data,
        pageCount: data.pageCount || 0
      };
      console.log('Setting analysis results:', results);
      setAnalysisResult(results);
      setAnalysisState('results');
      console.log('Analysis Results Transactions:', results.transactions);

    } catch (error: any) {
      console.error('Error analyzing Kotak statement:', error);
      setError('Failed to analyze statement. Please try again.');
      setAnalysisState('upload');
      setAnalysisResult(null);
    }
  }, []);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('Kotak File selected:', file?.name);
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
      await analyzeStatement(file);
    } else {
      setError('Please select a valid PDF file');
      setSelectedFile(null);
      setAnalysisState('upload');
      setAnalysisResult(null);
    }
    if (event.target) {
      event.target.value = '';
    }
  }, [analyzeStatement]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const file = event.dataTransfer.files?.[0];
    console.log('Kotak File dropped:', file?.name);
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
      await analyzeStatement(file);
    } else {
      setError('Please drop a valid PDF file');
      setSelectedFile(null);
      setAnalysisState('upload');
      setAnalysisResult(null);
    }
  }, [analyzeStatement]);

  return (
    <div className="min-h-screen bg-black">
      <KotakAnalysisView 
        setCurrentView={() => router.push('/')}
        selectedFile={selectedFile}
        analysisState={analysisState}
        analysisResults={analysisResults}
        handleFileSelect={handleFileSelect}
        handleDragOver={handleDragOver}
        handleDrop={handleDrop}
        fileInputRef={fileInputRef}
      />
      {error && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  )
} 