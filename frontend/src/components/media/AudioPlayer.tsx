import React, { useState, useRef } from "react";
import { Play, Pause, Download, Volume2, Music, RotateCcw } from "lucide-react";

interface AudioPlayerProps {
  src: string;
  title?: string;
  fileSize?: number;
  downloadUrl?: string;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title = "Voice Recording",
  fileSize,
  downloadUrl,
  className = "",
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const restartAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div
      className={`rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/70 to-blue-50/50 p-3 shadow-xs space-y-2.5 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <Volume2 className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <h5 className="text-xs font-bold text-slate-800 truncate">{title}</h5>
            {fileSize && (
              <span className="text-[10px] text-slate-400">
                {(fileSize / 1024).toFixed(1)} KB
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Playback speed toggle */}
          <button
            type="button"
            onClick={cyclePlaybackRate}
            className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Toggle playback speed"
          >
            {playbackRate}x
          </button>

          {/* Restart */}
          <button
            type="button"
            onClick={restartAudio}
            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
            title="Restart"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Download */}
          {downloadUrl && (
            <a
              href={downloadUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
              title="Download audio"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Visualizer & Controls */}
      <div className="flex items-center gap-2.5 bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs">
        <button
          type="button"
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-xs cursor-pointer"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
        </button>

        {/* Animated Wave Indicator (Active when playing) */}
        <div className="flex items-center gap-0.5 px-1 shrink-0">
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={`w-0.5 rounded-full bg-indigo-500 transition-all ${
                isPlaying ? "animate-pulse h-4" : "h-2 bg-slate-300"
              }`}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>

        {/* Scrubber */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Hidden HTML Audio */}
        <audio
          ref={audioRef}
          src={src}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          preload="metadata"
          className="hidden"
        />
      </div>
    </div>
  );
};
