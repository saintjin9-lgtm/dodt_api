import React, { useState, useEffect, useRef } from 'react';
import { FeedItem, ViewState, User, Creation } from '../types';
import { Search, Heart, MoreHorizontal, Copy, Check, X, Trash2, CheckCircle2, Sparkles } from 'lucide-react';
import { getFeedCreations, likeCreation, unlikeCreation, toggleAdminPick, deleteCreationAdmin } from '../services/apiService';

interface FeedProps {
  currentUser: User | null;
  onNavigate: (view: ViewState) => void;
}

// Helper to map API's Creation object to frontend's FeedItem
const mapCreationToFeedItem = (creation: Creation): FeedItem => ({
  id: creation.id,
  imageUrl: creation.media_url,
  authorId: creation.user_id,
  authorName: creation.author_name || 'Anonymous',
  createdAt: creation.created_at,
  likes: creation.likes_count,
  isLiked: creation.is_liked || false,
  tags: creation.tags_array || [],
  description: creation.prompt,
  isPicked: creation.is_picked_by_admin || false,
  trendInsight: creation.recommendation_text, // Map the new field
});

export const Feed: React.FC<FeedProps> = ({ currentUser, onNavigate }) => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [filter, setFilter] = useState('latest'); // latest | popular
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 10;
  
  const observer = useRef<IntersectionObserver>();
  const lastItemElementRef = useRef<HTMLDivElement>(null);

  const fetchItems = async (currentOffset: number, currentFilter: string, replace: boolean = false) => {
    if (loading || (!hasMore && !replace)) return;
    setLoading(true);
    try {
      const newCreations = await getFeedCreations(currentFilter, limit, currentOffset);
      const newItems = newCreations.map(mapCreationToFeedItem);
      if (replace) {
        setItems(newItems);
      } else {
        setItems(prev => [...prev, ...newItems]);
      }
      setHasMore(newItems.length === limit);
      setOffset(currentOffset + newItems.length);
    } catch (error) {
      console.error("Failed to fetch feed items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setItems([]);
    setOffset(0);
    setHasMore(true);
    fetchItems(0, filter, true);
  }, [filter]);
  
  useEffect(() => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchItems(offset, filter);
      }
    });

    if (lastItemElementRef.current) {
      observer.current.observe(lastItemElementRef.current);
    }
    return () => observer.current?.disconnect();
  }, [loading, hasMore, offset, filter]);
  

  const handleItemClick = (item: FeedItem) => {
    setSelectedItem(item);
  };

  const handleCopyLink = () => {
    // Simulate copy
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
  };
  
  const handleLikeToggle = async (item: FeedItem) => {
      if (!currentUser) {
          alert("Please login to like items.");
          onNavigate(ViewState.LOGIN);
          return;
      }
      
      const originalItem = items.find(i => i.id === item.id);
      if (!originalItem) return;

      // Optimistic update
      const updatedItems = items.map(i => 
          i.id === item.id ? { ...i, isLiked: !i.isLiked, likes: i.isLiked ? i.likes - 1 : i.likes + 1 } : i
      );
      setItems(updatedItems);
      if(selectedItem?.id === item.id) {
          setSelectedItem(prev => prev ? { ...prev, isLiked: !prev.isLiked, likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1 } : null);
      }

      try {
          if (item.isLiked) {
              await unlikeCreation(item.id);
          } else {
              await likeCreation(item.id);
          }
      } catch (error) {
          // Revert on error
          console.error("Failed to toggle like:", error);
          setItems(items.map(i => i.id === item.id ? originalItem : i));
          if(selectedItem?.id === item.id) setSelectedItem(originalItem);
          alert("Failed to update like status.");
      }
  };

  const handleAdminDelete = async (e: React.MouseEvent, creationId: string | number) => {
    e.stopPropagation(); // Prevent modal from opening
    if (!window.confirm("Are you sure you want to delete this creation as an admin?")) return;

    try {
      await deleteCreationAdmin(String(creationId));
      setItems(prevItems => prevItems.filter(item => item.id !== creationId));
    } catch (error) {
      console.error("Failed to delete creation as admin:", error);
      alert("Admin deletion failed.");
    }
  };

  const handleAdminPick = async (e: React.MouseEvent, creationId: string | number) => {
    e.stopPropagation(); // Prevent modal from opening

    // Optimistic update
    setItems(prevItems => prevItems.map(item => 
      item.id === creationId ? { ...item, isPicked: !item.isPicked } : item
    ));

    try {
      await toggleAdminPick(String(creationId));
    } catch (error) {
      console.error("Failed to pick creation as admin:", error);
      alert("Admin pick failed.");
      // Revert on error
      setItems(prevItems => prevItems.map(item => 
        item.id === creationId ? { ...item, isPicked: !item.isPicked } : item
      ));
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 pb-24 pt-14">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 w-full max-w-md mx-auto bg-white/95 backdrop-blur z-30 px-5 py-3 border-b border-gray-100 flex justify-between items-center">
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
        <div className="grid grid-cols-2 gap-2"> {/* Changed to grid grid-cols-2 gap-2 */}
          {items.map((item, index) => (
            <div 
              key={item.id} 
              onClick={() => handleItemClick(item)}
              ref={index === items.length - 1 ? lastItemElementRef : null}
              className="relative rounded-xl overflow-hidden bg-gray-200 cursor-pointer group aspect-[3/4]" /* Added aspect-[3/4] for consistent image size */
            >
              <img 
                src={item.imageUrl} 
                alt={item.description}
                className="w-full h-full object-cover" /* Changed to h-full to fill container */
                loading="lazy"
              />
              
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors"></div>
              
              {/* User-facing info */}
              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                <div className="text-[10px] text-white/90 font-mono bg-black/30 px-1.5 py-0.5 rounded backdrop-blur-sm">
                  {item.authorName}
                </div>
                <div className="flex items-center space-x-1">
                  <div className="flex flex-col items-center">
                     <Heart className={`w-4 h-4 text-white ${item.isLiked ? "fill-red-500" : "fill-white"} drop-shadow-sm`} />
                     <span className="text-[10px] text-white font-medium drop-shadow-sm">{item.likes}</span>
                  </div>
                </div>
              </div>

              {/* Admin-only controls */}
              {currentUser?.role === 'ADMIN' && (
                <div className="absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => handleAdminPick(e, item.id)}
                    className={`p-2 rounded-full backdrop-blur-md transition-colors ${item.isPicked ? 'bg-purple-600 text-white' : 'bg-white/50 text-gray-800 hover:bg-purple-500 hover:text-white'}`}
                    title={item.isPicked ? "Unpick" : "Pick"}
                  >
                    <CheckCircle2 size={16} />
                  </button>
                  <button 
                    onClick={(e) => handleAdminDelete(e, item.id)}
                    className="p-2 rounded-full bg-white/50 text-gray-800 hover:bg-red-500 hover:text-white backdrop-blur-md transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        {loading && <p className="text-center col-span-2 py-4">Loading more...</p>}
        {!hasMore && items.length > 0 && <p className="text-center col-span-2 py-4 text-xs text-gray-500">You've reached the end.</p>}
        {!loading && items.length === 0 && <p className="text-center col-span-2 py-20 text-gray-500">No items in the feed yet.</p>}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedItem(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm max-h-[85vh] overflow-hidden flex flex-col relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
             
             <button 
               onClick={() => setSelectedItem(null)}
               className="absolute top-3 right-3 z-10 bg-black/50 p-1 rounded-full text-white"
             >
               <X size={20} />
             </button>

             <div className="w-full bg-gray-100">
               <img src={selectedItem.imageUrl} className="w-full h-auto max-h-[50vh] object-cover" />
             </div>

             <div className="p-5 overflow-y-auto">
               <div className="flex justify-between items-center mb-4">
                 <div>
                   <h3 className="font-bold text-lg">{selectedItem.authorName}</h3>
                   <span className="text-xs text-gray-500 font-mono">ID: {selectedItem.authorId}</span>
                 </div>
                 <div className="flex space-x-3">
                    <button onClick={() => handleLikeToggle(selectedItem)} className={`flex flex-col items-center ${selectedItem.isLiked ? 'text-pink-500' : 'text-gray-400'}`}>
                      <Heart className={`${selectedItem.isLiked ? 'fill-pink-500' : ''} w-6 h-6`} />
                      <span className="text-xs font-bold">{selectedItem.likes}</span>
                    </button>
                    <button onClick={handleCopyLink} className="flex flex-col items-center text-gray-500">
                      <Copy className="w-6 h-6" />
                      <span className="text-xs font-bold">Copy</span>
                    </button>
                 </div>
               </div>

               {selectedItem.trendInsight && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
                    <h4 className="font-semibold text-sm mb-2 flex items-center">
                      <Sparkles size={14} className="text-purple-500 mr-2" />
                      Trend Insight
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {selectedItem.trendInsight}
                    </p>
                  </div>
               )}

               <div className="flex flex-wrap gap-2 mb-4">
                 {selectedItem.tags.map(tag => (
                   <span key={tag} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-md font-medium">
                     #{tag}
                   </span>
                 ))}
               </div>

               <div className="text-xs text-gray-400 pt-4 border-t border-gray-100">
                 Created at {new Date(selectedItem.createdAt).toLocaleDateString()}
               </div>
             </div>
             
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
