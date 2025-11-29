import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface Product {
  _id: string;
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrls: string[];
  category: string;
  stock: number;
  status: string;
}

interface Favorite {
  _id: string;
  userId: string;
  productId: Product | number; // Can be either populated product or just the id
  date: string;
}

interface FavoriteContextType {
  favorites: Favorite[];
  isLoadingFavorites: boolean;
  favoriteError: string | null;
  addFavorite: (productId: number) => Promise<void>;
  removeFavorite: (productId: number) => Promise<void>;
  isFavorite: (productId: number) => boolean;
  toggleFavorite: (productId: number) => Promise<void>;
  fetchFavorites: () => Promise<void>;
}

const FavoriteContext = createContext<FavoriteContextType | undefined>(undefined);

const API_BASE_URL = '/api';

export const FavoriteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const fetchFavorites = useCallback(async () => {
    if (!currentUser) {
      console.debug('[Favorites] No current user, clearing favorites');
      setFavorites([]);
      return;
    }

    setIsLoadingFavorites(true);
    setFavoriteError(null);
    try {
      console.debug('[Favorites] Fetching favorites from API');
      const response = await fetch(`${API_BASE_URL}/favorites`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
      });

      if (!response.ok) {
        // Check if it's an authentication error
        if (response.status === 401) {
          const errorData = await response.json().catch(() => ({}));
          console.error('[Favorites] Authentication error:', errorData);

          // If token is invalid, clear it and show a message
          if (errorData.error === 'INVALID_TOKEN' || errorData.error === 'EXPIRED_TOKEN') {
            console.warn('[Favorites] Token invalide détecté, nettoyage du localStorage');
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            alert('Votre session a expiré. Veuillez vous reconnecter.');
            window.location.reload();
            return;
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.debug('[Favorites] Received data:', data);

      // Normalize favorites to ensure productId is either a populated product or a number
      const normalized: Favorite[] = (data || []).map((f: any) => ({
        _id: f._id,
        userId: f.userId,
        productId: f.product && typeof f.product === 'object' ? f.product : (f.productId ?? f.product),
        date: f.date ?? f.createdAt ?? new Date().toISOString(),
      }));

      setFavorites(normalized);
      console.debug('[Favorites] Set normalized favorites:', normalized);
    } catch (error: any) {
      setFavoriteError(error.message || 'An unknown error occurred');
      console.error('[Favorites] Error fetching favorites:', error);
    } finally {
      setIsLoadingFavorites(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      console.debug('[Favorites] currentUser changed, fetching favorites');
      fetchFavorites();
    } else {
      console.debug('[Favorites] currentUser is null, clearing favorites');
      setFavorites([]);
    }
  }, [currentUser, fetchFavorites]);

  const addFavorite = useCallback(async (productId: number) => {
    if (!currentUser) {
      alert('Vous devez être connecté pour ajouter des favoris.');
      return;
    }

    // Optimistic update
    const tempFavorite: Favorite = {
      _id: `temp-${Date.now()}`,
      userId: currentUser.id,
      productId,
      date: new Date().toISOString()
    };
    console.debug('[Favorites] Optimistically adding favorite:', tempFavorite);
    setFavorites(prev => [...prev, tempFavorite]);

    try {
      const response = await fetch(`${API_BASE_URL}/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Check if it's an authentication error
        if (response.status === 401 && (errorData.error === 'INVALID_TOKEN' || errorData.error === 'EXPIRED_TOKEN')) {
          console.warn('[Favorites] Token invalide détecté lors de l\'ajout');
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          alert('Votre session a expiré. Veuillez vous reconnecter.');
          window.location.reload();
          return;
        }

        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const newFavorite = await response.json().catch(() => null);
      console.debug('[Favorites] Server added favorite response:', newFavorite);

      // Refresh to get the real data from server (including populated product)
      await fetchFavorites();
    } catch (error: any) {
      setFavoriteError(error.message);
      console.error('[Favorites] Error adding favorite:', error);
      // Rollback optimistic update
      setFavorites(prev => prev.filter(f => f._id !== tempFavorite._id));

      if (!error.message?.includes?.('already in favorites')) {
        alert('Erreur lors de l\'ajout aux favoris: ' + error.message);
      }
    }
  }, [currentUser, fetchFavorites]);

  const removeFavorite = useCallback(async (productId: number) => {
    if (!currentUser) {
      console.debug('[Favorites] removeFavorite called without a currentUser');
      return;
    }

    // Optimistic update
    const originalFavorites = [...favorites];
    console.debug('[Favorites] Optimistically removing favorite for productId:', productId);
    setFavorites(prev => prev.filter(f => {
      const favProductId = typeof f.productId === 'object' ? (f.productId as Product).id : f.productId;
      return favProductId !== productId;
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/favorites/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Check if it's an authentication error
        if (response.status === 401 && (errorData.error === 'INVALID_TOKEN' || errorData.error === 'EXPIRED_TOKEN')) {
          console.warn('[Favorites] Token invalide détecté lors de la suppression');
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          alert('Votre session a expiré. Veuillez vous reconnecter.');
          window.location.reload();
          return;
        }

        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.debug('[Favorites] Successfully removed favorite for productId:', productId);
    } catch (error: any) {
      setFavoriteError(error.message);
      console.error('[Favorites] Error removing favorite:', error);
      // Rollback optimistic update
      setFavorites(originalFavorites);
      alert('Erreur lors de la suppression du favori.');
    }
  }, [currentUser, favorites]);

  const isFavorite = useCallback((productId: number): boolean => {
    const found = favorites.some(f => {
      const favProductId = typeof f.productId === 'object' ? (f.productId as Product).id : f.productId;
      return favProductId === productId;
    });
    console.debug('[Favorites] isFavorite check for', productId, '=>', found);
    return found;
  }, [favorites]);

  const toggleFavorite = useCallback(async (productId: number) => {
    console.debug('[Favorites] toggleFavorite called for productId:', productId);
    if (isFavorite(productId)) {
      await removeFavorite(productId);
    } else {
      await addFavorite(productId);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  return (
    <FavoriteContext.Provider
      value={{
        favorites,
        isLoadingFavorites,
        favoriteError,
        addFavorite,
        removeFavorite,
        isFavorite,
        toggleFavorite,
        fetchFavorites,
      }}
    >
      {children}
    </FavoriteContext.Provider>
  );
};

export const useFavorites = (): FavoriteContextType => {
  const context = useContext(FavoriteContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoriteProvider');
  }
  return context;
};
