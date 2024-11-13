import React, { useEffect, useRef } from 'react';
import { Subtitle } from '../types';

interface ScrollingSubtitleProps {
  subtitle: Subtitle | null;
  currentTime: number;
}

export function ScrollingSubtitle({ subtitle, currentTime }: ScrollingSubtitleProps) {
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!subtitle || !spanRef.current) return;

    const duration = subtitle.endTime - subtitle.startTime;
    const animationDelay = subtitle.startTime - currentTime;
    const span = spanRef.current;

    span.style.animationDuration = `${duration}s`;

    if (animationDelay < 0) {
      const elapsedTimeRatio = -animationDelay / duration;
      span.style.animationDelay = '0s';
      span.style.animationTimingFunction = `linear ${elapsedTimeRatio * 100}%`;
    } else {
      span.style.animationDelay = `${animationDelay}s`;
      span.style.animationTimingFunction = 'linear';
    }

    span.style.animationPlayState = 'running';
  }, [subtitle, currentTime]);

  if (!subtitle) return null;

  return (
    <div className="whitespace-nowrap overflow-hidden relative w-full h-8">
      <span
        ref={spanRef}
        className="absolute inline-block animate-scroll text-lg font-medium"
      >
        {subtitle.text}
      </span>
    </div>
  );
}