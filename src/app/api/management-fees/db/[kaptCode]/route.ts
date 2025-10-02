import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { kaptCode: string } }
) {
  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get('year');
  const kaptCode = params.kaptCode;

  if (!kaptCode) {
    return NextResponse.json(
      { error: 'kaptCode is required' },
      { status: 400 }
    );
  }

  const targetYear = year ? parseInt(year) : 2024;

  try {
    console.log(`🔍 DB에서 관리비 데이터 조회: ${kaptCode} (${targetYear})`);
    console.time(`DB query for ${kaptCode}`);

    // DB에서 해당 연도의 모든 월 데이터 조회
    const { data: managementFees, error } = await supabase
      .from('management_fees')
      .select(`
        *
      `)
      .eq('kapt_code', kaptCode)
      .eq('year', targetYear)
      .order('month', { ascending: true });

    if (error) {
      console.error('DB 조회 에러:', error);
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500 }
      );
    }

    console.timeEnd(`DB query for ${kaptCode}`);

    if (!managementFees || managementFees.length === 0) {
      return NextResponse.json({
        kaptCode,
        kaptName: '',
        year: targetYear,
        avgCommonFee: 0,
        avgIndividualFee: 0,
        avgTotalFee: 0,
        monthlyData: [],
        dataCount: 0,
        message: '관리비 데이터가 없습니다. 배치 수집이 필요합니다.'
      });
    }

    // 월별 데이터 변환
    const monthlyData = managementFees.map(fee => ({
      kaptCode: fee.kapt_code,
      kaptName: fee.kapt_name || '',
      year: fee.year,
      month: fee.month,
      commonFee: fee.common_fee || 0,
      individualFee: fee.individual_fee || 0,
      totalFee: fee.total_fee || 0,
      successRate: parseFloat(fee.success_rate) || 0,
      collectionDate: fee.collection_date,
      // 세부 항목들
      details: {
        common: {
          cleaningCost: fee.cleaning_cost || 0,
          guardCost: fee.guard_cost || 0,
          disinfectionCost: fee.disinfection_cost || 0,
          elevatorCost: fee.elevator_cost || 0,
          repairsCost: fee.repairs_cost || 0,
          facilityCost: fee.facility_cost || 0,
          vehicleCost: fee.vehicle_cost || 0,
          disasterCost: fee.disaster_cost || 0,
          etcCost: fee.etc_cost || 0,
          officeCost: fee.office_cost || 0,
          clothingCost: fee.clothing_cost || 0,
          educationCost: fee.education_cost || 0,
          homeNetworkCost: fee.home_network_cost || 0,
          safetyCost: fee.safety_cost || 0,
          managementCost: fee.management_cost || 0,
          laborCost: fee.labor_cost || 0,
          taxCost: fee.tax_cost || 0
        },
        individual: {
          heatingCost: fee.heating_cost || 0,
          hotWaterCost: fee.hot_water_cost || 0,
          electricityCost: fee.electricity_cost || 0,
          waterCost: fee.water_cost || 0,
          gasCost: fee.gas_cost || 0,
          wasteCost: fee.waste_cost || 0,
          meetingCost: fee.meeting_cost || 0,
          insuranceCost: fee.insurance_cost || 0,
          electionCost: fee.election_cost || 0,
          purifierCost: fee.purifier_cost || 0
        }
      }
    }));

    // 평균 계산
    const totalCommon = monthlyData.reduce((sum, data) => sum + data.commonFee, 0);
    const totalIndividual = monthlyData.reduce((sum, data) => sum + data.individualFee, 0);
    const totalFee = monthlyData.reduce((sum, data) => sum + data.totalFee, 0);
    const count = monthlyData.length;

    // 성공률 계산
    const avgSuccessRate = monthlyData.reduce((sum, data) => sum + data.successRate, 0) / count;

    console.log(`✅ DB 조회 완료: ${kaptCode} - ${count}/12개월, 평균 성공률 ${avgSuccessRate.toFixed(1)}%`);

    return NextResponse.json({
      kaptCode,
      kaptName: monthlyData[0]?.kaptName || '',
      year: targetYear,
      avgCommonFee: Math.round(totalCommon / count),
      avgIndividualFee: Math.round(totalIndividual / count),
      avgTotalFee: Math.round(totalFee / count),
      minTotalFee: Math.min(...monthlyData.map(d => d.totalFee)),
      maxTotalFee: Math.max(...monthlyData.map(d => d.totalFee)),
      avgSuccessRate: parseFloat(avgSuccessRate.toFixed(2)),
      monthlyData,
      dataCount: count,
      dataSource: 'database',
      lastUpdated: Math.max(...monthlyData.map(d => new Date(d.collectionDate).getTime()))
    });

  } catch (error) {
    console.error('관리비 DB 조회 에러:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch management fee data from database', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}