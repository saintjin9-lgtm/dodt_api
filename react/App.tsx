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
import { setAuthToken } from './services/apiService';

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
  const updateUserFromToken = (token: string) => {
    try {
      const payload = JSON.parse(decodeBase64Url(token.split('.')[1]));
      
      const currentTime = Date.now() / 1000;
      if (payload.exp && payload.exp < currentTime) {
        console.error("Token expired.");
        setAuthToken(null);
        setCurrentUser(null);
        return;
      }
      
      // Map JWT payload to the new User type
      const user: User = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        avatarUrl: payload.picture,
        role: payload.role, // Add role from token
        // These fields are not in the token, set defaults or fetch them later
        dailyGenerationsUsed: 0, 
        maxDailyGenerations: 5, 
      };
      
      setCurrentUser(user);
      setAuthToken(token);

    } catch (e) {
      console.error("Failed to decode token or token is invalid.", e);
      setAuthToken(null);
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    // Always start with a clean, unauthenticated state and default to HOME view
    setCurrentView(ViewState.HOME);
    setCurrentUser(null);
    setAuthToken(null); // Ensure no stale token is used implicitly

    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const tokenInLocalStorage = localStorage.getItem('authToken');

      // Prioritize OAuth code if present
      if (code) {
        // Clean the URL
        window.history.replaceState({}, '', '/');
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
            setCurrentView(ViewState.HOME); // Stay on HOME after successful OAuth
          } else {
            throw new Error('Backend did not return an access_token.');
          }
        } catch (error) {
          console.error("Error during Google OAuth callback:", error);
          alert(`Google login failed: ${error instanceof Error ? error.message : String(error)}`);
          // If OAuth fails, we should still remain on HOME, not redirect to LOGIN
          setCurrentView(ViewState.HOME); 
        }
      } 
      // If no code, but a token exists in localStorage, try to re-authenticate
      else if (tokenInLocalStorage) {
        updateUserFromToken(tokenInLocalStorage);
        // If token is invalid/expired, updateUserFromToken will clear it and currentUser.
        // We will remain on HOME due to the initial setCurrentView(ViewState.HOME)
      }
    };

    handleOAuthCallback();
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
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl overflow-hidden relative">
      {renderView()}
      
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
