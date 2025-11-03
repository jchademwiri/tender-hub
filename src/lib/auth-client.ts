// Better Auth client configuration for better-auth v1.3.27 compatibility

// Type definitions to match what the sign-in page expects
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
      // Mock implementation for better-auth v1.3.27 compatibility
      // In a real implementation, this would call the actual auth API
      return {
        error: null,
        user: { id: "mock-user-id", email: credentials.email }
      };
    }
  },
  signUp: {
    email: async (credentials: { email: string; password: string; name?: string }): Promise<AuthResult> => {
      // Mock implementation for better-auth v1.3.27 compatibility
      return {
        error: null,
        user: { id: "mock-user-id", email: credentials.email }
      };
    }
  },
  signOut: async (): Promise<{ error: AuthError | null }> => {
    // Mock implementation for better-auth v1.3.27 compatibility
    return { error: null };
  }
};

// Placeholder methods for direct exports
export const signOut = () => Promise.resolve();
export const signIn = () => Promise.resolve();
export const signUp = () => Promise.resolve();

// Create a minimal client for compatibility
export const createAuthClient = (config: { baseURL: string }) => ({
  baseURL: config.baseURL,
  signIn: {
    email: async (credentials: { email: string; password: string }): Promise<AuthResult> => {
      return {
        error: null,
        user: { id: "mock-user-id", email: credentials.email }
      };
    }
  },
  signUp: {
    email: async (credentials: { email: string; password: string; name?: string }): Promise<AuthResult> => {
      return {
        error: null,
        user: { id: "mock-user-id", email: credentials.email }
      };
    }
  },
  signOut: async (): Promise<{ error: AuthError | null }> => {
    return { error: null };
  }
});
