# UI Mockup Specification - 아파트인포 (Apartment Info Service)

## 1. Product Summary
아파트인포는 전국 아파트의 기본 정보를 한곳에서 검색·열람하고, 각 용어의 의미를 친절히 설명해 주는 웹 기반 서비스입니다. 예비 입주자, 입주민, 부동산 중개사, 투자자가 쉽고 빠르게 의사결정을 내릴 수 있도록 돕는 통합 부동산 정보 플랫폼입니다.

## 2. Target Users
- **예비 입주자** (30대 신혼부부): 매매·전세 결정을 위한 단지 정보 확인
- **현 입주민** (40대 가족): 자녀 교육환경 및 거주 단지 시설·관리 정보 파악
- **부동산 중개사**: 현장 상담용 고급 정보 및 빠른 상세 정보 제시
- **투자자**: 데이터 기반 비교·분석 및 투자 수익성 검토

## 3. Design Mood
- **Trustworthy**: 신뢰할 수 있는 부동산 정보 제공
- **Clean**: 깔끔하고 정리된 인터페이스
- **Modern**: 현대적이고 사용자 친화적인 디자인
- **Professional**: 전문적이고 세련된 비주얼
- **Accessible**: 모든 사용자가 쉽게 접근 가능한 UI

## 4. Color Palette (from T-001 Design Tokens)
- **Primary Blue**: #0ea5e9 (신뢰감, 안정감을 주는 메인 컬러)
- **Secondary Gray**: #64748b (중성적이고 전문적인 보조 컬러)
- **Accent Purple**: #d946ef (포인트 및 액센트 컬러)
- **Gray Scale**: #f9fafb ~ #111827 (텍스트 및 배경)

## 5. UI Guidelines
- **Spacing Scale**: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px
- **Grid System**: 12-column responsive grid with 24px gutters
- **Icon Style**: Lucide React icons, 24px standard size
- **Border Radius**: 8px for cards, 4px for buttons
- **Typography**: Inter font family with defined heading/body scales

## 6. User Journey Flow
```
[Home Page]
     ↓ (검색어 입력 또는 지역 선택)
[Search Results]
     ↓ (아파트 카드 클릭)
[Apartment Detail]
     ↓ (용어 호버)
[Tooltip Display]
     ↓ (비교 버튼 클릭)
[Comparison View]
```

**Key Interactions:**
- Home → Search: 검색바 또는 인기 지역 클릭
- Search → Results: 실시간 필터링 및 정렬
- Results → Detail: 아파트 카드 클릭으로 상세 페이지 이동
- Detail → Tooltip: 용어 위 호버로 설명 표시
- Detail → Comparison: 비교함에 추가 후 비교 보기

## 7. Common Components

### SearchBar
- 검색어 입력 필드 (placeholder: "아파트명 또는 지역을 검색하세요")
- 검색 아이콘 및 필터 버튼
- 자동완성 드롭다운

### ApartmentCard
- 아파트 이미지 (240x160px)
- 아파트명, 주소, 건축년도
- 주요 정보: 세대수, 주차대수, 관리비
- 북마크 아이콘, 비교함 추가 버튼

### Tooltip
- 용어 설명 팝오버 (max-width: 320px)
- 화살표 포인터 및 그림자
- 닫기 버튼 (선택적)

### ComparisonChart
- 최대 3개 아파트 비교 테이블
- 주요 지표별 차트 시각화
- 추가/제거 버튼

## 8. Sitemap

```
/ (Home)                    [Guest, User]
├── /search                 [User]
│   ├── /results           [User]
│   └── /compare           [User]
├── /apartments            [User, Broker]
│   └── /[id]              [User, Broker]
├── /favorites             [User]
├── /glossary              [Guest, User]
└── /about                 [Guest, User]
```

**Role-based Access:**
- **Guest**: Home, About, Glossary (제한된 검색)
- **User**: 전체 기능 접근
- **Broker**: 고급 필터 및 대량 데이터 접근

## 9. Page Implementations

### Home Page (/)
**Core Purpose**: 서비스 소개 및 검색 시작점
**Key Components**:
- Hero Section with SearchBar
- 인기 지역 카드 (Popular Areas)
- 최근 등록 아파트 (Recent Listings)
- 서비스 특징 (Features)

**Layout Structure**:
```
[Header Navigation]
[Hero Section + Search]
[Popular Areas Grid - 3 columns]
[Recent Listings - Horizontal Scroll]
[Features Section - 3 columns]
[Footer]
```

### Search Results (/search)
**Core Purpose**: 검색 결과 표시 및 필터링
**Key Components**:
- SearchBar with active filters
- FilterPanel (sidebar)
- ApartmentCard grid
- Pagination

**Layout Structure**:
```
[Header Navigation]
[SearchBar + Results Count]
[FilterPanel | ApartmentCard Grid (3 columns)]
[Pagination]
[Footer]
```

### Apartment Detail (/apartments/[id])
**Core Purpose**: 상세 정보 표시 및 용어 설명
**Key Components**:
- Image Gallery
- Basic Info with Tooltips
- Facilities & Amenities
- Management Info
- Location & Transportation

**Layout Structure**:
```
[Header Navigation]
[Breadcrumb]
[Image Gallery | Basic Info Panel]
[Facilities Grid - 4 columns]
[Management Details Table]
[Map & Transportation]
[Related Apartments]
[Footer]
```

## 10. Layout Components

### Header Navigation
**Applicable Routes**: All pages
**Core Components**: Logo, Search, User Menu
**Responsive Behavior**: Collapses to hamburger menu on mobile

### FilterPanel
**Applicable Routes**: /search, /compare
**Core Components**: Price Range, Building Year, Size, Amenities
**Responsive Behavior**: Slides over as drawer on mobile

### ApartmentGrid
**Applicable Routes**: /, /search, /favorites
**Core Components**: ApartmentCard components
**Responsive Behavior**:
- Desktop: 3 columns
- Tablet: 2 columns
- Mobile: 1 column

### Footer
**Applicable Routes**: All pages
**Core Components**: Links, Contact, Legal
**Responsive Behavior**: Single column on mobile

## 11. Responsive Breakpoints
- **Mobile**: < 640px (1 column layouts)
- **Tablet**: 640px - 1024px (2 column layouts)
- **Desktop**: > 1024px (3+ column layouts)
- **Large**: > 1280px (max content width)

## 12. Dummy Data Structure
```typescript
interface Apartment {
  id: string;
  name: string;
  address: string;
  buildYear: number;
  units: number;
  parking: number;
  maintenanceFee: number;
  images: string[];
  facilities: string[];
  location: { lat: number; lng: number };
}
```

This specification provides the foundation for implementing the UI-only mockup with all required components and layouts.