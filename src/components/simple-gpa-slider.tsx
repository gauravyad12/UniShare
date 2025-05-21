"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SimpleGPASliderProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onDragEnd?: (value: string) => void;
  className?: string;
}

export function SimpleGPASlider({ id, value, onChange, onDragEnd, className = "" }: SimpleGPASliderProps) {
  // Convert GPA value to percentage for styling
  const gpaToPercent = (gpa: number) => (gpa / 4) * 100;

  // Current percentage (0-100) based on GPA value (0-4)
  const [percent, setPercent] = useState(gpaToPercent(parseFloat(value)));

  // Update percent when value changes externally
  useEffect(() => {
    setPercent(gpaToPercent(parseFloat(value)));
  }, [value]);

  // Handle slider change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const newPercent = parseFloat(newValue);
    setPercent(newPercent);

    // Convert percent to GPA (0-4 scale with 2 decimal places)
    const newGpa = ((newPercent / 100) * 4).toFixed(2);
    onChange(newGpa);
  };

  // Handle slider release
  const handleChangeEnd = () => {
    if (onDragEnd) {
      const newGpa = ((percent / 100) * 4).toFixed(2);
      onDragEnd(newGpa);
    }
  };

  return (
    <div className={cn("relative py-4", className)}>
      {/* Custom styled track */}
      <div className="relative h-2 w-full rounded-full bg-primary/20">
        {/* Fill track based on current value */}
        <div
          className="absolute h-full bg-primary rounded-full"
          style={{ width: `${percent}%` }}
        />

        {/* Thumb indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border border-primary/50 bg-background shadow"
          style={{ left: `${percent}%`, transform: 'translateX(-50%) translateY(-50%)' }}
        />
      </div>

      {/* Actual range input (invisible but functional) */}
      <input
        type="range"
        id={id}
        min="0"
        max="100"
        step="0.25"
        value={percent}
        onChange={handleChange}
        onMouseUp={handleChangeEnd}
        onTouchEnd={handleChangeEnd}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        aria-label={`GPA slider for ${id}`}
      />
    </div>
  );
}
