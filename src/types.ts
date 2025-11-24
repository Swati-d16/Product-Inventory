export interface Product {
  id: string;
  name: string;
  unit: string;
  category: string;
  brand: string;
  stock: number;
  status: string;
  image: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryLog {
  id: string;
  product_id: string;
  old_stock: number;
  new_stock: number;
  changed_by: string;
  created_at: string;
}

export interface ImportResult {
  added: number;
  skipped: number;
  duplicates: Array<{ name: string; existingId: string }>;
}
