import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Loader2,
  BoxSelect
} from 'lucide-react';


// --- DATA MODEL & MOCK API ---
// Represents our server-side database
let database = [
  { id: '1', name: 'Ergonomic Desk Chair', category: 'Furniture', quantity: 45, price: 299.99, sku: 'FUR-001' },
  { id: '2', name: 'Mechanical Keyboard', category: 'Electronics', quantity: 12, price: 149.50, sku: 'ELE-042' },
  { id: '3', name: 'Coffee Beans (1kg)', category: 'Consumables', quantity: 0, price: 24.99, sku: 'CON-109' }, // Out of stock example
];

// Simulated network latency
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const MockAPI = {
  // Read all items
  getItems: async () => {
    await delay(800); // Simulate network load
    // Simulate a random 5% chance of a server error to demonstrate error states
    if (Math.random() < 0.05) throw new Error("Failed to fetch inventory from the server.");
    return [...database];
  },
  
  // Create a new item
  createItem: async (newItemData) => {
    await delay(600);
    // Server-side validation simulation
    if (database.some(item => item.sku.toLowerCase() === newItemData.sku.toLowerCase())) {
      throw new Error(`SKU '${newItemData.sku}' already exists.`);
    }
    const newItem = {
      ...newItemData,
      id: Math.random().toString(36).substr(2, 9),
    };
    database = [newItem, ...database];
    return newItem;
  },

  // Update an existing item
  updateItem: async (id, updatedData) => {
    await delay(600);
    const index = database.findIndex(item => item.id === id);
    if (index === -1) throw new Error("Item not found.");
    
    // Check SKU uniqueness excluding the current item
    if (database.some(item => item.id !== id && item.sku.toLowerCase() === updatedData.sku.toLowerCase())) {
      throw new Error(`SKU '${updatedData.sku}' already exists.`);
    }

    database[index] = { ...database[index], ...updatedData };
    return database[index];
  },

  // Delete an item
  deleteItem: async (id) => {
    await delay(500);
    database = database.filter(item => item.id !== id);
    return true;
  }
};


// --- REUSABLE UI COMPONENTS ---

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'error' ? 'bg-red-100 border-red-200' : 'bg-green-100 border-green-200';
  const textColor = type === 'error' ? 'text-red-800' : 'text-green-800';
  const Icon = type === 'error' ? AlertCircle : CheckCircle2;

  return (
    <div className={`fixed bottom-4 right-4 flex items-center gap-2 px-4 py-3 rounded-lg border shadow-lg ${bgColor} ${textColor} animate-in slide-in-from-bottom-5 z-50`}>
      <Icon className="w-5 h-5" />
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, itemName, isDeleting }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Item?</h3>
        <p className="text-slate-600 mb-6">
          Are you sure you want to delete <strong>{itemName}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose} 
            disabled={isDeleting}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};


// --- FORM COMPONENT ---

const ItemFormModal = ({ isOpen, onClose, onSubmit, initialData = null, isSaving }) => {
  const [formData, setFormData] = useState({
    name: '', sku: '', category: '', quantity: 0, price: 0.00
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData({ name: '', sku: '', category: '', quantity: 0, price: 0 });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // Basic Client-Side Validation
  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    if (formData.quantity === '' || formData.quantity < 0) newErrors.quantity = 'Quantity must be 0 or greater';
    if (formData.price === '' || formData.price < 0) newErrors.price = 'Price must be 0 or greater';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...formData,
        quantity: parseInt(formData.quantity, 10),
        price: parseFloat(formData.price)
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field as user types
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? 'Edit Item' : 'Add New Item'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
            <input 
              type="text" name="name" value={formData.name} onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-shadow ${errors.name ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-100 focus:border-blue-500'}`}
              placeholder="e.g. Wireless Mouse"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
              <input 
                type="text" name="sku" value={formData.sku} onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-shadow ${errors.sku ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-100 focus:border-blue-500'}`}
                placeholder="e.g. EL-001"
              />
              {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <input 
                type="text" name="category" value={formData.category} onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-shadow ${errors.category ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-100 focus:border-blue-500'}`}
                placeholder="e.g. Electronics"
              />
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
              <input 
                type="number" name="quantity" value={formData.quantity} onChange={handleChange} min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-shadow ${errors.quantity ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-100 focus:border-blue-500'}`}
              />
              {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Price ($)</label>
              <input 
                type="number" name="price" value={formData.price} onChange={handleChange} min="0" step="0.01"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:outline-none transition-shadow ${errors.price ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-100 focus:border-blue-500'}`}
              />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70">
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSaving ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --- MAIN APPLICATION ---

export default function App() {
  // Application State
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Status States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  
  // Action States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Delete States
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await MockAPI.getItems();
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Create / Update Logic
  const handleSaveItem = async (formData) => {
    setIsSaving(true);
    try {
      if (editingItem) {
        const updatedItem = await MockAPI.updateItem(editingItem.id, formData);
        setItems(items.map(item => item.id === editingItem.id ? updatedItem : item));
        showToast('Item updated successfully', 'success');
      } else {
        const newItem = await MockAPI.createItem(formData);
        setItems([newItem, ...items]);
        showToast('Item added successfully', 'success');
      }
      handleCloseForm();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Logic
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await MockAPI.deleteItem(itemToDelete.id);
      setItems(items.filter(item => item.id !== itemToDelete.id));
      showToast('Item deleted successfully', 'success');
      setItemToDelete(null);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };


  const handleEditClick = (item) => {
    setEditingItem(item);
    setIsFormModalOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormModalOpen(false);
    setEditingItem(null);
  };

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  // Filter items based on search
  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Inventory Control</h1>
              <p className="text-slate-500 text-sm">Manage your products and stock levels</p>
            </div>
          </div>
          <button 
            onClick={() => setIsFormModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-blue-200"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>
        </header>

        {/* Toolbar Section */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, SKU, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Main Content Area: Handles Loading, Error, Empty, and Data states */}
        <main className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {isLoading ? (
            // Loading State
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
              <p>Loading inventory data...</p>
            </div>
          ) : error ? (
            // Error State
            <div className="flex flex-col items-center justify-center py-20 text-slate-600">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="font-medium text-lg text-slate-900 mb-2">Connection Error</p>
              <p className="mb-4">{error}</p>
              <button onClick={fetchInventory} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors">
                Try Again
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            // Empty State (No data or no search results)
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
              <div className="bg-slate-50 p-4 rounded-full mb-4">
                <BoxSelect className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">No items found</h3>
              <p className="text-slate-500 max-w-sm mb-6">
                {searchQuery 
                  ? `We couldn't find anything matching "${searchQuery}". Try adjusting your search.`
                  : "Your inventory is currently empty. Start by adding a new item."}
              </p>
              {!searchQuery && (
                <button onClick={() => setIsFormModalOpen(true)} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
                  <Plus className="w-4 h-4" /> Add your first item
                </button>
              )}
            </div>
          ) : (
            // Data State (Table)
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm uppercase tracking-wider">
                    <th className="p-4 font-semibold">Item & SKU</th>
                    <th className="p-4 font-semibold">Category</th>
                    <th className="p-4 font-semibold">Price</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4">
                        <div className="font-medium text-slate-900">{item.name}</div>
                        <div className="text-sm text-slate-500 font-mono mt-0.5">{item.sku}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-sm font-medium border border-slate-200">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-900">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="p-4">
                        {item.quantity > 10 ? (
                          <span className="inline-flex items-center gap-1.5 text-green-700 text-sm font-medium">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            In Stock ({item.quantity})
                          </span>
                        ) : item.quantity > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-orange-600 text-sm font-medium">
                            <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                            Low Stock ({item.quantity})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-red-600 text-sm font-medium">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            Out of Stock
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditClick(item)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Item"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setItemToDelete(item)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Overlays / Portals */}
      <ItemFormModal 
        isOpen={isFormModalOpen}
        onClose={handleCloseForm}
        onSubmit={handleSaveItem}
        initialData={editingItem}
        isSaving={isSaving}
      />

      <DeleteConfirmationModal 
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        itemName={itemToDelete?.name}
        isDeleting={isDeleting}
      />

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