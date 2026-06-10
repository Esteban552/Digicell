import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Product } from '../lib/supabase-types';

interface InventoryPanelProps {
  products: Product[];
  onRefetchProducts: () => Promise<void>;
  showToast: (title: string, desc: string, type: 'success' | 'info' | 'error') => void;
}

export default function InventoryPanel({ products, onRefetchProducts, showToast }: InventoryPanelProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const resetForm = () => {
    setName('');
    setPrice('');
    setCategory('');
    setStock('');
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    const payload = {
      name: name.trim(),
      price: Math.max(0, Number(price) || 0),
      category: category.trim() || 'General',
      stock: Math.max(0, Number(stock) || 0),
    };

    if (editingId !== null) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingId);
      if (error) {
        showToast('Error', 'No se pudo actualizar el producto.', 'error');
        return;
      }
      showToast('Producto actualizado', `"${payload.name}" se actualizó correctamente.`, 'success');
    } else {
      const { error } = await supabase.from('products').insert({ ...payload, active: true });
      if (error) {
        showToast('Error', 'No se pudo agregar el producto.', 'error');
        return;
      }
      showToast('Producto agregado', `"${payload.name}" se añadió al inventario.`, 'success');
    }

    resetForm();
    onRefetchProducts();
  };

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setPrice(String(p.price));
    setCategory(p.category);
    setStock(String(p.stock));
  };

  const handleDelete = async (id: number, productName: string) => {
    if (!confirm(`¿Seguro que deseas eliminar "${productName}" del inventario?`)) return;
    const { error } = await supabase.from('products').update({ active: false }).eq('id', id);
    if (error) {
      showToast('Error', 'No se pudo eliminar el producto.', 'error');
      return;
    }
    showToast('Producto eliminado', `"${productName}" se desactivó del inventario.`, 'info');
    onRefetchProducts();
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Add / Edit Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-outline-variant rounded-md p-4 shadow-sm">
        <h3 className="text-sm font-bold font-sans text-on-surface mb-3">
          {editingId ? 'Editar Producto' : 'Agregar Producto'}
        </h3>
        <div className="grid grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold font-sans text-on-surface-variant uppercase tracking-wider">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del producto"
              className="h-9 border border-outline rounded px-3 focus:border-tertiary outline-none text-xs font-sans"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold font-sans text-on-surface-variant uppercase tracking-wider">Precio</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="$ 0.00"
              step="0.01"
              className="h-9 border border-outline rounded px-3 focus:border-tertiary outline-none text-xs font-sans"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold font-sans text-on-surface-variant uppercase tracking-wider">Categoría</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="General"
              className="h-9 border border-outline rounded px-3 focus:border-tertiary outline-none text-xs font-sans"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold font-sans text-on-surface-variant uppercase tracking-wider">Stock</label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="0"
              min="0"
              className="h-9 border border-outline rounded px-3 focus:border-tertiary outline-none text-xs font-sans"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            type="submit"
            className="h-9 px-4 bg-primary hover:bg-primary-container text-white rounded text-xs font-bold font-sans shadow-sm outline-none cursor-pointer"
          >
            {editingId ? 'Guardar Cambios' : 'Agregar al Inventario'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="h-9 px-4 border border-outline-variant rounded text-xs font-semibold font-sans outline-none cursor-pointer"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Products Table */}
      <div className="bg-white border border-outline-variant rounded-md shadow-sm flex-1 min-h-0 overflow-y-auto">
        {products.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs font-sans text-on-surface-variant font-medium">No hay productos en el inventario.</p>
          </div>
        ) : (
          <table className="w-full text-xs font-sans">
            <thead className="sticky top-0 bg-white border-b border-outline-variant">
              <tr>
                <th className="text-left py-2.5 px-3 font-bold text-on-surface-variant uppercase tracking-wider text-[10px]">Nombre</th>
                <th className="text-left py-2.5 px-3 font-bold text-on-surface-variant uppercase tracking-wider text-[10px]">Categoría</th>
                <th className="text-right py-2.5 px-3 font-bold text-on-surface-variant uppercase tracking-wider text-[10px]">Precio</th>
                <th className="text-right py-2.5 px-3 font-bold text-on-surface-variant uppercase tracking-wider text-[10px]">Stock</th>
                <th className="text-right py-2.5 px-3 font-bold text-on-surface-variant uppercase tracking-wider text-[10px]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-b border-outline-variant/50 hover:bg-surface-container-low">
                  <td className="py-2.5 px-3 font-semibold text-on-surface">{p.name}</td>
                  <td className="py-2.5 px-3 text-on-surface-variant">{p.category}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-tertiary">${p.price.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`font-semibold ${p.stock > 0 ? 'text-success' : 'text-error'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(p)}
                        className="p-1.5 rounded hover:bg-surface-container-high outline-none cursor-pointer"
                        title="Editar"
                      >
                        <span className="material-symbols-outlined text-[16px] text-on-surface-variant">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-1.5 rounded hover:bg-error-container outline-none cursor-pointer"
                        title="Eliminar"
                      >
                        <span className="material-symbols-outlined text-[16px] text-error">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
