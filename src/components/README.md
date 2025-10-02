# 아파트인포 UI 컴포넌트 라이브러리

## 개요

이 컴포넌트 라이브러리는 아파트 정보 검색 서비스에 특화된 UI 컴포넌트들을 제공합니다. shadcn/ui를 기반으로 하여 확장되었으며, TailwindCSS 디자인 토큰과 완전히 통합되어 있습니다.

## 디자인 철학

- **일관성**: 모든 컴포넌트가 동일한 디자인 토큰과 스타일 시스템을 사용
- **접근성**: WCAG 2.1 AA 수준의 접근성 가이드라인 준수
- **재사용성**: 다양한 컨텍스트에서 사용할 수 있는 유연한 컴포넌트
- **성능**: 최적화된 렌더링과 최소한의 번들 크기

## 컴포넌트 카테고리

### 1. 핵심 UI 컴포넌트 (Core UI)

#### Button Enhanced
```tsx
import { Button } from '@/components'

// 기본 사용법
<Button>버튼</Button>

// 아파트 특화 변형
<Button variant="search">검색</Button>
<Button variant="bookmark">북마크</Button>
<Button variant="bookmarked">북마크됨</Button>
<Button variant="compare">비교</Button>
<Button variant="compared">비교됨</Button>
<Button variant="premium">프리미엄</Button>
<Button variant="cta">지금 시작하기</Button>

// 로딩 상태
<Button loading loadingText="처리중...">제출</Button>

// 아이콘 포함
<Button icon={<SearchIcon />} iconPosition="left">검색</Button>
```

**Variants:**
- `default`: 기본 primary 버튼
- `search`: 검색 기능용 강조된 버튼
- `bookmark/bookmarked`: 북마크 토글 상태
- `compare/compared`: 비교 기능 토글 상태
- `premium`: 프리미엄 기능용 그라디언트 버튼
- `cta`: Call-to-Action용 애니메이션 버튼

#### Input Enhanced
```tsx
import { Input } from '@/components'

// 검색 입력창
<Input variant="search" placeholder="아파트명 또는 지역 검색" />

// 유효성 검사 상태
<Input
  variant="error"
  errorText="올바른 이메일을 입력해주세요"
  value={email}
/>

// 성공 상태
<Input
  variant="success"
  successText="사용 가능한 이메일입니다"
  value={email}
/>

// 비밀번호 입력
<Input
  isPassword
  showPasswordToggle
  placeholder="비밀번호"
/>

// 커스텀 아이콘
<Input
  icon={<UserIcon />}
  placeholder="사용자명"
/>
```

### 2. 레이아웃 컴포넌트 (Layout)

#### Card Enhanced
```tsx
import { Card, ApartmentCardWrapper, ComparisonCard, StatsCard } from '@/components'

// 아파트 카드
<ApartmentCardWrapper featured premium interactive>
  <CardContent>
    아파트 정보
  </CardContent>
</ApartmentCardWrapper>

// 비교 카드
<ComparisonCard>
  <CardContent>비교 정보</CardContent>
</ComparisonCard>

// 통계 카드
<StatsCard
  value="1,247"
  label="등록된 아파트"
  trend="up"
/>
```

#### Modal
```tsx
import { ApartmentModal, ComparisonModal, ContactModal } from '@/components'

// 아파트 상세 모달
<ApartmentModal
  title="롯데캐슬 골드파크"
  description="아파트 상세 정보"
  size="lg"
  open={isOpen}
  onOpenChange={setIsOpen}
>
  <div>아파트 상세 내용</div>
</ApartmentModal>

// 비교 모달
<ComparisonModal
  open={compareOpen}
  onOpenChange={setCompareOpen}
>
  <div>아파트 비교 내용</div>
</ComparisonModal>

// 문의 모달
<ContactModal
  open={contactOpen}
  onOpenChange={setContactOpen}
>
  <div>문의 양식</div>
</ContactModal>
```

### 3. 아파트 특화 컴포넌트 (Apartment-Specific)

#### SearchBar
```tsx
import { SearchBar } from '@/components'

<SearchBar
  onSearch={(query) => handleSearch(query)}
  onFilter={() => setShowFilters(true)}
  placeholder="아파트명 또는 지역을 검색하세요"
  showFilter={true}
/>
```

#### ApartmentCard
```tsx
import { ApartmentCard } from '@/components'

<ApartmentCard
  apartment={apartmentData}
  onBookmark={(id) => handleBookmark(id)}
  onCompare={(id) => handleCompare(id)}
  isBookmarked={false}
  isCompared={false}
/>
```

#### GlossaryTooltip
```tsx
import { GlossaryTooltip } from '@/components'

<GlossaryTooltip term="전용면적">
  전용면적
</GlossaryTooltip>
```

## 색상 시스템

컴포넌트들은 T-001에서 정의된 디자인 토큰을 사용합니다:

- **Primary**: `#0ea5e9` (신뢰감을 주는 블루)
- **Secondary**: `#64748b` (중성적인 그레이)
- **Accent**: `#d946ef` (포인트 컬러 퍼플)
- **Gray Scale**: `#f9fafb` ~ `#111827`

## 타이포그래피

- **Font Family**: Inter (system fallback 포함)
- **Heading Sizes**: h1(2.25rem) ~ h6(1rem)
- **Body Sizes**: body1(1rem), body2(0.875rem)
- **Special**: caption(0.75rem), overline(0.75rem)

## 반응형 디자인

모든 컴포넌트는 다음 브레이크포인트를 지원합니다:

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px
- **Large**: > 1280px

## 접근성 (Accessibility)

- 모든 인터랙티브 요소는 키보드 네비게이션 지원
- 적절한 ARIA 레이블과 역할 정의
- 색상 대비비 4.5:1 이상 유지
- 스크린 리더 호환성

## 성능 최적화

- Tree-shaking 지원으로 사용하지 않는 컴포넌트 제거
- 지연 로딩(Lazy Loading) 지원
- 메모이제이션 적용된 복합 컴포넌트
- 최소한의 런타임 의존성

## 사용 가이드라인

### 1. Import 방식
```tsx
// 추천: 중앙 집중식 import
import { Button, Card, Input } from '@/components'

// 비추천: 개별 파일 import
import { Button } from '@/components/ui/button'
```

### 2. 테마 일관성
항상 디자인 토큰을 사용하고 하드코딩된 색상값 사용 금지

### 3. 변형 사용
컴포넌트의 변형(variant)을 활용하여 일관된 스타일 유지

### 4. 접근성 고려
모든 form 요소에 적절한 레이블 제공

## 확장성

새로운 컴포넌트를 추가할 때는 다음 사항을 고려:

1. **일관성**: 기존 디자인 토큰과 패턴 준수
2. **재사용성**: 다양한 컨텍스트에서 사용 가능하도록 설계
3. **문서화**: 충분한 사용 예시와 가이드라인 제공
4. **테스트**: 단위 테스트와 시각적 회귀 테스트 작성

## 개발 도구

- **Storybook**: 컴포넌트 개발 및 문서화
- **Jest + RTL**: 단위 테스트
- **TypeScript**: 타입 안정성
- **ESLint + Prettier**: 코드 품질 관리