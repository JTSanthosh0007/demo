import React, { memo, useCallback } from 'react';
import { UPIApp, getAppsByCategory } from '../constants/upiApps';
import { Star } from 'lucide-react';

interface UPIAppCardProps {
  app: UPIApp;
  onSelect: (app: UPIApp) => void;
  isSelected?: boolean;
}

const UPIAppCard = memo(({ app, onSelect, isSelected }: UPIAppCardProps) => {
  const handleClick = useCallback(() => {
    if (app.available) {
      onSelect(app);
    }
  }, [app, onSelect]);

  const buttonClasses = `w-full p-4 rounded-lg ${
    !app.available 
      ? 'bg-gray-800 opacity-50 cursor-not-allowed' 
      : isSelected 
        ? 'bg-blue-600 text-white' 
        : 'bg-gray-800 hover:bg-gray-700 text-white'
  }`;

  return (
    <button
      onClick={handleClick}
      className={buttonClasses}
    >
      <div className="flex items-center space-x-3">
        {app.icon ? (
          <img 
            src={app.icon} 
            alt={`${app.name} icon`} 
            className="w-8 h-8 rounded-full"
            loading="lazy"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {app.name.charAt(0)}
            </span>
          </div>
        )}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{app.name}</h3>
            {!app.available && (
              <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded">
                Coming Soon
              </span>
            )}
          </div>
          <p className="text-sm text-gray-300">{app.description}</p>
        </div>
      </div>
    </button>
  );
});

export interface UPIAppGridProps {
  apps?: UPIApp[];
  favorites: Set<string>;
  toggleFavorite: (appName: string) => void;
}

const UPIAppGrid = memo(({ apps, favorites, toggleFavorite }: UPIAppGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-4">
      {apps?.map((app) => (
        <div 
          key={app.name}
          className="group bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800/50 hover:bg-zinc-800/80 transition-all duration-300"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center overflow-hidden">
                <div className="w-8 h-8 bg-[#5f259f] rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">Pe</span>
                </div>
            </div>
            <div className="flex-1">
              <h3 className="text-white font-medium">{app.name}</h3>
              <p className="text-sm text-zinc-400 mt-0.5">{app.description}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(app.name);
              }}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <Star className={`w-5 h-5 ${favorites.has(app.name) ? 'fill-white text-white' : ''}`} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
});

export default UPIAppGrid; 