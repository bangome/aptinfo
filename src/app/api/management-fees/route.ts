import { NextRequest, NextResponse } from 'next/server';
import { managementFeeService } from '@/lib/api/management-fee-service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const kaptCode = searchParams.get('kaptCode');
  const year = searchParams.get('year');

  if (!kaptCode) {
    return NextResponse.json(
      { error: 'kaptCode is required' },
      { status: 400 }
    );
  }

  const targetYear = year ? parseInt(year) : new Date().getFullYear() - 1;

  try {
    const data = await managementFeeService.fetchYearlyAverageManagementFee(kaptCode, targetYear);

    if (!data) {
      return NextResponse.json(
        { error: 'No management fee data found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching management fee:', error);
    return NextResponse.json(
      { error: 'Failed to fetch management fee data' },
      { status: 500 }
    );
  }
}