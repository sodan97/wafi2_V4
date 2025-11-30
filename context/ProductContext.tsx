import React, { createContext, useState, useContext, useCallback, ReactNode, useEffect, useMemo } from 'react';
import { Product } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ProductContextType {
  products: Product[];
  activeProducts: Product[];
  archivedProducts: Product[];
  isLoadingProducts: boolean;
  productError: { message: string; status?: number } | null;
  refreshProducts: () => Promise<void>;
  updateProductStock: (productId: number, newStock: number) => Promise<void>;
  updateProductStatus: (productId: number, status: 'active' | 'archived') => Promise<void>;
  deleteProduct: (productId: number) => Promise<void>;
  restoreProduct: (productId: number) => Promise<void>;
  permanentlyDeleteProduct: (productId: number) => Promise<void>;
  addProduct: (newProduct: Omit<Product, 'id'>) => Promise<Product | null>;
  updateProduct: (productId: number, productData: Partial<Product>) => Promise<Product | null>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [productError, setProductError] = useState<{ message: string; status?: number } | null>(null);

  const activeProducts = useMemo(() => products.filter(p => p.status === 'active'), [products]);
  const archivedProducts = useMemo(() => products.filter(p => p.status === 'archived'), [products]);

  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    setProductError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProductError({
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        status: error instanceof Error && 'status' in error ? (error as any).status : undefined
      });
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const refreshProducts = useCallback(async () => {
    await fetchProducts();
  }, [fetchProducts]);

  const addProduct = useCallback(async (newProduct: Omit<Product, 'id'>) => {
    // ... (implementation unchanged)
    return null;
  }, []);

  const updateProduct = useCallback(async (productId: number, productData: Partial<Product>) => {
    // ... (implementation unchanged)
    return null;
  }, []);

  const updateProductStock = useCallback(async (productId: number, newStock: number) => {
    // ... (implementation unchanged)
  }, [products]);

  const deleteProduct = useCallback(async (productId: number) => {
    // ... (implementation unchanged)
  }, [products]);

  const updateProductStatus = useCallback(async (productId: number, status: 'active' | 'archived') => {
    // ... (implementation unchanged)
  }, [products]);

  const restoreProduct = useCallback(async (productId: number) => {
    // ... (implementation unchanged)
  }, [products]);

  const permanentlyDeleteProduct = useCallback(async (productId: number) => {
    // ... (implementation unchanged)
  }, [products]);

  return (
    <ProductContext.Provider
      value={{
        products,
        activeProducts,
        archivedProducts,
        isLoadingProducts,
        productError,
        refreshProducts,
        updateProductStock,
        updateProductStatus,
        deleteProduct,
        restoreProduct,
        permanentlyDeleteProduct,
        addProduct,
        updateProduct
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProduct = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
};
