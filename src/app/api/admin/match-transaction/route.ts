/**
 * 수동 매칭 업데이트 API
 * 거래 데이터를 특정 단지 정보와 연결
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizeError, logError } from '@/lib/error-handling';

interface MatchRequest {
  transactionId: string;
  transactionType: 'trade' | 'rent';
  complexId: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: MatchRequest = await request.json();

    const { transactionId, transactionType, complexId } = body;

    // 입력 검증
    if (!transactionId || !transactionType || !complexId) {
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

    // 단지 정보 존재 확인
    const { data: complex, error: complexError } = await supabase
      .from('apartment_complexes')
      .select('id, name')
      .eq('id', complexId)
      .single();

    if (complexError || !complex) {
      return NextResponse.json({
        success: false,
        error: '존재하지 않는 단지입니다.'
      }, { status: 404 });
    }

    // 거래 데이터 조회
    const tableName = transactionType === 'trade'
      ? 'apartment_trade_transactions'
      : 'apartment_rent_transactions';

    const { data: targetTransaction, error: fetchError } = await supabase
      .from(tableName)
      .select('apartment_name, region_code, legal_dong')
      .eq('id', transactionId)
      .single();

    if (fetchError || !targetTransaction) {
      return NextResponse.json({
        success: false,
        error: '거래 데이터를 찾을 수 없습니다.'
      }, { status: 404 });
    }

    // 동일한 아파트명 + 지역코드 + 법정동을 가진 모든 미매칭 거래 업데이트
    const { data: updatedTransactions, error: updateError, count } = await supabase
      .from(tableName)
      .update({
        complex_id: complexId,
        updated_at: new Date().toISOString()
      })
      .is('complex_id', null)
      .eq('apartment_name', targetTransaction.apartment_name)
      .eq('region_code', targetTransaction.region_code)
      .eq('legal_dong', targetTransaction.legal_dong)
      .select();

    if (updateError) {
      throw updateError;
    }

    const matchedCount = updatedTransactions?.length || 0;

    return NextResponse.json({
      success: true,
      data: {
        complex: complex,
        matchedCount: matchedCount,
        apartmentName: targetTransaction.apartment_name,
        message: `"${targetTransaction.apartment_name}" 거래 ${matchedCount}건이 "${complex.name}" 단지와 연결되었습니다.`
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, { endpoint: '/api/admin/match-transaction', method: 'POST' });

    return NextResponse.json({
      success: false,
      error: normalizedError.userMessage,
      code: normalizedError.code
    }, { status: 500 });
  }
}

/**
 * 매칭 해제 (선택적)
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

    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        complex_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', transactionId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: '매칭이 해제되었습니다.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const normalizedError = normalizeError(error);
    logError(normalizedError, { endpoint: '/api/admin/match-transaction', method: 'DELETE' });

    return NextResponse.json({
      success: false,
      error: normalizedError.userMessage,
      code: normalizedError.code
    }, { status: 500 });
  }
}
