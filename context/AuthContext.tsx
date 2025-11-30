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

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
        const token = localStorage.getItem('authToken');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.exp * 1000 > Date.now()) {
            const userData: User = {
              id: payload.id,
              email: payload.email,
              firstName: payload.firstName,
              lastName: payload.lastName,
              role: payload.role,
              password: ''
            };
            setCurrentUser(userData);
            if (userData.role === 'admin') {
              await fetchUsers();
            }
          } else {
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

      // Note: This route might not exist yet on the backend.
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    }
  };

  const login = async (email: string, password: string): Promise<User | null> => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data: LoginResponse = await response.json();
        const user = data.user;
        
        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }
        
        setCurrentUser(user);
        
        if (user && user.role === 'admin') {
          await fetchUsers();
        }
        
        return user;
      } else {
        let errorMessage = 'Email ou mot de passe incorrect';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // ignore
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur de connexion est survenue';
      setAuthError(errorMessage);
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
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
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        // After successful registration, automatically log the user in
        const loggedInUser = await login(userData.email, userData.password);
        return loggedInUser;
      } else {
        let errorMessage = 'Échec de l\'inscription';
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.map((err: any) => err.msg).join(', ');
          }
        } catch (parseError) {
          // ignore
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Une erreur d\'inscription est survenue';
      setAuthError(errorMessage);
      throw error;
    } finally {
      setIsLoadingAuth(false);
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
