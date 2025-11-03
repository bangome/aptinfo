/**
 * 매칭 실패 표시 API
 * 매칭할 단지가 없는 거래를 표시하여 목록 뒤로 정렬
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeError, logError } from '@/lib/error-handling';

interface MarkFailedRequest {
  transactionId: string;
  transactionType: 'trade' | 'rent';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: MarkFailedRequest = await request.json();

    const { transactionId, transactionType } = body;

    // 입력 검증
    if (!transactionId || !transactionType) {
      return NextResponse.json({
        success: false,
        error: '필수 파라미터가 누락되었습니다.'
      }, { status: 400 });
    }

    if (transactionType !== 'trade' && transactionType !== 'rent') {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 거래 타입입니다.'
      }, { status: 400 });
    }

    const tableName = transactionType === 'trade'
      ? 'apartment_trade_transactions'
      : 'apartment_rent_transactions';

    // match_failed 플래그를 true로 설정
    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        match_failed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: '매칭 실패로 표시되었습니다. 목록 뒤로 이동됩니다.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, { endpoint: '/api/admin/mark-match-failed', method: 'POST' });

    return NextResponse.json({
      success: false,
      error: normalizedError.userMessage,
      code: normalizedError.code
    }, { status: 500 });
  }
}

/**
 * 매칭 실패 표시 해제
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const transactionId = searchParams.get('transactionId');
    const transactionType = searchParams.get('transactionType');

    if (!transactionId || !transactionType) {
      return NextResponse.json({
        success: false,
        error: '필수 파라미터가 누락되었습니다.'
      }, { status: 400 });
    }

    const tableName = transactionType === 'trade'
      ? 'apartment_trade_transactions'
      : 'apartment_rent_transactions';

    // match_failed 플래그를 false로 되돌림
    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        match_failed: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: '매칭 실패 표시가 해제되었습니다.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, { endpoint: '/api/admin/mark-match-failed', method: 'DELETE' });

    return NextResponse.json({
      success: false,
      error: normalizedError.userMessage,
      code: normalizedError.code
    }, { status: 500 });
  }
}
