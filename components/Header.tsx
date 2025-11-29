import React from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoriteContext';
import { View } from '../App';

interface HeaderProps {
  setView: (view: View) => void;
  onLogoClick: () => void;
  navigateToProductPage: (productId: number) => void;
}

const Header: React.FC<HeaderProps> = ({ setView, onLogoClick, navigateToProductPage }) => {
  const { currentUser, logout } = useAuth();
  const { itemCount } = useCart();
  const { favorites } = useFavorites();

  return (
    <header className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <button onClick={onLogoClick} className="text-2xl font-bold text-rose-500">Wafi</button>
        <nav className="space-x-4 hidden md:flex">
          <button onClick={() => setView('products')} className="hover:text-rose-500 transition">Produits</button>
          <button onClick={() => setView('cart')} className="hover:text-rose-500 transition">Panier</button>
          {currentUser && currentUser.role !== 'admin' && (
            <button onClick={() => setView('favorites')} className="hover:text-rose-500 transition">Favoris</button>
          )}
          {currentUser?.role === 'admin' && <button onClick={() => setView('admin')} className="hover:text-rose-500 transition">Admin</button>}
          {currentUser && <button onClick={() => setView('orders')} className="hover:text-rose-500 transition">Commandes</button>}
        </nav>
      </div>
      <div className="flex items-center space-x-4">
        {currentUser && currentUser.role !== 'admin' && (
          <button
            onClick={() => setView('favorites')}
            className="flex items-center space-x-1 hover:text-rose-500 transition p-2 relative"
            aria-label="Favoris"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="hidden sm:inline">Favoris</span>
            {favorites.length > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-rose-500 rounded-full min-w-[20px]">
                {favorites.length}
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => setView('cart')}
          className="flex items-center space-x-1 hover:text-rose-500 transition p-2 relative"
          aria-label="Panier"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6h9m0 0V13m0 0h2.5" />
          </svg>
          <span className="hidden sm:inline">Panier</span>
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-rose-500 rounded-full min-w-[20px]">
              {itemCount}
            </span>
          )}
        </button>
        {currentUser ? (
          <>
            <span className="text-sm text-gray-600">
              Bienvenue, <span className="font-semibold text-rose-600">{currentUser.firstName}</span>!
            </span>
            <button onClick={logout} className="text-gray-600 hover:text-rose-500 transition">Déconnexion</button>
          </>
        ) : (
          <>
            <button onClick={() => setView('login')} className="text-gray-600 hover:text-rose-500 transition">Connexion</button>
            <button onClick={() => setView('register')} className="text-gray-600 hover:text-rose-500 transition">Inscription</button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;