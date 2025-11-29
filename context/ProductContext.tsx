import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { Product } from '../types';

interface ProductContextType {
  products: Product[];
  isLoadingProducts: boolean;
  productError: { message: string; status?: number } | null;
  addProduct: (productData: Omit<Product, 'id' | 'status'>) => Promise<void>;
  updateProduct: (productId: number, productData: Partial<Product>) => Promise<void>;
  deleteProduct: (productId: number) => Promise<void>;
  updateProductStock: (productId: number, newStock: number) => Promise<void>;
  updateProductStatus: (productId: number, status: 'active' | 'archived') => Promise<void>;
  restoreProduct: (productId: number) => Promise<void>;
  permanentlyDeleteProduct: (productId: number) => Promise<void>;
  refreshProducts: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [productError, setProductError] = useState<{ message: string; status?: number } | null>(null);

  // Fetch products from API
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

  const updateProductStock = useCallback(async (productId: number, newStock: number) => {
    const originalProducts = [...products];

    // Optimistic update
    setProducts(prevProducts =>
      prevProducts.map(p =>
        p.id === productId ? { ...p, stock: newStock } : p
      )
    );

    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stock: Math.max(0, newStock) }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update product stock: ${response.status}`);
      }

      const updatedProduct = await response.json();

      // Mettre à jour l'état local avec le produit mis à jour
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === productId ? updatedProduct : p
        )
      );

      console.log('✅ Product stock updated. Backend will handle notifications automatically.');

      return updatedProduct;
    } catch (error) {
      console.error("Error updating product stock:", error);
      setProducts(originalProducts);
      setProductError({
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        status: error instanceof Error && 'status' in error ? (error as any).status : undefined
      });
      throw error;
    }
  }, [products]);

  const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'status'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error(`Failed to add product: ${response.status}`);
      }

      const newProduct = await response.json();
      setProducts(prevProducts => [...prevProducts, newProduct]);

      console.log('✅ Product added successfully');
      return newProduct;
    } catch (error) {
      console.error("Error adding product:", error);
      setProductError({
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        status: error instanceof Error && 'status' in error ? (error as any).status : undefined
      });
      throw error;
    }
  }, []);

  const deleteProduct = useCallback(async (productId: number) => {
    const originalProducts = [...products];

    // Optimistic update - Change status to 'deleted' instead of removing
    setProducts(prevProducts =>
      prevProducts.map(p =>
        p.id === productId ? { ...p, status: 'deleted' as const } : p
      )
    );

    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'deleted' }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete product: ${response.status}`);
      }

      const updatedProduct = await response.json();
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === productId ? updatedProduct : p
        )
      );
    } catch (error) {
      console.error("Error deleting product:", error);
      setProducts(originalProducts);
      setProductError({
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        status: error instanceof Error && 'status' in error ? (error as any).status : undefined
      });
      throw error;
    }
  }, [products]);

  const updateProductStatus = useCallback(async (productId: number, status: 'active' | 'archived') => {
    const originalProducts = [...products];

    // Optimistic update
    setProducts(prevProducts =>
      prevProducts.map(p =>
        p.id === productId ? { ...p, status } : p
      )
    );

    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update product status: ${response.status}`);
      }

      const updatedProduct = await response.json();
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === productId ? updatedProduct : p
        )
      );
    } catch (error) {
      console.error("Error updating product status:", error);
      setProducts(originalProducts);
      setProductError({
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        status: error instanceof Error && 'status' in error ? (error as any).status : undefined
      });
      throw error;
    }
  }, [products]);

  const updateProduct = useCallback(async (productId: number, productData: Partial<Product>) => {
    const originalProducts = [...products];

    // Optimistic update
    setProducts(prevProducts =>
      prevProducts.map(p =>
        p.id === productId ? { ...p, ...productData } : p
      )
    );

    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update product: ${response.status}`);
      }

      const updatedProduct = await response.json();

      // Le backend gère automatiquement l'envoi des notifications et emails
      // via le hook post-save du modèle Product
      console.log(`✅ Product updated. Backend will handle notifications automatically if stock was restored.`);

      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === productId ? updatedProduct : p
        )
      );
    } catch (error) {
      console.error("Error updating product:", error);
      setProducts(originalProducts);
      setProductError({
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        status: error instanceof Error && 'status' in error ? (error as any).status : undefined
      });
      throw error;
    }
  }, [products]);

  const restoreProduct = useCallback(async (productId: number) => {
    const originalProducts = [...products];

    // Optimistic update - Restore to 'active' status
    setProducts(prevProducts =>
      prevProducts.map(p =>
        p.id === productId ? { ...p, status: 'active' as const } : p
      )
    );

    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'active' }),
      });

      if (!response.ok) {
        throw new Error(`Failed to restore product: ${response.status}`);
      }

      const updatedProduct = await response.json();
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === productId ? updatedProduct : p
        )
      );
    } catch (error) {
      console.error("Error restoring product:", error);
      setProducts(originalProducts);
      setProductError({
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        status: error instanceof Error && 'status' in error ? (error as any).status : undefined
      });
      throw error;
    }
  }, [products]);

  const permanentlyDeleteProduct = useCallback(async (productId: number) => {
    const originalProducts = [...products];

    // Optimistic update - Remove from list
    setProducts(prevProducts =>
      prevProducts.filter(p => p.id !== productId)
    );

    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to permanently delete product: ${response.status}`);
      }
    } catch (error) {
      console.error("Error permanently deleting product:", error);
      setProducts(originalProducts);
      setProductError({
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        status: error instanceof Error && 'status' in error ? (error as any).status : undefined
      });
      throw error;
    }
  }, [products]);

  return (
    <ProductContext.Provider value={{
      products,
      isLoadingProducts,
      productError,
      addProduct,
      updateProduct,
      deleteProduct,
      updateProductStock,
      updateProductStatus,
      restoreProduct,
      permanentlyDeleteProduct,
      refreshProducts,
    }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

// Add a convenience hook expected by components: `useProduct`
// This augments the base context with a derived `activeProducts` array
export const useProduct = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  const activeProducts = context.products.filter(p => p.status === 'active');
  return { ...context, activeProducts } as const;
};