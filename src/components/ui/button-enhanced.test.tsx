/**
 * Tests for Enhanced Button Component
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Button } from './button-enhanced'
import { Search, Heart } from 'lucide-react'

describe('Button Enhanced', () => {
  // 기본 렌더링 테스트
  it('renders button with text', () => {
    render(<Button>테스트 버튼</Button>)
    expect(screen.getByRole('button', { name: '테스트 버튼' })).toBeInTheDocument()
  })

  // 클릭 이벤트 테스트
  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>클릭 테스트</Button>)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  // 변형(variants) 테스트
  describe('variants', () => {
    it('applies default variant class', () => {
      render(<Button variant="default">기본</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-primary')
    })

    it('applies search variant class', () => {
      render(<Button variant="search">검색</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-primary')
    })

    it('applies bookmark variant class', () => {
      render(<Button variant="bookmark">북마크</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-red-50', 'text-red-600')
    })

    it('applies bookmarked variant class', () => {
      render(<Button variant="bookmarked">북마크됨</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-red-500', 'text-white')
    })

    it('applies premium variant class', () => {
      render(<Button variant="premium">프리미엄</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-gradient-to-r')
    })

    it('applies cta variant class', () => {
      render(<Button variant="cta">CTA</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-gradient-to-r')
    })
  })

  // 크기(sizes) 테스트
  describe('sizes', () => {
    it('applies default size class', () => {
      render(<Button size="default">기본 크기</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-9', 'px-4', 'py-2')
    })

    it('applies small size class', () => {
      render(<Button size="sm">작은 크기</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-8')
    })

    it('applies large size class', () => {
      render(<Button size="lg">큰 크기</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-10')
    })

    it('applies xl size class', () => {
      render(<Button size="xl">매우 큰 크기</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-12')
    })
  })

  // 로딩 상태 테스트
  describe('loading state', () => {
    it('shows loading spinner when loading is true', () => {
      render(<Button loading>로딩중</Button>)
      const button = screen.getByRole('button')

      // 로딩 스피너가 있는지 확인
      expect(button.querySelector('svg')).toBeInTheDocument()
      expect(button).toHaveTextContent('처리중...')
    })

    it('shows custom loading text', () => {
      render(<Button loading loadingText="검색중...">검색</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('검색중...')
    })

    it('disables button when loading', () => {
      render(<Button loading>로딩중</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })
  })

  // 아이콘 테스트
  describe('icons', () => {
    it('renders icon on the left by default', () => {
      render(
        <Button icon={<Search data-testid="search-icon" />}>
          검색
        </Button>
      )

      const button = screen.getByRole('button')
      const icon = screen.getByTestId('search-icon')

      expect(icon).toBeInTheDocument()
      expect(icon.parentElement).toHaveClass('mr-2')
    })

    it('renders icon on the right when specified', () => {
      render(
        <Button
          icon={<Search data-testid="search-icon" />}
          iconPosition="right"
        >
          검색
        </Button>
      )

      const icon = screen.getByTestId('search-icon')
      expect(icon.parentElement).toHaveClass('ml-2')
    })
  })

  // 비활성화 상태 테스트
  describe('disabled state', () => {
    it('disables button when disabled prop is true', () => {
      render(<Button disabled>비활성화</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('does not trigger click when disabled', () => {
      const handleClick = jest.fn()
      render(<Button disabled onClick={handleClick}>비활성화</Button>)

      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  // 접근성 테스트
  describe('accessibility', () => {
    it('has correct role', () => {
      render(<Button>접근성 테스트</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('is focusable', () => {
      render(<Button>포커스 테스트</Button>)
      const button = screen.getByRole('button')
      button.focus()
      expect(button).toHaveFocus()
    })

    it('is not focusable when disabled', () => {
      render(<Button disabled>비활성화 포커스</Button>)
      const button = screen.getByRole('button')
      button.focus()
      expect(button).not.toHaveFocus()
    })
  })

  // asChild prop 테스트
  it('renders as child element when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">링크</a>
      </Button>
    )

    const link = screen.getByRole('link')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test')
  })

  // 커스텀 클래스 테스트
  it('applies custom className', () => {
    render(<Button className="custom-class">커스텀</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })
})