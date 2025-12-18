import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Home } from './components/Home';
import { Feed } from './components/Feed';
import { Generate } from './components/Generate';
import { MyPage } from './components/MyPage';
import { Login } from './components/Login';
import { User, ViewState, FeedItem } from './types';
import { MOCK_FEED_ITEMS } from './constants';

const App: React.FC = () => {
  // --- State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [feedItems, setFeedItems] = useState<FeedItem[]>(MOCK_FEED_ITEMS);
  const [myItems, setMyItems] = useState<FeedItem[]>([]);
  const [likedItems, setLikedItems] = useState<FeedItem[]>(MOCK_FEED_ITEMS.filter(i => i.isLiked));

  // --- Handlers ---
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView(ViewState.HOME); // Go home after login
  };

  const handleLogout = () => {
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
        return <Feed items={feedItems} currentUser={currentUser} onNavigate={setCurrentView} />;
      case ViewState.CREATE:
        return <Generate currentUser={currentUser} onNavigate={setCurrentView} onAddToFeed={handleAddToFeed} />;
      case ViewState.MYPAGE:
        if (!currentUser) return <Login onLogin={handleLogin} />;
        return <MyPage user={currentUser} myItems={myItems} likedItems={likedItems} onNavigate={setCurrentView} />;
      case ViewState.LOGIN:
        return <Login onLogin={handleLogin} />;
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
        />
      )}
    </div>
  );
};

export default App;