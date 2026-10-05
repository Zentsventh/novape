import React, { useState } from 'react';
import { Package, Plus, Trash2, FileText, Download } from 'lucide-react';
import Swal from 'sweetalert2';

export default function DealQuoteTab({ deal, setDeal }) {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    
    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearch(query);
        if (query.length > 2) {
            setSearching(true);
            try {
                const response = await fetch('/admin/crm/quote-variants?q=' + encodeURIComponent(query));
                const data = await response.json();
                setResults(data.productos || []);
            } catch (error) {
                console.error(error);
            } finally {
                setSearching(false);
            }
        } else {
            setResults([]);
        }
    };

    const handleAddProduct = async (producto) => {
        try {
            const csrfMeta = document.querySelector('meta[name="csrf-token"]');
            const response = await fetch('/admin/crm/deals/' + deal.id + '/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfMeta ? csrfMeta.getAttribute('content') : ''
                },
                body: JSON.stringify({ producto_id: producto.producto_id, variante_id: producto.variante_id, cantidad: 1 })
            });

            if (response.ok) {
                const resDeal = await fetch('/admin/crm/deals/' + deal.id + '/json');
                const updatedDeal = await resDeal.json();
                setDeal(updatedDeal);
                
                setSearch('');
                setResults([]);
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Producto agregado', showConfirmButton: false, timer: 1500 });
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo agregar el producto', 'error');
        }
    };

    const handleRemoveProduct = async (productId) => {
        try {
            const csrfMeta = document.querySelector('meta[name="csrf-token"]');
            const response = await fetch('/admin/crm/deals/' + deal.id + '/products/' + productId, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': csrfMeta ? csrfMeta.getAttribute('content') : ''
                }
            });

            if (response.ok) {
                const resDeal = await fetch('/admin/crm/deals/' + deal.id + '/json');
                const updatedDeal = await resDeal.json();
                setDeal(updatedDeal);
                
                Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Producto removido', showConfirmButton: false, timer: 1500 });
            } else { throw new Error('El producto no pudo agregarse. Verifica la variante y los permisos.'); }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
            
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
                <input 
                    type="text" 
                    placeholder="Buscar producto para cotizar..." 
                    value={search}
                    onChange={handleSearch}
                    style={{
                        width: '100%', padding: '12px 16px', borderRadius: '8px', 
                        border: '1px solid #d1d5db', fontSize: '14px'
                    }}
                />
                {results.length > 0 && (
                    <div style={{ 
                        position: 'absolute', top: '100%', left: 0, right: 0, 
                        backgroundColor: '#fff', border: '1px solid #e5e7eb', 
                        borderRadius: '8px', marginTop: '4px', zIndex: 10,
                        maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                        {results.map(prod => (
                            <div 
                                key={prod.id} 
                                style={{ padding: '10px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <div style={{ fontSize: '13px' }}>
                                    <div style={{ fontWeight: 600 }}>{prod.nombre} · {prod.sku}</div>
                                    <div style={{ color: '#6b7280' }}>{formatMoney(prod.precio_final || prod.precio)}</div>
                                </div>
                                <button 
                                    onClick={() => handleAddProduct(prod)}
                                    style={{ background: '#ecfdf5', color: '#10b981', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                    <Plus size={14} /> Añadir
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Products Table */}
            <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '12px 16px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Package size={16} /> Productos en Cotización
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                    {deal.products && deal.products.length > 0 ? (
                        deal.products.map(item => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{item.producto?.nombre}</div>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                        {item.cantidad} x {formatMoney(item.precio_unitario)}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{formatMoney(item.subtotal)}</div>
                                    <button onClick={() => handleRemoveProduct(item.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', color: '#9ca3af', padding: '24px 0', fontSize: '13px' }}>
                            No hay productos en este Deal.
                        </div>
                    )}
                </div>

                <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '16px', marginBottom: '16px' }}>
                        <span>Total:</span>
                        <span>{formatMoney(deal.valor)}</span>
                    </div>
                    
                    <a 
                        href={'/admin/crm/deals/' + deal.id + '/quote'}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            width: '100%', padding: '12px', borderRadius: '8px',
                            backgroundColor: '#1f2937', color: '#fff', fontWeight: 600,
                            textDecoration: 'none', cursor: 'pointer'
                        }}
                    >
                        <Download size={18} /> Generar Cotización (PDF)
                    </a>
                </div>
            </div>

        </div>
    );
}
