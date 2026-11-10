import React from 'react';
import {
  Carpark,
  VehicleLotType,
  getAvailabilityStatus,
  getStatusColor,
} from '../types/carpark';
import { CarparkService } from '../services/carparkService';
import {
  Bookmark,
  Navigation,
  Zap,
  TrendingDown,
  TrendingUp,
  Minus,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Sparkles,
} from 'lucide-react';

interface CarparkCardProps {
  carpark: Carpark;
  activeVehicleType: VehicleLotType | 'ALL';
  onSelect: (carpark: Carpark) => void;
  onToggleFavorite: (id: string) => void;
}

export const CarparkCard: React.FC<CarparkCardProps> = ({
  carpark,
  activeVehicleType,
  onSelect,
  onToggleFavorite,
}) => {
  const { available, total } = CarparkService.getLotsByType(carpark, activeVehicleType);
  const status = getAvailabilityStatus(available, total);
  const statusInfo = getStatusColor(status);
  const occupancyPercentage = Math.round((available / Math.max(1, total)) * 100);

  const carLot = carpark.lots.find((l) => l.lotType === 'C');
  const bikeLot = carpark.lots.find((l) => l.lotType === 'Y');
  const heavyLot = carpark.lots.find((l) => l.lotType === 'H');

  const openGoogleMaps = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://www.google.com/maps/dir/?api=1&destination=${carpark.coordinates.lat},${carpark.coordinates.lng}&destination_place_id=${encodeURIComponent(carpark.name)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={() => onSelect(carpark)}
      className="group relative bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 hover:border-slate-600 rounded-xl p-4 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between"
    >
      <div>
        {/* Top Header: ID & Name & Favorite */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-1.5 py-0.5 rounded">
                {carpark.id}
              </span>
              <span className="text-xs text-slate-400">{carpark.agency}</span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400 truncate">{carpark.region}</span>
            </div>
            <h3 className="font-semibold text-base text-slate-100 group-hover:text-emerald-300 transition-colors line-clamp-1">
              {carpark.name}
            </h3>
            <p className="text-xs text-slate-400 truncate mt-0.5">{carpark.address}</p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(carpark.id);
            }}
            title={carpark.isFavorite ? 'Remove from saved' : 'Save carpark'}
            className={`p-2 rounded-lg border transition-colors shrink-0 cursor-pointer ${
              carpark.isFavorite
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                : 'bg-slate-900/60 border-slate-700 text-slate-500 hover:text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Bookmark
              className="w-4 h-4"
              fill={carpark.isFavorite ? 'currentColor' : 'none'}
            />
          </button>
        </div>

        {/* Real-time Occupancy Bar & Status */}
        <div className="my-3 p-3 rounded-lg bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-300">
                {activeVehicleType === 'C'
                  ? 'Car Lots'
                  : activeVehicleType === 'Y'
                  ? 'Motorcycle Lots'
                  : 'All Available Lots'}
                :
              </span>
              <span className={`font-mono text-base font-bold tabular-nums ${statusInfo.text}`}>
                {available}
              </span>
              <span className="text-xs text-slate-500 font-mono">/ {total}</span>
            </div>

            <div className="flex items-center gap-1.5">
              {carpark.occupancyTrend === 'rising' && (
                <span className="text-[11px] text-emerald-400 flex items-center font-mono">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> +filling
                </span>
              )}
              {carpark.occupancyTrend === 'falling' && (
                <span className="text-[11px] text-rose-400 flex items-center font-mono">
                  <TrendingDown className="w-3 h-3 mr-0.5" /> -leaving
                </span>
              )}
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
              >
                {statusInfo.label}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(2, occupancyPercentage))}%`,
                backgroundColor: statusInfo.dot,
              }}
            />
          </div>

          {/* Detailed Lot Type Breakdown */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
            <span className="flex items-center gap-1">
              Cars (C):{' '}
              <strong className="text-slate-200 font-mono tabular-nums">
                {carLot?.lotsAvailable ?? 0}
              </strong>
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1">
              Bikes (Y):{' '}
              <strong className="text-slate-200 font-mono tabular-nums">
                {bikeLot?.lotsAvailable ?? 0}
              </strong>
            </span>
            {heavyLot && (
              <>
                <span className="text-slate-700">|</span>
                <span className="flex items-center gap-1">
                  Heavy (H):{' '}
                  <strong className="text-slate-200 font-mono tabular-nums">
                    {heavyLot.lotsAvailable}
                  </strong>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Features & Specs */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mb-3">
          <span className="flex items-center gap-1">
            <span className="text-slate-500">Clearance:</span>
            <span className="text-slate-200 font-medium font-mono">{carpark.gantryHeight}m</span>
          </span>
          <span className="text-slate-700">·</span>
          <span className="flex items-center gap-1">
            <span className="text-slate-500">Est:</span>
            <span className="text-slate-200 font-medium font-mono">
              ~${carpark.rates.hourlyEstimate.toFixed(2)}/hr
            </span>
          </span>
          {carpark.hasEvCharging && (
            <>
              <span className="text-slate-700">·</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Zap className="w-3 h-3" />
                <span>EV Charging ({carpark.evLotsCount ?? 4})</span>
              </span>
            </>
          )}
          {carpark.rates.freeParkingInfo !== 'None' && (
            <>
              <span className="text-slate-700">·</span>
              <span className="text-sky-400 truncate max-w-[180px]">
                {carpark.rates.freeParkingInfo}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{carpark.lastUpdated}</span>
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={openGoogleMaps}
            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
            title="Get directions in Google Maps"
          >
            <Navigation className="w-3 h-3 text-emerald-400" />
            <span>Navigate</span>
          </button>

          <button
            onClick={() => onSelect(carpark)}
            className="px-3 py-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Details</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
