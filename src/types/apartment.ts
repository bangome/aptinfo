export interface Apartment {
  id: string;
  kaptCode: string;  // 아파트 정부 코드 (URL에 사용)
  name: string;
  address: string;
  buildYear: number;
  units: number;
  parking: number | { total: number; household: number };
  maintenanceFee: number;
  images: string[];
  facilities: string[];
  educationFacilities?: string[];
  welfareFacilities?: string[];
  location?: { lat: number; lng: number };
  price?: {
    sale?: number;
    lease?: number;
    rent?: { deposit: number; monthly: number };
  };
  area: {
    exclusive: number;
    supply: number;
  };
  floors: number | { underground: number; ground: number; total: number };
  constructionCompany: string;
  region: string;
  subRegion: string;
  description?: string;
  keyFeatures?: string[];
  nearbyFacilities?: {
    schools: string[];
    transport: string[];
    hospitals: string[];
    shopping: string[];
  };
  transportation?: {
    subway?: {
      line?: string;
      station?: string;
      distance?: string;
    };
    bus?: {
      distance?: string;
    };
  };
  contact?: {
    phone: string;
    agent: string;
  };
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  formattedApprovalDate?: string;
}

export interface SearchFilters {
  query?: string;
  region?: string;
  sido?: string;        // 시도 (서버 사이드 필터)
  sigungu?: string;     // 시군구 (서버 사이드 필터)
  buildYearRange?: [number, number];
  priceRange?: [number, number];
  areaRange?: [number, number];
  unitsRange?: [number, number];        // 세대수 범위 (서버 사이드 필터)
  parkingRange?: [number, number];      // 주차대수 범위 (서버 사이드 필터)
  exclusiveAreaRange?: [number, number]; // 전용면적 범위 (서버 사이드 필터)
  facilities?: string[];
  limit?: number;
  page?: number;
  sortBy?: string;
  dealType?: 'sale' | 'lease' | 'rent' | 'short-term' | 'all';
}

export interface PopularArea {
  id: string;
  name: string;
  count: number;
  averagePrice: number;
  image: string;
}

export interface Facility {
  id: string;
  name: string;
  description: string;
  category: 'convenience' | 'exercise' | 'outdoor' | 'safety' | 'parking';
}