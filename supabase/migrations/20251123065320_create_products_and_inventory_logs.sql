/*
  # Product Inventory Management System Schema

  1. New Tables
    - `products`
      - `id` (uuid, primary key) - Unique identifier for each product
      - `name` (text, unique, not null) - Product name (case-insensitive unique)
      - `unit` (text, not null) - Unit of measurement (e.g., kg, pcs, box)
      - `category` (text, not null) - Product category for filtering
      - `brand` (text, not null) - Product brand name
      - `stock` (integer, not null, default 0) - Current stock quantity
      - `status` (text, not null) - Stock status (In Stock/Out of Stock)
      - `image` (text) - URL to product image
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record last update timestamp
    
    - `inventory_logs`
      - `id` (uuid, primary key) - Unique log identifier
      - `product_id` (uuid, foreign key) - Reference to products table
      - `old_stock` (integer, not null) - Stock quantity before change
      - `new_stock` (integer, not null) - Stock quantity after change
      - `changed_by` (text, not null) - User who made the change
      - `created_at` (timestamptz) - When the change occurred

  2. Security
    - Enable RLS on both tables
    - Add policies for public access (since no auth system specified)
    - Add trigger to automatically update status based on stock
    - Add trigger to log inventory changes
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  unit text NOT NULL,
  category text NOT NULL,
  brand text NOT NULL,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  status text NOT NULL,
  image text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  old_stock integer NOT NULL,
  new_stock integer NOT NULL,
  changed_by text NOT NULL DEFAULT 'system',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON inventory_logs(product_id, created_at DESC);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to products"
  ON products FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update to products"
  ON products FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from products"
  ON products FOR DELETE
  USING (true);

CREATE POLICY "Allow public read access to inventory logs"
  ON inventory_logs FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to inventory logs"
  ON inventory_logs FOR INSERT
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_product_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock > 0 THEN
    NEW.status := 'In Stock';
  ELSE
    NEW.status := 'Out of Stock';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_product_status'
  ) THEN
    CREATE TRIGGER set_product_status
      BEFORE INSERT OR UPDATE OF stock ON products
      FOR EACH ROW
      EXECUTE FUNCTION update_product_status();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION log_inventory_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stock IS DISTINCT FROM NEW.stock THEN
    INSERT INTO inventory_logs (product_id, old_stock, new_stock, changed_by)
    VALUES (NEW.id, OLD.stock, NEW.stock, 'admin');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'track_inventory_changes'
  ) THEN
    CREATE TRIGGER track_inventory_changes
      AFTER UPDATE OF stock ON products
      FOR EACH ROW
      EXECUTE FUNCTION log_inventory_change();
  END IF;
END $$;