import React, { useState } from 'react';
import { X, Code, Check, Copy, ExternalLink, Terminal, Server, Database } from 'lucide-react';

interface ApiGuideModalProps {
  onClose: () => void;
}

export const ApiGuideModal: React.FC<ApiGuideModalProps> = ({ onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const serverlessAvailabilitySnippet = `// /api/carparkavailability.ts - Live Serverless LTA DataMall Proxy
// GET /api/carparkavailability
// Automatically attaches:
// Header: AccountKey: process.env.ACCOUNT_KEY

// Example response when ACCOUNT_KEY is set:
{
  "odata.metadata": "https://datamall2.mytransport.sg/ltaodataservice/$metadata#CarParkAvailabilityv2",
  "status": "live",
  "isConfigured": true,
  "totalFetched": 500,
  "value": [
    {
      "CarParkID": "MBFC",
      "Area": "Marina",
      "Development": "Marina Bay Financial Centre",
      "Location": "1.2801 103.8543",
      "AvailableLots": 194,
      "LotType": "C",
      "Agency": "LTA"
    }
  ]
}`;

  const serverlessHealthSnippet = `// /api/health.ts - Health Check Endpoint
// GET /api/health

{
  "status": "ok",
  "timestamp": "2026-11-10T04:00:00.000Z",
  "service": "Singapore LTA Carpark Tracker Serverless API",
  "environment": {
    "nodeEnv": "development",
    "hasAccountKey": false // turns true once ACCOUNT_KEY is provided
  },
  "endpoints": {
    "carparkAvailability": "/api/carparkavailability",
    "ltaDataMallUpstream": "https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2"
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Backend Integration Architecture</h2>
              <p className="text-xs text-slate-400">
                LTA DataMall & data.gov.sg schemas ready for instant connection
              </p>
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
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs text-slate-300">
          {/* Overview */}
          <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-2">
            <h3 className="text-sm font-semibold text-emerald-300 flex items-center gap-1.5">
              <Server className="w-4 h-4" />
              <span>Front-End Ready for Zero-Friction Hookup</span>
            </h3>
            <p className="text-slate-300">
              The front-end has been constructed with a plug-and-play architecture in{' '}
              <code className="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded font-mono">
                src/services/carparkService.ts
              </code>
              . The data structures map directly to Singapore's two official real-time APIs.
            </p>
          </div>

          {/* Official API Sources */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-sky-400" />
                  <span>1. LTA DataMall v2</span>
                </span>
                <span className="text-[10px] text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded">
                  Commercial & Malls
                </span>
              </div>
              <p className="text-slate-400">
                Covers major commercial hubs, shopping malls (ION, Suntec, Marina Bay Sands, VivoCity) and Expressways.
              </p>
              <div className="font-mono text-[11px] bg-slate-900 p-2 rounded border border-slate-800 text-slate-300">
                GET /ltaodataservice/CarParkAvailabilityv2
              </div>
              <div className="text-[11px] text-slate-400">
                Requires free API Key in <code className="text-slate-200">AccountKey</code> header.
              </div>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>2. data.gov.sg (HDB/URA)</span>
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
                  Open Access
                </span>
              </div>
              <p className="text-slate-400">
                Real-time lot availability for 2,000+ HDB and URA carparks across all Singapore heartland estates.
              </p>
              <div className="font-mono text-[11px] bg-slate-900 p-2 rounded border border-slate-800 text-slate-300">
                GET /v1/transport/carpark-availability
              </div>
              <div className="text-[11px] text-emerald-400">
                No API key or authentication required!
              </div>
            </div>
          </div>

          {/* Serverless Live Carpark Availability Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>/api/carparkavailability.ts (Serverless Upstream Connection)</span>
              </span>
              <button
                onClick={() => copyToClipboard(serverlessAvailabilitySnippet, 'availability')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[11px] font-medium text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copiedSection === 'availability' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] overflow-x-auto text-emerald-300/90 leading-relaxed">
              {serverlessAvailabilitySnippet}
            </pre>
          </div>

          {/* Health Check Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">
                /api/health.ts (Serverless Health & Env Key Check)
              </span>
              <button
                onClick={() => copyToClipboard(serverlessHealthSnippet, 'health')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-[11px] font-medium text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copiedSection === 'health' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] overflow-x-auto text-sky-300/90 leading-relaxed">
              {serverlessHealthSnippet}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
