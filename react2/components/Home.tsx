import React from 'react';
import { FeedItem, ViewState } from '../types';
import { Heart } from 'lucide-react';

interface HomeProps {
  feedItems: FeedItem[];
  onNavigate: (view: ViewState) => void;
}

export const Home: React.FC<HomeProps> = ({ feedItems, onNavigate }) => {
  // Use first 4 items for preview
  const previewItems = feedItems.slice(0, 4);

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-gray-50">
      {/* Video Hero Section */}
      <div className="relative w-full aspect-[9/16] max-h-[70vh] overflow-hidden bg-black">
        <video
          className="w-full h-full object-cover opacity-90"
          autoPlay
          muted
          loop
          playsInline
          poster="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop"
        >
          {/* Using a stock fashion video URL placeholder */}
          <source src="https://videos.pexels.com/video-files/5668388/5668388-hd_1080_1920_25fps.mp4" type="video/mp4" />
        </video>
        
        {/* Overlay Content */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
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