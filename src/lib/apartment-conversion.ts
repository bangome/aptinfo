/**
 * Utility functions for converting between IntegratedApartmentData and Apartment types
 */

import { IntegratedApartmentData } from '@/lib/api/real-estate-api';
import { Apartment } from '@/types/apartment';

/**
 * Converts IntegratedApartmentData from the real estate API to the Apartment type
 * used throughout the UI components
 */
export function convertToApartment(apartmentData: IntegratedApartmentData): Apartment {
  return {
    id: apartmentData.id,
    kaptCode: apartmentData.kaptCode || apartmentData.id, // kapt_code 추가
    name: apartmentData.name,
    address: apartmentData.address,
    region: apartmentData.region,
    subRegion: apartmentData.subRegion,
    images: ['/placeholder.svg'], // Real estate API doesn't provide images
    buildYear: apartmentData.buildYear || 2020,
    area: {
      exclusive: apartmentData.area.exclusive || 84,
      supply: apartmentData.area.supply || apartmentData.area.exclusive || 84
    },
    price: {
      sale: apartmentData.price?.sale,
      lease: apartmentData.price?.lease,
      rent: apartmentData.price?.rent
    },
    floors: {
      underground: 0,
      ground: apartmentData.floor || 0,
      total: apartmentData.totalFloors || apartmentData.floor || 0
    },
    parking: {
      total: apartmentData.facilities?.parking?.total || 0,
      household: apartmentData.units ? Math.round((apartmentData.facilities?.parking?.total || 0) / apartmentData.units * 100) / 100 : 0
    },
    facilities: [
      ...(apartmentData.facilities?.convenient || [])
    ].filter(facility => {
      if (!facility) return false;
      
      // 불필요한 시설 정보 필터링
      const unwanted = [
        '한국전력공사',
        '전력공사',
        '행정구역',
        '법정동',
        '지번',
        '우편번호',
        '카테고리',
        '관공서(',
        '병원(',
        '공원(',
        '대형상가(',
        '기타(',
        '()' // 빈 괄호
      ];
      
      // 괄호가 포함된 불완전한 텍스트 필터링
      const hasIncompleteParentheses = facility.includes('(') && !facility.includes(')');
      if (hasIncompleteParentheses) return false;
      
      // 불필요한 키워드가 포함된 경우 제외
      const isUnwanted = unwanted.some(keyword => facility.includes(keyword));
      if (isUnwanted) return false;
      
      // 너무 짧거나 의미없는 텍스트 제외
      if (facility.length <= 2) return false;
      
      return true;
    }),
    educationFacilities: apartmentData.facilities?.education || [],
    welfareFacilities: apartmentData.facilities?.welfare || [],
    description: '',
    keyFeatures: [],
    nearbyFacilities: {
      schools: [],
      transport: [],
      hospitals: [],
      shopping: []
    },
    transportation: apartmentData.transportation,
    contact: {
      phone: '1588-0000',
      agent: apartmentData.estateAgent || '부동산정보'
    },
    status: apartmentData.dealType === 'sale' ? 'available' : 'rent',
    createdAt: apartmentData.createdAt.toISOString(),
    updatedAt: apartmentData.updatedAt.toISOString(),
    // Add fields that might not exist in IntegratedApartmentData
    units: apartmentData.units || 0,
    constructionCompany: apartmentData.constructionCompany || '정보없음',
    maintenanceFee: 0,
    formattedApprovalDate: apartmentData.formattedApprovalDate
  };
}

/**
 * Converts an array of IntegratedApartmentData to Apartment array
 */
export function convertToApartments(apartmentDataArray: IntegratedApartmentData[]): Apartment[] {
  return apartmentDataArray.map(convertToApartment);
}