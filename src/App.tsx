import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Pause, Download, Clock, Type, Volume2, VolumeX } from 'lucide-react';
import { WaveformVisualizer } from './components/WaveformVisualizer';
import { ScrollingSubtitle } from './components/ScrollingSubtitle';
import { Subtitle } from './types';
import clsx from 'clsx';

function App() {
  const [video, setVideo] = useState<string>('');
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentSubtitle, setCurrentSubtitle] = useState<Subtitle | null>(null);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideo(url);
    }
  };

  const handleSRTUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const text = await file.text();
      const parsedSubtitles = parseSRT(text);
      setSubtitles(parsedSubtitles);
    }
  };

  const parseSRT = (srtContent: string): Subtitle[] => {
    const blocks = srtContent.trim().split('\n\n');
    return blocks.map(block => {
      const [id, timeString, ...textLines] = block.split('\n');
      const [start, end] = timeString.split(' --> ').map(timeToSeconds);
      return {
        id: parseInt(id),
        startTime: start,
        endTime: end,
        text: textLines.join('\n')
      };
    });
  };

  const timeToSeconds = (timeString: string): number => {
    const [hours, minutes, seconds] = timeString.split(':');
    const [secs, ms] = seconds.split(',');
    return parseInt(hours) * 3600 + 
           parseInt(minutes) * 60 + 
           parseInt(secs) + 
           parseInt(ms) / 1000;
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      const current = subtitles.find(sub => 
        videoRef.current!.currentTime >= sub.startTime && 
        videoRef.current!.currentTime <= sub.endTime
      );
      setCurrentSubtitle(current || null);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleWaveformTimeUpdate = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const formatTime = (seconds: number): string => {
    const pad = (num: number) => num.toString().padStart(2, '0');
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${ms.toString().padStart(3, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text">
            Video Waveform Editor
          </h1>
          <p className="text-gray-400">Professional video editing with waveform visualization</p>
        </header>

        <div className="grid grid-cols-1 gap-8">
          <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-700/50">
              <div className="flex items-center gap-4 mb-6">
                <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors">
                  <Upload size={20} />
                  <span>Upload Video</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </label>
                <label className="flex items-center gap-2 px-4 py-2 bg-purple-600 rounded-lg cursor-pointer hover:bg-purple-700 transition-colors">
                  <Type size={20} />
                  <span>Upload SRT</span>
                  <input
                    type="file"
                    accept=".srt"
                    onChange={handleSRTUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {video && (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      src={video}
                      className="w-full rounded-lg"
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={togglePlayPause}
                            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                          >
                            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                          </button>
                          <button
                            onClick={toggleMute}
                            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                          >
                            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={16} />
                          <span>{formatTime(currentTime)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <WaveformVisualizer
                      videoUrl={video}
                      currentTime={currentTime}
                      duration={duration}
                      onTimeUpdate={handleWaveformTimeUpdate}
                    />
                    <div className="bg-gray-900 rounded-b-lg p-4">
                      <ScrollingSubtitle
                        subtitle={currentSubtitle}
                        currentTime={currentTime}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-gray-700/50">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Subtitles</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
                  <Download size={20} />
                  Export SRT
                </button>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                {subtitles.map((subtitle) => (
                  <div
                    key={subtitle.id}
                    className={clsx(
                      'p-4 rounded-lg transition-colors',
                      currentSubtitle?.id === subtitle.id
                        ? 'bg-indigo-600/20 border border-indigo-500'
                        : 'bg-gray-700/30 hover:bg-gray-700/50'
                    )}
                  >
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>#{subtitle.id}</span>
                      <span>{formatTime(subtitle.startTime)} → {formatTime(subtitle.endTime)}</span>
                    </div>
                    <p className="text-gray-100">{subtitle.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;