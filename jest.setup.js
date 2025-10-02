import '@testing-library/jest-dom'
import 'jest-axe/extend-expect'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return {
      get: jest.fn(),
    }
  },
  usePathname() {
    return '/test-path'
  },
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    const { src, alt, fill, ...rest } = props
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...rest} />
  },
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Search: () => <svg data-testid="search-icon" />,
  Heart: () => <svg data-testid="heart-icon" />,
  GitCompare: () => <svg data-testid="compare-icon" />,
  User: () => <svg data-testid="user-icon" />,
  Loader2: () => <svg data-testid="loader-icon" />,
  AlertCircle: () => <svg data-testid="alert-icon" />,
  CheckCircle2: () => <svg data-testid="check-icon" />,
  Eye: () => <svg data-testid="eye-icon" />,
  EyeOff: () => <svg data-testid="eye-off-icon" />,
  X: () => <svg data-testid="x-icon" />,
  MapPin: () => <svg data-testid="mappin-icon" />,
  Calendar: () => <svg data-testid="calendar-icon" />,
  Users: () => <svg data-testid="users-icon" />,
  Car: () => <svg data-testid="car-icon" />,
  Building2: () => <svg data-testid="building-icon" />,
  Filter: () => <svg data-testid="filter-icon" />,
  Grid: () => <svg data-testid="grid-icon" />,
  List: () => <svg data-testid="list-icon" />,
  SlidersHorizontal: () => <svg data-testid="sliders-icon" />,
  TrendingUp: () => <svg data-testid="trending-icon" />,
  Shield: () => <svg data-testid="shield-icon" />,
  Star: () => <svg data-testid="star-icon" />,
  Clock: () => <svg data-testid="clock-icon" />,
  Menu: () => <svg data-testid="menu-icon" />,
  Share: () => <svg data-testid="share-icon" />,
  ArrowLeft: () => <svg data-testid="arrow-left-icon" />,
  ChevronLeft: () => <svg data-testid="chevron-left-icon" />,
  ChevronRight: () => <svg data-testid="chevron-right-icon" />,
  HelpCircle: () => <svg data-testid="help-icon" />,
  Phone: () => <svg data-testid="phone-icon" />,
  Mail: () => <svg data-testid="mail-icon" />,
  Wrench: () => <svg data-testid="wrench-icon" />,
}))

// Global test helpers
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})