import React, { useState, useMemo } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import '../../../../css/admin/admin.css';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { Building2, ArrowRightLeft, MapPin, Package, CheckCircle, AlertCircle, Plus, Trash2, ClipboardList, Search, Filter } from 'lucide-react';

export default function AlmacenesIndex({ almacenes, productos, categorias, marcas, stocks, logoUrl }) {
    const confirmDialog = useConfirm();

    const [showModal, setShowModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);

    // Filtros
    const [filterCategoria, setFilterCategoria] = useState('');
    const [filterMarca, setFilterMarca] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const { data: dataA, setData: setDataA, post: postA, processing: procA, reset: resetA } = useForm({
        nombre: '', direccion: '', activo: true
    });

    const { data: dataT, setData: setDataT, post: postT, processing: procT, reset: resetT } = useForm({
        almacen_origen_id: '', almacen_destino_id: '', variante_id: '', cantidad: '', referencia: ''
    });

    const submitAlmacen = (e) => {
        e.preventDefault();
        postA('/admin/almacenes', { onSuccess: () => { setShowModal(false); resetA(); } });
    };

    const submitTransfer = async (e) => {
        e.preventDefault();
        postT('/admin/almacenes/transferir', { onSuccess: () => { setShowTransferModal(false); resetT(); } });
    };

    const handleDelete = async (id) => {
        if (await confirmDialog('¿Eliminar este almacén? Esto podría afectar a los productos vinculados.')) {
            router.delete(`/admin/almacenes/${id}`);
        }
    };

    // Filter products
    const filteredProductos = useMemo(() => {
        return productos.filter(p => {
            if (filterCategoria && p.category_id != filterCategoria) return false;
            if (filterMarca && p.marca_id != filterMarca) return false;
            if (searchQuery) {
                const search = searchQuery.toLowerCase();
                const nombreMatch = p.nombre && p.nombre.toLowerCase().includes(search);
                const skuMatch = p.sku && p.sku.toLowerCase().includes(search);
                if (!nombreMatch && !skuMatch) return false;
            }
            return true;
        });
    }, [productos, filterCategoria, filterMarca, searchQuery]);

    // Calculate max available stock for selected product and origin warehouse
    const maxAvailable = useMemo(() => {
        if (!dataT.almacen_origen_id || !dataT.variante_id) return null;
        const stockInfo = stocks.find(s => 
            s.almacen_id == dataT.almacen_origen_id && 
            s.variante_id == dataT.variante_id
        );
        return stockInfo ? stockInfo.cantidad : 0;
    }, [stocks, dataT.almacen_origen_id, dataT.variante_id]);

    return (
        <AdminLayout logoUrl={logoUrl}>
            <Head title="Gestión de Almacenes" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <h1 style={{ fontSize: '24px', margin: 0, fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.02em' }}>
                    <div style={{ padding: '8px', backgroundColor: '#F0F9FF', borderRadius: '10px', color: '#004797' }}>
                        <Building2 size={24} />
                    </div>
                    <div>
                        Ubicaciones y Almacenes
                        <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0 0', fontWeight: '500' }}>
                            Gestiona inventario distribuido y transferencias (Kardex).
                        </p>
                    </div>
                </h1>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        onClick={() => setShowTransferModal(true)} 
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; e.currentTarget.style.color = '#1E293B'; e.currentTarget.style.borderColor = '#94A3B8'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', color: '#475569', textDecoration: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', border: '1px solid #E2E8F0', transition: 'all 0.2s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', cursor: 'pointer' }}
                    >
                        <ArrowRightLeft size={16} />
                        Transferir Stock
                    </button>
                    <button 
                        onClick={() => setShowModal(true)} 
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#009BE0'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 71, 151, 0.3)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#004797'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 71, 151, 0.2)'; }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#004797', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0, 71, 151, 0.2)', cursor: 'pointer' }}
                    >
                        <Plus size={16} />
                        Nuevo Almacén
                    </button>
                </div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: '12px', overflowX: 'auto', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                    <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Almacén</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dirección</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Unidades</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total SKUs</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {almacenes.map(a => (
                            <tr 
                                key={a.id} 
                                style={{ borderBottom: '1px solid #E2E8F0', transition: 'background 0.2s' }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                                <td style={{ padding: '16px 24px', fontWeight: '700', color: '#1E293B', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Building2 size={16} style={{ color: '#004797' }} /> {a.nombre}
                                </td>
                                <td style={{ padding: '16px 24px', color: '#64748B', fontSize: '13px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MapPin size={14} style={{ opacity: 0.5 }} />
                                        {a.direccion || 'No especificada'}
                                    </div>
                                </td>
                                <td style={{ padding: '16px 24px', color: '#1E293B', fontWeight: '700', fontSize: '14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Package size={14} style={{ color: '#004797' }} />
                                        {a.total_unidades} <span style={{ color: '#94A3B8', fontSize: '11px' }}>u.</span>
                                    </div>
                                </td>
                                <td style={{ padding: '16px 24px', color: '#64748B', fontSize: '13px', fontWeight: '500' }}>{a.total_skus} prod.</td>
                                <td style={{ padding: '16px 24px' }}>
                                    {a.activo 
                                        ? <span style={{ background: '#ECFDF5', color: '#10B981', padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={12} /> Activo</span> 
                                        : <span style={{ background: '#F1F5F9', color: '#64748B', padding: '4px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} /> Inactivo</span>
                                    }
                                </td>
                                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <Link 
                                            href={`/admin/almacenes/${a.id}/kardex`} 
                                            title="Kardex (Movimientos)" 
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0F9FF'; e.currentTarget.style.color = '#009BE0'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#004797'; }}
                                            style={{ color: '#004797', background: 'transparent', textDecoration: 'none', padding: '8px', borderRadius: '8px', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <ClipboardList size={18} />
                                        </Link>
                                        <button 
                                            onClick={() => handleDelete(a.id)} 
                                            title="Eliminar Almacén" 
                                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#EF4444'; }}
                                            style={{ color: '#EF4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Nuevo Almacen */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ background: '#ffffff', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0' }}>
                        <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '800', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Building2 size={20} style={{ color: '#004797' }} />
                            Nuevo Almacén
                        </h2>
                        <form onSubmit={submitAlmacen} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: '#64748B' }}>Nombre del almacén</label>
                                <input 
                                    type="text" 
                                    value={dataA.nombre} 
                                    onChange={e => setDataA('nombre', e.target.value)} 
                                    placeholder="Ej. Tienda Miraflores"
                                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#1E293B', outline: 'none', transition: 'all 0.2s', fontSize: '14px', fontFamily: 'inherit' }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = '#004797'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 71, 151, 0.1)'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
                                    required 
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: '#64748B' }}>Dirección (Opcional)</label>
                                <input 
                                    type="text" 
                                    value={dataA.direccion} 
                                    onChange={e => setDataA('direccion', e.target.value)} 
                                    placeholder="Av. Larco 123..."
                                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#1E293B', outline: 'none', transition: 'all 0.2s', fontSize: '14px', fontFamily: 'inherit' }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = '#004797'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 71, 151, 0.1)'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)} 
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#E2E8F0'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#F1F5F9', color: '#475569', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s' }}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={procA} 
                                    onMouseEnter={(e) => { if(!procA) e.currentTarget.style.backgroundColor = '#009BE0'; }}
                                    onMouseLeave={(e) => { if(!procA) e.currentTarget.style.backgroundColor = '#004797'; }}
                                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#004797', color: 'white', fontWeight: '600', cursor: procA ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: procA ? 0.7 : 1, transition: 'all 0.2s' }}
                                >
                                    {procA ? 'Guardando...' : 'Crear Almacén'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Transferencia */}
            {showTransferModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ background: '#ffffff', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0' }}>
                        <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '800', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
                            <ArrowRightLeft size={20} style={{ color: '#004797' }} />
                            Transferencia de Stock Inter-Almacén
                        </h2>
                        <form onSubmit={submitTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: '#F8FAFC', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: '#64748B' }}>Desde (Origen)</label>
                                    <select 
                                        value={dataT.almacen_origen_id} 
                                        onChange={e => {
                                            setDataT(prev => ({...prev, almacen_origen_id: e.target.value, almacen_destino_id: prev.almacen_destino_id === e.target.value ? '' : prev.almacen_destino_id}));
                                        }} 
                                        style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', background: '#fff', color: '#1E293B', fontSize: '14px', fontFamily: 'inherit' }} 
                                        required
                                    >
                                        <option value="">Seleccione origen...</option>
                                        {almacenes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: '#64748B' }}>Hacia (Destino)</label>
                                    <select 
                                        value={dataT.almacen_destino_id} 
                                        onChange={e => setDataT('almacen_destino_id', e.target.value)} 
                                        style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', background: '#fff', color: '#1E293B', fontSize: '14px', fontFamily: 'inherit' }} 
                                        required
                                    >
                                        <option value="">Seleccione destino...</option>
                                        {almacenes.filter(a => String(a.id) !== String(dataT.almacen_origen_id)).map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            <div style={{ border: '1px solid #E2E8F0', padding: '24px', borderRadius: '12px' }}>
                                <h4 style={{ margin: '0 0 16px 0', color: '#1E293B', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Search size={16} style={{ color: '#94A3B8' }} /> Buscar Producto a Transferir
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                    <select 
                                        value={filterCategoria} 
                                        onChange={e => {setFilterCategoria(e.target.value); setDataT('variante_id', '');}} 
                                        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', background: '#fff' }}
                                    >
                                        <option value="">Todas las Categorías</option>
                                        {categorias && categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                    </select>
                                    <select 
                                        value={filterMarca} 
                                        onChange={e => {setFilterMarca(e.target.value); setDataT('variante_id', '');}} 
                                        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', background: '#fff' }}
                                    >
                                        <option value="">Todas las Marcas</option>
                                        {marcas && marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                    </select>
                                </div>
                                <div style={{ position: 'relative', marginBottom: '16px' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Buscar por nombre o SKU..." 
                                        value={searchQuery} 
                                        onChange={e => {setSearchQuery(e.target.value); setDataT('variante_id', '');}} 
                                        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }} 
                                    />
                                    <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                </div>
                                
                                <select 
                                    value={dataT.variante_id} 
                                    onChange={e => setDataT('variante_id', e.target.value)} 
                                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '8px', border: '2px solid #004797', fontWeight: '600', color: '#1E293B', outline: 'none', cursor: 'pointer', background: '#F0F9FF' }} 
                                    required
                                >
                                    <option value="">-- Seleccione el producto ({filteredProductos.length} encontrados) --</option>
                                    {filteredProductos.map(p => (
                                        <option key={p.variante_id} value={p.variante_id}>{p.sku} | {p.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: '#64748B' }}>Stock Disponible (Origen)</label>
                                    <div style={{ padding: '12px', borderRadius: '8px', background: maxAvailable > 0 ? '#F0F9FF' : '#F8FAFC', fontWeight: '700', color: maxAvailable > 0 ? '#004797' : '#94A3B8', border: `1px solid ${maxAvailable > 0 ? '#004797' : '#E2E8F0'}`, textAlign: 'center', fontSize: '18px' }}>
                                        {maxAvailable !== null ? `${maxAvailable} unidades` : 'Seleccione origen y producto'}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: '#64748B' }}>Cantidad a Transferir</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        max={maxAvailable || 1} 
                                        value={dataT.cantidad} 
                                        onChange={e => {
                                            let val = parseInt(e.target.value) || '';
                                            if (val !== '' && maxAvailable !== null && val > maxAvailable) {
                                                val = maxAvailable;
                                            }
                                            setDataT('cantidad', val);
                                        }} 
                                        style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '16px', fontWeight: '600', color: '#1E293B', outline: 'none', fontFamily: 'inherit' }} 
                                        onFocus={(e) => { e.currentTarget.style.borderColor = '#004797'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 71, 151, 0.1)'; }}
                                        onBlur={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.boxShadow = 'none'; }}
                                        required 
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: '#64748B' }}>Motivo / Referencia</label>
                                <input 
                                    type="text" 
                                    value={dataT.referencia} 
                                    onChange={e => setDataT('referencia', e.target.value)} 
                                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} 
                                    placeholder="Ej: Reposición de inventario para campaña, etc." 
                                    onFocus={(e) => { e.currentTarget.style.borderColor = '#004797'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 71, 151, 0.1)'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.boxShadow = 'none'; }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '24px' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setShowTransferModal(false)} 
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#E2E8F0'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                                    style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', background: '#F1F5F9', color: '#475569', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s' }}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={procT || maxAvailable === 0 || maxAvailable === null || dataT.cantidad > maxAvailable || dataT.cantidad < 1} 
                                    onMouseEnter={(e) => { if(!(procT || maxAvailable === 0 || maxAvailable === null || dataT.cantidad > maxAvailable || dataT.cantidad < 1)) e.currentTarget.style.backgroundColor = '#009BE0'; }}
                                    onMouseLeave={(e) => { if(!(procT || maxAvailable === 0 || maxAvailable === null || dataT.cantidad > maxAvailable || dataT.cantidad < 1)) e.currentTarget.style.backgroundColor = '#004797'; }}
                                    style={{ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', background: '#004797', color: 'white', fontWeight: '600', cursor: (procT || maxAvailable === 0 || maxAvailable === null || dataT.cantidad > maxAvailable || dataT.cantidad < 1) ? 'not-allowed' : 'pointer', opacity: (procT || maxAvailable === 0 || maxAvailable === null || dataT.cantidad > maxAvailable || dataT.cantidad < 1) ? 0.6 : 1, fontSize: '14px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    {procT ? 'Procesando...' : <><ArrowRightLeft size={16} /> Confirmar Transferencia</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
