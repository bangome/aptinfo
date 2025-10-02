"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: number[];
  onValueChange?: (value: number[]) => void;
  onValueCommit?: (value: number[]) => void;
  className?: string;
}

export function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onValueChange,
  onValueCommit,
  className
}: RangeSliderProps) {
  const [localValue, setLocalValue] = React.useState(value);
  const [isDragging, setIsDragging] = React.useState<number | null>(null);
  const sliderRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isDragging === null) {
      setLocalValue(value);
    }
  }, [value, isDragging]);

  const getValueFromPosition = (clientX: number) => {
    if (!sliderRef.current) return 0;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawValue = min + percent * (max - min);
    
    // Round to step
    return Math.round(rawValue / step) * step;
  };

  const handleMouseDown = (index: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(index);
    
    const handleMouseMove = (e: MouseEvent) => {
      const newValue = getValueFromPosition(e.clientX);
      const newValues = [...localValue];
      
      if (index === 0) {
        newValues[0] = Math.min(newValue, localValue[1] - step);
      } else {
        newValues[1] = Math.max(newValue, localValue[0] + step);
      }
      
      setLocalValue(newValues);
      onValueChange?.(newValues);
    };
    
    const handleMouseUp = () => {
      setIsDragging(null);
      onValueCommit?.(localValue);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTrackClick = (e: React.MouseEvent) => {
    if (isDragging !== null) return;
    
    const newValue = getValueFromPosition(e.clientX);
    const distanceToMin = Math.abs(newValue - localValue[0]);
    const distanceToMax = Math.abs(newValue - localValue[1]);
    
    const newValues = [...localValue];
    if (distanceToMin < distanceToMax) {
      newValues[0] = Math.min(newValue, localValue[1] - step);
    } else {
      newValues[1] = Math.max(newValue, localValue[0] + step);
    }
    
    setLocalValue(newValues);
    onValueChange?.(newValues);
    onValueCommit?.(newValues);
  };

  const minPercent = ((localValue[0] - min) / (max - min)) * 100;
  const maxPercent = ((localValue[1] - min) / (max - min)) * 100;

  return (
    <div 
      ref={sliderRef}
      className={cn("relative flex w-full items-center py-4", className)}
    >
      {/* Track */}
      <div 
        className="relative h-2 w-full rounded-full bg-secondary cursor-pointer"
        onClick={handleTrackClick}
      >
        {/* Active Range */}
        <div
          className="absolute h-full bg-primary rounded-full"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`
          }}
        />
        
        {/* Min Thumb */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-6 w-6 rounded-full border-2 border-primary bg-background shadow-md cursor-grab",
            isDragging === 0 && "cursor-grabbing scale-125"
          )}
          style={{ left: `${minPercent}%` }}
          onMouseDown={handleMouseDown(0)}
          role="slider"
          aria-valuenow={localValue[0]}
          aria-valuemin={min}
          aria-valuemax={localValue[1]}
          tabIndex={0}
        />
        
        {/* Max Thumb */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-6 w-6 rounded-full border-2 border-primary bg-background shadow-md cursor-grab",
            isDragging === 1 && "cursor-grabbing scale-125"
          )}
          style={{ left: `${maxPercent}%` }}
          onMouseDown={handleMouseDown(1)}
          role="slider"
          aria-valuenow={localValue[1]}
          aria-valuemin={localValue[0]}
          aria-valuemax={max}
          tabIndex={0}
        />
      </div>
    </div>
  );
}