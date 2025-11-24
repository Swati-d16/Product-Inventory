import { useState } from 'react';
import { Edit2, Trash2, Save, X, History } from 'lucide-react';
import { Product } from '../types';

interface ProductTableProps {
  products: Product[];
  onEdit: (id: string, updates: Partial<Product>) => void;
  onDelete: (id: string) => void;
  onViewHistory: (product: Product) => void;
}

export function ProductTable({ products, onEdit, onDelete, onViewHistory }: ProductTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Product>>({});

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditData({
      name: product.name,
      unit: product.unit,
      category: product.category,
      brand: product.brand,
      stock: product.stock,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async (id: string) => {
    await onEdit(id, editData);
    setEditingId(null);
    setEditData({});
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No products found</p>
        <p className="text-gray-400 text-sm mt-2">Add a product or import from CSV to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Image</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Unit</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Brand</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Stock</th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const isEditing = editingId === product.id;

            return (
              <tr
                key={product.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-3 px-4">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No img</span>
                    </div>
                  )}
                </td>

                <td className="py-3 px-4">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.name || ''}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="font-medium text-gray-900">{product.name}</span>
                  )}
                </td>

                <td className="py-3 px-4">
                  {isEditing ? (
                    <select
                      value={editData.unit || product.unit}
                      onChange={(e) => setEditData({ ...editData, unit: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pcs">pcs</option>
                      <option value="kg">kg</option>
                      <option value="box">box</option>
                      <option value="liter">liter</option>
                    </select>
                  ) : (
                    <span className="text-gray-700">{product.unit}</span>
                  )}
                </td>

                <td className="py-3 px-4">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.category || ''}
                      onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="text-gray-700">{product.category}</span>
                  )}
                </td>

                <td className="py-3 px-4">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.brand || ''}
                      onChange={(e) => setEditData({ ...editData, brand: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="text-gray-700">{product.brand}</span>
                  )}
                </td>

                <td className="py-3 px-4">
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={editData.stock ?? product.stock}
                      onChange={(e) => setEditData({ ...editData, stock: parseInt(e.target.value) || 0 })}
                      className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="font-medium text-gray-900">{product.stock}</span>
                  )}
                </td>

                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.status === 'In Stock'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.status}
                  </span>
                </td>

                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => saveEdit(product.id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Save"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => onViewHistory(product)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View History"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEdit(product)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this product?')) {
                              onDelete(product.id);
                            }
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
