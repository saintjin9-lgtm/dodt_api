import React from 'react';
import { Home, Grid, Plus, User as UserIcon, LogIn, LogOut } from 'lucide-react';
import { ViewState, User } from '../types';

interface NavbarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, currentUser, onLogout }) => {
  
  const handleNavClick = (target: ViewState) => {
    // If user is not logged in and tries to access restricted pages
    if (!currentUser && (target === ViewState.FEED || target === ViewState.CREATE || target === ViewState.MYPAGE)) {
      onNavigate(ViewState.LOGIN);
      return;
    }
    onNavigate(target);
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 pb-safe pt-2 px-6 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-center h-16 max-w-md mx-auto">
        
        {/* Home */}
        <button 
          onClick={() => handleNavClick(ViewState.HOME)}
          className={`flex flex-col items-center space-y-1 ${currentView === ViewState.HOME ? 'text-black' : 'text-gray-400'}`}
        >
          <Home size={24} strokeWidth={currentView === ViewState.HOME ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Home</span>
        </button>

        {/* Feed */}
        <button 
          onClick={() => handleNavClick(ViewState.FEED)}
          className={`flex flex-col items-center space-y-1 ${currentView === ViewState.FEED ? 'text-black' : 'text-gray-400'}`}
        >
          <Grid size={24} strokeWidth={currentView === ViewState.FEED ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Feed</span>
        </button>

        {/* Create (Center) */}
        <div className="relative -top-5">
          <button 
            onClick={() => handleNavClick(ViewState.CREATE)}
            className="w-14 h-14 bg-black rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform border-4 border-gray-50"
          >
            <Plus size={28} color="white" />
          </button>
        </div>

        {/* My Page */}
        <button 
          onClick={() => handleNavClick(ViewState.MYPAGE)}
          className={`flex flex-col items-center space-y-1 ${currentView === ViewState.MYPAGE ? 'text-black' : 'text-gray-400'}`}
        >
          <UserIcon size={24} strokeWidth={currentView === ViewState.MYPAGE ? 2.5 : 2} />
          <span className="text-[10px] font-medium">My Page</span>
        </button>

        {/* Login/Logout */}
        {currentUser ? (
          <button 
            onClick={onLogout}
            className="flex flex-col items-center space-y-1 text-gray-400"
          >
            <LogOut size={24} strokeWidth={2} />
            <span className="text-[10px] font-medium">Logout</span>
          </button>
        ) : (
          <button 
            onClick={() => onNavigate(ViewState.LOGIN)}
            className={`flex flex-col items-center space-y-1 ${currentView === ViewState.LOGIN ? 'text-black' : 'text-gray-400'}`}
          >
            <LogIn size={24} strokeWidth={currentView === ViewState.LOGIN ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Login</span>
          </button>
        )}
      </div>
    </nav>
  );
};