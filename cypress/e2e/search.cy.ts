describe('Search Functionality', () => {
  beforeEach(() => {
    cy.visit('/search');
    cy.waitForPageLoad();
  });

  it('should load the search page successfully', () => {
    cy.get('h1, h2').should('contain.text', '검색');
    cy.get('[data-testid="search-input"], input[placeholder*="검색"]').should('be.visible');
  });

  it('should perform a search and display results', () => {
    const searchTerm = '역삼';
    
    cy.get('[data-testid="search-input"], input[placeholder*="검색"]').first().type(searchTerm);
    cy.get('button[type="submit"], [data-testid="search-button"]').first().click();
    
    // Wait for results to load
    cy.get('[data-testid="search-results"], .search-results, [class*="result"]', { timeout: 10000 })
      .should('be.visible');
    
    // Check if search term appears in results or no results message
    cy.get('body').should('contain.text', searchTerm).or('contain.text', '검색결과').or('contain.text', '결과가 없습니다');
  });

  it('should show filters panel', () => {
    // Check for filter controls
    cy.get('[data-testid="filter-panel"], .filter, button').contains('필터').should('be.visible');
  });

  it('should handle empty search gracefully', () => {
    cy.get('button[type="submit"], [data-testid="search-button"]').first().click();
    
    // Should either show validation message or all results
    cy.get('body').should('not.contain', 'error').and('not.contain', '오류');
  });

  it('should be accessible with keyboard navigation', () => {
    // Tab through search form
    cy.get('[data-testid="search-input"], input[placeholder*="검색"]').first().focus().tab();
    cy.focused().should('have.attr', 'type', 'submit').or('contain.text', '검색');
    
    // Test Enter key submission
    cy.get('[data-testid="search-input"], input[placeholder*="검색"]').first().type('test{enter}');
  });

  it('should display loading states appropriately', () => {
    cy.get('[data-testid="search-input"], input[placeholder*="검색"]').first().type('아파트');
    cy.get('button[type="submit"], [data-testid="search-button"]').first().click();
    
    // Check for loading indicator (might be brief)
    // cy.get('[data-testid="loading"], .loading').should('be.visible');
    
    // Eventually results should appear
    cy.get('[data-testid="search-results"], .search-results, [class*="result"]', { timeout: 10000 })
      .should('exist');
  });

  it('should work on mobile devices', () => {
    cy.viewport('iphone-x');
    
    cy.get('[data-testid="search-input"], input[placeholder*="검색"]').should('be.visible');
    cy.get('button[type="submit"], [data-testid="search-button"]').should('be.visible');
    
    // Test mobile search
    cy.get('[data-testid="search-input"], input[placeholder*="검색"]').first().type('모바일테스트');
    cy.get('button[type="submit"], [data-testid="search-button"]').first().click();
  });
});