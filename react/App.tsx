import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Home } from './components/Home';
import { Feed } from './components/Feed';
import { Generate } from './components/Generate';
import { MyPage } from './components/MyPage';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { User, ViewState, FeedItem } from './types';
import { MOCK_FEED_ITEMS } from './constants';
import { setAuthToken, fetchCurrentUser } from './services/apiService';

// Helper function to decode Base64URL
const decodeBase64Url = (str: string) => {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return atob(str);
};

const App: React.FC = () => {
  // --- State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [feedItems, setFeedItems] = useState<FeedItem[]>(MOCK_FEED_ITEMS);
  const [myItems, setMyItems] = useState<FeedItem[]>([]);
  const [likedItems, setLikedItems] = useState<FeedItem[]>(MOCK_FEED_ITEMS.filter(i => i.isLiked));

  // --- Authentication and Session Handling ---
  const updateUserFromToken = async (token: string) => {
    setAuthToken(token); // Set token first for subsequent API calls
    try {
        const user = await fetchCurrentUser(); // fetchCurrentUser is in apiService
        if (user) {
            setCurrentUser(user);
        } else {
            // Token might be invalid on the backend, or expired and not handled by backend
            handleLogout();
        }
    } catch (error) {
        console.error("Failed to fetch user with token:", error);
        handleLogout();
    }
  };

  useEffect(() => {
    const handleAuthentication = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      // First, handle OAuth callback if a 'code' is present in the URL
      if (code) {
        window.history.replaceState({}, '', '/'); // Clean the URL
        try {
          const response = await fetch(`/auth/rest/oauth2-credential/callback?code=${code}`);
          if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Token exchange failed');
          }
          const data = await response.json();
          const { access_token } = data;
          
          if (access_token) {
            updateUserFromToken(access_token);
            setCurrentView(ViewState.HOME); // Go to home on successful login
          } else {
            throw new Error('Backend did not return an access_token.');
          }
        } catch (error) {
          console.error("Error during Google OAuth callback:", error);
          alert(`Google login failed: ${error instanceof Error ? error.message : String(error)}`);
          setCurrentView(ViewState.LOGIN); // On failure, direct to login
        }
      } else {
        // If no OAuth code, check for an existing token in localStorage to stay logged in
        const tokenInLocalStorage = localStorage.getItem('authToken');
        if (tokenInLocalStorage) {
          updateUserFromToken(tokenInLocalStorage);
        }
        // If no token, the user remains logged out, and the default view is HOME.
      }
    };

    handleAuthentication();
  }, []);


  // --- Handlers ---
  const handleLogin = (user: User) => {
    // This function is now effectively handled by the OAuth callback logic.
    // It can be kept for other login methods or removed if only Google OAuth is used.
    setCurrentUser(user);
    setCurrentView(ViewState.HOME); // Go home after login
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setCurrentView(ViewState.LOGIN);
  };

  const handleAddToFeed = (newItem: FeedItem) => {
    setFeedItems([newItem, ...feedItems]);
    setMyItems([newItem, ...myItems]);
  };

  const renderView = () => {
    switch (currentView) {
      case ViewState.HOME:
        return <Home feedItems={feedItems} onNavigate={setCurrentView} />;
      case ViewState.FEED:
        return <Feed currentUser={currentUser} onNavigate={setCurrentView} />;
      case ViewState.CREATE:
        return <Generate currentUser={currentUser} onNavigate={setCurrentView} onAddToFeed={handleAddToFeed} />;
      case ViewState.MYPAGE:
        if (!currentUser) return <Login onLogin={handleLogin} />;
        return <MyPage user={currentUser} onNavigate={setCurrentView} />;
      case ViewState.LOGIN:
        return <Login onLogin={handleLogin} />;
      case ViewState.ADMIN:
        if (!currentUser || currentUser.role !== 'ADMIN') return <Home feedItems={feedItems} onNavigate={setCurrentView} />;
        return <AdminDashboard user={currentUser} onNavigate={setCurrentView} />;
      default:
        return <Home feedItems={feedItems} onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white h-screen shadow-2xl flex flex-col">
      <div className="flex-1 overflow-y-auto pb-24">
        {renderView()}
      </div>
      
      {/* Hide Navbar on Login page */}
      {currentView !== ViewState.LOGIN && (
        <Navbar 
          currentView={currentView} 
          onNavigate={setCurrentView} 
          currentUser={currentUser} 
          onLogout={handleLogout}
          userRole={currentUser?.role}
        />
      )}
    </div>
  );
};

export default App;
