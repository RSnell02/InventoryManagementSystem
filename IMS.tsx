import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, Plus, Trash2, Edit2, AlertCircle, 
  Loader2, Search, X, PackagePlus, RefreshCw, Save
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const MOCK_DELAY = 600;
let db = [
  { id: 1, name: 'Ergonomic Chair', sku: 'FUR-001', price: 299.99, stock: 15 },
  { id: 2, name: 'Mechanical Keyboard', sku: 'TEC-042', price: 129.50, stock: 42 }
];

const mockApi = {
  fetchItems: () => new Promise((res, rej) => setTimeout(() => {
    if (Math.random() < 0.05) rej("Server connectivity issue.");
    else res([...db]);
  }, MOCK_DELAY)),
  
  createItem: (item) => new Promise((res, rej) => setTimeout(() => {
    if (db.find(i => i.sku === item.sku)) rej("SKU already exists.");
    const newItem = { ...item, id: Date.now(), price: parseFloat(item.price), stock: parseInt(item.stock) };
    db.push(newItem);
    res(newItem);
  }, MOCK_DELAY)),

  updateItem: (item) => new Promise((res) => setTimeout(() => {
    db = db.map(i => i.id === item.id ? item : i);
    res(item);
  }, MOCK_DELAY)),
  
  deleteItem: (id) => new Promise((res) => setTimeout(() => {
    db = db.filter(i => i.id !== id);
    res();
  }, MOCK_DELAY))
};

const StatusBadge = ({ count }) => (
  <span className={cn(
    "px-2 py-1 rounded-md text-xs font-semibold",
    count > 20 ? "bg-green-50 text-green-700 border border-green-200" : 
    count > 0 ? "bg-orange-50 text-orange-700 border border-orange-200" :
    "bg-red-50 text-red-700 border border-red-200"
  )}>
    {count > 0 ? `${count} in stock` : 'Out of stock'}
  </span>
);

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', sku: '', price: '', stock: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await mockApi.fetchItems();
      setItems(data);
    } catch (e) { setError(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) return;
    try {
      if (editingItem) await mockApi.updateItem({ ...formData, id: editingItem.id });
      else await mockApi.createItem(formData);
      setIsModalOpen(false);
      setEditingItem(null);
      loadData();
    } catch (e) { alert(e); }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Inventory System</h1>
            <p className="text-slate-500">Manage internal product database</p>
          </div>
          <button onClick={() => { setEditingItem(null); setFormData({name:'', sku:'', price:'', stock:''}); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition-all shadow-sm">
            <PackagePlus size={18} /> Add Product
          </button>
        </header>

        {loading ? (
          <div className="flex justify-center py-20 text-blue-600"><Loader2 className="animate-spin" size={40} /></div>
        ) : error ? (
          <div className="bg-red-50 p-6 rounded-xl border border-red-100 text-red-700 flex flex-col items-center gap-4">
            <AlertCircle size={40} /> {error} 
            <button onClick={loadData} className="flex items-center gap-2 underline"><RefreshCw size={16}/> Retry Connection</button>
          </div>
        ) : (
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-left">Product</th>
                  <th className="px-6 py-4 text-left">SKU</th>
                  <th className="px-6 py-4 text-left">Price</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono">{item.sku}</td>
                    <td className="px-6 py-4 font-semibold">${item.price}</td>
                    <td className="px-6 py-4"><StatusBadge count={item.stock} /></td>
                    <td className="px-6 py-4 text-right flex justify-end gap-3">
                      <button onClick={() => handleEdit(item)} className="text-slate-400 hover:text-blue-600"><Edit2 size={18} /></button>
                      <button onClick={async () => { await mockApi.deleteItem(item.id); loadData(); }} className="text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingItem ? 'Edit Product' : 'Add New Product'}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)}><X size={20}/></button>
            </div>
            <input required placeholder="Name" className="w-full border p-3 rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <input required placeholder="SKU" className="w-full border p-3 rounded-lg" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <input type="number" required placeholder="Price" className="border p-3 rounded-lg" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              <input type="number" required placeholder="Stock" className="border p-3 rounded-lg" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-bold flex items-center justify-center gap-2">
              <Save size={18}/> Save Product
            </button>
          </form>
        </div>
      )}
    </div>
  );
}