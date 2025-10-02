import { Apartment, PopularArea, Facility } from '@/types/apartment';

export const dummyApartments: Apartment[] = [
  {
    id: '1',
    kaptCode: 'DUMMY001',
    name: '롯데캐슬 골드파크',
    address: '서울특별시 서초구 방배동 123-45',
    buildYear: 2018,
    units: 1024,
    parking: 1536,
    maintenanceFee: 120000,
    images: [
      '/placeholder.svg',
      '/placeholder.svg'
    ],
    facilities: ['실내수영장', '피트니스센터', '키즈카페', '도서관', '지하주차장'],
    location: { lat: 37.4813, lng: 126.9964 },
    price: { sale: 1200000000, lease: 80000000 },
    area: { exclusive: 84.12, supply: 104.85 },
    floors: 25,
    constructionCompany: '롯데건설',
    region: '서울',
    subRegion: '서초구'
  },
  {
    id: '2',
    kaptCode: 'DUMMY002',
    name: '힐스테이트 광교',
    address: '경기도 수원시 영통구 광교동 456-78',
    buildYear: 2020,
    units: 854,
    parking: 1280,
    maintenanceFee: 95000,
    images: [
      '/placeholder.svg',
      '/placeholder.svg'
    ],
    facilities: ['골프연습장', '사우나', '뷰카페', '놀이터', '실내골프연습장'],
    location: { lat: 37.2856, lng: 127.0547 },
    price: { sale: 980000000, lease: 65000000 },
    area: { exclusive: 74.52, supply: 89.33 },
    floors: 30,
    constructionCompany: '현대건설',
    region: '경기',
    subRegion: '수원시'
  },
  {
    id: '3',
    kaptCode: 'DUMMY003',
    name: '푸르지오 월드마크',
    address: '인천광역시 송도동 789-10',
    buildYear: 2019,
    units: 1456,
    parking: 2184,
    maintenanceFee: 135000,
    images: [
      '/placeholder.svg',
      '/placeholder.svg'
    ],
    facilities: ['실내수영장', '테니스장', '스크린골프', '다목적실', '경로당'],
    location: { lat: 37.3914, lng: 126.6308 },
    price: { sale: 850000000, lease: 55000000 },
    area: { exclusive: 101.82, supply: 125.47 },
    floors: 35,
    constructionCompany: '대우건설',
    region: '인천',
    subRegion: '연수구'
  },
  {
    id: '4',
    name: '자이 하남감일',
    address: '경기도 하남시 감일동 321-65',
    buildYear: 2021,
    units: 743,
    parking: 1115,
    maintenanceFee: 105000,
    images: [
      '/placeholder.svg',
      '/placeholder.svg'
    ],
    facilities: ['커뮤니티센터', '독서실', '카페테리아', '어린이집', '관리사무소'],
    location: { lat: 37.5394, lng: 127.2067 },
    price: { sale: 750000000, lease: 48000000 },
    area: { exclusive: 59.85, supply: 72.16 },
    floors: 22,
    constructionCompany: 'GS건설',
    region: '경기',
    subRegion: '하남시'
  },
  {
    id: '5',
    name: '래미안 강남포레스트',
    address: '서울특별시 강남구 개포동 654-32',
    buildYear: 2017,
    units: 896,
    parking: 1344,
    maintenanceFee: 145000,
    images: [
      '/placeholder.svg',
      '/placeholder.svg'
    ],
    facilities: ['실내수영장', '헬스클럽', '요가실', '스터디룸', '게스트하우스'],
    location: { lat: 37.4964, lng: 127.0664 },
    price: { sale: 1680000000, lease: 120000000 },
    area: { exclusive: 114.58, supply: 142.33 },
    floors: 28,
    constructionCompany: '삼성물산',
    region: '서울',
    subRegion: '강남구'
  },
  {
    id: '6',
    name: '아크로리버파크',
    address: '서울특별시 영등포구 여의도동 987-21',
    buildYear: 2022,
    units: 612,
    parking: 918,
    maintenanceFee: 155000,
    images: [
      '/placeholder.svg',
      '/placeholder.svg'
    ],
    facilities: ['루프탑가든', '비즈니스센터', '라운지', '컨시어지', '발레파킹'],
    location: { lat: 37.5219, lng: 126.9245 },
    price: { sale: 2100000000, lease: 150000000 },
    area: { exclusive: 127.35, supply: 158.89 },
    floors: 42,
    constructionCompany: '대림산업',
    region: '서울',
    subRegion: '영등포구'
  }
];

export const popularAreas: PopularArea[] = [
  {
    id: 'gangnam',
    name: '강남구',
    count: 245,
    averagePrice: 1450000000,
    image: '/areas/gangnam.svg'
  },
  {
    id: 'seocho',
    name: '서초구',
    count: 189,
    averagePrice: 1280000000,
    image: '/areas/seocho.svg'
  },
  {
    id: 'songpa',
    name: '송파구',
    count: 156,
    averagePrice: 985000000,
    image: '/areas/songpa.svg'
  },
  {
    id: 'mapo',
    name: '마포구',
    count: 134,
    averagePrice: 890000000,
    image: '/areas/mapo.svg'
  },
  {
    id: 'yongsan',
    name: '용산구',
    count: 98,
    averagePrice: 1650000000,
    image: '/areas/yongsan.svg'
  },
  {
    id: 'bundang',
    name: '분당구',
    count: 167,
    averagePrice: 745000000,
    image: '/areas/bundang.svg'
  }
];

export const facilities: Facility[] = [
  { id: 'pool', name: '실내수영장', description: '사계절 이용 가능한 실내 수영장', category: 'exercise' },
  { id: 'gym', name: '피트니스센터', description: '최신 운동기구를 갖춘 헬스장', category: 'exercise' },
  { id: 'parking', name: '지하주차장', description: '전 세대 주차 가능한 지하 주차공간', category: 'parking' },
  { id: 'playground', name: '놀이터', description: '어린이를 위한 안전한 놀이공간', category: 'outdoor' },
  { id: 'library', name: '도서관', description: '조용한 독서 및 학습 공간', category: 'convenience' },
  { id: 'cafe', name: '카페테리아', description: '주민 커뮤니티 공간', category: 'convenience' },
  { id: 'security', name: '경비실', description: '24시간 보안 시스템', category: 'safety' },
  { id: 'sauna', name: '사우나', description: '피로 해소를 위한 사우나 시설', category: 'exercise' }
];

export const glossaryTerms = {
  '전용면적': '개인이 독점적으로 사용할 수 있는 면적으로, 발코니 제외',
  '공급면적': '전용면적 + 공용면적의 합계',
  '관리비': '아파트 공용시설 유지를 위해 매월 납부하는 비용',
  '주차대수': '아파트에서 이용 가능한 주차공간의 총 개수',
  '세대수': '아파트 단지 내 총 가구 수',
  '건축년도': '아파트가 준공된 연도',
  '분양가': '최초 분양 시 책정된 가격',
  '시세': '현재 거래되고 있는 시장 가격'
};