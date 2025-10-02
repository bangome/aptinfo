describe('Home Page', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForPageLoad();
  });

  it('should load the home page successfully', () => {
    cy.get('h1').should('contain', '아파트인포');
    cy.get('body').should('be.visible');
  });

  it('should have proper meta tags for SEO', () => {
    cy.document().its('head').find('title').should('contain', '아파트');
    cy.get('meta[name="description"]').should('exist');
    cy.get('meta[name="viewport"]').should('exist');
  });

  it('should have accessible navigation', () => {
    cy.get('nav').should('be.visible');
    cy.get('a[href="/search"]').should('be.visible').and('contain', '검색');
  });

  it('should be responsive on mobile devices', () => {
    cy.viewport('iphone-x');
    cy.get('body').should('be.visible');
    cy.get('nav').should('be.visible');
    
    cy.viewport('macbook-13');
    cy.get('body').should('be.visible');
  });

  it('should have working search functionality', () => {
    cy.get('[data-testid="search-input"], input[placeholder*="검색"]').first().should('be.visible');
    cy.get('button[type="submit"], [data-testid="search-button"]').first().should('be.visible');
  });

  it('should check basic accessibility', () => {
    // Check for proper heading hierarchy
    cy.get('h1').should('have.length.at.least', 1);
    
    // Check for alt text on images
    cy.get('img').each(($img) => {
      cy.wrap($img).should('have.attr', 'alt');
    });
    
    // Check for proper button/link text
    cy.get('button, a').each(($el) => {
      const text = $el.text().trim();
      const ariaLabel = $el.attr('aria-label');
      expect(text.length > 0 || ariaLabel?.length > 0).to.be.true;
    });
  });
});