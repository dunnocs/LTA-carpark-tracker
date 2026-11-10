import React, { useState } from 'react';
import { Carpark } from '../types/carpark';
import { CarparkService } from '../services/carparkService';
import {
  X,
  Calculator,
  Clock,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
} from 'lucide-react';

interface FeeCalculatorModalProps {
  carparks: Carpark[];
  onClose: () => void;
  onSelectCarpark: (carpark: Carpark) => void;
}

export const FeeCalculatorModal: React.FC<FeeCalculatorModalProps> = ({
  carparks,
  onClose,
  onSelectCarpark,
}) => {
  const [selectedId, setSelectedId] = useState<string>(carparks[0]?.id ?? 'MBFC');
  const [dayType, setDayType] = useState<'weekday' | 'saturday' | 'sunday'>('weekday');
  const [arrivalHour, setArrivalHour] = useState<number>(10);
  const [arrivalMinute, setArrivalMinute] = useState<number>(0);
  const [durationMinutes, setDurationMinutes] = useState<number>(120);

  const selectedCarpark = carparks.find((c) => c.id === selectedId) ?? carparks[0];

  const result = selectedCarpark
    ? CarparkService.calculateParkingFee(
        selectedCarpark,
        dayType,
        arrivalHour,
        arrivalMinute,
        durationMinutes
      )
    : { totalFee: 0, breakdown: '', isGracePeriod: false, isFreeParking: false };

  // Comparison carpark (e.g. standard HDB rate for reference)
  const hdbRefCarpark = carparks.find((c) => c.agency === 'HDB') ?? carparks[0];
  const hdbResult = hdbRefCarpark
    ? CarparkService.calculateParkingFee(
        hdbRefCarpark,
        dayType,
        arrivalHour,
        arrivalMinute,
        durationMinutes
      )
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Singapore Parking Fee Estimator</h2>
              <p className="text-xs text-slate-400">Calculate exact parking costs across malls, HDB & URA lots</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Carpark Picker */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Select Carpark:
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {carparks.map((cp) => (
                <option key={cp.id} value={cp.id}>
                  [{cp.id}] {cp.name} ({cp.region} - {cp.agency})
                </option>
              ))}
            </select>
          </div>

          {/* Timing Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">Day of Week</label>
              <select
                value={dayType}
                onChange={(e) => setDayType(e.target.value as any)}
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="weekday">Weekday (Mon - Fri)</option>
                <option value="saturday">Saturday</option>
                <option value="sunday">Sunday / Public Holiday</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">Arrival Hour</label>
              <select
                value={arrivalHour}
                onChange={(e) => setArrivalHour(Number(e.target.value))}
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value={8}>08:00 AM (Morning Peak)</option>
                <option value={10}>10:00 AM (Mid-morning)</option>
                <option value={12}>12:00 PM (Lunch)</option>
                <option value={14}>02:00 PM (Afternoon)</option>
                <option value={18}>06:00 PM (Evening / Dinner)</option>
                <option value={20}>08:00 PM (Night)</option>
                <option value={23}>11:00 PM (Overnight)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">Stay Duration</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value={10}>10 mins (Grace Period check)</option>
                <option value={30}>30 mins</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
                <option value={240}>4 hours</option>
                <option value={480}>8 hours (Full Day)</option>
              </select>
            </div>
          </div>

          {/* Result Card */}
          <div className="p-5 rounded-xl bg-slate-850 border border-emerald-500/30 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Total Estimated Fee:</span>
              <div className="text-right">
                <span className="font-mono text-3xl font-bold text-emerald-400 tabular-nums">
                  ${result.totalFee.toFixed(2)}
                </span>
                <span className="text-xs text-slate-500 ml-1">SGD</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs text-slate-300 mb-3">
              <span className="text-slate-400">Rate Rule applied: </span>
              <span className="font-medium text-white">{result.breakdown}</span>
            </div>

            <div className="text-[11px] text-slate-400 space-y-1">
              <div>
                • Grace Period: <span className="text-slate-200">{selectedCarpark.rates.gracePeriodMins} mins</span> (Free if exiting within this window)
              </div>
              <div>
                • Free Parking Policy: <span className="text-emerald-400">{selectedCarpark.rates.freeParkingInfo}</span>
              </div>
            </div>
          </div>

          {/* Benchmark comparison with HDB if checking a commercial mall */}
          {selectedCarpark.agency !== 'HDB' && hdbResult && (
            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400">
                  Standard HDB coupon/EPS equivalent:
                </span>
              </div>
              <span className="font-mono font-bold text-slate-200">
                ${hdbResult.totalFee.toFixed(2)} SGD
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => {
              onSelectCarpark(selectedCarpark);
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>View Carpark Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
