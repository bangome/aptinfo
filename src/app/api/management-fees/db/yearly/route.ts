import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const kaptCode = searchParams.get('kaptCode');
  const year = searchParams.get('year');
  const month = searchParams.get('month');

  if (!kaptCode) {
    return NextResponse.json(
      { error: 'kaptCode parameter is required' },
      { status: 400 }
    );
  }

  const targetYear = year ? parseInt(year) : 2024;

  try {
    console.log(`🔍 DB에서 연간 관리비 데이터 조회: ${kaptCode} (${targetYear})`);
    console.time(`Yearly DB query for ${kaptCode}`);

    let query = supabase
      .from('management_fees')
      .select('*')
      .eq('kapt_code', kaptCode)
      .eq('year', targetYear)
      .order('month', { ascending: true });

    // 특정 월 요청시
    if (month) {
      query = query.eq('month', parseInt(month));
    }

    const { data: managementFees, error } = await query;

    if (error) {
      console.error('DB 조회 에러:', error);
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500 }
      );
    }

    console.timeEnd(`Yearly DB query for ${kaptCode}`);

    if (!managementFees || managementFees.length === 0) {
      return NextResponse.json({
        kaptCode,
        year: targetYear,
        month: month ? parseInt(month) : null,
        data: [],
        message: '관리비 데이터가 없습니다. 배치 수집이 필요합니다.',
        dataSource: 'database'
      });
    }

    // 특정 월 요청시 단일 데이터 반환
    if (month && managementFees.length > 0) {
      const fee = managementFees[0];
      
      return NextResponse.json({
        kaptCode: fee.kapt_code,
        kaptName: fee.kapt_name || '',
        year: fee.year,
        month: fee.month,
        commonFee: fee.common_fee || 0,
        individualFee: fee.individual_fee || 0,
        totalFee: fee.total_fee || 0,
        perHouseholdFee: 0, // 가구수 정보가 필요한 경우 별도 조회
        successRate: parseFloat(fee.success_rate) || 0,
        collectionDate: fee.collection_date,
        dataSource: 'database',
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
      });
    }

    // 연간 데이터 변환
    const yearlyData = managementFees.map(fee => ({
      kaptCode: fee.kapt_code,
      kaptName: fee.kapt_name || '',
      year: fee.year,
      month: fee.month,
      commonFee: fee.common_fee || 0,
      individualFee: fee.individual_fee || 0,
      totalFee: fee.total_fee || 0,
      perHouseholdFee: 0, // 가구수 정보가 필요한 경우 별도 조회
      successRate: parseFloat(fee.success_rate) || 0,
      collectionDate: fee.collection_date,
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

    // 통계 계산
    const totalCommon = yearlyData.reduce((sum, data) => sum + data.commonFee, 0);
    const totalIndividual = yearlyData.reduce((sum, data) => sum + data.individualFee, 0);
    const totalFee = yearlyData.reduce((sum, data) => sum + data.totalFee, 0);
    const count = yearlyData.length;
    const avgSuccessRate = yearlyData.reduce((sum, data) => sum + data.successRate, 0) / count;

    console.log(`✅ 연간 DB 조회 완료: ${kaptCode} - ${count}/12개월, 평균 성공률 ${avgSuccessRate.toFixed(1)}%`);

    return NextResponse.json({
      kaptCode,
      kaptName: yearlyData[0]?.kaptName || '',
      year: targetYear,
      totalMonths: count,
      avgCommonFee: count > 0 ? Math.round(totalCommon / count) : 0,
      avgIndividualFee: count > 0 ? Math.round(totalIndividual / count) : 0,
      avgTotalFee: count > 0 ? Math.round(totalFee / count) : 0,
      yearlyCommonTotal: totalCommon,
      yearlyIndividualTotal: totalIndividual,
      yearlyTotalFee: totalFee,
      avgSuccessRate: count > 0 ? parseFloat(avgSuccessRate.toFixed(2)) : 0,
      data: yearlyData,
      dataSource: 'database',
      lastUpdated: count > 0 ? Math.max(...yearlyData.map(d => new Date(d.collectionDate).getTime())) : null
    });

  } catch (error) {
    console.error('연간 관리비 DB 조회 에러:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch yearly management fee data from database', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}