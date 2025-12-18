import React from 'react';
import { User, FeedItem, ViewState } from '../types';
import { Settings, Zap } from 'lucide-react';

interface MyPageProps {
  user: User;
  myItems: FeedItem[];
  likedItems: FeedItem[];
  onNavigate: (view: ViewState) => void;
}

export const MyPage: React.FC<MyPageProps> = ({ user, myItems, likedItems, onNavigate }) => {
  const [tab, setTab] = React.useState<'generated' | 'liked'>('generated');

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
          My Generations ({myItems.length})
        </button>
        <button 
          onClick={() => setTab('liked')}
          className={`flex-1 py-4 text-sm font-bold text-center border-b-2 transition-colors ${tab === 'liked' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
        >
          Liked Fashion ({likedItems.length})
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-1 p-1">
        {(tab === 'generated' ? myItems : likedItems).map((item) => (
          <div key={item.id} className="aspect-square bg-gray-100 relative">
             <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
        {(tab === 'generated' ? myItems : likedItems).length === 0 && (
          <div className="col-span-3 py-20 text-center text-gray-400 text-sm">
            No items yet.
            <br />
            {tab === 'generated' ? (
               <button onClick={() => onNavigate(ViewState.CREATE)} className="text-purple-600 font-bold mt-2">Create Now</button>
            ) : "Go explore the feed!"}
          </div>
        )}
      </div>
    </div>
  );
};