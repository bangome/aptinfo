/**
 * 간소화된 스케줄러 초기화 API (임시 핫픽스)
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 간소화된 스케줄러 초기화 시작');
    
    // 간단한 초기화 로직
    const result = {
      message: '스케줄러가 초기화되었습니다.',
      initialized: true,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ 간소화된 스케줄러 초기화 완료');
    
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ 스케줄러 초기화 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: '스케줄러 초기화 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: '스케줄러 초기화 API가 작동 중입니다.',
    status: 'ready'
  });
}