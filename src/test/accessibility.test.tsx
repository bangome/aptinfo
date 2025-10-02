/**
 * Accessibility Tests
 *
 * Tests for WCAG compliance and accessibility features
 */

import React from 'react'
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { SearchBar } from '@/components/SearchBar'
import { ApartmentCard } from '@/components/ApartmentCard'
import { Button } from '@/components/ui/button-enhanced'
import { dummyApartments } from '@/data/dummy-apartments'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

describe('Accessibility Tests', () => {

  describe('SearchBar Component', () => {
    it('should not have any accessibility violations', async () => {
      const mockOnSearch = jest.fn()
      const { container } = render(
        <SearchBar onSearch={mockOnSearch} />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA labels', () => {
      const mockOnSearch = jest.fn()
      const { getByRole } = render(
        <SearchBar onSearch={mockOnSearch} />
      )

      const searchRegion = getByRole('search')
      expect(searchRegion).toBeInTheDocument()

      const searchInput = getByRole('textbox')
      expect(searchInput).toHaveAttribute('aria-label', '아파트 검색')
    })
  })

  describe('ApartmentCard Component', () => {
    const mockApartment = dummyApartments[0]

    it('should not have any accessibility violations', async () => {
      const { container } = render(
        <ApartmentCard
          apartment={mockApartment}
          onBookmark={() => {}}
          onCompare={() => {}}
        />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper article structure', () => {
      const { getByRole } = render(
        <ApartmentCard
          apartment={mockApartment}
          onBookmark={() => {}}
          onCompare={() => {}}
        />
      )

      const article = getByRole('article')
      expect(article).toBeInTheDocument()
      expect(article).toHaveAttribute('aria-labelledby', `apartment-title-${mockApartment.id}`)
    })

    it('should have accessible bookmark and compare buttons', () => {
      const { getByRole } = render(
        <ApartmentCard
          apartment={mockApartment}
          onBookmark={() => {}}
          onCompare={() => {}}
        />
      )

      const toolbar = getByRole('toolbar')
      expect(toolbar).toBeInTheDocument()
      expect(toolbar).toHaveAttribute('aria-label', '아파트 액션')

      // Check for bookmark button with proper aria attributes
      const bookmarkButton = getByRole('button', { name: new RegExp(mockApartment.name + '.*북마크') })
      expect(bookmarkButton).toHaveAttribute('aria-pressed')
    })
  })

  describe('Enhanced Button Component', () => {
    it('should not have any accessibility violations', async () => {
      const { container } = render(
        <Button>Test Button</Button>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should be keyboard accessible', () => {
      const { getByRole } = render(
        <Button>Test Button</Button>
      )

      const button = getByRole('button')
      expect(button).toBeInTheDocument()

      // Button should be focusable
      button.focus()
      expect(button).toHaveFocus()
    })

    it('should support disabled state properly', () => {
      const { getByRole } = render(
        <Button disabled>Disabled Button</Button>
      )

      const button = getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('Color Contrast', () => {
    it('should meet WCAG color contrast requirements', async () => {
      // Test with various color combinations
      const testCases = [
        { bg: 'bg-primary', text: 'text-primary-foreground' },
        { bg: 'bg-secondary', text: 'text-secondary-foreground' },
        { bg: 'bg-muted', text: 'text-muted-foreground' },
      ]

      for (const testCase of testCases) {
        const { container } = render(
          <div className={`${testCase.bg} ${testCase.text} p-4`}>
            Test Content
          </div>
        )

        const results = await axe(container, {
          rules: {
            'color-contrast': { enabled: true }
          }
        })

        expect(results).toHaveNoViolations()
      }
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support tab navigation', () => {
      const { getByRole } = render(
        <div>
          <Button>First Button</Button>
          <Button>Second Button</Button>
          <SearchBar onSearch={() => {}} />
        </div>
      )

      const firstButton = getByRole('button', { name: 'First Button' })
      const secondButton = getByRole('button', { name: 'Second Button' })
      const searchInput = getByRole('textbox')

      // All interactive elements should be focusable
      firstButton.focus()
      expect(firstButton).toHaveFocus()

      secondButton.focus()
      expect(secondButton).toHaveFocus()

      searchInput.focus()
      expect(searchInput).toHaveFocus()
    })
  })

  describe('Screen Reader Support', () => {
    it('should provide appropriate screen reader content', () => {
      const { container } = render(
        <ApartmentCard
          apartment={mockApartment}
          onBookmark={() => {}}
          onCompare={() => {}}
        />
      )

      // Check for screen reader only content
      const srOnlyElements = container.querySelectorAll('.sr-only')
      expect(srOnlyElements.length).toBeGreaterThan(0)

      // Check that icons have aria-hidden
      const icons = container.querySelectorAll('svg[aria-hidden="true"]')
      expect(icons.length).toBeGreaterThan(0)
    })
  })
})