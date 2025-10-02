/**
 * 간소화된 스케줄러 API (임시 핫픽스)
 * chunk 로딩 문제를 피하기 위해 의존성을 최소화
 */
import { NextRequest, NextResponse } from 'next/server';

// 간단한 상태 저장
let schedulerStatus = {
  isRunning: false,
  lastRun: null as Date | null,
  totalJobs: 0,
  runningJobs: 0,
  errors: [] as string[]
};

export async function GET(request: NextRequest) {
  try {
    console.log('📊 간소화된 스케줄러 상태 조회');
    
    return NextResponse.json({
      success: true,
      data: {
        ...schedulerStatus,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ 스케줄러 상태 조회 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: '스케줄러 상태 조회 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, jobId } = body;

    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'action 파라미터가 필요합니다.',
        validActions: ['start', 'stop', 'restart', 'status']
      }, { status: 400 });
    }

    console.log(`🎯 간소화된 스케줄러 제어 요청: ${action}`);
    
    let result;

    switch (action) {
      case 'start':
        schedulerStatus.isRunning = true;
        schedulerStatus.lastRun = new Date();
        result = { message: '스케줄러가 시작되었습니다.' };
        break;

      case 'stop':
        schedulerStatus.isRunning = false;
        result = { message: '스케줄러가 중지되었습니다.' };
        break;

      case 'restart':
        schedulerStatus.isRunning = false;
        await new Promise(resolve => setTimeout(resolve, 500));
        schedulerStatus.isRunning = true;
        schedulerStatus.lastRun = new Date();
        result = { message: '스케줄러가 재시작되었습니다.' };
        break;

      case 'status':
        result = { 
          status: schedulerStatus,
          message: '스케줄러 상태를 조회했습니다.' 
        };
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `알 수 없는 액션: ${action}`,
          validActions: ['start', 'stop', 'restart', 'status']
        }, { status: 400 });
    }

    console.log(`✅ 간소화된 스케줄러 제어 완료: ${action}`);
    
    return NextResponse.json({
      success: true,
      action,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 스케줄러 제어 실패:', error);
    
    return NextResponse.json({
      success: false,
      error: '스케줄러 제어 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}