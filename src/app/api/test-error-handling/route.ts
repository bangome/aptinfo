/**
 * 에러 처리 테스트를 위한 API 엔드포인트
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const errorType = searchParams.get('type');
  const delay = parseInt(searchParams.get('delay') || '0');

  // 지연 시뮬레이션
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  switch (errorType) {
    // HTTP 상태 코드 에러들
    case 'bad-request':
      return NextResponse.json(
        { error: { code: 'INVALID_PARAMS', message: '잘못된 요청 파라미터' } },
        { status: 400 }
      );

    case 'unauthorized':
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 }
      );

    case 'forbidden':
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: '접근 권한이 없습니다' } },
        { status: 403 }
      );

    case 'not-found':
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '리소스를 찾을 수 없습니다' } },
        { status: 404 }
      );

    case 'validation':
      return NextResponse.json(
        { 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: '입력 데이터 검증 실패',
            details: {
              fields: ['email', 'password'],
              violations: ['이메일 형식 오류', '비밀번호는 8자 이상']
            }
          } 
        },
        { status: 422 }
      );

    case 'rate-limit':
      return NextResponse.json(
        { 
          error: { 
            code: 'RATE_LIMIT_EXCEEDED', 
            message: '요청 한도 초과',
            details: { retryAfter: 60 }
          } 
        },
        { status: 429, headers: { 'Retry-After': '60' } }
      );

    case 'server-error':
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류' } },
        { status: 500 }
      );

    case 'bad-gateway':
      return NextResponse.json(
        { error: { code: 'BAD_GATEWAY', message: '게이트웨이 오류' } },
        { status: 502 }
      );

    case 'service-unavailable':
      return NextResponse.json(
        { error: { code: 'SERVICE_UNAVAILABLE', message: '서비스 일시 중단' } },
        { status: 503 }
      );

    case 'timeout':
      return NextResponse.json(
        { error: { code: 'GATEWAY_TIMEOUT', message: '게이트웨이 타임아웃' } },
        { status: 504 }
      );

    // 정부 API 에러 시뮬레이션
    case 'gov-api-invalid-key':
      return NextResponse.json({
        error: {
          code: 'GOV_API_20',
          message: '서비스 키가 유효하지 않습니다',
          details: { apiType: 'government', errorCode: '20' }
        }
      });

    case 'gov-api-no-data':
      return NextResponse.json({
        error: {
          code: 'GOV_API_03',
          message: '요청하신 데이터가 없습니다',
          details: { apiType: 'government', errorCode: '03' }
        }
      });

    case 'gov-api-limit':
      return NextResponse.json({
        error: {
          code: 'GOV_API_22',
          message: '서비스 이용 한도를 초과했습니다',
          details: { apiType: 'government', errorCode: '22' }
        }
      });

    // 타임아웃 시뮬레이션 (15초 대기)
    case 'timeout-simulation':
      await new Promise(resolve => setTimeout(resolve, 15000));
      return NextResponse.json({ message: '타임아웃 테스트' });

    // 성공 응답
    case 'success':
    default:
      return NextResponse.json({
        success: true,
        data: {
          message: '성공적으로 처리되었습니다',
          timestamp: new Date().toISOString(),
          errorType: errorType || 'none'
        }
      });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { errorType, simulateDelay } = body;

  if (simulateDelay) {
    await new Promise(resolve => setTimeout(resolve, simulateDelay));
  }

  switch (errorType) {
    case 'json-parse-error':
      // 잘못된 JSON 응답 시뮬레이션
      return new Response('{"invalid": json}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    case 'empty-response':
      return new Response('', { status: 200 });

    case 'unexpected-format':
      return new Response('<html><body>Unexpected HTML response</body></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      });

    case 'partial-content':
      return NextResponse.json({
        success: true,
        data: {
          // 일부 필드만 포함된 불완전한 응답
          id: 123,
          // name 필드 누락
          // email 필드 누락
        }
      });

    default:
      return NextResponse.json({
        success: true,
        message: 'POST 요청 성공',
        receivedData: body
      });
  }
}