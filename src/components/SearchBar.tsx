'use client';

import { Filter } from 'lucide-react';
import { Input } from '@/components/ui/input-enhanced';
import { Button } from '@/components/ui/button-enhanced';
import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFilter?: () => void;
  placeholder?: string;
  showFilter?: boolean;
  className?: string;
}

export function SearchBar({
  onSearch,
  onFilter,
  placeholder = "아파트명 또는 지역을 검색하세요",
  showFilter = true,
  className = ""
}: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch(query);
    }
  };

  return (
    <div className={`relative flex items-center gap-2 ${className}`} role="search">
      <form onSubmit={handleSubmit} className="flex-1 relative">
        <Input
          variant="search"
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="rounded-lg"
          aria-label="아파트 검색"
          aria-describedby={showFilter ? "filter-help" : undefined}
        />
      </form>

      {showFilter && (
        <>
          <Button
            variant="filter"
            size="lg"
            icon={<Filter className="h-4 w-4" aria-hidden="true" />}
            onClick={onFilter}
            aria-label="검색 필터 열기"
            aria-describedby="filter-help"
          >
            필터
          </Button>
          <div id="filter-help" className="sr-only">
            검색 조건을 세부적으로 설정할 수 있습니다
          </div>
        </>
      )}
    </div>
  );
}