import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/services/databaseService';

export async function POST(request: NextRequest) {
  try {
    console.log('=== 데이터베이스 초기화 시작 ===');

    const result = await databaseService.initializeDatabase();

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }

    console.log('데이터베이스 초기화 완료');

    return NextResponse.json({
      success: true,
      message: '데이터베이스가 성공적으로 초기화되었습니다.'
    });

  } catch (error) {
    console.error('데이터베이스 초기화 실패:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}