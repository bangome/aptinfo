// In Next.js, this file would be called: app/providers.tsx
'use client';

// Since QueryClientProvider relies on useContext under the hood, we have to put 'use client' on top
import {
  isServer,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 아파트 정보는 자주 변경되지 않으므로 긴 staleTime 설정
        staleTime: 5 * 60 * 1000, // 5분
        // 캐시 유지 시간 연장 (가비지 컬렉션 방지)
        gcTime: 10 * 60 * 1000, // 10분 (구 cacheTime)
        // 재시도 정책 최적화
        retry: (failureCount, error) => {
          // 404 에러는 재시도하지 않음
          if (error instanceof Error && error.message.includes('404')) {
            return false;
          }
          // 최대 2번까지만 재시도
          return failureCount < 2;
        },
        // 네트워크 재연결 시 자동 재fetch 비활성화 (배터리 절약)
        refetchOnReconnect: false,
        // 윈도우 포커스 시 재fetch 비활성화 (불필요한 요청 방지)
        refetchOnWindowFocus: false,
        // 마운트 시 재fetch는 staleTime이 지난 경우만
        refetchOnMount: 'stale',
      },
      mutations: {
        // 뮤테이션 재시도 정책
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export default function Providers({ children }: { children: React.ReactNode }) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
