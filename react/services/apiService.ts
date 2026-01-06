// Service to interact with our FastAPI backend
import { Task, Creation, User } from '../types';

// Initialize token from localStorage for persistence across page reloads.
let token: string | null = localStorage.getItem('authToken');

export const setAuthToken = (newToken: string | null) => {
    token = newToken;
    if (newToken) {
        localStorage.setItem('authToken', newToken);
    } else {
        localStorage.removeItem('authToken');
    }
};

const getAuthHeaders = () => {
    if (!token) return {};
    return {
        'Authorization': `Bearer ${token}`
    };
};

/**
 * A wrapper around fetch that automatically includes the auth token.
 * @param url The URL to fetch.
 * @param options The fetch options.
 * @returns The fetch response promise.
 */
const fetchWithAuth = (url: string, options: RequestInit = {}) => {
    const headers = {
        ...options.headers,
        ...getAuthHeaders(),
    };

    // Do not set Content-Type for FormData, browser does it.
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    } else {
        // Only set Content-Type if not FormData and body exists
        if (options.body) {
            headers['Content-Type'] = 'application/json';
        }
    }

    return fetch(url, { ...options, headers, credentials: 'include' });
};


// --- User Authentication ---

export const registerWithEmail = async (name:string, email: string, password: string) => {
    const response = await fetchWithAuth('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to register' }));
        throw new Error(errorData.detail || 'Server error');
    }
    return response.json();
};

export const loginWithEmail = async (email: string, password: string): Promise<{ access_token: string }> => {
    const response = await fetch('/auth/login', { // Login doesn't need auth token
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to log in' }));
        throw new Error(errorData.detail || 'Server error');
    }
    const data = await response.json();
    setAuthToken(data.access_token);
    return data;
};

/**
 * Exchange an OAuth authorization code with the backend for an access token.
 * The backend endpoint returns JSON containing `access_token` and optional `redirect_to`.
 */
export const exchangeOAuthCode = async (code: string): Promise<any> => {
    const response = await fetch(`/auth/rest/oauth2-credential/callback?code=${encodeURIComponent(code)}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to exchange OAuth code' }));
        throw new Error(errorData.detail || 'Server error');
    }
    return response.json();
};


export const fetchCurrentUser = async (): Promise<any | null> => {
    try {
        const response = await fetchWithAuth('/users/me');
        if (!response.ok) {
            return null;
        }
        return response.json();
    } catch (e) {
        return null;
    }
};


// --- Task/Creation Management ---

/**
 * Creates a new generation task on the backend.
 * @param params An object containing all generation parameters.
 * @returns A promise that resolves to an object containing the task_id.
 */
export const createGenerationTask = async (params: {
    imageFile: File | null;
    prompt: string;
    gender: string;
    height: number;
    bodyType: string;
    style: string;
    colors: string[];
}): Promise<{ task_id: string }> => {
    const { imageFile, prompt, gender, height, bodyType, style, colors } = params;

    const formData = new FormData();
    
    // The backend expects 'text' for the prompt
    formData.append('text', prompt); 
    formData.append('gender', gender);
    formData.append('height', String(height));
    formData.append('body_type', bodyType);
    formData.append('style', style);
    
    // Join colors array into a single string
    formData.append('colors', colors.join(','));

    // The old fields 'age_group' and 'is_public' are not in the new UI.
    // We can send default/empty values if the backend requires them.
    formData.append('age_group', ''); // Sending empty as it's not in the new UI
    formData.append('is_public', 'true'); // Defaulting to true

    if (imageFile) {
        formData.append('image', imageFile);
    }

    const response = await fetchWithAuth('/api/create_task', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to create task' }));
        throw new Error(errorData.detail || 'Server error');
    }

    return response.json();
};

/**
 * Fetches the status of a specific task from the backend.
 * @param taskId The ID of the task to check.
 * @returns A promise that resolves to a Task object.
 */
export const getTaskStatus = async (taskId: string): Promise<Task> => {
    const response = await fetchWithAuth(`/api/task_status/${taskId}`);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to get task status' }));
        throw new Error(errorData.detail || 'Server error');
    }

    return response.json();
};

/**
 * Fetches creations for the current logged-in user.
 * @param limit Number of creations to fetch.
 * @param offset Offset for pagination.
 * @returns A promise that resolves to a list of Creation objects.
 */
export const getCreationsForUser = async (limit: number = 10, offset: number = 0): Promise<Creation[]> => {
    const response = await fetchWithAuth(`/api/users/me/creations?limit=${limit}&offset=${offset}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch user creations' }));
        throw new Error(errorData.detail || 'Server error');
    }
    return response.json();
};

/**
 * Fetches creations liked by the current logged-in user.
 * @param limit Number of creations to fetch.
 * @param offset Offset for pagination.
 * @returns A promise that resolves to a list of Creation objects.
 */
export const getLikedCreations = async (limit: number = 10, offset: number = 0): Promise<Creation[]> => {
    const response = await fetchWithAuth(`/api/users/me/liked_creations?limit=${limit}&offset=${offset}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch liked creations' }));
        throw new Error(errorData.detail || 'Server error');
    }
    return response.json();
};

/**
 * Fetches public creations for the feed.
 * @param sortBy 'latest' or 'popular'.
 * @param limit Number of creations to fetch.
 * @param offset Offset for pagination.
 * @returns A promise that resolves to a list of Creation objects.
 */
export const getFeedCreations = async (sortBy: string = 'latest', limit: number = 10, offset: number = 0): Promise<Creation[]> => {
    const response = await fetchWithAuth(`/api/creations/feed?sort_by=${sortBy}&limit=${limit}&offset=${offset}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch feed creations' }));
        throw new Error(errorData.detail || 'Server error');
    }
    return response.json();
};

/**
 * Fetches admin-picked creations for the home screen.
 * @param limit Number of creations to fetch (default 9).
 * @returns A promise that resolves to a list of Creation objects.
 */
export const getPickedCreations = async (limit: number = 9): Promise<Creation[]> => {
    const response = await fetchWithAuth(`/api/creations/picked?limit=${limit}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch picked creations' }));
        throw new Error(errorData.detail || 'Server error');
    }
    return response.json();
};

/**
 * Fetches the most recent unique tags for the ticker.
 * @returns A promise that resolves to a list of strings (tags).
 */
export const getRecentTags = async (): Promise<string[]> => {
    // This endpoint doesn't require auth, so we can use fetch directly
    const response = await fetch(`/api/tags/recent`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch recent tags' }));
        throw new Error(errorData.detail || 'Server error');
    }
    return response.json();
};

/**
 * Allows a user to like a creation.
 * @param creationId The ID of the creation to like.
 */
export const likeCreation = async (creationId: string): Promise<any> => {
    const response = await fetchWithAuth(`/api/creations/${creationId}/like`, {
        method: 'POST'
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to like creation' }));
        throw new Error(errorData.detail || 'Server error');
    }
    return response.json();
};

/**
 * Allows a user to unlike a creation.
 * @param creationId The ID of the creation to unlike.
 */
export const unlikeCreation = async (creationId: string): Promise<any> => {
    const response = await fetchWithAuth(`/api/creations/${creationId}/like`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to unlike creation' }));
        throw new Error(errorData.detail || 'Server error');
    }
    return response.json();
};

/**
 * Allows a user to delete their own creation.
 * @param creationId The ID of the creation to delete.
 */
export const deleteCreation = async (creationId: string | number): Promise<any> => {
    const response = await fetchWithAuth(`/api/creations/${creationId}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to delete creation' }));
        throw new Error(errorData.detail || 'Server error');
    }
    // No JSON body is expected on a successful 204 No Content, but FastAPI might return one.
    // Check for content before trying to parse.
    const text = await response.text();
    return text ? JSON.parse(text) : {};
};

/**
 * Allows an admin to toggle the 'is_picked_by_admin' flag for a creation.
 * @param creationId The ID of the creation.
 * @returns A promise that resolves to the updated status.
 */
export const toggleAdminPick = async (creationId: string): Promise<any> => {
    const response = await fetchWithAuth(`/api/admin/creations/${creationId}/pick`, {
        method: 'POST'
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to toggle admin pick' }));
        throw new Error(errorData.detail || 'Server error');
    }
    return response.json();
};

// --- Admin APIs ---

/**
 * Fetches all users for admin view.
 * @returns A promise that resolves to a list of User objects (without sensitive info).
 */
export const getAllUsers = async (): Promise<User[]> => {
    const response = await fetchWithAuth('/admin/users');
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch users' }));
        throw new Error(errorData.detail || 'Server error');
    }
    return response.json();
};

/**
 * Fetches all admin-picked creations for admin view.
 * @returns A promise that resolves to a list of Creation objects.
 */
export const getAdminPickedCreations = async (): Promise<Creation[]> => {
    const response = await fetchWithAuth('/admin/creations/picked');
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch admin picked creations' }));
        throw new Error(errorData.detail || 'Server error');
    }
    return response.json();
};

/**
 * Allows an admin to delete a creation.
 * @param creationId The ID of the creation to delete.
 */
export const deleteCreationAdmin = async (creationId: string): Promise<any> => {
    const response = await fetchWithAuth(`/admin/creations/${creationId}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to delete creation' }));
        throw new Error(errorData.detail || 'Server error');
    }
    return response.json();
};



/**

 * Fetches the total number of users for admin stats.

 * @returns A promise that resolves to an object with user_count.

 */

export const getUsersCountAdmin = async (): Promise<{ users_count: number }> => {

    const response = await fetchWithAuth('/admin/stats/users_count');

    if (!response.ok) {

        const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch user count' }));

        throw new Error(errorData.detail || 'Server error');

    }

    return response.json();

};



/**

 * Sets a specific creation as the main one for the discovery page.

 * @param creationId The ID of the creation to set as main.

 */

export const setMainCreation = async (creationId: string): Promise<any> => {

    const response = await fetchWithAuth(`/api/admin/creations/${creationId}/main`, {

        method: 'POST'

    });

    if (!response.ok) {

        const errorData = await response.json().catch(() => ({ detail: 'Failed to set main creation' }));

        throw new Error(errorData.detail || 'Server error');

    }

    return response.json();

};
