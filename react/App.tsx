import React, { useState, useEffect, useRef } from 'react';
import { PageView, User, Creation, GenerationResult, Task } from './types';
import { 
  createGenerationTask, 
  getTaskStatus, 
  loginWithEmail, 
  registerWithEmail, 
  setAuthToken, 
  fetchCurrentUser,
  getCreationsForUser,
  getFeedCreations,
  getPickedCreations,
  likeCreation,
  unlikeCreation,
  toggleAdminPick,
  getAllUsers, // New API call
  getAdminPickedCreations, // New API call for admin feed management
  deleteCreationAdmin, // New API call for admin delete
  getUsersCountAdmin, // New API call for admin stats
  setMainCreation
} from './services/apiService';
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  UserIcon, 
  PlusIcon,
  ArrowLeftIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  EllipsisHorizontalIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  ShieldCheckIcon, // Admin icon
  TrashIcon // Delete icon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconFilled } from '@heroicons/react/24/solid';


// Helper function to decode Base64URL
const decodeBase64Url = (str: string) => {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return atob(str);
};


// --- COMPONENTS DEFINED IN-FILE FOR SIMPLICITY AS REQUESTED ---

// Generic Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100]" onClick={onClose}>
      <div className="relative p-4 rounded-lg shadow-lg max-w-lg max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};


// 1. Navigation Bar (Updated for Admin Link)
const Navbar = ({ 
  currentView, 
  setView, 
  isLoggedIn,
  userRole // New prop for user role
}: { 
  currentView: PageView; 
  setView: (v: PageView) => void; 
  isLoggedIn: boolean;
  userRole?: string;
}) => {
  const navItemClass = (view: PageView) => 
    `flex flex-col items-center justify-center w-full h-full space-y-1 ${currentView === view ? 'text-black font-bold' : 'text-gray-400'}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex justify-around items-center z-50 px-4 pb-safe">
      <button onClick={() => setView(PageView.HOME)} className={navItemClass(PageView.HOME)}>
        <HomeIcon className="w-6 h-6" />
        <span className="text-[10px]">Home</span>
      </button>
      <button onClick={() => setView(PageView.FEED)} className={navItemClass(PageView.FEED)}>
        <MagnifyingGlassIcon className="w-6 h-6" />
        <span className="text-[10px]">Feed</span>
      </button>
      
      {/* Generate Button - Floating Action Style */}
      <div className="relative -top-5">
        <button 
          onClick={() => setView(PageView.GENERATE)}
          className="bg-black text-white rounded-full p-4 shadow-lg hover:scale-105 transition-transform"
        >
          <PlusIcon className="w-6 h-6" />
        </button>
      </div>

      <button 
        onClick={() => setView(isLoggedIn ? PageView.MY_PAGE : PageView.LOGIN)} 
        className={navItemClass(PageView.MY_PAGE)}
      >
        <UserIcon className="w-6 h-6" />
        <span className="text-[10px]">{isLoggedIn ? 'My Page' : 'Login'}</span>
      </button>
      
      {/* Admin Link (Conditional) */}
      {isLoggedIn && userRole === "ADMIN" && (
        <button onClick={() => setView(PageView.ADMIN_DASHBOARD)} className={navItemClass(PageView.ADMIN_DASHBOARD)}>
            <ShieldCheckIcon className="w-6 h-6" />
            <span className="text-[10px]">Admin</span>
        </button>
      )}

      {/* Logout simulation for demo */}
      {isLoggedIn && (
         <button onClick={() => { setAuthToken(null); setView(PageView.LOGIN); }} className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-400">
           <span className="text-[10px] font-mono">Exit</span>
         </button>
      )}
    </div>
  );
};

// 2. Home Page (Updated for Admin Picks)
const HomePage = ({ setView, user }: { setView: (v: PageView) => void; user: User }) => {
  const [pickedCreations, setPickedCreations] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPicked = async () => {
      setLoading(true);
      try {
        const creations = await getPickedCreations();
        setPickedCreations(creations);
      } finally {
        setLoading(false);
      }
    };
    fetchPicked();
  }, []);

  return (
    <div className="pb-20 pt-4">
      {/* Header */}
      <div className="px-4 mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-black tracking-tighter">DOTD.</h1>
        <div className="text-xs font-medium text-gray-500 border rounded-full px-3 py-1">
          BETA v1.0
        </div>
      </div>

      {/* Main Call to Action - Generate Outfit */}
      <div className="px-4 mb-10">
        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-sm bg-gray-100 group">
          {/* This section could be an intro image or promotional */}
          <img 
            src="https://picsum.photos/seed/home_intro/600/800" 
            alt="Generate your own style" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
            <h2 className="text-white text-2xl font-bold">Discover Your Daily Outfit</h2>
            <p className="text-white/80 text-xs mb-1 uppercase tracking-widest font-semibold">AI Powered Style Generation</p>
          </div>
        </div>
        
        <button 
          onClick={() => setView(PageView.GENERATE)}
          className="w-full bg-black text-white mt-4 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <span>Generate My Outfit</span>
          <ArrowDownTrayIcon className="w-5 h-5 -rotate-90" />
        </button>
      </div>

      {/* Admin Picks - 3x3 Grid */}
      <div className="mb-8">
        <div className="px-4 mb-4 flex justify-between items-end">
          <h3 className="font-bold text-lg">Editor's Picks</h3>
        </div>
        {loading && <p className="text-center text-gray-500">Loading editor's picks...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        {!loading && !error && pickedCreations.length === 0 && (
          <p className="text-center text-gray-500">No editor's picks available yet.</p>
        )}
        <div className="grid grid-cols-3 gap-1 px-4">
          {pickedCreations.map((creation) => (
            <div key={creation.id} className="aspect-square rounded-lg overflow-hidden bg-gray-200">
              <img src={creation.media_url} alt={creation.prompt} className="w-full h-full object-cover"/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 3. Feed Page (Updated for dynamic content, sorting, liking, admin pick)
const FeedPage = ({ user, setView }: { user: User; setView: (v: PageView) => void }) => {
  const [filter, setFilter] = useState<'popular' | 'latest'>('latest');
  const [creations, setCreations] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 10;
  const observer = useRef<IntersectionObserver>();
  const lastCreationElementRef = useRef<HTMLDivElement>(null);
  
  const [selectedCreation, setSelectedCreation] = useState<Creation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCreations = async (currentOffset: number, currentFilter: 'popular' | 'latest', replace: boolean = false) => {
    if (!hasMore && !replace) return;
    setLoading(true);
    try {
      const newCreations = await getFeedCreations(currentFilter, limit, currentOffset);
      if (replace) {
        setCreations(newCreations);
      } else {
        setCreations(prev => [...prev, ...newCreations]);
      }
      setHasMore(newCreations.length === limit);
      setOffset(currentOffset + newCreations.length);
    } catch (error) {
      console.error("Failed to fetch feed creations:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCreations([]);
    setOffset(0);
    setHasMore(true);
    fetchCreations(0, filter, true);
  }, [filter]);

  useEffect(() => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchCreations(offset, filter);
      }
    }, { threshold: 0.5 });

    if (lastCreationElementRef.current) {
      observer.current.observe(lastCreationElementRef.current);
    }
    return () => observer.current?.disconnect();
  }, [loading, hasMore, offset, filter]);

  const handleLike = async (creationId: string, isLiked: boolean) => {
    if (!user.isLoggedIn) {
      alert("Please log in to like creations.");
      setView(PageView.LOGIN);
      return;
    }
    try {
      if (isLiked) {
        await unlikeCreation(creationId);
      } else {
        await likeCreation(creationId);
      }
      setCreations(prevCreations => prevCreations.map(c => 
        c.id === creationId ? { ...c, is_liked: !isLiked, likes_count: c.likes_count + (isLiked ? -1 : 1) } : c
      ));
    } catch (error) {
      console.error("Failed to toggle like:", error);
      alert("Failed to update like status.");
    }
  };

  const handleAdminPick = async (creationId: string) => {
    if (user.role !== "ADMIN") {
        alert("You must be an admin to pick creations.");
        return;
    }
    try {
        await toggleAdminPick(creationId);
        setCreations(prevCreations => prevCreations.map(c => 
            c.id === creationId ? { ...c, is_picked_by_admin: !c.is_picked_by_admin } : c
        ));
        alert("Admin pick status updated.");
    } catch (error) {
      console.error("Failed to toggle admin pick:", error);
        alert("Failed to update admin pick status.");
    }
  };

  const handleDeleteCreation = async (creationId: string) => {
    if (user.role !== "ADMIN") {
        alert("You must be an admin to delete creations.");
        return;
    }
    if (!window.confirm("Are you sure you want to delete this creation?")) {
        return;
    }
    try {
        await deleteCreationAdmin(creationId);
        setCreations(prevCreations => prevCreations.filter(c => c.id !== creationId));
        alert("Creation deleted.");
    } catch (error) {
        console.error("Failed to delete creation:", error);
        alert("Failed to delete creation.");
    }
  };

  const openModal = (creation: Creation) => {
    setSelectedCreation(creation);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedCreation(null);
    setIsModalOpen(false);
  };

  return (
    <div className="pb-20 pt-4 px-2">
      <div className="sticky top-0 bg-white z-10 py-2 mb-4">
        <div className="flex gap-4 mb-4 px-2 border-b border-gray-100 pb-2">
          <button 
            onClick={() => setFilter('popular')}
            className={`text-lg font-bold ${filter === 'popular' ? 'text-black' : 'text-gray-300'}`}
          >
            Popular
          </button>
          <button 
            onClick={() => setFilter('latest')}
            className={`text-lg font-bold ${filter === 'latest' ? 'text-black' : 'text-gray-300'}`}
          >
            Latest
          </button>
        </div>
      </div>

      <div className="columns-2 gap-2 space-y-2">
        {creations.map((creation, index) => (
          <div 
            key={creation.id} 
            className="break-inside-avoid relative group rounded-lg overflow-hidden cursor-pointer"
            ref={index === creations.length - 1 ? lastCreationElementRef : null}
            onClick={() => openModal(creation)}
          >
            <img src={creation.media_url} alt={creation.prompt} className="w-full h-auto object-cover rounded-lg" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            
            <div className="absolute inset-0 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium bg-gradient-to-t from-black/60 to-transparent">
                <div className="flex justify-end gap-2">
                    {user.role === "ADMIN" && (
                        <>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleAdminPick(creation.id); }}
                            className={`p-1 rounded-full ${creation.is_picked_by_admin ? 'bg-green-500' : 'bg-gray-500'} bg-opacity-75 backdrop-blur-sm`}
                        >
                            <PlusIcon className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteCreation(creation.id); }}
                            className="p-1 rounded-full bg-red-500 bg-opacity-75 backdrop-blur-sm"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gray-300 overflow-hidden">
                        <img src={creation.author_picture || 'https://picsum.photos/seed/avatar_default/100'} alt="avatar" className="w-full h-full object-cover" />
                    </div>
                    <span className="truncate">{creation.author_name || 'Anonymous'}</span>
                </div>
            </div>

            <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-bold drop-shadow-md">
                <button onClick={(e) => { e.stopPropagation(); handleLike(creation.id, creation.is_liked || false); }}>
                    {creation.is_liked ? <HeartIconFilled className="w-5 h-5 text-red-500" /> : <HeartIcon className="w-5 h-5" />}
                </button>
                <span>{creation.likes_count}</span>
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); alert("Report functionality coming soon!"); }}
              className="absolute top-2 right-2 text-white opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-black/20 rounded-full backdrop-blur-sm"
            >
              <EllipsisHorizontalIcon className="w-5 h-5" />
            </button>
          </div>
        ))}
        {loading && <p className="text-center text-gray-500 col-span-2">Loading more creations...</p>}
        {!hasMore && !loading && creations.length > 0 && <p className="text-center text-gray-500 col-span-2">You've reached the end!</p>}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        {selectedCreation && (
          <div className="bg-white p-4 rounded-lg shadow-xl w-full max-w-md">
            <img src={selectedCreation.media_url} alt={selectedCreation.prompt} className="w-full rounded-lg mb-4" />
            <h3 className="text-xl font-bold mb-2">{selectedCreation.prompt}</h3>
            <p className="text-sm text-gray-700 mb-2">Gender: {selectedCreation.gender || 'N/A'}, Age Group: {selectedCreation.age_group || 'N/A'}</p>
            <p className="text-xs text-gray-500">Created: {new Date(selectedCreation.created_at).toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-4">
                <button onClick={(e) => { e.stopPropagation(); handleLike(selectedCreation.id, selectedCreation.is_liked || false); }}>
                    {selectedCreation.is_liked ? <HeartIconFilled className="w-6 h-6 text-red-500" /> : <HeartIcon className="w-6 h-6" />}
                </button>
                <span>{selectedCreation.likes_count} Likes</span>
            </div>
            {user.role === "ADMIN" && (
                <button 
                    onClick={(e) => { e.stopPropagation(); handleAdminPick(selectedCreation.id); }}
                    className={`mt-4 w-full py-2 rounded-lg text-sm font-medium ${selectedCreation.is_picked_by_admin ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                    {selectedCreation.is_picked_by_admin ? 'Unpick from Admin' : 'Pick for Admin'}
                </button>
            )}
            <button onClick={closeModal} className="mt-4 w-full bg-black text-white py-2 rounded-lg">Close</button>
          </div>
        )}
      </Modal>
    </div>
  );
};

// 4. Generate Page (Updated with new form fields)
const GeneratePage = ({ onGenerate, setView, user }: { onGenerate: (file: File, prompt: string, gender: string, age_group: string, is_public: boolean) => void; setView: (view: PageView) => void; user: User }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [gender, setGender] = useState('female'); // Default value
  const [ageGroup, setAgeGroup] = useState('20s'); // Default value
  const [isPublic, setIsPublic] = useState(true); // Default to public

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (selectedFile && prompt) {
        onGenerate(selectedFile, prompt, gender, ageGroup, isPublic);
    } else {
        alert("Please provide an image and a prompt.");
    }
  };

  return (
    <div className="p-4 pt-6 min-h-screen flex flex-col bg-white">
      <div className="flex items-center mb-6">
        <button onClick={() => setView(PageView.HOME)} className="p-2 -ml-2 mr-2">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold">Create DOTD</h2>
      </div>
      
      <div className="mb-6">
        <label htmlFor="prompt" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">My Style Request</label>
        <textarea 
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="ex. Going to a cafe in Hannam-dong, need a 'Kwan-kku' vibe..."
          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none h-24"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="gender" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Gender</label>
        <select
          id="gender"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="unisex">Unisex</option>
        </select>
      </div>

      <div className="mb-6">
        <label htmlFor="ageGroup" className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Age Group</label>
        <select
          id="ageGroup"
          value={ageGroup}
          onChange={(e) => setAgeGroup(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="10s">10s</option>
          <option value="20s">20s</option>
          <option value="30s">30s</option>
          <option value="40s">40s</option>
          <option value="50s+">50s+</option>
        </select>
      </div>

      <div className="mb-6 flex items-center">
        <input
          type="checkbox"
          id="isPublic"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
        />
        <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
          Make this creation public (visible in Feed)
        </label>
      </div>

      <div className="flex-1 mb-6">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">My Photo</label>
        <div className={`border-2 border-dashed border-gray-200 rounded-xl h-full max-h-[400px] flex flex-col items-center justify-center relative overflow-hidden transition-all ${!preview ? 'bg-gray-50' : 'bg-white'}`}>
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-contain" />
          ) : (
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center text-gray-400">
                <PlusIcon className="w-6 h-6" />
              </div>
              <p className="text-gray-500 text-sm">Tap to upload your photo</p>
            </div>
          )}
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="absolute inset-0 opacity-0 cursor-pointer" 
          />
        </div>
      </div>

      <div className="mt-auto pb-24">
         <p className="text-[10px] text-gray-400 text-center mb-3">
           AI generated results may vary. Please review terms of service regarding content.
         </p>
         <button 
           disabled={!selectedFile || !prompt || !user.isLoggedIn}
           onClick={handleSubmit}
           className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${ 
             (selectedFile && prompt && user.isLoggedIn) ? 'bg-black text-white shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
           }`}
         >
           Generate Analysis
         </button>
         {!user.isLoggedIn && <p className="text-red-500 text-xs text-center mt-2">Please log in to generate creations.</p>}
      </div>
    </div>
  );
};

// 5. Loading Page
const LoadingPage = () => {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPercent(p => {
        if (p >= 99) {
          clearInterval(interval);
          return 99;
        }
        return p + Math.floor(Math.random() * 5) + 1;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white p-8">
      <div className="w-16 h-16 border-4 border-gray-100 border-t-black rounded-full animate-spin mb-8" />
      <h2 className="text-2xl font-bold mb-2 animate-pulse">Analyzing Style...</h2>
      <p className="text-gray-400 text-sm mb-8">Consulting with AI Stylist</p>
      <div className="w-full max-w-xs h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-black transition-all duration-300" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-xs font-mono">{percent}%</p>
    </div>
  );
};

// 6. Result Page (Updated with Creation type)
const ResultPage = ({ 
  result, 
  onRetry, 
  onFeedUpload 
}: { 
  result: GenerationResult | null; 
  onRetry: () => void; 
  onFeedUpload: (creationId: string) => void;
}) => {
  if (!result || !result.creation) return null;

  console.log("ResultPage received result:", result);

  return (
    <div className="min-h-screen bg-white pb-24 animate-fade-in">
      <div className="relative w-full aspect-[3/4] bg-gray-100">
        <img src={result.creation.media_url} alt="Generated Outfit" className="w-full h-full object-cover" />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full border border-gray-200">
          <span className="text-xs font-black tracking-widest">DOTD GENERATED</span>
        </div>
      </div>

      <div className="p-5 -mt-6 bg-white rounded-t-3xl relative z-10 shadow-[-10px_-10px_30px_rgba(0,0,0,0.05)]">
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Style Analysis</h1>
            <p className="text-xs text-gray-500">Based on your upload</p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 border border-gray-200 rounded-full hover:bg-gray-50">
               <ArrowDownTrayIcon className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 border border-gray-200 rounded-full hover:bg-gray-50">
               <ShareIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {(result.tags && result.tags.length > 0 ? result.tags : ['nothing']).map((tag, idx) => (
            <span key={idx} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-lg text-xs font-medium">
              {tag}
            </span>
          ))}
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-gray-50 p-4 rounded-xl">
            <h3 className="font-bold text-sm mb-2">✨ Stylist's Note</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{result.analysis || 'nothing'}</p>
          </div>
          
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
             <h3 className="font-bold text-sm mb-2 text-stone-800">💡 Recommendation</h3>
             <p className="text-sm text-gray-600 leading-relaxed">{result.recommendation || 'nothing'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={onRetry}
            className="py-3 border border-gray-300 rounded-xl font-semibold text-sm hover:bg-gray-50"
          >
            Recreate
          </button>
          <button 
            onClick={() => onFeedUpload(result.creation.id)}
            className="py-3 bg-black text-white rounded-xl font-semibold text-sm hover:opacity-90 shadow-lg shadow-gray-200"
          >
            Upload to Feed
          </button>
        </div>
      </div>
    </div>
  );
};

// 7. Login Page (Refactored to handle Google OAuth click)
const LoginPage = ({ onEmailLogin, onRegister }: { onEmailLogin: any; onRegister: any }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (isLoginView) {
      onEmailLogin(email, password).catch((err: Error) => setError(err.message));
    } else {
      onRegister(name, email, password)
        .then(() => {
          setIsLoginView(true);
          setPassword('');
        })
        .catch((err: Error) => setError(err.message));
    }
  };

  const handleGoogleLoginClick = () => {
    // Redirect to backend endpoint to initiate Google OAuth flow
    window.location.href = '/auth/login/google';
  };

  return (
    <div className="h-screen bg-white flex flex-col p-6 items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-black mb-2 tracking-tighter">DOTD.</h1>
        <p className="text-gray-500 mb-8">
          {isLoginView ? 'Log in to continue.' : 'Create an account.'}
        </p>
        
        {/* Google Login button */}
        <button 
          onClick={handleGoogleLoginClick}
          className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium flex items-center justify-center gap-3 mb-4 hover:bg-gray-50 transition-colors"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
          Continue with Google
        </button>
        
        <div className="flex items-center gap-4 my-6">
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="text-xs text-gray-400">OR</span>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        {error && <p className="text-red-500 text-xs text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginView && (
            <input 
               type="text" 
               placeholder="Name" 
               value={name}
               onChange={(e) => setName(e.target.value)}
               required
               className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-black outline-none"
            />
          )}
          <input 
             type="email" 
             placeholder="Email address"
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             required
             className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-black outline-none"
          />
          <input 
             type="password" 
             placeholder="Password" 
             value={password}
             onChange={(e) => setPassword(e.target.value)}
             required
             className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-black outline-none"
          />
          
          {isLoginView && (
            <div className="flex justify-between items-center text-xs">
              <label className="flex items-center gap-2 text-gray-500">
                <input type="checkbox" className="rounded border-gray-300" />
                Keep me logged in
              </label>
              <span className="text-gray-400 cursor-pointer">Forgot password?</span>
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-black text-white py-4 rounded-lg font-bold text-sm mt-4 hover:opacity-90"
          >
            {isLoginView ? 'Log In' : 'Create Account'}
          </button>
        </form>
        
        <p className="text-center text-xs text-gray-400 mt-6">
          {isLoginView ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setIsLoginView(!isLoginView); setError(''); }} className="font-bold text-black hover:underline">
            {isLoginView ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
};

// 8. My Page (Updated for dynamic content, infinite scroll, modal)
const MyPage = ({ user, setView }: { user: User; setView: (v: PageView) => void }) => {
  const [creations, setCreations] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 9;
  const observer = useRef<IntersectionObserver>();
  const lastCreationElementRef = useRef<HTMLDivElement>(null);

  const [selectedCreation, setSelectedCreation] = useState<Creation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCreations = async (currentOffset: number, replace: boolean = false) => {
    if (!user.isLoggedIn || (!hasMore && !replace)) return;
    setLoading(true);
    try {
      const newCreations = await getCreationsForUser(limit, currentOffset);
      if (replace) {
        setCreations(newCreations);
      } else {
        setCreations(prev => [...prev, ...newCreations]);
      }
      setHasMore(newCreations.length === limit);
      setOffset(currentOffset + newCreations.length);
    } catch (error) {
      console.error("Failed to fetch user creations:", error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.isLoggedIn) {
      setCreations([]);
      setOffset(0);
      setHasMore(true);
      fetchCreations(0, true);
    } else {
      setCreations([]);
    }
  }, [user.isLoggedIn]);

  useEffect(() => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchCreations(offset);
      }
    }, { threshold: 0.5 });

    if (lastCreationElementRef.current) {
      observer.current.observe(lastCreationElementRef.current);
    }
    return () => observer.current?.disconnect();
  }, [loading, hasMore, offset, user.isLoggedIn]);

  const openModal = (creation: Creation) => {
    setSelectedCreation(creation);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedCreation(null);
    setIsModalOpen(false);
  };

  return (
    <div className="pb-20 pt-6 px-4 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold">My Profile</h2>
        <button className="p-2" onClick={() => {/* Settings */}}>
           <div className="w-1 h-1 bg-black rounded-full shadow-[5px_0_0_0_#000,-5px_0_0_0_#000]"></div>
        </button>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-lg">
           <img src={user.avatar || 'https://picsum.photos/seed/default_avatar/100'} alt="Me" className="w-full h-full object-cover" />
        </div>
        <div>
          <h3 className="font-bold text-lg">{user.name}</h3>
          <p className="text-xs text-gray-500">@{user.id} {user.role === 'ADMIN' ? '• Admin' : ''} • Fashion Enthusiast</p>
          <div className="flex gap-4 mt-3">
             <div className="text-center">
                <span className="block font-bold text-sm">N/A</span>
                <span className="text-[10px] text-gray-400">Followers</span>
             </div>
             <div className="text-center">
                <span className="block font-bold text-sm">N/A</span>
                <span className="text-[10px] text-gray-400">Following</span>
             </div>
          </div>
        </div>
      </div>

      <div className="mb-6 border-b border-gray-100 flex gap-6">
        <button className="pb-2 border-b-2 border-black font-bold text-sm">My DOTD</button>
      </div>

      {!user.isLoggedIn && <p className="text-center text-gray-500">Please log in to see your creations.</p>}
      {user.isLoggedIn && loading && creations.length === 0 && <p className="text-center text-gray-500">Loading your creations...</p>}
      {user.isLoggedIn && !loading && creations.length === 0 && <p className="text-center text-gray-500">You haven't created anything yet.</p>}

      <div className="grid grid-cols-3 gap-1">
         {creations.map((creation, index) => (
           <div 
             key={creation.id} 
             className="aspect-square relative cursor-pointer"
             ref={index === creations.length - 1 ? lastCreationElementRef : null}
             onClick={() => openModal(creation)}
           >
             <img src={creation.media_url} className="w-full h-full object-cover" alt={creation.prompt}/>
           </div>
         ))}
      </div>
      {loading && creations.length > 0 && <p className="text-center text-gray-500 mt-4">Loading more...</p>}
      {!hasMore && !loading && creations.length > 0 && <p className="text-center text-gray-500 mt-4">No more creations.</p>}

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        {selectedCreation && (
          <div className="bg-white p-4 rounded-lg shadow-xl w-full max-w-md">
            <img src={selectedCreation.media_url} alt={selectedCreation.prompt} className="w-full rounded-lg mb-4" />
            <h3 className="text-xl font-bold mb-2">{selectedCreation.prompt}</h3>
            <p className="text-sm text-gray-700 mb-2">Gender: {selectedCreation.gender || 'N/A'}, Age Group: {selectedCreation.age_group || 'N/A'}</p>
            <p className="text-xs text-gray-500">Created: {new Date(selectedCreation.created_at).toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-4">
                <HeartIconFilled className="w-6 h-6 text-red-500" />
                <span>{selectedCreation.likes_count} Likes</span>
            </div>
            {user.role === "ADMIN" && (
                <button 
                    onClick={(e) => { e.stopPropagation(); handleAdminPick(selectedCreation.id); }}
                    className={`mt-4 w-full py-2 rounded-lg text-sm font-medium ${selectedCreation.is_picked_by_admin ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                    {selectedCreation.is_picked_by_admin ? 'Unpick from Admin' : 'Pick for Admin'}
                </button>
            )}
            <button onClick={closeModal} className="mt-4 w-full bg-black text-white py-2 rounded-lg">Close</button>
          </div>
        )}
      </Modal>
    </div>
  );
};

const AdminDashboard = ({ setView, user }: { setView: (v: PageView) => void; user: User }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [pickedCreations, setPickedCreations] = useState<Creation[]>([]);
  const [stats, setStats] = useState({ users_count: 0 });
  const [loading, setLoading] = useState({ users: true, creations: true, stats: true });

  const fetchAdminData = async () => {
    try {
      setLoading(prev => ({ ...prev, users: true }));
      const usersRes = await getAllUsers();
      setUsers(usersRes);
    } catch (error) {
      console.error("Error fetching users:", error);
      alert("Failed to fetch users.");
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }

    try {
      setLoading(prev => ({ ...prev, creations: true }));
      const creationsRes = await getAdminPickedCreations();
      setPickedCreations(creationsRes);
    } catch (error) {
      console.error("Error fetching picked creations:", error);
      alert("Failed to fetch picked creations.");
    } finally {
      setLoading(prev => ({ ...prev, creations: false }));
    }

    try {
      setLoading(prev => ({ ...prev, stats: true }));
      const statsRes = await getUsersCountAdmin();
      setStats({ users_count: statsRes.users_count });
    } catch (error) {
      console.error("Error fetching stats:", error);
      alert("Failed to fetch stats.");
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  useEffect(() => {
    if (user.role !== "ADMIN") {
      alert("Access denied.");
      setView(PageView.HOME);
      return;
    }
    fetchAdminData();
  }, [user.role, setView]);

  const handleSetMainImage = async (creationId: string) => {
    if (!window.confirm("Set this image as the main 'Discover' image on the Home page?")) return;
    try {
      await setMainCreation(creationId);
      alert('Main image has been updated.');
    } catch (error) {
      console.error('Error setting main image:', error);
      alert('Failed to update main image.');
    }
  };

  const handleUnpickImage = async (creationId: string) => {
     if (!window.confirm("Remove this image from the 'Picked' list? (It will no longer appear on the home page)")) return;
    try {
      await toggleAdminPick(creationId);
      setPickedCreations(prev => prev.filter(c => c.id !== creationId));
      alert('Image has been un-picked.');
    } catch (error) {
      console.error('Error unpicking image:', error);
      alert('Failed to un-pick image.');
    }
  };

  if (user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-gray-700">Site Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500">Total Users</h3>
            {loading.stats ? <div className="h-8 bg-gray-200 rounded animate-pulse mt-1"></div> : <p className="text-3xl font-bold">{stats.users_count}</p>}
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500">Today's Visitors</h3>
            <p className="text-3xl font-bold text-gray-300">N/A</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500">Today's Views</h3>
            <p className="text-3xl font-bold text-gray-300">N/A</p>
          </div>
        </div>
      </div>
      
      <div className="mb-10">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">Daily Statistics</h2>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
              <p className="text-sm text-gray-400">Daily statistics chart/table will be shown here when the API is ready.</p>
          </div>
      </div>

      <div className="mb-10">
        <h2 className="text-lg font-semibold mb-3 text-gray-700">Feed Management (Editor's Picks)</h2>
        {loading.creations ? (
             <p className="text-sm text-gray-500">Loading picked images...</p>
        ) : pickedCreations.length === 0 ? (
            <p className="text-sm text-gray-500">No images have been picked yet.</p>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {pickedCreations.map(creation => (
                <div key={creation.id} className="relative group bg-gray-100 rounded-lg shadow-sm overflow-hidden aspect-square">
                <img src={creation.media_url} alt={creation.prompt} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => handleSetMainImage(creation.id)}
                        className="bg-blue-500 text-white px-3 py-1 rounded-md mb-2 text-xs font-semibold w-full hover:bg-blue-600 transition-colors"
                    >
                        Set as Main
                    </button>
                    <button
                        onClick={() => handleUnpickImage(creation.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded-md text-xs font-semibold w-full hover:bg-red-600 transition-colors"
                    >
                        Un-pick
                    </button>
                </div>
                </div>
            ))}
            </div>
        )}
      </div>
      
      <div>
        <h2 className="text-lg font-semibold mb-3 text-gray-700">User Management</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto border border-gray-100">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left font-semibold">ID</th>
                <th className="p-3 text-left font-semibold">Username</th>
                <th className="p-3 text-left font-semibold">Email</th>
                <th className="p-3 text-left font-semibold">Role</th>
                <th className="p-3 text-left font-semibold">Created At</th>
              </tr>
            </thead>
            <tbody>
              {loading.users ? (
                <tr><td colSpan={5} className="p-4 text-center text-gray-500">Loading users...</td></tr>
              ) : users.map((user, index) => (
                <tr key={user.id} className={`border-t border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="p-3 truncate" title={String(user.id)}>{String(user.id).substring(0,8)}...</td>
                  <td className="p-3 font-medium">{user.name}</td>
                  <td className="p-3 text-gray-600">{user.email}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                        {user.role}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600">{new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


// --- MAIN APP COMPONENT ---

export default function App() {
  const [currentView, setView] = useState<PageView>(PageView.HOME); // Default to home
  const [user, setUser] = useState<User>({
    id: 'guest',
    name: 'Guest User',
    avatar: 'https://picsum.photos/seed/guest/100',
    isLoggedIn: false
  });
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);

  const updateUserFromToken = (token: string) => {
    try {
      const payload = JSON.parse(decodeBase64Url(token.split('.')[1]));

      // Check for token expiration
      const currentTime = Date.now() / 1000; // current time in seconds
      if (payload.exp && payload.exp < currentTime) {
        console.error("Token expired. Logging out user.");
        setUser({ id: 'guest', name: 'Guest User', isLoggedIn: false });
        setAuthToken(null); // This will clear the token from localStorage
        return;
      }

      setUser({
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        avatar: payload.picture,
        role: payload.role,
        isLoggedIn: true,
      });
    } catch(e) {
      console.error("Error decoding token or token invalid", e);
      setUser({ id: 'guest', name: 'Guest User', isLoggedIn: false });
      setAuthToken(null);
    }
  };

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        try {
          const response = await fetch(`/auth/rest/oauth2-credential/callback?code=${code}`);
          if (!response.ok) { 
            const err = await response.json();
            throw new Error(err.detail || 'Token exchange failed'); 
          }
          
          const data = await response.json();
          const access_token = data.access_token;
          
          if (access_token) {
            setAuthToken(access_token);
            updateUserFromToken(access_token);
            setView(PageView.HOME);
            window.history.replaceState({}, '', '/');
          } else {
            throw new Error('Backend did not return an access token.');
          }
        } catch (error) {
          console.error("Error during Google OAuth callback:", error);
          alert(`Google login failed: ${error.message}`);
          window.history.replaceState({}, '', '/');
          setView(PageView.LOGIN);
        }
      } else {
        const token = localStorage.getItem('authToken');
        if (token) {
          updateUserFromToken(token);
        }
      }
    };

    handleOAuthCallback();
  }, []);

  const handleEmailLogin = async (email: string, password: string) => {
    const { access_token } = await loginWithEmail(email, password);
    setAuthToken(access_token);
    updateUserFromToken(access_token);
    setView(PageView.HOME);
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    await registerWithEmail(name, email, password);
    alert('Registration successful! Please log in.');
    setView(PageView.LOGIN);
  };

  const handleGenerate = async (file: File, prompt: string, gender: string, age_group: string, is_public: boolean) => {
    if (!user.isLoggedIn) {
      alert("Please log in to generate creations.");
      setView(PageView.LOGIN);
      return;
    }
    setView(PageView.LOADING);

    try {
      const { task_id } = await createGenerationTask(file, prompt, gender, age_group, is_public);

      const intervalId = setInterval(async () => {
        try {
          const task = await getTaskStatus(task_id);

          if (task.status === 'completed' && task.result && task.result.creation) {
            clearInterval(intervalId);
            
            const creation = task.result.creation;
            const finalAnalysis = creation.analysis_text || 'nothing';
            const finalRecommendation = creation.recommendation_text || 'nothing';
            const finalTags = (creation.tags_array && creation.tags_array.length > 0) ? creation.tags_array : [];
            
            setGenerationResult({
              creation: creation,
              analysis: finalAnalysis,
              recommendation: finalRecommendation,
              tags: finalTags
            });
            setView(PageView.RESULT);

          } else if (task.status === 'failed') {
            clearInterval(intervalId);
            console.error("Task failed:", task.result);
            setView(PageView.GENERATE);
          }
        } catch (pollError) {
          clearInterval(intervalId);
          console.error("Polling error:", pollError);
          alert("An error occurred while checking the task status.");
          setView(PageView.GENERATE);
        }
      }, 3000);

    } catch (createError) {
      console.error("Create task error:", createError);
      alert("Failed to start the generation task. Please try again.");
      setView(PageView.GENERATE);
    }
  };


  // Report Modal (Unchanged)
  const ReportModal = () => (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-slide-up">
        <div className="flex items-center gap-2 mb-4 text-red-600">
           <ExclamationTriangleIcon className="w-6 h-6" />
           <h3 className="font-bold text-lg">Report Content</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">Why are you reporting this post?</p>
        <div className="space-y-2 mb-6">
           {['Offensive/Hate Speech', 'Unauthorized Use of Likeness', 'Spam/Misleading', 'Other'].map(reason => (
             <button 
               key={reason} 
               onClick={() => { setReportModalOpen(false); alert('Report Submitted'); }}
               className="w-full text-left p-3 rounded-lg border border-gray-100 hover:bg-gray-50 text-sm font-medium"
             >
               {reason}
             </button>
           ))}
        </div>
        <button onClick={() => setReportModalOpen(false)} className="mt-4 w-full bg-black text-white py-2 rounded-lg">Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white relative shadow-2xl overflow-hidden">
      {/* View Routing */}
      {currentView === PageView.HOME && <HomePage setView={setView} user={user} />}
      {currentView === PageView.FEED && <FeedPage user={user} setView={setView} />}
      {currentView === PageView.GENERATE && <GeneratePage onGenerate={handleGenerate} setView={setView} user={user} />}
      {currentView === PageView.LOADING && <LoadingPage />}
      {currentView === PageView.RESULT && <ResultPage result={generationResult} onRetry={() => setView(PageView.GENERATE)} onFeedUpload={(creationId) => { alert(`Creation ${creationId} uploaded to feed!`); setView(PageView.FEED); }} />}
      {currentView === PageView.LOGIN && <LoginPage onEmailLogin={handleEmailLogin} onRegister={handleRegister} />}
      {currentView === PageView.MY_PAGE && <MyPage user={user} setView={setView} />}
      {currentView === PageView.ADMIN_DASHBOARD && <AdminDashboard setView={setView} user={user} />}

      {/* Global Navbar (Only show on main navigation pages if logged in) */}
      {(currentView === PageView.HOME || currentView === PageView.FEED || currentView === PageView.MY_PAGE || currentView === PageView.ADMIN_DASHBOARD) && (
        <Navbar currentView={currentView} setView={setView} isLoggedIn={user.isLoggedIn} userRole={user.role} />
      )}

      {/* Modals */}
      {reportModalOpen && <ReportModal />}
    </div>
  );
}