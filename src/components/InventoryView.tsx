import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { Package, Plus, Search, AlertCircle, Copy, Edit, Trash2, CheckCircle2 } from 'lucide-react';

interface InventoryViewProps {
  products: Product[];
  onSaveProduct: (product: Product, isNew: boolean) => { success: boolean; message: string };
  onUpdateStock: (sku: string, stock: number) => void;
  onToggleStatus: (sku: string, status: 'Active' | 'Inactive') => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onSaveProduct,
  onUpdateStock,
  onToggleStatus
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showInactive, setShowInactive] = useState<boolean>(false);
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);
  const [lowThreshold, setLowThreshold] = useState<number>(5);

  // Form State
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [sku, setSku] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [variation, setVariation] = useState<string>('');
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [extraCost, setExtraCost] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [bundleQty, setBundleQty] = useState<number>(0);
  const [bundlePrice, setBundlePrice] = useState<number>(0);

  // Inline stock edits
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({});

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const active = p.status === 'Active';
      if (!showInactive && !active) return false;
      if (lowStockOnly && (p.stock > lowThreshold || !active)) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const hay = `${p.sku} ${p.name} ${p.category} ${p.variation || ''}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [products, showInactive, lowStockOnly, lowThreshold, searchTerm]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSku('');
    setName('');
    setCategory('');
    setVariation('');
    setBuyPrice(0);
    setSellPrice(0);
    setExtraCost(0);
    setStock(0);
    setBundleQty(0);
    setBundlePrice(0);
    setFormOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setIsEditing(true);
    setSku(p.sku);
    setName(p.name);
    setCategory(p.category);
    setVariation(p.variation || '');
    setBuyPrice(p.buyPrice);
    setSellPrice(p.sellPrice);
    setExtraCost(p.extraCost);
    setStock(p.stock);
    setBundleQty(p.bundleQty);
    setBundlePrice(p.bundlePrice);
    setFormOpen(true);
  };

  const handleDuplicate = (p: Product) => {
    const newSku = prompt('New SKU for duplicate product:', `${p.sku}-COPY`);
    if (!newSku || !newSku.trim()) return;
    const newVar = prompt('New Variation (optional):', p.variation || '');

    const newProd: Product = {
      ...p,
      sku: newSku.trim(),
      variation: newVar !== null ? newVar.trim() : p.variation,
      stock: 0,
      openingStock: 0,
      status: 'Active'
    };

    const res = onSaveProduct(newProd, true);
    alert(res.message);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) {
      alert('SKU এবং Product Name আবশ্যক!');
      return;
    }

    const payload: Product = {
      sku: sku.trim(),
      name: name.trim(),
      category: category.trim(),
      variation: variation.trim(),
      buyPrice: Number(buyPrice) || 0,
      sellPrice: Number(sellPrice) || 0,
      extraCost: Number(extraCost) || 0,
      stock: Number(stock) || 0,
      bundleQty: Number(bundleQty) || 0,
      bundlePrice: Number(bundlePrice) || 0,
      status: 'Active'
    };

    const res = onSaveProduct(payload, !isEditing);
    if (res.success) {
      alert(res.message);
      setFormOpen(false);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-800">Inventory &amp; Product Management</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin approve করে Delivered করলে stock auto minus হবে। Return/Exchange এ stock auto add হয় না (Admin manual restock করবেন)।
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-center">
          <div className="sm:col-span-2">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="SKU, Product Name, Category দিয়ে খুঁজুন..."
                className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={e => setShowInactive(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span>Show Inactive</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={e => setLowStockOnly(e.target.checked)}
                className="rounded text-amber-600"
              />
              <span>Low Stock Only</span>
            </label>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 whitespace-nowrap">Threshold:</span>
            <input
              type="number"
              min="1"
              value={lowThreshold}
              onChange={e => setLowThreshold(parseInt(e.target.value) || 5)}
              className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-center font-mono font-bold outline-none"
            />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Cost (Buy+Ex)</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3 text-center">Bundle Offer</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Current Stock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    কোনো প্রোডাক্ট পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const isActive = p.status === 'Active';
                  const isLow = isActive && p.stock <= lowThreshold;
                  const currentEditStock = stockEdits[p.sku] !== undefined ? stockEdits[p.sku] : p.stock;

                  return (
                    <tr key={p.sku} className={`hover:bg-slate-50/60 transition-colors ${!isActive ? 'opacity-60 bg-slate-50/50' : ''}`}>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.sku}</td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{p.name}</div>
                        {p.variation && (
                          <div className="text-[11px] text-slate-500">Var: {p.variation}</div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-600">{p.category || '—'}</td>

                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {(p.buyPrice + p.extraCost).toFixed(2)} QR
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {p.sellPrice.toFixed(2)} QR
                      </td>

                      <td className="py-3 px-3 text-center">
                        {p.bundleQty > 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            {p.bundleQty} for {p.bundlePrice} QR
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {p.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            value={currentEditStock}
                            onChange={e => {
                              const val = parseInt(e.target.value) || 0;
                              setStockEdits({ ...stockEdits, [p.sku]: Math.max(0, val) });
                            }}
                            className={`w-16 px-2 py-1 text-center border rounded-lg font-mono font-bold text-xs outline-none ${
                              isLow ? 'border-red-300 text-red-600 bg-red-50/50' : 'border-slate-200'
                            }`}
                          />
                          {stockEdits[p.sku] !== undefined && stockEdits[p.sku] !== p.stock && (
                            <button
                              onClick={() => {
                                onUpdateStock(p.sku, stockEdits[p.sku]);
                                const next = { ...stockEdits };
                                delete next[p.sku];
                                setStockEdits(next);
                              }}
                              className="px-2 py-1 rounded bg-indigo-600 text-white text-[10px] font-bold"
                            >
                              Save
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDuplicate(p)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-purple-600 hover:bg-slate-100"
                            title="Duplicate Product"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {isActive ? (
                            <button
                              onClick={() => {
                                if (confirm(`SKU ${p.sku} Deactivate করবেন? Current stock 0 হবে।`)) {
                                  onToggleStatus(p.sku, 'Inactive');
                                }
                              }}
                              className="text-[11px] font-semibold text-red-600 hover:underline px-1.5 py-1"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => onToggleStatus(p.sku, 'Active')}
                              className="text-[11px] font-semibold text-emerald-600 hover:underline px-1.5 py-1"
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">
              {isEditing ? `Edit Product: ${sku}` : 'নতুন প্রোডাক্ট যুক্ত করুন (Add Product)'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">SKU *</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={e => setSku(e.target.value.toUpperCase())}
                    disabled={isEditing}
                    placeholder="TS-BLK-L"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold outline-none uppercase disabled:bg-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Premium Cotton T-Shirt"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="Men Apparel"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Variation</label>
                  <input
                    type="text"
                    value={variation}
                    onChange={e => setVariation(e.target.value)}
                    placeholder="Black - L"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={e => setStock(parseInt(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Buy Price (QR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={buyPrice}
                    onChange={e => setBuyPrice(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Sell Price (QR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={sellPrice}
                    onChange={e => setSellPrice(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Extra Cost (QR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={extraCost}
                    onChange={e => setExtraCost(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Bundle Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={bundleQty}
                    onChange={e => setBundleQty(parseInt(e.target.value) || 0)}
                    placeholder="3"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Bundle Price (QR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={bundlePrice}
                    onChange={e => setBundlePrice(parseFloat(e.target.value) || 0)}
                    placeholder="90"
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl font-mono outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  {isEditing ? 'Save Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
