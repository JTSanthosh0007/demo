import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="w-16 h-16 border-4 border-zinc-600 border-t-white rounded-full animate-spin mb-4"></div>
      <p className="text-white text-lg font-medium">Loading...</p>
    </div>
  );
};

export default LoadingSpinner; 