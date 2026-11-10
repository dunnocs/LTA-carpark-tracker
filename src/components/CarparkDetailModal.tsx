import React, { useState } from 'react';
import {
  Carpark,
  getAvailabilityStatus,
  getStatusColor,
} from '../types/carpark';
import { CarparkService } from '../services/carparkService';
import {
  X,
  Bookmark,
  Navigation,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Clock,
  DollarSign,
  Car,
  Bike,
  Truck,
  Copy,
  Check,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface CarparkDetailModalProps {
  carpark: Carpark;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
}

const VEHICLE_PRESETS = [
  { label: 'Standard Sedan', height: 1.48 },
  { label: 'Crossover / SUV', height: 1.68 },
  { label: 'Large MPV / Alphard', height: 1.90 },
  { label: 'Commercial Van / HiAce', height: 2.10 },
];

export const CarparkDetailModal: React.FC<CarparkDetailModalProps> = ({
  carpark,
  onClose,
  onToggleFavorite,
}) => {
  const [selectedVehicleHeight, setSelectedVehicleHeight] = useState<number>(1.48);
  const [copiedCoord, setCopiedCoord] = useState(false);

  // Fee calculator state
  const [calcDay, setCalcDay] = useState<'weekday' | 'saturday' | 'sunday'>('weekday');
  const [calcHour, setCalcHour] = useState<number>(14); // 2 PM
  const [calcDuration, setCalcDuration] = useState<number>(120); // 2 hours

  const calculatedFee = CarparkService.calculateParkingFee(
    carpark,
    calcDay,
    calcHour,
    0,
    calcDuration
  );

  const carLot = carpark.lots.find((l) => l.lotType === 'C');
  const bikeLot = carpark.lots.find((l) => l.lotType === 'Y');
  const heavyLot = carpark.lots.find((l) => l.lotType === 'H');

  const { available: allAvail, total: allTotal } = CarparkService.getLotsByType(
    carpark,
    'ALL'
  );
  const status = getAvailabilityStatus(allAvail, allTotal);
  const statusInfo = getStatusColor(status);

  const heightDifference = carpark.gantryHeight - selectedVehicleHeight;
  const isVehicleSafe = heightDifference >= 0;

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(
      `${carpark.coordinates.lat}, ${carpark.coordinates.lng} (${carpark.name}, Singapore ${carpark.postalCode})`
    );
    setCopiedCoord(true);
    setTimeout(() => setCopiedCoord(false), 2000);
  };

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${carpark.coordinates.lat},${carpark.coordinates.lng}&destination_place_id=${encodeURIComponent(carpark.name)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openWaze = () => {
    const url = `https://waze.com/ul?ll=${carpark.coordinates.lat},${carpark.coordinates.lng}&navigate=yes`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Top Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-850">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800 px-2 py-0.5 rounded">
                [{carpark.id}]
              </span>
              <span className="text-xs text-slate-400">{carpark.agency}</span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400">{carpark.carparkType}</span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400">{carpark.region}</span>
            </div>
            <h2 className="text-xl font-bold text-white">{carpark.name}</h2>
            <p className="text-sm text-slate-400 mt-0.5">{carpark.address}, Singapore {carpark.postalCode}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onToggleFavorite(carpark.id)}
              className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                carpark.isFavorite
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title={carpark.isFavorite ? 'Remove from saved' : 'Save carpark'}
            >
              <Bookmark className="w-5 h-5" fill={carpark.isFavorite ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Real-time Occupancy Breakdown */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-200">Real-Time Lot Availability</span>
                <span className="text-xs text-slate-400 font-mono">({carpark.lastUpdated})</span>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
              >
                {statusInfo.label}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Car Lots */}
              {carLot && (
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                    <Car className="w-4 h-4 text-emerald-400" />
                    <span>Cars (Lot C)</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-2xl font-bold text-white tabular-nums">
                      {carLot.lotsAvailable}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">/ {carLot.totalLots}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {Math.round((carLot.lotsAvailable / carLot.totalLots) * 100)}% available
                  </div>
                </div>
              )}

              {/* Motorcycle Lots */}
              {bikeLot && (
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                    <Bike className="w-4 h-4 text-sky-400" />
                    <span>Motorcycles (Lot Y)</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-2xl font-bold text-white tabular-nums">
                      {bikeLot.lotsAvailable}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">/ {bikeLot.totalLots}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {Math.round((bikeLot.lotsAvailable / bikeLot.totalLots) * 100)}% available
                  </div>
                </div>
              )}

              {/* Heavy Lots or EV Charging */}
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                  {carpark.hasEvCharging ? (
                    <>
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <span>EV Charging</span>
                    </>
                  ) : heavyLot ? (
                    <>
                      <Truck className="w-4 h-4 text-amber-400" />
                      <span>Heavy Vehicles</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>Grace Period</span>
                    </>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  {carpark.hasEvCharging ? (
                    <>
                      <span className="font-mono text-2xl font-bold text-emerald-400 tabular-nums">
                        {carpark.evLotsCount ?? 6}
                      </span>
                      <span className="text-xs text-slate-400">chargers</span>
                    </>
                  ) : heavyLot ? (
                    <>
                      <span className="font-mono text-2xl font-bold text-white tabular-nums">
                        {heavyLot.lotsAvailable}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">/ {heavyLot.totalLots}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-mono text-2xl font-bold text-white tabular-nums">
                        {carpark.rates.gracePeriodMins}
                      </span>
                      <span className="text-xs text-slate-400">mins free</span>
                    </>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {carpark.hasEvCharging ? 'Type 2 AC & CCS 2 DC' : 'EPS Gate System'}
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Height Clearance Checker */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-200">Gantry Clearance Check</span>
              <span className="text-sm font-mono font-bold text-white">
                Gantry Limit: {carpark.gantryHeight}m
              </span>
            </div>

            <div className="text-xs text-slate-400 mb-3">
              Select your vehicle profile to verify overhead entry clearance:
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {VEHICLE_PRESETS.map((v) => (
                <button
                  key={v.label}
                  onClick={() => setSelectedVehicleHeight(v.height)}
                  className={`p-2 rounded-lg text-xs font-medium border text-left transition-colors cursor-pointer ${
                    selectedVehicleHeight === v.height
                      ? 'bg-slate-700 border-emerald-500 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold">{v.label}</div>
                  <div className="text-[11px] text-slate-500 font-mono">~{v.height}m</div>
                </button>
              ))}
            </div>

            <div
              className={`p-3 rounded-lg flex items-center gap-2.5 text-xs font-medium ${
                isVehicleSafe
                  ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/40 border border-rose-800/60 text-rose-300'
              }`}
            >
              {isVehicleSafe ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Clearance verified. Your vehicle has{' '}
                    <strong className="font-mono">+{heightDifference.toFixed(2)}m</strong> safety buffer.
                  </span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    Warning: Vehicle exceeds gantry limit by{' '}
                    <strong className="font-mono">{Math.abs(heightDifference).toFixed(2)}m</strong>. Do not enter.
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Rates Table */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Singapore Parking Rates & Policies</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-700/60">
                <span className="text-slate-400">Weekday Peak (Daytime):</span>
                <span className="text-slate-200 font-medium text-right">{carpark.rates.weekdayPeakRate}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-700/60">
                <span className="text-slate-400">Weekday Off-Peak (Evening):</span>
                <span className="text-slate-200 font-medium text-right">{carpark.rates.weekdayOffPeakRate}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-700/60">
                <span className="text-slate-400">Saturday & Weekend:</span>
                <span className="text-slate-200 font-medium text-right">{carpark.rates.weekendRate}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-700/60">
                <span className="text-slate-400">Free Parking Scheme:</span>
                <span className="text-emerald-400 font-medium text-right">{carpark.rates.freeParkingInfo}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Grace Period (Pick-up / Drop-off):</span>
                <span className="text-slate-200 font-medium font-mono">{carpark.rates.gracePeriodMins} minutes</span>
              </div>
            </div>
          </div>

          {/* Embedded Parking Fee Estimator */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-900/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-300">Quick Fee Estimator</span>
              </div>
              <span className="text-xs text-slate-400">Live SGD Calculation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              {/* Day */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Day of Week</label>
                <select
                  value={calcDay}
                  onChange={(e) => setCalcDay(e.target.value as any)}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="weekday">Monday - Friday (Weekday)</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday">Sunday / Public Holiday</option>
                </select>
              </div>

              {/* Time */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Entry Time</label>
                <select
                  value={calcHour}
                  onChange={(e) => setCalcHour(Number(e.target.value))}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value={9}>09:00 AM (Morning Peak)</option>
                  <option value={12}>12:30 PM (Lunch)</option>
                  <option value={14}>02:00 PM (Afternoon)</option>
                  <option value={19}>07:00 PM (Dinner / Night)</option>
                  <option value={23}>11:00 PM (Late Night)</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Duration</label>
                <select
                  value={calcDuration}
                  onChange={(e) => setCalcDuration(Number(e.target.value))}
                  className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value={10}>10 minutes (Grace period check)</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={240}>4 hours</option>
                  <option value={480}>8 hours (Full work day)</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-lg flex items-center justify-between border border-slate-700">
              <div>
                <div className="text-xs text-slate-400">{calculatedFee.breakdown}</div>
                {calculatedFee.isFreeParking && (
                  <div className="text-[11px] text-emerald-400 font-medium">Free Parking Eligible</div>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 mr-1.5">Estimated:</span>
                <span className="font-mono text-xl font-bold text-emerald-400 tabular-nums">
                  ${calculatedFee.totalFee.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleCopyCoords}
            className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copiedCoord ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied GPS & Postal</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy GPS Coordinates</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={openWaze}
              className="px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 text-sky-400" />
              <span>Waze</span>
            </button>

            <button
              onClick={openGoogleMaps}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Navigate in Google Maps</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
