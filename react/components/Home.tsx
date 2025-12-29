import React, { useRef, useState, useEffect } from 'react';
import { FeedItem, ViewState, Creation } from '../types';
import { Heart, Play, Star } from 'lucide-react';
import { getPickedCreations, getRecentTags } from '../services/apiService';

const HotTagsTicker: React.FC = () => {
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const recentTags = await getRecentTags();
        // To create a seamless loop, we duplicate the content.
        const duplicatedTags = recentTags.length > 0 ? [...recentTags, ...recentTags] : [];
        setTags(duplicatedTags);
      } catch (error) {
        console.error("Failed to fetch recent tags:", error);
      }
    };
    fetchTags();
  }, []);

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="bg-black text-white text-xs py-2 w-full flex items-center">
      <div className="bg-black font-bold uppercase tracking-wider px-4 flex-shrink-0 z-10 relative">Hot Tags</div>
      <div className="flex-shrink-0 w-px h-4 bg-gray-600 mx-2 z-10 relative"></div> {/* Separator */}
      <div className="flex-grow relative h-full overflow-hidden flex items-center">
        <div className="animate-scroll-ltr flex space-x-8">
          {tags.map((tag, index) => (
            <span key={index} className="flex-shrink-0 whitespace-nowrap">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

interface HomeProps {
  feedItems: FeedItem[];
  onNavigate: (view: ViewState) => void;
}

export const Home: React.FC<HomeProps> = ({ feedItems, onNavigate }) => {
  const previewItems = feedItems.slice(0, 4);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [pickedItems, setPickedItems] = useState<Creation[]>([]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
      const timer = setTimeout(() => {
        if (!video.paused) {
          video.pause();
          setIsPlaying(false);
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);
  
  useEffect(() => {
    const fetchPickedItems = async () => {
      try {
        const items = await getPickedCreations(6); // Fetch up to 6 picked items
        setPickedItems(items);
      } catch (error) {
        console.error("Failed to fetch picked items:", error);
      }
    };
    fetchPickedItems();
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
    <div className="flex flex-col bg-gray-50">
      <HotTagsTicker />
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
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm transition-all">
            <Play className="w-16 h-16 text-white/80 drop-shadow-lg" fill="currentColor" />
            <p className="mt-2 text-white text-lg font-semibold drop-shadow-lg">
              클릭하여 재생
            </p>
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6 pointer-events-none">
          <h1 className="text-white text-3xl font-bold mb-1 tracking-tight">DOTD</h1>
          <p className="text-white/90 text-sm font-light mb-4">
            Finding your most attractive self <br/> with the latest AI fashion styling.
          </p>
        </div>
      </div>

      {/* Staff Picks Section */}
      {pickedItems.length > 0 && (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold flex items-center">
              <Star size={18} className="mr-2 text-yellow-500 fill-yellow-400" />
              Staff Picks
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {pickedItems.map((item) => (
              <div 
                key={item.id} 
                onClick={() => onNavigate(ViewState.FEED)}
                className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-200 cursor-pointer shadow-sm active:scale-[0.98] transition-transform"
              >
                <img 
                  src={item.media_url} 
                  alt={item.prompt || 'Picked item'} 
                  className="w-full h-full object-cover" 
                />
              </div>
            ))}
          </div>
        </div>
      )}

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
