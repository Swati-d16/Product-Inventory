import { useEffect, useState } from 'react';
import { X, Clock } from 'lucide-react';
import { InventoryLog, Product } from '../types';
import { api } from '../api';

interface InventoryHistoryProps {
  product: Product;
  onClose: () => void;
}

export function InventoryHistory({ product, onClose }: InventoryHistoryProps) {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [product.id]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getProductHistory(product.id);
      setLogs(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 overflow-hidden flex flex-col">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-1">Inventory History</h2>
            <p className="text-blue-100 text-sm">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-500 rounded-lg p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-4 mt-4 text-sm">
          <div>
            <span className="text-blue-200">Current Stock:</span>
            <span className="ml-2 font-semibold">{product.stock}</span>
          </div>
          <div>
            <span className="text-blue-200">Status:</span>
            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
              product.status === 'In Stock' ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900'
            }`}>
              {product.status}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No history available</p>
            <p className="text-sm text-gray-400 mt-1">
              Changes will appear here when stock is updated
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      log.new_stock > log.old_stock ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-900">
                      Stock {log.new_stock > log.old_stock ? 'Increased' : 'Decreased'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-red-50 rounded-lg p-2">
                    <p className="text-xs text-red-600 font-medium mb-1">Previous</p>
                    <p className="text-lg font-bold text-red-700">{log.old_stock}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <p className="text-xs text-green-600 font-medium mb-1">New</p>
                    <p className="text-lg font-bold text-green-700">{log.new_stock}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="font-medium">By:</span> {log.changed_by}
                  </span>
                  <span>{formatDate(log.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
