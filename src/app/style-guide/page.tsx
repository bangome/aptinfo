'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button-enhanced';
import { Badge } from '@/components/ui/badge';
import {
  Palette,
  Type,
  Layout,
  Accessibility,
  Code2,
  Smartphone,
  BookOpen,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function StyleGuidePage() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    {
      id: 'overview',
      title: '개요',
      description: '디자인 시스템 소개',
      icon: BookOpen,
      href: '#overview'
    },
    {
      id: 'tokens',
      title: '디자인 토큰',
      description: '색상, 타이포그래피, 간격',
      icon: Palette,
      href: '/style-guide/design-tokens'
    },
    {
      id: 'components',
      title: '컴포넌트',
      description: 'UI 컴포넌트 라이브러리',
      icon: Layout,
      href: '/style-guide/components'
    },
    {
      id: 'examples',
      title: '예제 및 패턴',
      description: '실제 사용 예제',
      icon: Code2,
      href: '/style-guide/examples'
    },
    {
      id: 'responsive',
      title: '반응형 디자인',
      description: '모바일 퍼스트 가이드라인',
      icon: Smartphone,
      href: '/style-guide/responsive-design'
    },
    {
      id: 'accessibility',
      title: '접근성',
      description: '웹 접근성 가이드라인',
      icon: Accessibility,
      href: '/style-guide/accessibility'
    }
  ];

  const quickLinks = [
    { title: 'GitHub 저장소', href: '#', icon: ExternalLink },
    { title: 'Figma 디자인', href: '#', icon: ExternalLink },
    { title: 'NPM 패키지', href: '#', icon: ExternalLink }
  ];

  const stats = [
    { label: '컴포넌트', value: '25+' },
    { label: '디자인 토큰', value: '100+' },
    { label: '접근성 등급', value: 'AA' },
    { label: '브라우저 지원', value: '95%' }
  ];

  return (
    <div className="container px-4 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            아파트인포 스타일 가이드
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            일관되고 접근 가능한 사용자 인터페이스를 구축하기 위한
            디자인 시스템과 컴포넌트 라이브러리입니다.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 빠른 링크 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {quickLinks.map((link, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <Link
                  href={link.href}
                  className="flex items-center justify-between text-sm font-medium hover:text-primary focus-outline"
                >
                  <span>{link.title}</span>
                  <link.icon className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 주요 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {sections.map((section) => {
            const Icon = section.icon;
            const isOverview = section.id === 'overview';

            return (
              <Card
                key={section.id}
                className="hover:shadow-md transition-shadow group"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{section.title}</h3>
                      <p className="text-sm text-muted-foreground font-normal">
                        {section.description}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isOverview ? (
                    <Button
                      variant="ghost"
                      className="w-full justify-between group-hover:bg-muted"
                      onClick={() => setActiveSection('overview')}
                    >
                      자세히 보기
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Link href={section.href}>
                      <Button
                        variant="ghost"
                        className="w-full justify-between group-hover:bg-muted focus-outline"
                      >
                        자세히 보기
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 개요 섹션 */}
        {activeSection === 'overview' && (
          <Card className="mb-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                디자인 시스템 개요
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">설계 원칙</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">일관성 (Consistency)</h4>
                    <p className="text-sm text-muted-foreground">
                      모든 인터페이스에서 일관된 시각적 언어와 상호작용 패턴을 유지합니다.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">접근성 (Accessibility)</h4>
                    <p className="text-sm text-muted-foreground">
                      WCAG 2.1 AA 표준을 준수하여 모든 사용자가 접근할 수 있도록 합니다.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">반응형 (Responsive)</h4>
                    <p className="text-sm text-muted-foreground">
                      모바일 퍼스트 접근법으로 모든 디바이스에서 최적의 경험을 제공합니다.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">재사용성 (Reusability)</h4>
                    <p className="text-sm text-muted-foreground">
                      모듈화된 컴포넌트로 개발 효율성과 유지보수성을 높입니다.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">기술 스택</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">React 18</Badge>
                  <Badge variant="secondary">Next.js 15</Badge>
                  <Badge variant="secondary">TypeScript</Badge>
                  <Badge variant="secondary">Tailwind CSS</Badge>
                  <Badge variant="secondary">Radix UI</Badge>
                  <Badge variant="secondary">MDX</Badge>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">프로젝트 구조</h3>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  <div>src/</div>
                  <div>├── components/ui/     # 기본 UI 컴포넌트</div>
                  <div>├── docs/             # 스타일 가이드 문서</div>
                  <div>├── utils/            # 유틸리티 함수</div>
                  <div>├── app/              # Next.js 앱 라우터</div>
                  <div>└── styles/           # 글로벌 스타일</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">시작하기</h3>
                <p className="text-muted-foreground mb-4">
                  아파트인포 스타일 가이드를 프로젝트에 적용하려면 다음 단계를 따르세요:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>
                    <Link href="/style-guide/design-tokens" className="text-primary hover:underline">
                      디자인 토큰
                    </Link>을 검토하여 색상, 타이포그래피, 간격 체계를 이해하세요.
                  </li>
                  <li>
                    <Link href="/style-guide/components" className="text-primary hover:underline">
                      컴포넌트 라이브러리
                    </Link>에서 사용 가능한 UI 컴포넌트를 확인하세요.
                  </li>
                  <li>
                    <Link href="/style-guide/examples" className="text-primary hover:underline">
                      예제 및 패턴
                    </Link>에서 실제 구현 방법을 학습하세요.
                  </li>
                  <li>
                    <Link href="/style-guide/accessibility" className="text-primary hover:underline">
                      접근성 가이드라인
                    </Link>을 따라 모든 사용자가 접근할 수 있는 인터페이스를 만드세요.
                  </li>
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/style-guide/design-tokens">
                  <Button className="w-full sm:w-auto">
                    디자인 토큰 보기
                  </Button>
                </Link>
                <Link href="/style-guide/components">
                  <Button variant="outline" className="w-full sm:w-auto">
                    컴포넌트 라이브러리
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 업데이트 로그 */}
        <Card>
          <CardHeader>
            <CardTitle>최근 업데이트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">v1.0.0 - 초기 스타일 가이드 구축</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    디자인 토큰, 컴포넌트 라이브러리, 접근성 가이드라인 문서화 완료
                  </p>
                </div>
                <Badge variant="outline">2024-01-15</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}