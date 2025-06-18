import React from 'react';
import { Star } from 'lucide-react';

interface FavoritesViewProps {
  favorites: Set<string>;
  toggleFavorite: (appName: string) => void;
}

const FavoritesView: React.FC<FavoritesViewProps> = ({ favorites, toggleFavorite }) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-white mb-6">Favorites</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from(favorites).map((appName) => (
          <div key={appName} className="group cursor-pointer relative">
            <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-3xl group-hover:bg-yellow-500/30 transition-all duration-300"></div>
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 p-4 rounded-3xl border border-gray-800/50 backdrop-blur-xl overflow-hidden">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(appName);
                }}
                className="absolute top-2 right-2 z-20 text-yellow-400 hover:text-yellow-500 transition-colors duration-300"
              >
                <Star className="w-5 h-5 fill-yellow-400" />
              </button>
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-yellow-500/20 transition-all duration-300"></div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-500/20 blur group-hover:blur-lg transition-all duration-300"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl overflow-hidden flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <span className="text-lg font-medium text-white">{appName[0]}</span>
                  </div>
                </div>
                <div className="relative z-10">
                  <h3 className="text-sm font-medium text-white mb-1 group-hover:text-yellow-400 transition-colors duration-300">{appName}</h3>
                  <p className="text-xs text-gray-400">Favorite App</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FavoritesView; 