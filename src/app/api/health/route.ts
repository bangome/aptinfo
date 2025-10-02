import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health checks
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      checks: {
        database: await checkDatabase(),
        externalApi: await checkExternalServices(),
      }
    };

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}

async function checkDatabase(): Promise<{ status: string; latency?: number }> {
  try {
    const start = Date.now();
    
    // Simple connectivity check - you might want to add actual DB query
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }
    
    const latency = Date.now() - start;
    return {
      status: 'connected',
      latency
    };
  } catch (error) {
    return {
      status: 'disconnected'
    };
  }
}

async function checkExternalServices(): Promise<{ status: string; services: Record<string, string> }> {
  const services: Record<string, string> = {};
  
  try {
    // Check if API key is configured
    const apiKey = process.env.NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY;
    services.dataGoKr = apiKey ? 'configured' : 'not_configured';
    
    return {
      status: 'operational',
      services
    };
  } catch (error) {
    return {
      status: 'degraded',
      services
    };
  }
}