import { useState, useEffect, useRef } from 'react';
import { Play, Pause, FastForward, Rewind } from 'lucide-react';
import { TimelapseFrame } from '../hooks/useTimelapseData';
import { format } from 'date-fns';

interface TimelapsePlayerProps {
  frames: TimelapseFrame[];
  onFrameChange: (frame: TimelapseFrame, index: number) => void;
  onClose: () => void;
}

export function TimelapsePlayer({ frames, onFrameChange, onClose }: TimelapsePlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(12); // Default to 'now' if 25 frames
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 0.5, 1, 2, 4
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (frames.length > 0) {
      onFrameChange(frames[currentIndex], currentIndex);
    }
  }, [currentIndex, frames, onFrameChange]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 500 / speed);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, frames.length]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.code === 'ArrowRight') {
        setCurrentIndex((p) => Math.min(frames.length - 1, p + 1));
      } else if (e.code === 'ArrowLeft') {
        setCurrentIndex((p) => Math.max(0, p - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [frames.length]);

  if (frames.length === 0) return null;

  const currentFrame = frames[currentIndex];
  const progress = (currentIndex / (frames.length - 1)) * 100;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-[2000] glass rounded-2xl p-4 border border-white/20 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-white/10 rounded-t-2xl overflow-hidden">
        <div 
          className="h-full bg-blue-400 transition-all duration-300 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-col gap-4 mt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Rewind className="w-4 h-4 text-white/70" />
            </button>
            <button onClick={() => setIsPlaying(!isPlaying)} className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors">
              {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
            </button>
            <button onClick={() => setCurrentIndex(Math.min(frames.length - 1, currentIndex + 1))} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <FastForward className="w-4 h-4 text-white/70" />
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white/5 rounded-full p-1">
            {[0.5, 1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 text-[10px] rounded-full transition-colors ${speed === s ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white/80'}`}
              >
                {s}×
              </button>
            ))}
          </div>

          <div className="text-right">
            <p className="text-sm font-medium">{format(new Date(currentFrame.time), "HH:mm · EEEE d MMM")}</p>
            <p className="text-[10px] text-white/50">{currentIndex < 12 ? `-${12 - currentIndex}h` : currentIndex > 12 ? `+${currentIndex - 12}h` : 'Sekarang'}</p>
          </div>
          
          <button onClick={onClose} className="text-xs text-white/50 hover:text-white ml-4">
            Tutup
          </button>
        </div>

        {/* Scrubber */}
        <div className="relative w-full h-8 flex items-center group cursor-pointer" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const percentage = Math.max(0, Math.min(1, x / rect.width));
          setCurrentIndex(Math.round(percentage * (frames.length - 1)));
        }}>
          <div className="absolute w-full h-1 bg-white/20 rounded-full" />
          <div className="absolute h-1 bg-blue-400 rounded-full pointer-events-none" style={{ width: `${progress}%` }} />
          
          {/* Now Marker */}
          <div className="absolute h-3 w-0.5 bg-yellow-400 top-1/2 -translate-y-1/2" style={{ left: '50%' }} />

          {/* Thumb */}
          <div 
            className="absolute w-3 h-3 bg-white rounded-full shadow-lg top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-transform group-hover:scale-150"
            style={{ left: `${progress}%` }}
          />
        </div>
        
        {/* Time Labels */}
        <div className="flex justify-between text-[9px] text-white/30 px-1">
          <span>-12h</span>
          <span>Sekarang</span>
          <span>+12h</span>
        </div>
      </div>
    </div>
  );
}
