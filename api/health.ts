/**
 * Serverless Health Endpoint
 * Path: /api/health.ts
 *
 * Checks serverless function health and reports configuration status
 * for the Singapore LTA DataMall integration.
 */

export interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  service: string;
  version: string;
  environment: {
    nodeEnv: string;
    hasAccountKey: boolean;
  };
  endpoints: {
    carparkAvailability: string;
    ltaDataMallUpstream: string;
  };
}

export function getHealthData(): HealthResponse {
  const hasAccountKey = Boolean(
    process.env.ACCOUNT_KEY ||
    process.env.LTA_DATAMALL_KEY ||
    process.env.LTA_ACCOUNT_KEY
  );

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Singapore LTA Carpark Tracker Serverless API',
    version: '1.0.0',
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      hasAccountKey,
    },
    endpoints: {
      carparkAvailability: '/api/carparkavailability',
      ltaDataMallUpstream:
        'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2',
    },
  };
}

/**
 * Universal Serverless Handler (Node / Express / Vercel Serverless / Connect)
 */
export default async function handler(req: any, res: any) {
  // Handle CORS Preflight
  if (req?.method === 'OPTIONS') {
    if (res) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, AccountKey');
      if (typeof res.status === 'function') {
        return res.status(204).end();
      }
      res.statusCode = 204;
      return res.end();
    }
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, AccountKey',
      },
    });
  }

  const data = getHealthData();

  if (res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(200).json(data);
    }

    res.statusCode = 200;
    return res.end(JSON.stringify(data, null, 2));
  }

  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

/**
 * Named GET export for Web Standards / Edge runtime
 */
export async function GET() {
  const data = getHealthData();
  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
