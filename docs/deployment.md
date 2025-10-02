# Deployment and CI/CD Setup Guide

## Overview

This document outlines the complete development environment and deployment pipeline setup for the 아파트인포 (ApartInfo) project.

## 🔧 Development Environment

### Prerequisites

- Node.js 20+
- npm or yarn
- Git

### Local Setup

1. Clone the repository
2. Copy `.env.example` to `.env.local`
3. Fill in the required environment variables
4. Run `npm install`
5. Run `npm run dev`

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes | `eyJ...` |
| `NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY` | Government API key | Yes | `ABC123...` |

⚠️ **Security Notes:**
- Never commit `.env.local` to version control
- Service role keys should NEVER be exposed to client-side code
- Use GitHub Secrets for production deployment
- Only use `NEXT_PUBLIC_` prefix for client-safe variables

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow

The project uses a comprehensive CI/CD pipeline with the following stages:

#### 1. Security Scan
- **Trivy vulnerability scanner**: Scans for security vulnerabilities
- **TruffleHog secret detection**: Prevents API keys from being committed
- **CodeQL analysis**: Static code analysis for security issues

#### 2. Test and Lint
- **ESLint**: Code quality and style enforcement
- **TypeScript**: Type checking
- **Jest**: Unit testing with coverage reports
- **Codecov integration**: Coverage reporting

#### 3. Build
- **Next.js build**: Production build with optimizations
- **Artifact upload**: Build files stored for deployment

#### 4. E2E Testing
- **Cypress**: End-to-end testing
- **Accessibility testing**: WCAG compliance checks
- **Cross-browser testing**: Chrome, Firefox, Edge

#### 5. Deployment
- **Vercel**: Production deployment
- **Preview deployments**: For pull requests
- **Lighthouse audits**: Performance monitoring

### Required GitHub Secrets

Set these in your GitHub repository settings under `Settings > Secrets and variables > Actions`:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_DATA_GO_KR_SERVICE_KEY
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

## 📋 Testing Strategy

### Unit Tests
```bash
npm run test          # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### E2E Tests
```bash
npm run cypress:open  # Interactive mode
npm run cypress:run   # Headless mode
npm run e2e          # Full E2E pipeline
```

### Test Coverage
- **Target**: 80%+ code coverage
- **Components**: All UI components tested
- **API routes**: Integration tests
- **Accessibility**: WCAG 2.1 AA compliance

## 🔒 Security Measures

### Secret Management
- Environment variables in GitHub Secrets
- No hardcoded API keys or credentials
- Automatic secret scanning in CI/CD

### Security Headers
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()

### Vulnerability Scanning
- **Trivy**: Container and filesystem scanning
- **CodeQL**: Static application security testing
- **npm audit**: Dependency vulnerability checks

## 🌐 Deployment

### Vercel Deployment

1. **Automatic Deployment**
   - Push to `main`/`master` triggers production deployment
   - Pull requests create preview deployments

2. **Manual Deployment**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

3. **Environment Configuration**
   - Variables set in `vercel.json`
   - Secrets managed via Vercel dashboard

### Performance Optimization
- **CDN**: Global content delivery
- **Image optimization**: Next.js Image component
- **Code splitting**: Automatic route-based splitting
- **Caching**: API route caching strategies

## 🔄 Continuous Integration

### Branch Protection Rules
- Require PR reviews
- Require status checks to pass
- Require branches to be up to date
- Require linear history

### Automated Checks
- ✅ Lint and format
- ✅ Type checking
- ✅ Unit tests
- ✅ Security scanning
- ✅ Build verification
- ✅ E2E tests

## 📊 Monitoring and Analytics

### Performance Monitoring
- **Lighthouse CI**: Automated performance audits
- **Web Vitals**: Core web vitals tracking
- **Bundle analyzer**: Bundle size monitoring

### Error Tracking
- Production error boundaries
- Client-side error logging
- API error monitoring

## 🚨 Incident Response

### Rollback Strategy
1. Identify issue via monitoring
2. Rollback to previous deployment
3. Fix issue in development
4. Deploy fix with full CI/CD pipeline

### Emergency Procedures
- Direct Vercel deployment for critical fixes
- Hotfix branch workflow
- Communication protocols

## 📚 Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Vercel Platform Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cypress Documentation](https://docs.cypress.io)

---

Last updated: January 2025