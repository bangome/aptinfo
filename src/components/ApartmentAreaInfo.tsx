/**
 * 아파트 면적 정보 표시 컴포넌트
 * 전용면적/공급면적 구분 및 세대수 분포 표시
 */

'use client';

import { Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GlossaryTooltip } from '@/components/GlossaryTooltip';

interface AreaDistribution {
  kapt_mparea60?: number;
  kapt_mparea85?: number;
  kapt_mparea135?: number;
  kapt_mparea136?: number;
  ho_cnt?: number;
}

interface ApartmentAreaInfoProps {
  data: AreaDistribution;
  className?: string;
}

/**
 * 공급면적을 전용면적으로 변환 (대략적인 전용율 적용)
 */
function convertToExclusiveArea(supplyArea: string): string {
  const conversionRates: Record<string, number> = {
    '60': 0.75,   // 60㎡ 이하: 전용율 약 75%
    '85': 0.76,   // 60-85㎡: 전용율 약 76%
    '135': 0.78,  // 85-135㎡: 전용율 약 78%
    '136': 0.80   // 135㎡ 초과: 전용율 약 80%
  };

  const [min, max] = supplyArea.includes('초과')
    ? ['136', '']
    : supplyArea.includes('이하')
    ? ['', supplyArea.match(/\d+/)?.[0] || '60']
    : supplyArea.split('~').map(s => s.match(/\d+/)?.[0] || '');

  if (min === '136') {
    return '108㎡ 초과';
  }

  if (max && !min) {
    const maxNum = parseInt(max);
    const exclusiveMax = Math.round(maxNum * (conversionRates[max] || 0.75));
    return `${exclusiveMax}㎡ 이하`;
  }

  if (min && max) {
    const minNum = parseInt(min);
    const maxNum = parseInt(max);
    const exclusiveMin = Math.round(minNum * (conversionRates[min] || 0.75));
    const exclusiveMax = Math.round(maxNum * (conversionRates[max] || 0.75));
    return `${exclusiveMin}~${exclusiveMax}㎡`;
  }

  return supplyArea;
}

/**
 * 평형으로 변환 (1평 = 3.3㎡)
 */
function convertToPyeong(area: string): string {
  const match = area.match(/(\d+)/);
  if (match) {
    const sqm = parseInt(match[1]);
    const pyeong = Math.round(sqm / 3.3);
    return `${pyeong}평`;
  }
  return '';
}

export function ApartmentAreaInfo({
  data,
  className = ''
}: ApartmentAreaInfoProps) {
  const totalHouseholds = data.ho_cnt || 0;

  if (totalHouseholds === 0) {
    return null;
  }

  // 면적별 세대수 데이터
  const areaDistribution = [
    {
      label: '60㎡ 이하',
      exclusiveLabel: '45㎡ 이하',
      pyeong: '14평 이하',
      count: data.kapt_mparea60 || 0,
      color: 'bg-blue-500'
    },
    {
      label: '60~85㎡',
      exclusiveLabel: '45~64㎡',
      pyeong: '14~19평',
      count: data.kapt_mparea85 || 0,
      color: 'bg-green-500'
    },
    {
      label: '85~135㎡',
      exclusiveLabel: '64~105㎡',
      pyeong: '19~32평',
      count: data.kapt_mparea135 || 0,
      color: 'bg-yellow-500'
    },
    {
      label: '135㎡ 초과',
      exclusiveLabel: '105㎡ 초과',
      pyeong: '32평 초과',
      count: data.kapt_mparea136 || 0,
      color: 'bg-red-500'
    }
  ].filter(item => item.count > 0);

  if (areaDistribution.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <h4 className="text-h6 font-semibold">면적별 세대수 분포</h4>
        <GlossaryTooltip term="면적">
          <Info
            className="h-4 w-4 text-muted-foreground cursor-help"
            aria-label="면적 정보 도움말"
          />
        </GlossaryTooltip>
      </div>

      <div className="bg-muted/20 rounded-lg p-3 space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">공급면적 기준</Badge>
          <span className="text-muted-foreground">
            데이터베이스의 면적별 세대수는 공급면적 기준입니다
          </span>
        </div>
        <div className="text-muted-foreground">
          • 전용면적 = 공급면적 × 약 75~80% (전용율)
        </div>
      </div>

      <div className="space-y-3">
        {areaDistribution.map((item, index) => {
          const percentage = Math.round((item.count / totalHouseholds) * 100);

          return (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-body2 font-medium">
                      공급 {item.label}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      전용 {item.exclusiveLabel}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    약 {item.pyeong}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-body2 font-medium">
                    {item.count.toLocaleString()}세대
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {percentage}%
                  </div>
                </div>
              </div>
              <Progress
                value={percentage}
                className="h-2"
                aria-label={`${item.label} 세대 비율: ${percentage}%`}
              />
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t">
        <div className="flex justify-between text-body2">
          <span className="font-medium">총 세대수</span>
          <span className="font-semibold">{totalHouseholds.toLocaleString()}세대</span>
        </div>
      </div>
    </div>
  );
}