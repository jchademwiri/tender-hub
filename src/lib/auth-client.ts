// Simple authentication client for testing
interface AuthError {
  message?: string;
  code?: string;
  [key: string]: any;
}

interface AuthResult {
  error: AuthError | null;
  user?: { id: string; email: string; [key: string]: any };
}

export const authClient = {
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  
  signIn: {
    email: async (credentials: { email: string; password: string }): Promise<AuthResult> => {
      const { email } = credentials;
      
      if (!email) {
        return { error: { code: "INVALID_EMAIL", message: "Email is required" } };
      }
      
      // Simple role detection
      const lowerEmail = email.toLowerCase();
      let role = 'user';
      if (lowerEmail.includes('admin')) {
        role = 'admin';
      } else if (lowerEmail.includes('manager')) {
        role = 'manager';
      }
      
      const user = {
        id: `user-${Date.now()}`,
        email: email,
        name: email.split('@')[0].replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        role: role,
        status: "active"
      };
      
      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('tender-hub-user', JSON.stringify(user));
      }
      
      return {
        error: null,
        user: user
      };
    }
  },
  
  signOut: async (): Promise<{ error: AuthError | null }> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tender-hub-user');
    }
    return { error: null };
  }
};

// Simple helper to get current user
export function getCurrentUser() {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('tender-hub-user');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }
  return null;
}

// Export other required methods
export const signOut = () => Promise.resolve();
export const signIn = () => Promise.resolve();
export const signUp = () => Promise.resolve();
export const createAuthClient = () => ({});
