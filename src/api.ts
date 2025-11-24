import { Product, InventoryLog, ImportResult } from './types';

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/products-api`;

const getHeaders = () => ({
  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
});

export const api = {
  async getProducts(category?: string): Promise<Product[]> {
    const url = category && category !== 'all'
      ? `${API_BASE}/products?category=${encodeURIComponent(category)}`
      : `${API_BASE}/products`;
    const response = await fetch(url, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  },

  async searchProducts(name: string): Promise<Product[]> {
    const response = await fetch(
      `${API_BASE}/products/search?name=${encodeURIComponent(name)}`,
      { headers: getHeaders() }
    );
    if (!response.ok) throw new Error('Failed to search products');
    return response.json();
  },

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(product),
    });
    if (!response.ok) throw new Error('Failed to create product');
    return response.json();
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update product');
    }
    return response.json();
  },

  async deleteProduct(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete product');
  },

  async getProductHistory(productId: string): Promise<InventoryLog[]> {
    const response = await fetch(`${API_BASE}/products/${productId}/history`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch product history');
    return response.json();
  },

  async importCSV(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/products/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to import CSV');
    return response.json();
  },

  async exportCSV(): Promise<void> {
    const response = await fetch(`${API_BASE}/products/export`, {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    });
    if (!response.ok) throw new Error('Failed to export CSV');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
