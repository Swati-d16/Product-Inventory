import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Upload, Download, Package } from 'lucide-react';
import { Product } from './types';
import { api } from './api';
import { ProductTable } from './components/ProductTable';
import { ProductModal } from './components/ProductModal';
import { InventoryHistory } from './components/InventoryHistory';
import { Toast } from './components/Toast';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, selectedCategory, searchQuery]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);

      const uniqueCategories = Array.from(new Set(data.map(p => p.category))).sort();
      setCategories(uniqueCategories);
    } catch (error) {
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      );
    }

    setFilteredProducts(filtered);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const results = await api.searchProducts(query);
        setFilteredProducts(results);
      } catch (error) {
        showToast('Search failed', 'error');
      }
    }
  };

  const handleCreate = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await api.createProduct(productData);
      showToast('Product added successfully', 'success');
      setShowModal(false);
      loadProducts();
    } catch (error) {
      showToast('Failed to add product', 'error');
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Product>) => {
    try {
      await api.updateProduct(id, updates);
      showToast('Product updated successfully', 'success');
      loadProducts();
    } catch (error: any) {
      showToast(error.message || 'Failed to update product', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteProduct(id);
      showToast('Product deleted successfully', 'success');
      loadProducts();
    } catch (error) {
      showToast('Failed to delete product', 'error');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await api.importCSV(file);
      showToast(
        `Import complete: ${result.added} added, ${result.skipped} skipped`,
        'success'
      );
      loadProducts();
    } catch (error) {
      showToast('Failed to import CSV', 'error');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = async () => {
    try {
      await api.exportCSV();
      showToast('Products exported successfully', 'success');
    } catch (error) {
      showToast('Failed to export products', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Product Inventory</h1>
          </div>
          <p className="text-gray-600">Manage your product catalog with ease</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search products by name, brand, or category..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleImport}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <Upload className="w-4 h-4" />
                  Import
                </button>

                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ProductTable
              products={filteredProducts}
              onEdit={handleUpdate}
              onDelete={handleDelete}
              onViewHistory={setSelectedProduct}
            />
          )}
        </div>

        {filteredProducts.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        )}
      </div>

      {showModal && (
        <ProductModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCreate}
        />
      )}

      {selectedProduct && (
        <InventoryHistory
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;
