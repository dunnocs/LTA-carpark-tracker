/**
 * Serverless Carpark Availability Endpoint
 * Path: /api/carparkavailability.ts
 *
 * Connects to Singapore Land Transport Authority (LTA) DataMall API:
 * Upstream: https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2
 * Required Header: AccountKey: <YOUR_LTA_KEY>
 *
 * Keys are loaded dynamically from environment variables:
 * - process.env.ACCOUNT_KEY
 * - process.env.LTA_DATAMALL_KEY
 * - process.env.LTA_ACCOUNT_KEY
 */

const LTA_CARPARK_API_URL =
  'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2';

export interface LTACarparkRecord {
  CarParkID: string;
  Area: string;
  Development: string;
  Location: string; // Latitude Longitude
  AvailableLots: number;
  LotType: 'C' | 'H' | 'Y'; // C = Cars, H = Heavy, Y = Motorcycles
  Agency: 'HDB' | 'LTA' | 'URA';
}

export interface LTACarparkResponse {
  'odata.metadata'?: string;
  value: LTACarparkRecord[];
  status?: string;
  message?: string;
  isConfigured?: boolean;
  totalFetched?: number;
  timestamp?: string;
}

/**
 * Retrieves the LTA AccountKey from environment variables
 */
function getAccountKey(): string | null {
  const key =
    process.env.ACCOUNT_KEY ||
    process.env.LTA_DATAMALL_KEY ||
    process.env.LTA_ACCOUNT_KEY;

  if (key && key.trim() !== '' && !key.includes('MY_') && !key.includes('YOUR_')) {
    return key.trim();
  }
  return null;
}

/**
 * Fetches real-time carpark availability data from LTA DataMall
 */
export async function fetchLTACarparks(skip: number = 0): Promise<{
  success: boolean;
  statusCode: number;
  data: LTACarparkResponse;
}> {
  const accountKey = getAccountKey();

  if (!accountKey) {
    return {
      success: false,
      statusCode: 200, // Return 200 with clear configuration guide so frontend doesn't crash
      data: {
        status: 'pending_key_configuration',
        message:
          'LTA DataMall AccountKey is not set. Please set the ACCOUNT_KEY environment variable with your LTA DataMall API key.',
        isConfigured: false,
        timestamp: new Date().toISOString(),
        value: [],
      },
    };
  }

  try {
    const url = new URL(LTA_CARPARK_API_URL);
    if (skip > 0) {
      url.searchParams.set('$skip', String(skip));
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        AccountKey: accountKey,
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        statusCode: response.status,
        data: {
          status: 'upstream_error',
          message: `LTA DataMall API responded with HTTP ${response.status}: ${errorText}`,
          isConfigured: true,
          timestamp: new Date().toISOString(),
          value: [],
        },
      };
    }

    const json = (await response.json()) as LTACarparkResponse;

    return {
      success: true,
      statusCode: 200,
      data: {
        ...json,
        status: 'live',
        isConfigured: true,
        totalFetched: json.value?.length ?? 0,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    return {
      success: false,
      statusCode: 502,
      data: {
        status: 'network_error',
        message: `Failed to connect to LTA DataMall: ${error?.message || error}`,
        isConfigured: true,
        timestamp: new Date().toISOString(),
        value: [],
      },
    };
  }
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

  // Parse skip query param if provided (e.g. ?skip=500 or ?$skip=500)
  const skipParam =
    req?.query?.skip ||
    req?.query?.['$skip'] ||
    new URL(req?.url || 'http://localhost', 'http://localhost').searchParams.get('skip') ||
    '0';
  const skip = parseInt(String(skipParam), 10) || 0;

  const result = await fetchLTACarparks(skip);

  if (res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

    if (typeof res.status === 'function' && typeof res.json === 'function') {
      return res.status(result.statusCode).json(result.data);
    }

    res.statusCode = result.statusCode;
    return res.end(JSON.stringify(result.data, null, 2));
  }

  return new Response(JSON.stringify(result.data, null, 2), {
    status: result.statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=30, stale-while-revalidate=60',
    },
  });
}

/**
 * Named GET export for Web Standards / Edge runtime
 */
export async function GET(request?: Request) {
  let skip = 0;
  if (request?.url) {
    const url = new URL(request.url);
    const skipParam = url.searchParams.get('skip') || url.searchParams.get('$skip') || '0';
    skip = parseInt(skipParam, 10) || 0;
  }

  const result = await fetchLTACarparks(skip);

  return new Response(JSON.stringify(result.data, null, 2), {
    status: result.statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
      'Cache-Control': 's-maxage=30, stale-while-revalidate=60',
    },
  });
}
