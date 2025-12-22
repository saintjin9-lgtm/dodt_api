import React, { useRef, useState, useEffect } from 'react';
import { FeedItem, ViewState } from '../types';
import { Heart, Play } from 'lucide-react';

interface HomeProps {
  feedItems: FeedItem[];
  onNavigate: (view: ViewState) => void;
}

export const Home: React.FC<HomeProps> = ({ feedItems, onNavigate }) => {
  // Use first 4 items for preview
  const previewItems = feedItems.slice(0, 4);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Start playing automatically
    video.play().catch(() => {
      // Autoplay was prevented.
      setIsPlaying(false);
    });
    setIsPlaying(true);


    // Pause after 5 seconds
    const timer = setTimeout(() => {
      if (video.paused) return
      video.pause();
      setIsPlaying(false);
    }, 5000);

    // Cleanup timer
    return () => clearTimeout(timer);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      {/* Video Hero Section */}
      <div 
        className="relative w-full aspect-[9/16] max-h-[70vh] overflow-hidden bg-black cursor-pointer"
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover opacity-90"
          muted
          playsInline
          poster="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop"
        >
          <source src="/static/files/main.mp4" type="video/mp4" />
        </video>

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-all">
            <Play className="w-16 h-16 text-white/80 drop-shadow-lg" fill="currentColor" />
          </div>
        )}
        
        {/* Overlay Content */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6 pointer-events-none">
          <h1 className="text-white text-3xl font-bold mb-1 tracking-tight">DOTD</h1>
          <p className="text-white/90 text-sm font-light mb-4">
            Finding your most attractive self <br/> with the latest AI fashion styling.
          </p>
        </div>
      </div>

      {/* Feed Preview Section */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Popular Styles</h2>
          <button 
            onClick={() => onNavigate(ViewState.FEED)}
            className="text-xs text-gray-500 font-medium"
          >
            View All &rarr;
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {previewItems.map((item) => (
            <div 
              key={item.id} 
              onClick={() => onNavigate(ViewState.FEED)}
              className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-200 cursor-pointer shadow-sm active:scale-[0.98] transition-transform"
            >
              <img 
                src={item.imageUrl} 
                alt="Fashion" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute bottom-2 right-2 flex items-center text-white text-xs drop-shadow-md">
                <Heart size={12} className="fill-white mr-1" />
                {item.likes}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
