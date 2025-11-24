# Product Inventory
A full-stack application for managing products with search, filtering, inline editing, CSV import/export, and inventory history tracking

<img width="866" height="728" alt="Screenshot 2025-11-24 060638" src="https://github.com/user-attachments/assets/be393110-ad12-4bc7-9837-062cc7a1b808" />

---
## 🚀Objective

Build a complete Product Inventory Management System that allows users to search, filter, import/export, and edit products efficiently while maintaining a detailed inventory change history.

## 🖥️ Frontend (React)
### 1. 🔎 Product Search & Filtering

Search bar connected to:
GET /api/products/search?name=<query>

Category filter dropdown for real-time filtering

Add New Product button (opens modal/form)

Import and Export buttons placed on the right side of the header

### 2. 📋 Products Table

Displays product list with columns:
Image | Name | Unit | Category | Brand | Stock | Status | Actions

Stock Status Labels

In Stock → Green label

Out of Stock → Red label

Actions

Edit → Enables inline editing

Delete → Removes product

### 3. 📥 Import / 📤 Export Features
Import (CSV → Database)

Opens file picker

Uploads CSV via: POST /api/products/import

Shows success/error toast

Refreshes table automatically

Export

Downloads CSV via:
GET /api/products/export

### 4. ✏️ Inline Editing

Clicking Edit converts row fields into editable inputs (except ID & Image)

Shows Save and Cancel buttons

Save Action

Sends update request:
PUT /api/products/:id

Frontend updates row instantly (optimistic update)

## 🛠️ Backend (Node.js + Express + SQLite)
### 1. 📥 CSV Import API

POST /api/products/import

Accepts multipart/form-data

Expected CSV columns:
name, unit, category, brand, stock, status, image

Inserts only new products

Duplicate check by name (case-insensitive)

Response
{
  "added": 12,
  "skipped": 5,
  "duplicates": [
    { "name": "Product A", "existingId": 14 }
  ]
}

### 2. 📤 CSV Export API

GET /api/products/export

Returns CSV of all products

Includes headers and Content-Disposition: attachment

### 3. 📦 Product Retrieval APIs
API	Description
GET /api/products	Get all products
GET /api/products/search?name=abc	Search by name (partial, case-insensitive)

### 4. ✏️ Update Product API

PUT /api/products/:id

Validation Rules

name → must be unique (excluding itself)

stock ≥ 0

All fields required as per schema

Returns the updated product on success.

## ⭐ Bonus (Optional but Adds Value)

Server-side pagination, sorting, and filtering

Basic authentication system

Fully responsive layout

Unit/integration tests (Jest, Supertest, React Testing Library)

Advanced toast notifications & improved error handling
