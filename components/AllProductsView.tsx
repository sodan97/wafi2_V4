import React from 'react';
import ProductCard from './ProductCard';
import { useProduct } from '../context/ProductContext';
import { Product } from '../types';

interface AllProductsViewProps {
  onProductSelect: (id: number) => void;
  onNotifyMeClick: (product: Product) => void;
}

const AllProductsView: React.FC<AllProductsViewProps> = ({ onProductSelect, onNotifyMeClick }) => {
  const { activeProducts } = useProduct();

  return (
    <div className="mt-2">
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 border-l-4 border-rose-500 pl-4">
          Nos Produits
        </h2>
        <p className="text-md text-gray-500 mb-8 pl-5">
          Découvrez notre sélection exclusive de produits de qualité.
        </p>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          {activeProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onProductSelect={onProductSelect}
              onNotifyMeClick={onNotifyMeClick}
            />
          ))}
        </div>
        {activeProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucun produit disponible pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllProductsView;