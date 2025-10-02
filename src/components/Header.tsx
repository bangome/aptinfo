'use client';

import { Building2, Search, Heart, User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import Link from 'next/link';
import { SearchBar } from './SearchBar';
import { useRouter } from 'next/navigation';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const router = useRouter();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setShowMobileSearch(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setShowMobileSearch(false);
  };

  const toggleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="text-h5 font-bold text-foreground">아파트인포</span>
        </Link>

        {/* Desktop Search */}
        <div className="hidden md:block flex-1 max-w-md mx-8">
          <SearchBar
            onSearch={handleSearch}
            showFilter={false}
            placeholder="아파트명 또는 지역 검색"
          />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4">
          <Link
            href="/search"
            className="text-body1 text-muted-foreground hover:text-foreground transition-colors"
          >
            전체검색
          </Link>
          <Link
            href="/favorites"
            className="text-body1 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Heart className="h-4 w-4" />
            관심목록
          </Link>
          <Link
            href="/glossary"
            className="text-body1 text-muted-foreground hover:text-foreground transition-colors"
          >
            용어사전
          </Link>
          <Button variant="outline" size="sm">
            <User className="h-4 w-4 mr-2" />
            로그인
          </Button>
        </nav>

        {/* Mobile buttons */}
        <div className="flex md:hidden items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobileSearch}
            className="p-2"
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobileMenu}
            className="p-2"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Search */}
      {showMobileSearch && (
        <div className="md:hidden border-t bg-background p-4">
          <SearchBar
            onSearch={handleSearch}
            showFilter={false}
            placeholder="아파트명 또는 지역 검색"
          />
        </div>
      )}

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="flex flex-col space-y-1 p-4">
            <Link
              href="/search"
              className="text-body1 text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              전체검색
            </Link>
            <Link
              href="/favorites"
              className="text-body1 text-muted-foreground hover:text-foreground transition-colors py-2 flex items-center gap-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Heart className="h-4 w-4" />
              관심목록
            </Link>
            <Link
              href="/glossary"
              className="text-body1 text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              용어사전
            </Link>
            <div className="pt-2 border-t">
              <Button variant="outline" size="sm" className="w-full">
                <User className="h-4 w-4 mr-2" />
                로그인
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}