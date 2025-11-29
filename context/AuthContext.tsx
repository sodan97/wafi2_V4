import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, LoginResponse } from '../types';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  register: (userData: Omit<User, 'id' | 'role'>) => Promise<User | null>;
  isLoadingAuth: boolean;
  authError: Error | string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/users` : '/api/users';

// Mock admin user for fallback
const MOCK_ADMIN: User = {
  id: 1,
  email: 'admin@wafi.com',
  password: 'admin123',
  firstName: 'Admin',
  lastName: 'Wafi',
  role: 'admin'
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [authError, setAuthError] = useState<Error | string | null>(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoadingAuth(true);
      setAuthError(null);
      try {
        // Check if user has stored token
        const token = localStorage.getItem('authToken');
        if (token) {
          // For now, just check if token exists (we'll implement proper verification later)
          try {
            // Try to decode the token to get user info
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.exp * 1000 > Date.now()) {
              // Token not expired, create user object from payload
              const userData = {
                id: payload.id,
                email: payload.email || 'admin@wafi.com',
                firstName: payload.firstName || 'Admin',
                lastName: payload.lastName || 'User',
                role: payload.role || 'admin'
              };
              setCurrentUser(userData);
              if (userData.role === 'admin') {
                await fetchUsers();
              }
            } else {
              // Token expired
              localStorage.removeItem('authToken');
              setCurrentUser(null);
            }
          } catch (tokenError) {
            // Invalid token format
            localStorage.removeItem('authToken');
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Authentication check error:", error);
        setAuthError(error instanceof Error ? error : new Error(String(error)));
        localStorage.removeItem('authToken');
        setCurrentUser(null);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    checkAuthStatus();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        // Fallback to mock admin if API fails
        setUsers([MOCK_ADMIN]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      // Fallback to mock admin
      setUsers([MOCK_ADMIN]);
    }
  };

  const login = async (email: string, password: string): Promise<User | null> => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      // Try API login first
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data: LoginResponse = await response.json();
        const user = data.user;
        
        // Store JWT token if provided
        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }
        
        setCurrentUser(user);
        
        if (user && user.role === 'admin') {
          await fetchUsers();
        }
        
        setIsLoadingAuth(false);
        return user;
      } else {
        // Try to get error message from response
        let errorMessage = 'Email ou mot de passe incorrect';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If we can't parse the error response, use default message
        }
        
        // Fallback to mock admin for development
        if (email === MOCK_ADMIN.email && password === MOCK_ADMIN.password) {
          setCurrentUser(MOCK_ADMIN);
          setUsers([MOCK_ADMIN]);
          setIsLoadingAuth(false);
          return MOCK_ADMIN;
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur de connexion est survenue';
      setAuthError(errorMessage);
      setIsLoadingAuth(false);
      throw error; // Re-throw to let the component handle it
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      // Remove stored token
      localStorage.removeItem('authToken');
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error("Logout error:", error);
      setAuthError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setCurrentUser(null);
      setUsers([]);
      setIsLoadingAuth(false);
    }
  };

  const register = async (userData: Omit<User, 'id' | 'role'>): Promise<User | null> => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const newUser = await response.json();
        
        // Auto-login after registration
        setCurrentUser(newUser);
        
        setIsLoadingAuth(false);
        return newUser;
      } else {
        let errorMessage = 'Échec de l\'inscription';
        try {
          const errorData = await response.json();
          
          // Handle specific error cases
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.errors && Array.isArray(errorData.errors)) {
            // Handle validation errors from express-validator
            const validationErrors = errorData.errors.map((err: any) => err.msg).join(', ');
            errorMessage = validationErrors;
          }
        } catch (parseError) {
          // If we can't parse the error response, use default message
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur d\'inscription est survenue';
      setAuthError(errorMessage);
      setIsLoadingAuth(false);
      throw error; // Re-throw to let the component handle it
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, users, login, logout, register, isLoadingAuth, authError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};