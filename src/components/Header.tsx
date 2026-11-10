import React from 'react';
import { RefreshCw, Car, Code, Calculator, MapPin, Bookmark } from 'lucide-react';

interface HeaderProps {
  activeTab: 'map-list' | 'list' | 'favorites';
  onSelectTab: (tab: 'map-list' | 'list' | 'favorites') => void;
  onOpenCalculator: () => void;
  onOpenApiGuide: () => void;
  onRefresh: () => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  lastUpdatedTime: string;
  favoriteCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenCalculator,
  onOpenApiGuide,
  onRefresh,
  isSimulating,
  onToggleSimulation,
  lastUpdatedTime,
  favoriteCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark (single text element) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Car className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap">
            Park<span className="text-emerald-400">SG</span>
          </span>
        </div>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => onSelectTab('map-list')}
            className={`transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'map-list'
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Live Map & Lots
          </button>

          <button
            onClick={() => onSelectTab('list')}
            className={`transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'list'
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Directory
          </button>

          <button
            onClick={() => onSelectTab('favorites')}
            className={`transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'favorites'
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            Saved ({favoriteCount})
          </button>

          <button
            onClick={onOpenCalculator}
            className="transition-colors whitespace-nowrap cursor-pointer text-slate-300 hover:text-white flex items-center gap-1.5"
          >
            <Calculator className="w-4 h-4" />
            Fee Calculator
          </button>

          <button
            onClick={onOpenApiGuide}
            className="transition-colors whitespace-nowrap cursor-pointer text-slate-300 hover:text-white flex items-center gap-1.5"
          >
            <Code className="w-4 h-4" />
            Backend API Specs
          </button>
        </nav>

        {/* Zone 3: 1 primary action area */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Live simulation toggle button */}
          <button
            onClick={onToggleSimulation}
            title={isSimulating ? 'Pause real-time simulation' : 'Start real-time lot simulation'}
            className={`hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
              isSimulating
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSimulating ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
              }`}
            />
            <span>{isSimulating ? 'Live Ticker Active' : 'Ticker Paused'}</span>
          </button>

          {/* Primary Action Button */}
          <button
            onClick={onRefresh}
            className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Lots</span>
            <span className="text-[10px] text-emerald-950/70 font-mono hidden lg:inline">
              ({lastUpdatedTime})
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
