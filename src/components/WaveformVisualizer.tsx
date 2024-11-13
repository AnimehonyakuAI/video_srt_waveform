import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface WaveformVisualizerProps {
  videoUrl: string;
  currentTime: number;
  duration?: number;
  onTimeUpdate?: (time: number) => void;
}

export function WaveformVisualizer({ videoUrl, currentTime, duration = 0, onTimeUpdate }: WaveformVisualizerProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const timeAxisRef = useRef<HTMLCanvasElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [zoom, setZoom] = useState(50);

  const drawTimeAxis = (duration: number) => {
    const canvas = timeAxisRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set styles
    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';

    // Calculate time markers based on duration and zoom
    const interval = Math.max(1, Math.floor(duration / 10)); // Show max 10 markers
    const pixelsPerSecond = zoom;

    for (let time = 0; time <= duration; time += interval) {
      const x = time * pixelsPerSecond;
      
      // Draw tick mark
      ctx.fillRect(x, 0, 1, 6);
      
      // Format and draw time
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      ctx.fillText(timeText, x, 20);
    }
  };

  useEffect(() => {
    if (!waveformRef.current) return;

    const options = {
      container: waveformRef.current,
      waveColor: '#4f46e5',
      progressColor: '#818cf8',
      cursorColor: '#c7d2fe',
      height: 128,
      normalize: true,
      interact: true,
      minPxPerSec: zoom
    };

    // Create new instance
    const wavesurfer = WaveSurfer.create(options);
    wavesurferRef.current = wavesurfer;

    // Load audio and handle events
    wavesurfer.load(videoUrl);
    wavesurfer.on('interaction', (position) => {
      onTimeUpdate?.(position);
    });

    wavesurfer.on('ready', () => {
      drawTimeAxis(wavesurfer.getDuration());
    });

    // Cleanup function
    return () => {
      if (wavesurfer && !wavesurfer.isDestroyed) {
        wavesurfer.destroy();
      }
    };
  }, [videoUrl]);

  useEffect(() => {
    const wavesurfer = wavesurferRef.current;
    if (wavesurfer && !wavesurfer.isDestroyed) {
      wavesurfer.setTime(currentTime);
      drawTimeAxis(wavesurfer.getDuration());
    }
  }, [currentTime, zoom]);

  const handleZoom = (direction: 'in' | 'out') => {
    const wavesurfer = wavesurferRef.current;
    if (!wavesurfer || wavesurfer.isDestroyed) return;

    const newZoom = direction === 'in' ? zoom * 1.2 : zoom / 1.2;
    setZoom(newZoom);
    wavesurfer.zoom(newZoom);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="absolute right-4 top-4 flex gap-2 z-10">
          <button
            onClick={() => handleZoom('in')}
            className="p-2 bg-indigo-600 rounded-full hover:bg-indigo-700 transition-colors"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => handleZoom('out')}
            className="p-2 bg-indigo-600 rounded-full hover:bg-indigo-700 transition-colors"
          >
            <ZoomOut size={16} />
          </button>
        </div>
        <div ref={waveformRef} className="bg-gray-900 rounded-t-lg p-4" />
      </div>
      <canvas 
        ref={timeAxisRef}
        className="w-full h-8 bg-gray-900"
        height={32}
        width={2000}
      />
    </div>
  );
}