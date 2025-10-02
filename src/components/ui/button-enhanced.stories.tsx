/**
 * Storybook Stories for Enhanced Button Component
 */

import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button-enhanced'
import { Search, Heart, GitCompare, User } from 'lucide-react'

const meta: Meta<typeof Button> = {
  title: 'UI/Button Enhanced',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '아파트 검색 서비스에 특화된 향상된 버튼 컴포넌트입니다. 다양한 변형과 상태를 지원합니다.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'search', 'bookmark', 'bookmarked', 'compare', 'compared', 'filter', 'premium', 'cta'],
      description: '버튼의 스타일 변형'
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'xl', 'icon', 'icon-sm', 'icon-lg'],
      description: '버튼의 크기'
    },
    loading: {
      control: { type: 'boolean' },
      description: '로딩 상태 표시'
    },
    disabled: {
      control: { type: 'boolean' },
      description: '비활성화 상태'
    }
  },
}

export default meta
type Story = StoryObj<typeof meta>

// 기본 버튼들
export const Default: Story = {
  args: {
    children: '기본 버튼',
  },
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">기본</Button>
      <Button variant="secondary">보조</Button>
      <Button variant="outline">외곽선</Button>
      <Button variant="ghost">고스트</Button>
      <Button variant="link">링크</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '기본 제공되는 버튼 변형들입니다.'
      }
    }
  }
}

// 아파트 특화 변형들
export const ApartmentVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="search" icon={<Search className="h-4 w-4" />}>
        검색
      </Button>
      <Button variant="bookmark" icon={<Heart className="h-4 w-4" />}>
        북마크
      </Button>
      <Button variant="bookmarked" icon={<Heart className="h-4 w-4" />}>
        북마크됨
      </Button>
      <Button variant="compare" icon={<GitCompare className="h-4 w-4" />}>
        비교
      </Button>
      <Button variant="compared" icon={<GitCompare className="h-4 w-4" />}>
        비교됨
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '아파트 검색 서비스에 특화된 버튼 변형들입니다.'
      }
    }
  }
}

export const PremiumVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="premium" size="lg">
        프리미엄 기능
      </Button>
      <Button variant="cta" size="xl">
        지금 시작하기
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '프리미엄 기능과 CTA용 특별한 스타일의 버튼들입니다.'
      }
    }
  }
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center flex-wrap gap-4">
      <Button size="sm">작음</Button>
      <Button size="default">기본</Button>
      <Button size="lg">큼</Button>
      <Button size="xl">매우 큼</Button>
    </div>
  ),
}

export const Icons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button icon={<Search className="h-4 w-4" />} iconPosition="left">
        검색
      </Button>
      <Button icon={<User className="h-4 w-4" />} iconPosition="right">
        프로필
      </Button>
      <Button variant="outline" size="icon">
        <Heart className="h-4 w-4" />
      </Button>
    </div>
  ),
}

export const LoadingStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button loading>로딩중</Button>
      <Button loading loadingText="검색중...">
        검색
      </Button>
      <Button variant="premium" loading loadingText="처리중...">
        프리미엄 기능
      </Button>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button>정상</Button>
      <Button disabled>비활성화</Button>
      <Button loading>로딩중</Button>
    </div>
  ),
}