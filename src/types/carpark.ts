export type VehicleLotType = 'C' | 'H' | 'Y'; // C = Car, H = Heavy Vehicle, Y = Motorcycle

export interface CarparkLotInfo {
  lotType: VehicleLotType;
  totalLots: number;
  lotsAvailable: number;
}

export type CarparkAgency = 'HDB' | 'URA' | 'LTA' | 'Commercial' | 'Airport' | 'Hospital';

export type CarparkRegion =
  | 'All Regions'
  | 'CBD & Marina Bay'
  | 'Orchard & Somerset'
  | 'Tampines & East'
  | 'Jurong & West'
  | 'Woodlands & North'
  | 'Harbourfront & Sentosa'
  | 'Bugis & Chinatown';

export interface CarparkRate {
  weekdayPeakRate: string;
  weekdayOffPeakRate: string;
  weekendRate: string;
  gracePeriodMins: number;
  freeParkingInfo: string;
  hourlyEstimate: number; // approximate $/hr for quick sorting
}

export interface Carpark {
  id: string; // e.g. "MBFC", "ACB", "ION"
  name: string;
  address: string;
  postalCode: string;
  region: CarparkRegion;
  agency: CarparkAgency;
  parkingSystem: 'ELECTRONIC PARKING SYSTEM' | 'COUPON PARKING';
  carparkType: 'BASEMENT' | 'MULTI-STOREY' | 'SURFACE' | 'MECHANISED';
  gantryHeight: number; // in meters, e.g. 2.15
  hasEvCharging: boolean;
  evLotsCount?: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  lots: CarparkLotInfo[];
  rates: CarparkRate;
  lastUpdated: string; // ISO string or time e.g. "2 mins ago"
  occupancyTrend?: 'rising' | 'falling' | 'stable';
  isFavorite?: boolean;
}

export type AvailabilityStatus = 'plenty' | 'moderate' | 'critical' | 'full';

export function getAvailabilityStatus(available: number, total: number): AvailabilityStatus {
  if (total <= 0) return 'full';
  const ratio = available / total;
  if (available === 0) return 'full';
  if (ratio < 0.1 || available < 10) return 'critical';
  if (ratio < 0.3) return 'moderate';
  return 'plenty';
}

export function getStatusColor(status: AvailabilityStatus): {
  bg: string;
  text: string;
  border: string;
  dot: string;
  label: string;
} {
  switch (status) {
    case 'plenty':
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-950/40',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        dot: '#10b981',
        label: 'High Availability',
      };
    case 'moderate':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-950/40',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        dot: '#f59e0b',
        label: 'Filling Up',
      };
    case 'critical':
      return {
        bg: 'bg-rose-500/10 dark:bg-rose-950/40',
        text: 'text-rose-400',
        border: 'border-rose-500/30',
        dot: '#f43f5e',
        label: 'Limited Lots',
      };
    case 'full':
      return {
        bg: 'bg-slate-500/10 dark:bg-slate-900/40',
        text: 'text-slate-400',
        border: 'border-slate-500/30',
        dot: '#64748b',
        label: 'Carpark Full',
      };
  }
}
