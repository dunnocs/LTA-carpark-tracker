/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Carpark, VehicleLotType, getAvailabilityStatus } from './types/carpark';
import { CarparkService } from './services/carparkService';
import { Header } from './components/Header';
import { CarparkMap } from './components/CarparkMap';
import { CarparkCard } from './components/CarparkCard';
import { FilterBar, FilterState } from './components/FilterBar';
import { CarparkDetailModal } from './components/CarparkDetailModal';
import { FeeCalculatorModal } from './components/FeeCalculatorModal';
import { ApiGuideModal } from './components/ApiGuideModal';
import {
  Layers,
  Car,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  MapPin,
  Bookmark,
  Zap,
  RotateCcw,
} from 'lucide-react';

const INITIAL_FILTERS: FilterState = {
  searchQuery: '',
  region: 'All Regions',
  agency: 'All',
  vehicleType: 'ALL',
  onlyFavorites: false,
  onlyFreeSunday: false,
  onlyEv: false,
  minClearance2m: false,
  minAvailableLots: false,
  sortBy: 'lots-desc',
};

export default function App() {
  const [carparks, setCarparks] = useState<Carpark[]>(() => CarparkService.getCarparks());
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [activeTab, setActiveTab] = useState<'map-list' | 'list' | 'favorites'>('map-list');
  const [selectedCarpark, setSelectedCarpark] = useState<Carpark | null>(null);

  // Modals
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isApiGuideOpen, setIsApiGuideOpen] = useState(false);

  // Live simulation ticker
  const [isSimulating, setIsSimulating] = useState(true);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('Just now');

  // Handle simulation timer
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setCarparks((prev) => CarparkService.simulateLiveUpdates(prev));
      const now = new Date();
      setLastUpdatedTime(
        now.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 6000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Handle manual refresh
  const handleManualRefresh = () => {
    setCarparks((prev) => CarparkService.simulateLiveUpdates(prev));
    const now = new Date();
    setLastUpdatedTime(
      now.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
  };

  // Toggle favorite
  const handleToggleFavorite = (carparkId: string) => {
    CarparkService.toggleFavorite(carparkId);
    setCarparks((prev) =>
      prev.map((cp) =>
        cp.id === carparkId ? { ...cp, isFavorite: !cp.isFavorite } : cp
      )
    );
  };

  const handleFilterChange = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  // Filtered & Sorted carparks
  const filteredCarparks = useMemo(() => {
    return carparks
      .filter((cp) => {
        // Tab-specific filter for Favorites
        if (activeTab === 'favorites' && !cp.isFavorite) {
          return false;
        }

        // Search
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase().trim();
          const matchName = cp.name.toLowerCase().includes(q);
          const matchId = cp.id.toLowerCase().includes(q);
          const matchAddr = cp.address.toLowerCase().includes(q);
          const matchPostal = cp.postalCode.includes(q);
          const matchRegion = cp.region.toLowerCase().includes(q);
          if (!matchName && !matchId && !matchAddr && !matchPostal && !matchRegion) {
            return false;
          }
        }

        // Region
        if (filters.region !== 'All Regions' && cp.region !== filters.region) {
          return false;
        }

        // Agency
        if (filters.agency !== 'All' && cp.agency !== filters.agency) {
          return false;
        }

        // Only favorites checkbox
        if (filters.onlyFavorites && !cp.isFavorite) {
          return false;
        }

        // Free Sunday
        if (
          filters.onlyFreeSunday &&
          !cp.rates.freeParkingInfo.toLowerCase().includes('sun')
        ) {
          return false;
        }

        // EV
        if (filters.onlyEv && !cp.hasEvCharging) {
          return false;
        }

        // Clearance
        if (filters.minClearance2m && cp.gantryHeight < 2.0) {
          return false;
        }

        // Lots > 30
        if (filters.minAvailableLots) {
          const { available } = CarparkService.getLotsByType(cp, filters.vehicleType);
          if (available < 30) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const aLots = CarparkService.getLotsByType(a, filters.vehicleType).available;
        const bLots = CarparkService.getLotsByType(b, filters.vehicleType).available;

        switch (filters.sortBy) {
          case 'lots-desc':
            return bLots - aLots;
          case 'rate-asc':
            return a.rates.hourlyEstimate - b.rates.hourlyEstimate;
          case 'clearance-desc':
            return b.gantryHeight - a.gantryHeight;
          case 'name-asc':
            return a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });
  }, [carparks, filters, activeTab]);

  // KPI Calculations
  const kpiStats = useMemo(() => {
    let totalLots = 0;
    let availableLots = 0;
    let criticalCount = 0;
    let freeSundayCount = 0;

    carparks.forEach((cp) => {
      const { available, total } = CarparkService.getLotsByType(cp, filters.vehicleType);
      totalLots += total;
      availableLots += available;
      if (getAvailabilityStatus(available, total) === 'critical') {
        criticalCount++;
      }
      if (cp.rates.freeParkingInfo.toLowerCase().includes('sun')) {
        freeSundayCount++;
      }
    });

    return {
      totalCarparks: carparks.length,
      totalLots,
      availableLots,
      criticalCount,
      freeSundayCount,
      favoriteCount: carparks.filter((c) => c.isFavorite).length,
    };
  }, [carparks, filters.vehicleType]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'favorites') {
            setFilters((prev) => ({ ...prev, onlyFavorites: false }));
          }
        }}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        onOpenApiGuide={() => setIsApiGuideOpen(true)}
        onRefresh={handleManualRefresh}
        isSimulating={isSimulating}
        onToggleSimulation={() => setIsSimulating(!isSimulating)}
        lastUpdatedTime={lastUpdatedTime}
        favoriteCount={kpiStats.favoriteCount}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Strip */}
        <section aria-label="System Metrics" className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Monitored Sites</span>
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {kpiStats.totalCarparks}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">HDB, URA & Malls</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Available Lots</span>
              <Car className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              {kpiStats.availableLots.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              of {kpiStats.totalLots.toLocaleString()} total lots
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Filling Up / Critical</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-rose-400 tabular-nums">
              {kpiStats.criticalCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">&lt; 10% lots remaining</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Free Sunday/PH</span>
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-sky-400 tabular-nums">
              {kpiStats.freeSundayCount}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Complimentary Schemes</div>
          </div>
        </section>

        {/* Global Filter Bar */}
        <FilterBar
          filters={filters}
          onChangeFilter={handleFilterChange}
          onResetFilters={handleResetFilters}
          totalFilteredCount={filteredCarparks.length}
          totalCount={carparks.length}
        />

        {/* Dynamic Views */}
        {activeTab === 'map-list' && (
          <div className="space-y-6">
            {/* Interactive Map Viewport */}
            <div className="h-[480px] w-full">
              <CarparkMap
                carparks={filteredCarparks}
                selectedCarpark={selectedCarpark}
                onSelectCarpark={(cp) => setSelectedCarpark(cp)}
                activeVehicleType={filters.vehicleType}
              />
            </div>

            {/* Adjacent Quick Cards Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>Real-Time Carpark Directory</span>
                </h2>
                <span className="text-xs text-slate-400 font-mono">
                  {filteredCarparks.length} results matching criteria
                </span>
              </div>

              {filteredCarparks.length === 0 ? (
                <div className="p-12 text-center rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <Car className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-200">No carparks found</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Try adjusting your search query, region selection, or clearing the active filters.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCarparks.map((cp) => (
                    <CarparkCard
                      key={cp.id}
                      carpark={cp}
                      activeVehicleType={filters.vehicleType}
                      onSelect={(carpark) => setSelectedCarpark(carpark)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-100">
                All Singapore Carparks Directory
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                Showing {filteredCarparks.length} carparks
              </span>
            </div>

            {filteredCarparks.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <Car className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-200">No carparks match your filter</h3>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCarparks.map((cp) => (
                  <CarparkCard
                    key={cp.id}
                    carpark={cp}
                    activeVehicleType={filters.vehicleType}
                    onSelect={(carpark) => setSelectedCarpark(carpark)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span>Saved & Favorite Carparks</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {filteredCarparks.length} saved
              </span>
            </div>

            {filteredCarparks.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Bookmark className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-slate-200">No favorite carparks saved yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click the bookmark icon on any carpark card (e.g. your home HDB, office MBFC, or weekend mall) to track lot availability here quickly.
                </p>
                <button
                  onClick={() => setActiveTab('map-list')}
                  className="px-4 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
                >
                  Explore All Carparks
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCarparks.map((cp) => (
                  <CarparkCard
                    key={cp.id}
                    carpark={cp}
                    activeVehicleType={filters.vehicleType}
                    onSelect={(carpark) => setSelectedCarpark(carpark)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">ParkSG</span>
            <span>·</span>
            <span>Singapore Real-Time Carpark Availability Tracker</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsApiGuideOpen(true)}
              className="text-emerald-400 hover:underline cursor-pointer"
            >
              LTA & HDB API Docs
            </button>
            <span>·</span>
            <button
              onClick={() => setIsCalculatorOpen(true)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              Parking Fee Estimator
            </button>
          </div>
        </div>
      </footer>

      {/* Carpark Detail Drawer / Modal */}
      {selectedCarpark && (
        <CarparkDetailModal
          carpark={selectedCarpark}
          onClose={() => setSelectedCarpark(null)}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* Standalone Fee Calculator Modal */}
      {isCalculatorOpen && (
        <FeeCalculatorModal
          carparks={carparks}
          onClose={() => setIsCalculatorOpen(false)}
          onSelectCarpark={(cp) => {
            setSelectedCarpark(cp);
            setIsCalculatorOpen(false);
          }}
        />
      )}

      {/* Backend API Integration Guide Modal */}
      {isApiGuideOpen && (
        <ApiGuideModal onClose={() => setIsApiGuideOpen(false)} />
      )}
    </div>
  );
}
