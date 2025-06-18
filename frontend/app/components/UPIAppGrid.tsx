import React, { memo, useCallback } from 'react';
import { UPIApp, getAppsByCategory } from '../constants/upiApps';

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

interface UPIAppGridProps {
  onSelectApp: (app: UPIApp) => void;
  selectedAppId?: string;
  showOnlyAvailable?: boolean;
}

const UPIAppGrid = memo(({ 
  onSelectApp, 
  selectedAppId,
  showOnlyAvailable = true 
}: UPIAppGridProps) => {
  const allApps = getAppsByCategory(undefined, showOnlyAvailable);
  
  const categorizedApps = allApps.reduce((acc, app) => {
    if (!acc[app.category]) {
      acc[app.category] = [];
    }
    acc[app.category].push(app);
    return acc;
  }, {} as Record<UPIApp['category'], UPIApp[]>);

  const categoryTitles = {
    popular: 'Available UPI Apps for Analysis',
    bank: 'Bank Apps',
    wallet: 'Wallet Apps',
    other: 'Other Apps'
  };

  return (
    <div className="space-y-8">
      {(Object.keys(categorizedApps) as Array<keyof typeof categorizedApps>).map(category => {
        const apps = categorizedApps[category];
        if (apps.length === 0) return null;

        return (
          <div key={category}>
            <h2 className="text-lg font-semibold text-white mb-4">
              {categoryTitles[category]}
            </h2>
            <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
              {apps.slice(0, 4).map(app => (
                <UPIAppCard
                  key={app.id}
                  app={app}
                  onSelect={onSelectApp}
                  isSelected={app.id === selectedAppId}
                />
              ))}
              {[...Array(Math.max(0, 4 - apps.length))].map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="w-full p-4 rounded-lg bg-gray-800 opacity-30"
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default UPIAppGrid; 