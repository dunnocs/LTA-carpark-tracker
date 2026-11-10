import { Carpark, CarparkLotInfo, VehicleLotType } from '../types/carpark';
import { INITIAL_SINGAPORE_CARPARKS } from './carparkData';

const FAVORITES_STORAGE_KEY = 'parksg_favorite_carparks_v1';

export class CarparkService {
  /**
   * Retrieves all initial Singapore carparks loaded with user favorites from localStorage
   */
  static getCarparks(): Carpark[] {
    const savedFavorites = this.getSavedFavorites();
    return INITIAL_SINGAPORE_CARPARKS.map((cp) => ({
      ...cp,
      isFavorite: savedFavorites.includes(cp.id),
    }));
  }

  /**
   * Saves or toggles favorite carparks in localStorage
   */
  static toggleFavorite(carparkId: string): string[] {
    const favorites = this.getSavedFavorites();
    const index = favorites.indexOf(carparkId);
    let updated: string[];
    if (index >= 0) {
      updated = favorites.filter((id) => id !== carparkId);
    } else {
      updated = [...favorites, carparkId];
    }
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // storage unavailable or full
    }
    return updated;
  }

  static getSavedFavorites(): string[] {
    try {
      const data = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Real-time Simulation Engine:
   * Generates natural lot arrival/departure fluctuations matching Singapore peak traffic
   */
  static simulateLiveUpdates(carparks: Carpark[]): Carpark[] {
    return carparks.map((cp) => {
      // 50% chance a carpark's lot counts shift slightly this tick
      if (Math.random() < 0.4) {
        return cp;
      }

      const updatedLots: CarparkLotInfo[] = cp.lots.map((lot) => {
        // Delta between -5 and +5 lots
        const delta = Math.floor(Math.random() * 9) - 4;
        let newAvailable = lot.lotsAvailable + delta;
        if (newAvailable < 0) newAvailable = 0;
        if (newAvailable > lot.totalLots) newAvailable = lot.totalLots;
        return {
          ...lot,
          lotsAvailable: newAvailable,
        };
      });

      const carLotBefore = cp.lots.find((l) => l.lotType === 'C')?.lotsAvailable ?? 0;
      const carLotAfter = updatedLots.find((l) => l.lotType === 'C')?.lotsAvailable ?? 0;
      const trend =
        carLotAfter > carLotBefore
          ? ('rising' as const)
          : carLotAfter < carLotBefore
          ? ('falling' as const)
          : cp.occupancyTrend;

      return {
        ...cp,
        lots: updatedLots,
        occupancyTrend: trend,
        lastUpdated: 'Just now',
      };
    });
  }

  /**
   * Calculates realistic Singapore parking fees based on Day, Entry Time, and Duration
   */
  static calculateParkingFee(
    carpark: Carpark,
    dayType: 'weekday' | 'saturday' | 'sunday',
    arrivalHour24: number,
    arrivalMin: number,
    durationMinutes: number
  ): {
    totalFee: number;
    breakdown: string;
    isGracePeriod: boolean;
    isFreeParking: boolean;
  } {
    if (durationMinutes <= carpark.rates.gracePeriodMins) {
      return {
        totalFee: 0,
        breakdown: `Exited within ${carpark.rates.gracePeriodMins}-minute grace period (No charge)`,
        isGracePeriod: true,
        isFreeParking: true,
      };
    }

    // Free parking scheme check (e.g. Sunday/PH HDB or lunch promo)
    if (
      dayType === 'sunday' &&
      carpark.rates.freeParkingInfo.toLowerCase().includes('sun') &&
      arrivalHour24 >= 7 &&
      arrivalHour24 < 22
    ) {
      return {
        totalFee: 0,
        breakdown: 'HDB/URA Sunday & Public Holiday Free Parking (07:00 - 22:30)',
        isGracePeriod: false,
        isFreeParking: true,
      };
    }

    // Lunch free parking check for IMM/OTH
    if (
      dayType === 'weekday' &&
      carpark.id === 'IMM' &&
      durationMinutes <= 60
    ) {
      return {
        totalFee: 0,
        breakdown: 'IMM 1st Hour Free on Weekdays (Excludes PH)',
        isGracePeriod: false,
        isFreeParking: true,
      };
    }

    // Default Singapore calculation based on hourly estimate or per-entry caps
    const hours = Math.ceil(durationMinutes / 30) / 2; // in 30-min blocks
    let fee = 0;
    let breakdownNote = '';

    if (dayType === 'sunday') {
      if (carpark.rates.weekendRate.includes('per entry')) {
        fee = 3.5;
        breakdownNote = `Weekend Per-Entry charge ($${fee.toFixed(2)})`;
      } else {
        fee = Math.max(1.2, hours * carpark.rates.hourlyEstimate);
        breakdownNote = `${hours} hrs @ approx $${carpark.rates.hourlyEstimate.toFixed(2)}/hr`;
      }
    } else if (arrivalHour24 >= 18 || arrivalHour24 < 7) {
      // Off-peak / evening per entry or night cap
      if (carpark.agency === 'HDB' || carpark.agency === 'URA') {
        const nightBlocks = Math.ceil(durationMinutes / 30);
        fee = Math.min(5.0, nightBlocks * 0.6);
        breakdownNote = `${nightBlocks} x 30m blocks ($0.60/blk, HDB night cap $5.00)`;
      } else if (carpark.rates.weekdayOffPeakRate.includes('per entry')) {
        fee = 3.5;
        breakdownNote = `Evening Per-Entry charge ($${fee.toFixed(2)})`;
      } else {
        fee = hours * carpark.rates.hourlyEstimate;
        breakdownNote = `${hours} hrs @ off-peak rate`;
      }
    } else {
      // Weekday / Saturday daytime peak
      fee = hours * carpark.rates.hourlyEstimate;
      breakdownNote = `${hours} hrs daytime parking rate`;
    }

    return {
      totalFee: Math.round(fee * 100) / 100,
      breakdown: breakdownNote,
      isGracePeriod: false,
      isFreeParking: false,
    };
  }

  /**
   * Helper to get lot numbers for a specific vehicle type
   */
  static getLotsByType(carpark: Carpark, type: VehicleLotType | 'ALL'): { available: number; total: number } {
    if (type === 'ALL') {
      const available = carpark.lots.reduce((acc, l) => acc + l.lotsAvailable, 0);
      const total = carpark.lots.reduce((acc, l) => acc + l.totalLots, 0);
      return { available, total };
    }
    const match = carpark.lots.find((l) => l.lotType === type);
    if (!match) return { available: 0, total: 0 };
    return { available: match.lotsAvailable, total: match.totalLots };
  }

  /**
   * LTA DATAMALL INTEGRATION METHOD:
   * Connects to the serverless /api/carparkavailability endpoint.
   * If ACCOUNT_KEY is set in the environment, it merges real-time LTA DataMall lots.
   * If not set yet, it returns the structured carparks with a pending configuration notice.
   */
  static async fetchFromLTADataMall(
    apiUrl: string = '/api/carparkavailability'
  ): Promise<{ carparks: Carpark[]; isLive: boolean; message?: string }> {
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();

      if (data.status === 'live' && Array.isArray(data.value) && data.value.length > 0) {
        const current = this.getCarparks();
        const updated = current.map((cp) => {
          const matches = data.value.filter(
            (r: any) =>
              r.CarParkID === cp.id ||
              (r.Development &&
                cp.name.toLowerCase().includes(r.Development.toLowerCase()))
          );

          if (matches.length > 0) {
            const updatedLots = cp.lots.map((lot) => {
              const matchLot = matches.find((m: any) => m.LotType === lot.lotType);
              if (matchLot && typeof matchLot.AvailableLots === 'number') {
                return { ...lot, lotsAvailable: matchLot.AvailableLots };
              }
              return lot;
            });
            return {
              ...cp,
              lots: updatedLots,
              lastUpdated: 'Live LTA DataMall',
            };
          }
          return cp;
        });

        return { carparks: updated, isLive: true };
      }

      return {
        carparks: this.getCarparks(),
        isLive: false,
        message: data.message,
      };
    } catch (err: any) {
      console.warn('Could not reach /api/carparkavailability:', err?.message || err);
      return { carparks: this.getCarparks(), isLive: false };
    }
  }

  /**
   * BACKEND INTEGRATION SPECIFICATION:
   * When integrating real backend connections, this method can be pointed to:
   * 1. Your Express server `/api/carparkavailability` route
   * 2. LTA DataMall v2: https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2
   * 3. data.gov.sg: https://api.data.gov.sg/v1/transport/carpark-availability
   */
  static async fetchFromBackend(apiUrl: string = '/api/carparkavailability'): Promise<Carpark[]> {
    const result = await this.fetchFromLTADataMall(apiUrl);
    return result.carparks;
  }
}
