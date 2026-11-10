import React from 'react';
import {
  CarparkAgency,
  CarparkRegion,
  VehicleLotType,
} from '../types/carpark';
import {
  Search,
  SlidersHorizontal,
  X,
  Bookmark,
  Zap,
  Sparkles,
  ArrowUpDown,
  Car,
  Bike,
} from 'lucide-react';

export interface FilterState {
  searchQuery: string;
  region: CarparkRegion;
  agency: CarparkAgency | 'All';
  vehicleType: VehicleLotType | 'ALL';
  onlyFavorites: boolean;
  onlyFreeSunday: boolean;
  onlyEv: boolean;
  minClearance2m: boolean;
  minAvailableLots: boolean;
  sortBy: 'lots-desc' | 'rate-asc' | 'name-asc' | 'clearance-desc';
}

interface FilterBarProps {
  filters: FilterState;
  onChangeFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onResetFilters: () => void;
  totalFilteredCount: number;
  totalCount: number;
}

const REGIONS: CarparkRegion[] = [
  'All Regions',
  'CBD & Marina Bay',
  'Orchard & Somerset',
  'Tampines & East',
  'Jurong & West',
  'Woodlands & North',
  'Harbourfront & Sentosa',
  'Bugis & Chinatown',
];

const AGENCIES: Array<CarparkAgency | 'All'> = [
  'All',
  'Commercial',
  'HDB',
  'URA',
  'Airport',
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChangeFilter,
  onResetFilters,
  totalFilteredCount,
  totalCount,
}) => {
  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.region !== 'All Regions' ||
    filters.agency !== 'All' ||
    filters.vehicleType !== 'ALL' ||
    filters.onlyFavorites ||
    filters.onlyFreeSunday ||
    filters.onlyEv ||
    filters.minClearance2m ||
    filters.minAvailableLots;

  return (
    <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
      {/* Search & Vehicle Switcher Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onChangeFilter('searchQuery', e.target.value)}
            placeholder="Search by name, ID (e.g. MBFC, ACB, ION), street, or postal code..."
            className="w-full pl-10 pr-9 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onChangeFilter('searchQuery', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Vehicle Lot Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-800 border border-slate-700 rounded-lg shrink-0">
          <button
            onClick={() => onChangeFilter('vehicleType', 'ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filters.vehicleType === 'ALL'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            All Lots
          </button>
          <button
            onClick={() => onChangeFilter('vehicleType', 'C')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
              filters.vehicleType === 'C'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Cars (C)</span>
          </button>
          <button
            onClick={() => onChangeFilter('vehicleType', 'Y')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
              filters.vehicleType === 'Y'
                ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Motorcycles (Y)</span>
          </button>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <select
              value={filters.sortBy}
              onChange={(e) =>
                onChangeFilter(
                  'sortBy',
                  e.target.value as FilterState['sortBy']
                )
              }
              className="appearance-none pl-3 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="lots-desc">Sort: Most Available Lots</option>
              <option value="rate-asc">Sort: Lowest Hourly Rate</option>
              <option value="clearance-desc">Sort: Highest Clearance</option>
              <option value="name-asc">Sort: Carpark Name (A-Z)</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Region & Operator Pill Rows */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 mr-1">Region:</span>
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => onChangeFilter('region', r)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                filters.region === r
                  ? 'bg-slate-200 text-slate-900 font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Agency Switcher */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 mr-1">Agency:</span>
          {AGENCIES.map((a) => (
            <button
              key={a}
              onClick={() => onChangeFilter('agency', a)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                filters.agency === a
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-medium'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Attribute Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2">
          {/* Favorites Filter */}
          <button
            onClick={() => onChangeFilter('onlyFavorites', !filters.onlyFavorites)}
            className={`px-3 py-1 text-xs rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
              filters.onlyFavorites
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-medium'
                : 'bg-slate-800 border-slate-700/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved Favorites</span>
          </button>

          {/* Free Sunday Parking */}
          <button
            onClick={() => onChangeFilter('onlyFreeSunday', !filters.onlyFreeSunday)}
            className={`px-3 py-1 text-xs rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
              filters.onlyFreeSunday
                ? 'bg-sky-500/10 border-sky-500/40 text-sky-300 font-medium'
                : 'bg-slate-800 border-slate-700/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Free Sunday / PH</span>
          </button>

          {/* EV Charging */}
          <button
            onClick={() => onChangeFilter('onlyEv', !filters.onlyEv)}
            className={`px-3 py-1 text-xs rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
              filters.onlyEv
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-medium'
                : 'bg-slate-800 border-slate-700/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>EV Charging</span>
          </button>

          {/* Clearance >= 2.0m */}
          <button
            onClick={() => onChangeFilter('minClearance2m', !filters.minClearance2m)}
            className={`px-3 py-1 text-xs rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
              filters.minClearance2m
                ? 'bg-purple-500/10 border-purple-500/40 text-purple-300 font-medium'
                : 'bg-slate-800 border-slate-700/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Height &ge; 2.0m</span>
          </button>

          {/* Available Lots > 30 */}
          <button
            onClick={() => onChangeFilter('minAvailableLots', !filters.minAvailableLots)}
            className={`px-3 py-1 text-xs rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
              filters.minAvailableLots
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-medium'
                : 'bg-slate-800 border-slate-700/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Lots &gt; 30 (Good Chance)</span>
          </button>
        </div>

        {/* Counter and Reset */}
        <div className="flex items-center gap-3 text-xs text-slate-400 ml-auto">
          <span>
            Showing <strong className="text-white font-mono">{totalFilteredCount}</strong> of{' '}
            <span className="font-mono">{totalCount}</span> carparks
          </span>
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Reset filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
