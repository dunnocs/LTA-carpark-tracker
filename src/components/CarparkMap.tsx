import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Carpark, VehicleLotType, getAvailabilityStatus, getStatusColor } from '../types/carpark';
import { CarparkService } from '../services/carparkService';
import { Compass, Layers, ShieldCheck, Zap } from 'lucide-react';

interface CarparkMapProps {
  carparks: Carpark[];
  selectedCarpark: Carpark | null;
  onSelectCarpark: (carpark: Carpark) => void;
  activeVehicleType: VehicleLotType | 'ALL';
}

const REGION_COORDINATES: Record<string, { lat: number; lng: number; zoom: number }> = {
  'All Singapore': { lat: 1.3521, lng: 103.8198, zoom: 12 },
  'CBD & Marina Bay': { lat: 1.2825, lng: 103.8535, zoom: 15 },
  'Orchard': { lat: 1.303, lng: 103.834, zoom: 15 },
  'Jurong East': { lat: 1.334, lng: 103.743, zoom: 15 },
  'Tampines & East': { lat: 1.353, lng: 103.945, zoom: 14 },
  'Woodlands': { lat: 1.435, lng: 103.787, zoom: 14 },
};

export const CarparkMap: React.FC<CarparkMapProps> = ({
  carparks,
  selectedCarpark,
  onSelectCarpark,
  activeVehicleType,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [1.3521, 103.8198],
      zoom: 12,
      minZoom: 11,
      maxZoom: 18,
      zoomControl: false,
    });

    // Add sleek dark theme basemap (CartoDB Dark Matter tiles)
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync markers when carparks or active vehicle type change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    carparks.forEach((cp) => {
      const { available, total } = CarparkService.getLotsByType(cp, activeVehicleType);
      const status = getAvailabilityStatus(available, total);
      const statusInfo = getStatusColor(status);

      // Custom high-contrast SVG marker showing available lots directly
      const iconHtml = `
        <div class="relative group cursor-pointer" style="transform: translate(-50%, -100%);">
          <div class="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold shadow-lg border transition-all ${
            status === 'plenty'
              ? 'bg-emerald-600 text-white border-emerald-400'
              : status === 'moderate'
              ? 'bg-amber-600 text-white border-amber-400'
              : status === 'critical'
              ? 'bg-rose-600 text-white border-rose-400'
              : 'bg-slate-700 text-slate-300 border-slate-500'
          }">
            <span class="font-mono text-xs tabular-nums">${available}</span>
            <span class="text-[9px] uppercase tracking-wider opacity-85">lots</span>
          </div>
          <div class="w-2 h-2 rotate-45 mx-auto -mt-1 ${
            status === 'plenty'
              ? 'bg-emerald-600'
              : status === 'moderate'
              ? 'bg-amber-600'
              : status === 'critical'
              ? 'bg-rose-600'
              : 'bg-slate-700'
          }"></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-carpark-pin',
        iconSize: [60, 32],
        iconAnchor: [30, 32],
      });

      const marker = L.marker([cp.coordinates.lat, cp.coordinates.lng], { icon: customIcon });

      // Popup content
      const popupHtml = `
        <div class="p-3 text-slate-100 max-w-xs">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="text-xs font-mono font-bold text-emerald-400">[${cp.id}]</span>
            <span class="text-[11px] text-slate-400">${cp.agency}</span>
          </div>
          <h4 class="font-semibold text-sm text-slate-100 leading-tight mb-1">${cp.name}</h4>
          <p class="text-xs text-slate-400 mb-2">${cp.address}</p>

          <div class="p-2 rounded bg-slate-800/80 border border-slate-700/60 mb-2">
            <div class="flex justify-between items-center text-xs mb-1">
              <span class="text-slate-400">Available:</span>
              <span class="font-mono font-bold ${statusInfo.text}">${available} / ${total} lots</span>
            </div>
            <div class="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div class="h-1.5 rounded-full" style="width: ${Math.min(
                100,
                Math.round((available / Math.max(1, total)) * 100)
              )}%; background-color: ${statusInfo.dot};"></div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300 mb-3">
            <div>Rate: <span class="text-slate-100 font-medium">~$${cp.rates.hourlyEstimate}/hr</span></div>
            <div>Clearance: <span class="text-slate-100 font-medium">${cp.gantryHeight}m</span></div>
          </div>

          <button id="btn-view-${cp.id}" class="w-full py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded text-xs transition-colors text-center cursor-pointer">
            View Details & Calculator
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-view-${cp.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectCarpark(cp);
          };
        }
      });

      marker.addTo(markersLayer);
    });
  }, [carparks, activeVehicleType, onSelectCarpark]);

  // Pan to selected carpark if any
  useEffect(() => {
    if (!selectedCarpark || !mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo(
      [selectedCarpark.coordinates.lat, selectedCarpark.coordinates.lng],
      16,
      { duration: 1.2 }
    );
  }, [selectedCarpark]);

  const handleJumpRegion = (name: string) => {
    const coords = REGION_COORDINATES[name];
    if (coords && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([coords.lat, coords.lng], coords.zoom, { duration: 1 });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[460px] rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl flex flex-col">
      {/* Map Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Quick Region Selector Pills */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg shadow-lg overflow-x-auto max-w-full">
          <div className="flex items-center gap-1 px-2 text-xs text-slate-400 shrink-0">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Jump to:</span>
          </div>
          {Object.keys(REGION_COORDINATES).map((region) => (
            <button
              key={region}
              onClick={() => handleJumpRegion(region)}
              className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap cursor-pointer"
            >
              {region}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="pointer-events-auto hidden lg:flex items-center gap-3 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg text-xs shadow-lg">
          <span className="text-slate-400 font-medium">Availability:</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>&gt;30% (Plenty)</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>10-30%</span>
          </span>
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>&lt;10% (Critical)</span>
          </span>
        </div>
      </div>

      {/* Leaflet Container */}
      <div ref={mapContainerRef} className="w-full flex-1 z-10" />

      {/* Map Footer Bar */}
      <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Showing {carparks.length} Singapore Carparks</span>
          </span>
          <span className="hidden sm:inline text-slate-600">·</span>
          <span className="hidden sm:inline">Click any pin for lot breakdown & live rates</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 text-[11px] font-mono">EPS Real-Time Synced</span>
        </div>
      </div>
    </div>
  );
};
