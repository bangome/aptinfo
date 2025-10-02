describe('Homepage Visual Check', () => {
  beforeEach(() => {
    // 로컬 개발 서버의 실제 포트로 방문
    cy.visit('http://localhost:3004')
  })

  it('should load homepage and capture screenshot', () => {
    // 페이지 로딩 대기
    cy.get('body').should('exist')
    
    // 메인 컨텐츠가 로딩될 때까지 대기 (검색바나 주요 컴포넌트)
    cy.get('body', { timeout: 15000 }).should('be.visible')
    
    // 추가 로딩 시간 확보
    cy.wait(3000)
    
    // 전체 페이지 스크린샷
    cy.screenshot('homepage-full-page', {
      capture: 'fullPage',
      clip: null
    })
    
    // 뷰포트 스크린샷
    cy.screenshot('homepage-viewport')
    
    // 콘솔 에러 확인을 위한 리스너 설정
    cy.window().then((win) => {
      cy.wrap(win.console).as('console')
    })
  })
  
  it('should check for console errors', () => {
    cy.visit('http://localhost:3004')
    
    // 콘솔 에러 수집을 위한 스파이 설정
    cy.window().then((win) => {
      cy.stub(win.console, 'error').as('consoleError')
    })
    
    // 페이지 로딩 완료 대기
    cy.get('body').should('exist')
    cy.wait(5000)
    
    // 콘솔 에러 확인
    cy.get('@consoleError').should('not.have.been.called')
  })
  
  it('should check network requests', () => {
    // 네트워크 요청 인터셉트
    cy.intercept('GET', '**', (req) => {
      req.continue((res) => {
        if (res.statusCode >= 400) {
          cy.log(`Network Error: ${req.url} - ${res.statusCode}`)
        }
      })
    }).as('allRequests')
    
    cy.visit('http://localhost:3004')
    cy.get('body').should('exist')
    cy.wait(5000)
    
    // 모든 네트워크 요청을 대기 (최대 10개)
    for (let i = 0; i < 10; i++) {
      cy.wait('@allRequests', { timeout: 1000 }).then((interception) => {
        if (interception && interception.response) {
          expect(interception.response.statusCode).to.be.lessThan(400)
        }
      })
    }
  })
})