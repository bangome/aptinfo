import { NextResponse } from 'next/server';
import { realApartmentService } from '@/services/realApartmentService';

export async function POST() {
  try {
    realApartmentService.clearCache();

    return NextResponse.json({
      success: true,
      message: '캐시가 성공적으로 클리어되었습니다.'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}