/**
 * 간단한 헬스 체크 API
 * GET /api/admin/health - 서버 상태 확인
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Server is running',
    uptime: process.uptime ? process.uptime() : 0
  });
}