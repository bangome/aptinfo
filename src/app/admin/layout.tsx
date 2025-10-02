/**
 * 관리자 페이지 레이아웃
 */

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">관리자 도구</h1>
            <p className="text-gray-600">시스템 모니터링 및 관리</p>
          </div>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}