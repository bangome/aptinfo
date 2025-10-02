/**
 * Tests for SearchBar Component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { SearchBar } from './SearchBar'

describe('SearchBar', () => {
  const mockOnSearch = jest.fn()
  const mockOnFilter = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // 기본 렌더링 테스트
  it('renders search input with default placeholder', () => {
    render(<SearchBar onSearch={mockOnSearch} />)

    const searchInput = screen.getByPlaceholderText('아파트명 또는 지역을 검색하세요')
    expect(searchInput).toBeInTheDocument()
  })

  it('renders with custom placeholder', () => {
    const customPlaceholder = '커스텀 플레이스홀더'
    render(<SearchBar onSearch={mockOnSearch} placeholder={customPlaceholder} />)

    expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument()
  })

  // 검색 기능 테스트
  it('calls onSearch when form is submitted', async () => {
    const user = userEvent.setup()
    render(<SearchBar onSearch={mockOnSearch} />)

    const searchInput = screen.getByRole('textbox')
    const testQuery = '강남구 아파트'

    await user.type(searchInput, testQuery)
    await user.keyboard('{Enter}')

    expect(mockOnSearch).toHaveBeenCalledWith(testQuery)
  })

  it('calls onSearch when Enter key is pressed', async () => {
    const user = userEvent.setup()
    render(<SearchBar onSearch={mockOnSearch} />)

    const searchInput = screen.getByRole('textbox')
    const testQuery = '서초구'

    await user.type(searchInput, testQuery)
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter', charCode: 13 })

    expect(mockOnSearch).toHaveBeenCalledWith(testQuery)
  })

  it('updates input value when typing', async () => {
    const user = userEvent.setup()
    render(<SearchBar onSearch={mockOnSearch} />)

    const searchInput = screen.getByRole('textbox') as HTMLInputElement
    const testQuery = '테스트 검색어'

    await user.type(searchInput, testQuery)

    expect(searchInput.value).toBe(testQuery)
  })

  // 필터 기능 테스트
  describe('filter functionality', () => {
    it('shows filter button by default', () => {
      render(<SearchBar onSearch={mockOnSearch} />)

      const filterButton = screen.getByRole('button', { name: /필터/i })
      expect(filterButton).toBeInTheDocument()
    })

    it('hides filter button when showFilter is false', () => {
      render(<SearchBar onSearch={mockOnSearch} showFilter={false} />)

      const filterButton = screen.queryByRole('button', { name: /필터/i })
      expect(filterButton).not.toBeInTheDocument()
    })

    it('calls onFilter when filter button is clicked', async () => {
      const user = userEvent.setup()
      render(<SearchBar onSearch={mockOnSearch} onFilter={mockOnFilter} />)

      const filterButton = screen.getByRole('button', { name: /필터/i })
      await user.click(filterButton)

      expect(mockOnFilter).toHaveBeenCalledTimes(1)
    })
  })

  // 아이콘 테스트
  it('displays search icon', () => {
    render(<SearchBar onSearch={mockOnSearch} />)

    const searchIcon = screen.getByTestId('search-icon')
    expect(searchIcon).toBeInTheDocument()
  })

  it('displays filter icon in filter button', () => {
    render(<SearchBar onSearch={mockOnSearch} />)

    const filterIcon = screen.getByTestId('filter-icon')
    expect(filterIcon).toBeInTheDocument()
  })

  // 스타일링 테스트
  it('applies custom className', () => {
    render(<SearchBar onSearch={mockOnSearch} className="custom-search-bar" />)

    const searchContainer = screen.getByRole('textbox').closest('div')?.parentElement
    expect(searchContainer).toHaveClass('custom-search-bar')
  })

  // 접근성 테스트
  describe('accessibility', () => {
    it('has correct input role', () => {
      render(<SearchBar onSearch={mockOnSearch} />)

      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('filter button is focusable', async () => {
      const user = userEvent.setup()
      render(<SearchBar onSearch={mockOnSearch} />)

      const filterButton = screen.getByRole('button', { name: /필터/i })
      await user.tab()
      await user.tab() // 첫 번째 tab은 input, 두 번째는 button

      expect(filterButton).toHaveFocus()
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<SearchBar onSearch={mockOnSearch} />)

      const searchInput = screen.getByRole('textbox')

      await user.tab()
      expect(searchInput).toHaveFocus()

      await user.tab()
      const filterButton = screen.getByRole('button', { name: /필터/i })
      expect(filterButton).toHaveFocus()
    })
  })

  // 에지 케이스 테스트
  describe('edge cases', () => {
    it('handles empty search query', async () => {
      const user = userEvent.setup()
      render(<SearchBar onSearch={mockOnSearch} />)

      const searchInput = screen.getByRole('textbox')
      await user.type(searchInput, '{Enter}')

      expect(mockOnSearch).toHaveBeenCalledWith('')
    })

    it('handles whitespace-only search query', async () => {
      const user = userEvent.setup()
      render(<SearchBar onSearch={mockOnSearch} />)

      const searchInput = screen.getByRole('textbox')
      await user.type(searchInput, '   ')
      await user.keyboard('{Enter}')

      expect(mockOnSearch).toHaveBeenCalledWith('   ')
    })

    it('handles special characters in search query', async () => {
      const user = userEvent.setup()
      render(<SearchBar onSearch={mockOnSearch} />)

      const searchInput = screen.getByRole('textbox')
      const specialQuery = '강남구 @#$% 아파트 123'

      await user.type(searchInput, specialQuery)
      await user.keyboard('{Enter}')

      expect(mockOnSearch).toHaveBeenCalledWith(specialQuery)
    })

    it('handles onFilter not being provided', () => {
      render(<SearchBar onSearch={mockOnSearch} />)

      const filterButton = screen.getByRole('button', { name: /필터/i })
      // 에러 없이 렌더링되어야 함
      expect(filterButton).toBeInTheDocument()
    })
  })

  // 성능 테스트
  it('does not cause unnecessary re-renders on input change', async () => {
    const user = userEvent.setup()
    const renderSpy = jest.fn()

    const TestWrapper = () => {
      renderSpy()
      return <SearchBar onSearch={mockOnSearch} />
    }

    render(<TestWrapper />)

    const searchInput = screen.getByRole('textbox')
    await user.type(searchInput, 'test')

    // 초기 렌더링 + 각 입력마다 한 번씩 = 5번
    expect(renderSpy).toHaveBeenCalledTimes(5)
  })
})