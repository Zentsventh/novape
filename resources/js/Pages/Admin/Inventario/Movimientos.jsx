import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ArrowLeftRight, Search, Download, ArrowUpRight, ArrowDownRight, RefreshCcw, Package, Plus, X } from 'lucide-react';

export default function Movimientos({ movimientos, almacenes, filters, logoUrl, usuario_nombre, flash }) {
    const [selectedAlmacen, setSelectedAlmacen] = useState(filters?.almacen_id || 'todos');
    const [selectedTipo, setSelectedTipo] = useState(filters?.tipo || 'todos');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        variante_id: '',
        almacen_id: almacenes.length > 0 ? almacenes[0].id : '',
        tipo: 'entrada',
        operacion_ajuste: 'suma',
        cantidad: 1,
        motivo: '',
        operation_key: crypto.randomUUID()
    });

    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        const timer = setTimeout(() => {
            fetch(`/admin/selectores/variantes?q=${encodeURIComponent(searchQuery)}`)
                .then(res => res.json())
                .then(data => {
                    setSearchResults(data.data || []);
                    setIsSearching(false);
                });
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleFilterChange = (key, value) => {
        const newFilters = {
            almacen_id: selectedAlmacen,
            tipo: selectedTipo,
            [key]: value
        };

        if (key === 'almacen_id') setSelectedAlmacen(value);
        if (key === 'tipo') setSelectedTipo(value);

        router.get('/admin/inventario/movimientos', newFilters, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    const submitMovimiento = (e) => {
        e.preventDefault();
        router.post('/admin/inventario/movimientos', formData, {
            onSuccess: () => {
                setShowModal(false);
                setFormData({ ...formData, variante_id: '', cantidad: 1, motivo: '', operation_key: crypto.randomUUID() });
                setSearchQuery('');
                setSearchResults([]);
            }
        });
    };

    const getTypeBadge = (tipo) => {
        switch (tipo) {
            case 'entrada': return <span style={{ background: '#ECFDF5', color: '#059669', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><ArrowDownRight size={14} /> Entrada</span>;
            case 'salida': return <span style={{ background: '#FEF2F2', color: '#DC2626', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><ArrowUpRight size={14} /> Salida</span>;
            case 'ajuste': return <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><RefreshCcw size={14} /> Ajuste</span>;
            case 'transferencia': return <span style={{ background: '#F5F3FF', color: '#7C3AED', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><ArrowLeftRight size={14} /> Transferencia</span>;
            default: return <span style={{ background: '#F1F5F9', color: '#475569', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{tipo}</span>;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <AdminLayout logoUrl={logoUrl} usuario_nombre={usuario_nombre}>
            <Head title="Kardex de Inventario - Novape" />

            <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
                
                {flash?.success && (
                    <div style={{ background: '#ECFDF5', color: '#065F46', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontWeight: '500', border: '1px solid #A7F3D0' }}>
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontWeight: '500', border: '1px solid #FECACA' }}>
                        {flash.error}
                    </div>
                )}

                {/* Header Premium */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div style={{ background: '#004797', color: 'white', padding: '10px', borderRadius: '12px' }}>
                                <ArrowLeftRight size={24} />
                            </div>
                            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1E293B', margin: 0, letterSpacing: '-0.02em' }}>Historial de Movimientos</h1>
                        </div>
                        <p style={{ color: '#64748B', fontSize: '15px', margin: 0 }}>Registro de Kardex y auditoría de inventario físico.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', color: '#1E293B', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            <Download size={18} /> Exportar
                        </button>
                        <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#004797', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0, 71, 151, 0.2)' }}>
                            <Plus size={18} /> Registrar Movimiento
                        </button>
                    </div>
                </div>

                <div style={{ marginBottom: 16 }}><label>Registro <select value={filters?.source || "current"} onChange={e => handleFilterChange("source", e.target.value)}><option value="current">Kardex desde el saldo de apertura</option><option value="legacy">Historial anterior a la consolidación</option></select></label>{filters?.source === "legacy" && <p>Los saldos anteriores no fueron registrados. Este historial se conserva para conciliación y no se vuelve a descontar del stock.</p>}</div>
                {/* Filters */}
                <div style={{ background: '#ffffff', borderRadius: '20px', padding: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', marginBottom: '24px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                    
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filtrar por Almacén</label>
                        <select 
                            value={selectedAlmacen}
                            onChange={e => handleFilterChange('almacen_id', e.target.value)}
                            style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B', borderRadius: '10px', padding: '10px 16px', outline: 'none', fontSize: '14px', fontWeight: '500' }}
                        >
                            <option value="todos">Todos los almacenes</option>
                            {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                        </select>
                    </div>

                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo de Movimiento</label>
                        <select 
                            value={selectedTipo}
                            onChange={e => handleFilterChange('tipo', e.target.value)}
                            style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B', borderRadius: '10px', padding: '10px 16px', outline: 'none', fontSize: '14px', fontWeight: '500' }}
                        >
                            <option value="todos">Todos los tipos</option>
                            <option value="entrada">Entrada</option>
                            <option value="salida">Salida</option>
                            <option value="ajuste">Ajuste</option>
                            <option value="transferencia">Transferencia</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha y Hora</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Producto / SKU</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cant.</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stock Final</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Almacén</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Motivo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movimientos.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                                            <Package size={48} style={{ opacity: 0.2, margin: '0 auto 16px auto', display: 'block' }} />
                                            <p style={{ margin: 0, fontSize: '15px' }}>No hay movimientos registrados con estos filtros.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    movimientos.data.map((mov) => (
                                        <tr key={mov.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#F8FAFC'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                            <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569', fontWeight: '500' }}>
                                                {formatDate(mov.created_at)}
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B', marginBottom: '4px' }}>{mov.variante?.producto?.nombre || 'Producto Desconocido'}</div>
                                                <div style={{ fontSize: '12px', color: '#94A3B8', fontFamily: 'monospace' }}>{mov.variante?.sku}</div>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                {getTypeBadge(mov.tipo)}
                                            </td>
                                            <td style={{ padding: '16px 24px', fontSize: '15px', fontWeight: '700', color: mov.cantidad > 0 ? '#059669' : '#DC2626' }}>
                                                {mov.cantidad > 0 ? `+${mov.cantidad}` : mov.cantidad}
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                                    <span style={{ color: '#94A3B8', textDecoration: 'line-through' }}>{mov.stock_anterior ?? "Sin dato"}</span>
                                                    <ArrowRight size={12} color="#CBD5E1" />
                                                    <span style={{ fontWeight: '700', color: '#1E293B' }}>{mov.stock_nuevo ?? "Sin dato"}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px', fontSize: '14px', color: '#475569' }}>
                                                {mov.almacen?.nombre || 'N/A'}
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ fontSize: '13px', color: '#1E293B' }}>{mov.motivo}</div>
                                                {mov.usuario && <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>Por: {mov.usuario.nombres}</div>}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    {movimientos.links && movimientos.links.length > 3 && (
                        <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'center', gap: '4px' }}>
                            {movimientos.links.map((link, i) => (
                                <button 
                                    key={i}
                                    onClick={() => link.url && router.get(link.url)}
                                    disabled={!link.url}
                                    style={{ 
                                        padding: '8px 12px', 
                                        border: '1px solid', 
                                        borderColor: link.active ? '#004797' : '#E2E8F0',
                                        background: link.active ? '#004797' : (link.url ? '#ffffff' : '#F8FAFC'),
                                        color: link.active ? '#ffffff' : (link.url ? '#475569' : '#CBD5E1'),
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        cursor: link.url ? 'pointer' : 'default',
                                        transition: 'all 0.2s'
                                    }}
                                    dangerouslySetInnerHTML={{ __html: link.label.replace('Previous', 'Anterior').replace('Next', 'Siguiente') }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Registrar Movimiento Modal */}
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}>
                        <div style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '600px', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', position: 'relative' }}>
                            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                                <X size={24} />
                            </button>
                            
                            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', margin: '0 0 8px 0' }}>Registrar Movimiento</h2>
                            <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>Ajusta el stock de un almacén directamente. Esto quedará auditado.</p>

                            <form onSubmit={submitMovimiento}>
                                <div style={{ marginBottom: '20px', position: 'relative' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1E293B', marginBottom: '8px' }}>Buscar Producto/Variante *</label>
                                    <div style={{ position: 'relative' }}>
                                        <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                                        <input 
                                            type="text" 
                                            placeholder="Busca por nombre o SKU..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B', borderRadius: '12px', padding: '12px 16px 12px 36px', outline: 'none', fontSize: '14px' }}
                                        />
                                    </div>
                                    
                                    {searchResults.length > 0 && (
                                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '12px', marginTop: '4px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: '200px', overflowY: 'auto' }}>
                                            {searchResults.map(res => (
                                                <div 
                                                    key={res.id} 
                                                    onClick={() => {
                                                        setFormData({ ...formData, variante_id: res.id });
                                                        setSearchQuery(`${res.nombre} (${res.sku})`);
                                                        setSearchResults([]);
                                                    }}
                                                    style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.2s' }}
                                                    onMouseOver={e => e.currentTarget.style.background = '#F8FAFC'}
                                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <div style={{ fontWeight: '600', fontSize: '14px', color: '#1E293B' }}>{res.nombre}</div>
                                                    <div style={{ fontSize: '12px', color: '#64748B' }}>SKU: {res.sku}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1E293B', marginBottom: '8px' }}>Almacén *</label>
                                        <select 
                                            required
                                            value={formData.almacen_id}
                                            onChange={e => setFormData({ ...formData, almacen_id: e.target.value })}
                                            style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B', borderRadius: '12px', padding: '12px 16px', outline: 'none', fontSize: '14px' }}
                                        >
                                            <option value="">Selecciona...</option>
                                            {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1E293B', marginBottom: '8px' }}>Tipo de Movimiento *</label>
                                        <select 
                                            required
                                            value={formData.tipo}
                                            onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                                            style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B', borderRadius: '12px', padding: '12px 16px', outline: 'none', fontSize: '14px' }}
                                        >
                                            <option value="entrada">Entrada (+)</option>
                                            <option value="salida">Salida (-)</option>
                                            <option value="ajuste">Ajuste de Inventario</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                                    {formData.tipo === 'ajuste' && (
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1E293B', marginBottom: '8px' }}>Operación</label>
                                            <select 
                                                value={formData.operacion_ajuste}
                                                onChange={e => setFormData({ ...formData, operacion_ajuste: e.target.value })}
                                                style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B', borderRadius: '12px', padding: '12px 16px', outline: 'none', fontSize: '14px' }}
                                            >
                                                <option value="suma">Suma (+)</option>
                                                <option value="resta">Resta (-)</option>
                                            </select>
                                        </div>
                                    )}
                                    <div style={{ flex: formData.tipo === 'ajuste' ? 1 : 'none', width: formData.tipo === 'ajuste' ? 'auto' : '50%' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1E293B', marginBottom: '8px' }}>Cantidad Absoluta *</label>
                                        <input 
                                            type="number" 
                                            min="1"
                                            required
                                            value={formData.cantidad}
                                            onChange={e => setFormData({ ...formData, cantidad: parseInt(e.target.value) })}
                                            style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B', borderRadius: '12px', padding: '12px 16px', outline: 'none', fontSize: '14px', fontWeight: '700' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '32px' }}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#1E293B', marginBottom: '8px' }}>Motivo / Justificación *</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="Ej. Ingreso inicial, Ajuste por merma, Producto dañado..."
                                        value={formData.motivo}
                                        onChange={e => setFormData({ ...formData, motivo: e.target.value })}
                                        style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#1E293B', borderRadius: '12px', padding: '12px 16px', outline: 'none', fontSize: '14px' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    <button type="button" onClick={() => setShowModal(false)} style={{ background: '#ffffff', color: '#475569', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={!formData.variante_id} style={{ background: formData.variante_id ? '#004797' : '#94A3B8', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 32px', fontSize: '14px', fontWeight: '600', cursor: formData.variante_id ? 'pointer' : 'not-allowed', transition: 'all 0.2s', boxShadow: formData.variante_id ? '0 4px 12px rgba(0, 71, 151, 0.2)' : 'none' }}>
                                        Guardar Movimiento
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

const ArrowRight = ({ size, color }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
);
