import React, { useState } from 'react';
import { FeedItem, ViewState, User } from '../types';
import { Search, Heart, MoreHorizontal, Copy, Check, X } from 'lucide-react';

interface FeedProps {
  items: FeedItem[];
  currentUser: User | null;
  onNavigate: (view: ViewState) => void;
}

export const Feed: React.FC<FeedProps> = ({ items, currentUser, onNavigate }) => {
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [filter, setFilter] = useState('popular'); // popular | latest

  const handleItemClick = (item: FeedItem) => {
    if (!currentUser) {
      // Prompt non-logged in user
      if (confirm("Please login to view details.")) {
        onNavigate(ViewState.LOGIN);
      }
      return;
    }
    setSelectedItem(item);
  };

  const handleCopyLink = () => {
    // Simulate copy
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 pt-14">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur z-30 px-5 py-3 border-b border-gray-100 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-tight">Feed</h1>
        <div className="flex space-x-3 text-sm font-medium">
          <button 
            onClick={() => setFilter('popular')}
            className={filter === 'popular' ? 'text-black' : 'text-gray-400'}
          >
            Popular
          </button>
          <button 
             onClick={() => setFilter('latest')}
             className={filter === 'latest' ? 'text-black' : 'text-gray-400'}
          >
            Latest
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="px-4 mb-4 mt-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search styles (ex. Vintage, Casual...)" 
            className="w-full bg-white border border-gray-200 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="px-2">
        <div className="columns-2 gap-2 space-y-2">
          {items.map((item) => (
            <div 
              key={item.id} 
              onClick={() => handleItemClick(item)}
              className="break-inside-avoid relative rounded-xl overflow-hidden bg-gray-200 cursor-pointer group"
            >
              <img 
                src={item.imageUrl} 
                alt="Feed" 
                className="w-full h-auto object-cover"
                loading="lazy"
              />
              
              {/* Overlay Info */}
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
              
              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                <div className="text-[10px] text-white/90 font-mono bg-black/30 px-1.5 py-0.5 rounded backdrop-blur-sm">
                  {item.authorId}
                </div>
                <div className="flex items-center space-x-1">
                  <div className="flex flex-col items-center">
                     <Heart className="w-4 h-4 text-white fill-white drop-shadow-sm" />
                     <span className="text-[10px] text-white font-medium drop-shadow-sm">{item.likes}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm max-h-[85vh] overflow-hidden flex flex-col relative shadow-2xl">
             
             {/* Close Button */}
             <button 
               onClick={() => setSelectedItem(null)}
               className="absolute top-3 right-3 z-10 bg-black/50 p-1 rounded-full text-white"
             >
               <X size={20} />
             </button>

             {/* Image */}
             <div className="w-full bg-gray-100">
               <img src={selectedItem.imageUrl} className="w-full h-auto max-h-[50vh] object-cover" />
             </div>

             {/* Content */}
             <div className="p-5 overflow-y-auto">
               <div className="flex justify-between items-center mb-4">
                 <div>
                   <h3 className="font-bold text-lg">{selectedItem.authorName}</h3>
                   <span className="text-xs text-gray-500 font-mono">ID: {selectedItem.authorId}</span>
                 </div>
                 <div className="flex space-x-3">
                    <button className="flex flex-col items-center text-pink-500">
                      <Heart className="fill-pink-500 w-6 h-6" />
                      <span className="text-xs font-bold">{selectedItem.likes}</span>
                    </button>
                    <button onClick={handleCopyLink} className="flex flex-col items-center text-gray-500">
                      <MoreHorizontal className="w-6 h-6" />
                    </button>
                 </div>
               </div>

               {/* Tags */}
               <div className="flex flex-wrap gap-2 mb-4">
                 {selectedItem.tags.map(tag => (
                   <span key={tag} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-md font-medium">
                     {tag}
                   </span>
                 ))}
               </div>
               
               {/* Description */}
               {selectedItem.description && (
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    {selectedItem.description}
                  </p>
               )}

               <div className="text-xs text-gray-400 pt-4 border-t border-gray-100">
                 Created at {new Date(selectedItem.createdAt).toLocaleDateString()}
               </div>
             </div>
             
             {/* Toast Notification */}
             {showCopyToast && (
               <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs py-2 px-4 rounded-full flex items-center shadow-lg">
                 <Check size={14} className="mr-1.5" />
                 Link Copied!
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};