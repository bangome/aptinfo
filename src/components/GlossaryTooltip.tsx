'use client';

import { HelpCircle, X } from 'lucide-react';
import { useState } from 'react';
import { glossaryTerms } from '@/data/dummy-apartments';

interface GlossaryTooltipProps {
  term: keyof typeof glossaryTerms;
  children: React.ReactNode;
  className?: string;
}

export function GlossaryTooltip({ term, children, className = '' }: GlossaryTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const description = glossaryTerms[term];
  if (!description) return <>{children}</>;

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  return (
    <>
      <span
        className={`inline-flex items-center gap-1 cursor-help border-b border-dotted border-primary hover:border-solid transition-all ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
        <HelpCircle className="h-3 w-3 text-primary opacity-70" />
      </span>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Tooltip */}
          <div
            className="fixed z-50 bg-white border border-border rounded-lg shadow-lg p-3 max-w-xs"
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
              transform: 'translateX(-50%) translateY(-100%)'
            }}
          >
            {/* Arrow */}
            <div
              className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-white"
              style={{ marginTop: '-1px' }}
            />
            <div
              className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-border"
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-body1 text-foreground">{term}</h4>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <p className="text-body2 text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}