export enum PageView {
  HOME = 'HOME',
  FEED = 'FEED',
  GENERATE = 'GENERATE',
  MY_PAGE = 'MY_PAGE',
  LOGIN = 'LOGIN',
  LOADING = 'LOADING',
  RESULT = 'RESULT'
}

export interface User {
  id: string;
  email?: string; // Added for JWT payload
  name: string;
  avatar?: string; // Renamed from picture, optional
  role?: string; // Added for JWT payload
  isLoggedIn: boolean;
  created_at?: string; // From backend, ISO string
}

export interface Creation {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  prompt: string;
  gender?: string; // Optional as not all creations might have it
  age_group?: string; // Optional as not all creations might have it
  is_public: boolean;
  is_picked_by_admin: boolean;
  likes_count: number;
  created_at: string; // ISO string
  author_name?: string; // From JOIN users table
  author_picture?: string; // From JOIN users table
  is_liked?: boolean; // From backend service, depending on current user
}

export interface GenerationResult {
  creation: Creation; // Contains the generated/processed image and all its metadata
  analysis: string;
  recommendation: string;
  tags: string[];
}

// Gemini specific types for our service
export interface GeminiAnalysisResponse {
  analysis: string;
  recommendation: string;
  tags: string[];
}

export interface Task {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result: {
      creation?: Creation; // Now explicitly Creation
      n8n_response?: GeminiAnalysisResponse;
      error?: string;
    }; 
}