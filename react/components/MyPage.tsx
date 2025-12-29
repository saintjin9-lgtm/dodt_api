import React, { useState, useEffect } from 'react';
import { User, ViewState, Creation } from '../types';
import { Settings, Zap, Trash2, X, Sparkles } from 'lucide-react';
import { getCreationsForUser, deleteCreation } from '../services/apiService';

interface MyPageProps {
  user: User;
  onNavigate: (view: ViewState) => void;
}

export const MyPage: React.FC<MyPageProps> = ({ user, onNavigate }) => {
  const [tab, setTab] = useState<'generated' | 'liked'>('generated');
  const [myCreations, setMyCreations] = useState<Creation[]>([]);
  const [likedCreations, setLikedCreations] = useState<Creation[]>([]); // Placeholder for future
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCreation, setSelectedCreation] = useState<Creation | null>(null);

  useEffect(() => {
    const fetchMyCreations = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const creations = await getCreationsForUser();
        setMyCreations(creations);
      } catch (err) {
        setError("Failed to load your creations. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyCreations();
    // TODO: Add logic to fetch liked creations when API is ready
  }, [user]);
  
  const handleDelete = async (creationId: string | number) => {
    if (!window.confirm("Are you sure you want to delete this creation? This action cannot be undone.")) {
      return;
    }
    
    try {
      await deleteCreation(creationId);
      // Remove the deleted item from the state to update the UI
      setMyCreations(myCreations.filter(c => c.id !== creationId));
    } catch (err) {
      alert("Failed to delete creation. Please try again.");
      console.error(err);
    }
  };

  const itemsToShow = tab === 'generated' ? myCreations : likedCreations;

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="px-6 pt-10 pb-6 border-b border-gray-100">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center">
            <img src={user.avatarUrl} alt="Avatar" className="w-16 h-16 rounded-full mr-4 border border-gray-200" />
            <div>
              <h1 className="text-xl font-bold">{user.name}</h1>
              <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded w-fit mt-1">
                ID: {user.id}
              </div>
            </div>
          </div>
          <button className="text-gray-400">
            <Settings size={20} />
          </button>
        </div>

        {/* Plan / Usage */}
        <div className="bg-black text-white rounded-xl p-4 flex justify-between items-center shadow-lg">
          <div>
            <div className="text-xs text-gray-400 mb-1">Today's Generations</div>
            <div className="text-xl font-bold flex items-center">
               <Zap size={16} className="text-yellow-400 mr-1 fill-yellow-400" />
               {user.dailyGenerationsUsed} / {user.maxDailyGenerations}
            </div>
          </div>
          <button className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm">
            Upgrade Plan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        <button 
          onClick={() => setTab('generated')}
          className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${tab === 'generated' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
        >
          My Generations ({myCreations.length})
        </button>
        <button 
          onClick={() => setTab('liked')}
          className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${tab === 'liked' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
        >
          Liked Fashion ({likedCreations.length})
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-1 p-1">
        {loading ? (
          <div className="col-span-2 py-20 text-center text-gray-400 text-sm">Loading...</div>
        ) : error ? (
          <div className="col-span-2 py-20 text-center text-red-500 text-sm">{error}</div>
        ) : itemsToShow.length === 0 ? (
          <div className="col-span-2 py-20 text-center text-gray-400 text-sm">
            No items yet.
            <br />
            {tab === 'generated' ? (
               <button onClick={() => onNavigate(ViewState.CREATE)} className="text-purple-600 font-bold mt-2">Create Now</button>
            ) : "Go explore the feed!"}
          </div>
        ) : (
          itemsToShow.map((item) => (
            <div key={item.id} className="group bg-gray-100 relative aspect-square">
              <img 
                src={item.media_url || item.imageUrl} 
                alt={item.prompt || ''} 
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setSelectedCreation(item)}
              />
              <div 
                onClick={() => handleDelete(item.id)}
                className="absolute top-2 right-2 p-2 bg-black/40 rounded-full text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                aria-label="Delete creation"
              >
                <Trash2 size={16} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedCreation && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" 
          onClick={() => setSelectedCreation(null)}
        >
          <div className="bg-white rounded-2xl w-full max-w-sm max-h-[85vh] overflow-hidden flex flex-col relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
             <button 
               onClick={() => setSelectedCreation(null)}
               className="absolute top-3 right-3 z-10 bg-black/50 p-1 rounded-full text-white"
             >
               <X size={20} />
             </button>

             <div className="w-full bg-gray-100">
               <img src={selectedCreation.media_url || selectedCreation.imageUrl} alt={selectedCreation.prompt || ''} className="w-full h-auto max-h-[50vh] object-cover" />
             </div>

             <div className="p-5 overflow-y-auto">
               {selectedCreation.recommendation_text && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
                    <h4 className="font-semibold text-sm mb-2 flex items-center">
                      <Sparkles size={14} className="text-purple-500 mr-2" />
                      Trend Insight
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {selectedCreation.recommendation_text}
                    </p>
                  </div>
               )}

               <div className="flex flex-wrap gap-2 mb-4">
                 {(selectedCreation.tags_array || []).map(tag => (
                   <span key={tag} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-md font-medium">
                     #{tag}
                   </span>
                 ))}
               </div>
               
               <div className="text-sm text-gray-800 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
                  <p className="whitespace-pre-line">{selectedCreation.prompt}</p>
               </div>

               <div className="text-xs text-gray-400 pt-4 border-t border-gray-100">
                 Created at {new Date(selectedCreation.created_at).toLocaleDateString()}
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
