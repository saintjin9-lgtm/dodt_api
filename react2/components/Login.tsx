import React from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  
  const handleGoogleLogin = () => {
    // Simulation
    const randomId = 'USR' + Math.floor(1000 + Math.random() * 9000);
    const mockUser: User = {
      id: randomId,
      name: 'Google User',
      email: 'user@gmail.com',
      avatarUrl: `https://ui-avatars.com/api/?name=Google+User&background=random`,
      dailyGenerationsUsed: 0,
      maxDailyGenerations: 3
    };
    onLogin(mockUser);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-2">DOTD</h1>
        <p className="text-gray-500 mb-12">Discover your daily fashion.</p>

        <button 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3.5 px-4 rounded-xl transition-colors shadow-sm"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6 mr-3" alt="Google" />
          Continue with Google
        </button>

        <div className="mt-8 text-[10px] text-gray-400 text-center">
          By continuing, you agree to our Terms of Service <br/> and Privacy Policy.
          <br/><br/>
          &copy; 2024 DOTD AI. All rights reserved.
        </div>
      </div>
    </div>
  );
};