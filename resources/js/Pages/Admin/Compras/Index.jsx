import React, { useState, useMemo } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import '../../../../css/admin/admin.css';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { Plus, Search, Filter, Trash2, Eye, ShoppingCart, TrendingUp, Clock, Package, X, ChevronRight } from 'lucide-react';

export default function ComprasIndex({ compras, totalGastado, comprasPendientes, proveedores, productos, categorias, marcas, historialProducto, filters, logoUrl }) {
    const confirmDialog = useConfirm();

    const [showModal, setShowModal] = useState(false);
    const [items, setItems] = useState([{ producto_id: '', variante_id: '', cantidad: 1, costo_unitario: '' }]);
    const { data, setData, post, processing, reset } = useForm({
        proveedor_id: '',
        notas: '',
        items: [],
    });

    const [searchFilters, setSearchFilters] = useState({
        proveedor_id: filters?.proveedor_id || '',
        estado: filters?.estado || '',
        categoria_id: filters?.categoria_id || '',
        marca_id: filters?.marca_id || '',
        producto_id: filters?.producto_id || '',
        search: filters?.search || ''
    });

    const productosFiltrados = useMemo(() => {
        let filtrados = productos;
        if (searchFilters.categoria_id) {
            filtrados = filtrados?.filter(p => p.parent_category_id == searchFilters.categoria_id);
        }
        if (searchFilters.marca_id) {
            filtrados = filtrados?.filter(p => p.marca_id == searchFilters.marca_id);
        }
        return filtrados;
    }, [productos, searchFilters.categoria_id, searchFilters.marca_id]);

    const applyFilters = () => {
        router.get('/admin/compras', searchFilters, { preserveState: true });
    };

    const resetFilters = () => {
        setSearchFilters({ proveedor_id: '', estado: '', categoria_id: '', marca_id: '', producto_id: '', search: '' });
        router.get('/admin/compras');
    };

    const addItemRow = () => {
        setItems([...items, { producto_id: '', variante_id: '', cantidad: 1, costo_unitario: '' }]);
    };

    const updateItem = (idx, field, value) => {
        const updated = [...items];
        updated[idx][field] = value;
        if (field === 'producto_id') {
            const prod = productos.find(p => p.producto_id == value);
            if (prod) {
                updated[idx].variante_id = prod.variante_id;
                updated[idx].costo_unitario = (parseFloat(prod.precio) * 0.6).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            }
        }
        setItems(updated);
    };

    const removeItem = (idx) => {
        if (items.length > 1) setItems(items.filter((_, i) => i !== idx));
    };

    const totalOrden = items.reduce((s, i) => s + (parseFloat(i.costo_unitario || 0) * parseInt(i.cantidad || 0)), 0);

    const submit = async (e) => {
        e.preventDefault();
        router.post('/admin/compras', {
            proveedor_id: data.proveedor_id,
            notas: data.notas,
            items: items.map(i => ({
                producto_id: i.producto_id,
                variante_id: i.variante_id,
                cantidad: parseInt(i.cantidad),
                costo_unitario: parseFloat(i.costo_unitario),
            })),
        }, {
            onSuccess: () => {
                setShowModal(false);
                setItems([{ producto_id: '', variante_id: '', cantidad: 1, costo_unitario: '' }]);
                reset();
            },
        });
    };

    const handleDelete = async (id) => {
        if (await confirmDialog('¿Eliminar esta orden de compra y todos sus items?')) {
            router.delete(`/admin/compras/${id}`);
        }
    };

    // Shared input/select style
    const inputStyle = {
        width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', 
        fontSize: '14px', outline: 'none', backgroundColor: '#F8FAFC', color: '#1E293B', transition: 'all 0.2s',
        appearance: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
    };
    const inputFocusStyle = { borderColor: '#004797', boxShadow: '0 0 0 4px rgba(0, 71, 151, 0.1)', backgroundColor: '#ffffff' };
    const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748B', marginBottom: '8px', letterSpacing: '0.02em' };

    return (
        <AdminLayout logoUrl={logoUrl}>
            <Head title="Historial de Compras" />

            <div style={{ fontFamily: "'Inter', sans-serif", padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', margin: '0 0 8px 0', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.5px' }}>Historial de Compras</h1>
                        <p style={{ margin: 0, color: '#64748B', fontSize: '15px' }}>Gestiona tus órdenes de compra, proveedores y abastecimiento.</p>
                    </div>
                    <button 
                        onClick={() => setShowModal(true)} 
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '8px', background: '#004797', color: 'white', 
                            padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
                            boxShadow: '0 4px 14px rgba(0, 71, 151, 0.3)', transition: 'all 0.2s ease'
                        }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 71, 151, 0.4)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 71, 151, 0.3)'; }}
                    >
                        <Plus size={18} /> Nueva Orden
                    </button>
                </div>

                {/* KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                    <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '20px', transition: 'transform 0.2s', cursor: 'default' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #E0F2FE, #BAE6FD)', color: '#0369A1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrendingUp size={28} />
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Inversión Total</div>
                            <div style={{ fontSize: '28px', fontWeight: 800, color: '#1E293B' }}>S/ {Number(totalGastado).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        </div>
                    </div>
                    <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '20px', transition: 'transform 0.2s', cursor: 'default' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Clock size={28} />
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Órdenes Pendientes</div>
                            <div style={{ fontSize: '28px', fontWeight: 800, color: '#1E293B' }}>{comprasPendientes}</div>
                        </div>
                    </div>
                    <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '20px', transition: 'transform 0.2s', cursor: 'default' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #F1F5F9, #E2E8F0)', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShoppingCart size={28} />
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Total Órdenes</div>
                            <div style={{ fontSize: '28px', fontWeight: 800, color: '#1E293B' }}>{compras.length}</div>
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#1E293B', fontWeight: 700 }}>
                        <Filter size={18} color="#004797" /> Filtros Avanzados
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', alignItems: 'flex-end' }}>
                        <div>
                            <label style={labelStyle}>Categoría</label>
                            <div style={{ position: 'relative' }}>
                                <select 
                                    value={searchFilters.categoria_id} 
                                    onChange={e => setSearchFilters({...searchFilters, categoria_id: e.target.value, producto_id: ''})} 
                                    style={inputStyle}
                                    onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                >
                                    <option value="">Todas</option>
                                    {categorias?.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                </select>
                                <ChevronRight size={16} color="#94A3B8" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', pointerEvents: 'none' }} />
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Marca</label>
                            <div style={{ position: 'relative' }}>
                                <select 
                                    value={searchFilters.marca_id} 
                                    onChange={e => setSearchFilters({...searchFilters, marca_id: e.target.value, producto_id: ''})} 
                                    style={inputStyle}
                                    onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                >
                                    <option value="">Todas</option>
                                    {marcas?.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                </select>
                                <ChevronRight size={16} color="#94A3B8" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', pointerEvents: 'none' }} />
                            </div>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Producto Comprado</label>
                            <div style={{ position: 'relative' }}>
                                <select 
                                    value={searchFilters.producto_id} 
                                    onChange={e => setSearchFilters({...searchFilters, producto_id: e.target.value})} 
                                    style={inputStyle}
                                    onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                >
                                    <option value="">Todos los productos</option>
                                    {productosFiltrados?.map(p => <option key={p.producto_id} value={p.producto_id}>{p.nombre}</option>)}
                                </select>
                                <ChevronRight size={16} color="#94A3B8" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', pointerEvents: 'none' }} />
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Proveedor</label>
                            <div style={{ position: 'relative' }}>
                                <select 
                                    value={searchFilters.proveedor_id} 
                                    onChange={e => setSearchFilters({...searchFilters, proveedor_id: e.target.value})} 
                                    style={inputStyle}
                                    onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                >
                                    <option value="">Todos</option>
                                    {proveedores?.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                </select>
                                <ChevronRight size={16} color="#94A3B8" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', pointerEvents: 'none' }} />
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Buscar</label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type="text" placeholder="SKU / Nombre / Orden..." 
                                    value={searchFilters.search} 
                                    onChange={e => setSearchFilters({...searchFilters, search: e.target.value})} 
                                    onKeyDown={e => e.key === 'Enter' && applyFilters()} 
                                    style={{...inputStyle, paddingLeft: '40px'}}
                                    onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                />
                                <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Estado</label>
                            <div style={{ position: 'relative' }}>
                                <select 
                                    value={searchFilters.estado} 
                                    onChange={e => setSearchFilters({...searchFilters, estado: e.target.value})} 
                                    style={inputStyle}
                                    onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                >
                                    <option value="">Todos</option>
                                    <option value="completado">Completados</option>
                                    <option value="pendiente">Pendientes</option>
                                    <option value="cancelado">Cancelados</option>
                                </select>
                                <ChevronRight size={16} color="#94A3B8" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', pointerEvents: 'none' }} />
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px', gridColumn: 'span 1' }}>
                            <button 
                                onClick={resetFilters} 
                                style={{ flex: 1, padding: '12px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', fontSize: '14px' }}
                                onMouseOver={e => e.currentTarget.style.background = '#E2E8F0'}
                                onMouseOut={e => e.currentTarget.style.background = '#F1F5F9'}
                            >
                                Limpiar
                            </button>
                            <button 
                                onClick={applyFilters} 
                                style={{ flex: 1, padding: '12px', background: '#1E293B', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', fontSize: '14px', boxShadow: '0 4px 12px rgba(30, 41, 59, 0.2)' }}
                                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(30, 41, 59, 0.3)'; }}
                                onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 41, 59, 0.2)'; }}
                            >
                                Filtrar
                            </button>
                        </div>
                    </div>
                </div>

                {historialProducto && (
                    /* TABLA DE ANÁLISIS DE PRECIOS POR PRODUCTO (KARDEX DE COMPRAS) */
                    <div style={{ background: '#ffffff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', border: '1px solid #BAE6FD', marginBottom: '32px' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E0F2FE', background: '#F0F9FF', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#004797', padding: '8px', borderRadius: '10px', color: 'white' }}><Package size={18} /></div>
                            <h3 style={{ margin: 0, color: '#0369A1', fontSize: '16px', fontWeight: 700 }}>Kardex de Compras (Producto Filtrado)</h3>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                        <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</th>
                                        <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Orden</th>
                                        <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Proveedor</th>
                                        <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cantidad</th>
                                        <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Precio Unit.</th>
                                        <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subtotal</th>
                                        <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historialProducto.length > 0 ? historialProducto.map((hp, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid #F1F5F9', background: index === 0 ? '#F8FAFC' : 'white', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#F8FAFC'} onMouseOut={e => e.currentTarget.style.backgroundColor = index === 0 ? '#F8FAFC' : 'white'}>
                                            <td style={{ padding: '20px 24px', color: '#475569', fontSize: '14px', fontWeight: index === 0 ? 600 : 400 }}>
                                                {hp.fecha_compra} 
                                                {index === 0 && <span style={{fontSize:'10px', background:'#10B981', color:'white', padding:'4px 8px', borderRadius:'12px', marginLeft:'8px', fontWeight: 700}}>ÚLTIMA</span>}
                                            </td>
                                            <td style={{ padding: '20px 24px', fontWeight: 700, color: '#1E293B', fontSize: '14px' }}>{hp.numero_orden}</td>
                                            <td style={{ padding: '20px 24px', color: '#004797', fontWeight: 600, fontSize: '14px' }}>{hp.proveedor_nombre || 'Sin proveedor'}</td>
                                            <td style={{ padding: '20px 24px', fontWeight: 700, color: '#1E293B', fontSize: '14px' }}>{hp.cantidad} unds.</td>
                                            <td style={{ padding: '20px 24px', fontWeight: 700, color: '#10B981', fontSize: '14px' }}>S/ {Number(hp.costo_unitario).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                            <td style={{ padding: '20px 24px', fontWeight: 700, color: '#1E293B', fontSize: '14px' }}>S/ {Number(hp.subtotal).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <span style={{ 
                                                    background: hp.estado === 'completado' ? '#D1FAE5' : '#FEF3C7', 
                                                    color: hp.estado === 'completado' ? '#059669' : '#D97706', 
                                                    padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, textTransform: 'capitalize' 
                                                }}>
                                                    {hp.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="7" style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>No hay compras registradas para este producto.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TABLA GENERAL DE ORDENES DE COMPRA */}
                <div style={{ background: '#ffffff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0' }}>
                    {historialProducto && <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', background: '#ffffff' }}><h3 style={{ margin: 0, color: '#1E293B', fontSize: '16px', fontWeight: 700 }}>Todas las Órdenes de Compra</h3></div>}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                    <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID Orden</th>
                                    <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Proveedor</th>
                                    <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</th>
                                    <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Orden</th>
                                    <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                                    <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {compras.length > 0 ? compras.map(c => (
                                    <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.2s', backgroundColor: '#ffffff' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#F8FAFC'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#ffffff'}>
                                        <td style={{ padding: '20px 24px', fontWeight: 700, color: '#1E293B', fontSize: '14px' }}>
                                            <div style={{ background: '#F1F5F9', padding: '6px 12px', borderRadius: '8px', display: 'inline-block' }}>
                                                #{c.numero_orden || `OC-${String(c.id).padStart(4, '0')}`}
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 24px', color: '#475569', fontWeight: 500, fontSize: '14px' }}>{c.proveedor_nombre || 'Sin proveedor'}</td>
                                        <td style={{ padding: '20px 24px', color: '#64748B', fontSize: '14px' }}>{c.fecha_compra}</td>
                                        <td style={{ padding: '20px 24px', fontWeight: 800, color: '#1E293B', fontSize: '15px' }}>S/ {Number(c.total).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <span style={{
                                                background: c.estado === 'completado' ? '#D1FAE5' : c.estado === 'pendiente' ? '#FEF3C7' : '#FEE2E2',
                                                color: c.estado === 'completado' ? '#059669' : c.estado === 'pendiente' ? '#D97706' : '#DC2626',
                                                padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, textTransform: 'capitalize'
                                            }}>
                                                {c.estado}
                                            </span>
                                        </td>
                                        <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <Link 
                                                    href={`/admin/compras/${c.id}`} 
                                                    style={{ 
                                                        color: '#004797', background: '#E0F2FE', padding: '8px', borderRadius: '8px', 
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', textDecoration: 'none'
                                                    }}
                                                    onMouseOver={e => { e.currentTarget.style.backgroundColor = '#004797'; e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                                                    onMouseOut={e => { e.currentTarget.style.backgroundColor = '#E0F2FE'; e.currentTarget.style.color = '#004797'; e.currentTarget.style.transform = 'scale(1)'; }}
                                                    title="Ver Detalles"
                                                >
                                                    <Eye size={18} />
                                                </Link>
                                                <button 
                                                    onClick={() => handleDelete(c.id)} 
                                                    style={{ 
                                                        color: '#EF4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px',
                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                                                    }}
                                                    onMouseOver={e => { e.currentTarget.style.backgroundColor = '#FEE2E2'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                                                    onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '60px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                                                    <ShoppingCart size={32} />
                                                </div>
                                                <p style={{ margin: 0, color: '#64748B', fontSize: '15px', fontWeight: 500 }}>No hay compras registradas.</p>
                                                <button 
                                                    onClick={() => setShowModal(true)} 
                                                    style={{ background: 'transparent', border: '1px solid #004797', color: '#004797', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', marginTop: '8px' }}
                                                    onMouseOver={(e) => { e.currentTarget.style.background = '#004797'; e.currentTarget.style.color = '#fff'; }}
                                                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#004797'; }}
                                                >
                                                    Crear Primera Orden
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal Nueva Orden de Compra */}
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setShowModal(false)}></div>
                        <div style={{ 
                            position: 'relative', background: 'white', borderRadius: '24px', width: '800px', maxWidth: '90%', 
                            maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}>
                            <div style={{ padding: '24px 32px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>Nueva Orden de Compra</h2>
                                <button 
                                    onClick={() => setShowModal(false)}
                                    style={{ background: '#F1F5F9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseOver={(e) => { e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.color = '#1E293B'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#64748B'; }}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div style={{ padding: '32px', overflowY: 'auto' }}>
                                <form id="compra-form" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div>
                                        <label style={labelStyle}>Proveedor</label>
                                        <div style={{ position: 'relative' }}>
                                            <select 
                                                value={data.proveedor_id} 
                                                onChange={e => setData('proveedor_id', e.target.value)} 
                                                style={inputStyle} 
                                                onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                                required
                                            >
                                                <option value="">Seleccionar proveedor...</option>
                                                {proveedores?.map(p => (
                                                    <option key={p.id} value={p.id}>{p.nombre}</option>
                                                ))}
                                            </select>
                                            <ChevronRight size={16} color="#94A3B8" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%) rotate(90deg)', pointerEvents: 'none' }} />
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <label style={{ ...labelStyle, marginBottom: 0 }}>Productos</label>
                                        </div>
                                        <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)' }}>
                                            {items.map((item, idx) => (
                                                <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 110px 130px 44px', gap: '16px', alignItems: 'center', background: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px -2px rgba(0,0,0,0.03)', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px -4px rgba(0,0,0,0.06)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(0,0,0,0.03)'; }}>
                                                    <div style={{ position: 'relative' }}>
                                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Producto</div>
                                                        <select 
                                                            value={item.producto_id} 
                                                            onChange={e => updateItem(idx, 'producto_id', e.target.value)} 
                                                            style={{ ...inputStyle, padding: '12px 16px', background: '#F8FAFC', boxShadow: 'none' }} 
                                                            onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                                            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F8FAFC'; }}
                                                            required
                                                        >
                                                            <option value="">Seleccionar...</option>
                                                            {productos?.map((p, i) => (
                                                                <option key={i} value={p.producto_id}>{p.nombre} ({p.sku})</option>
                                                            ))}
                                                        </select>
                                                        <ChevronRight size={16} color="#94A3B8" style={{ position: 'absolute', right: '14px', top: '38px', transform: 'rotate(90deg)', pointerEvents: 'none' }} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Cantidad</div>
                                                        <input 
                                                            type="number" min="1" value={item.cantidad} onChange={e => updateItem(idx, 'cantidad', e.target.value)} placeholder="0" 
                                                            style={{ ...inputStyle, padding: '12px 16px', background: '#F8FAFC', boxShadow: 'none', textAlign: 'center' }} 
                                                            onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                                            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F8FAFC'; }}
                                                            required 
                                                        />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Costo Unit. (S/)</div>
                                                        <input 
                                                            type="number" step="0.01" value={item.costo_unitario} onChange={e => updateItem(idx, 'costo_unitario', e.target.value)} placeholder="0.00" 
                                                            style={{ ...inputStyle, padding: '12px 16px', background: '#F8FAFC', boxShadow: 'none', textAlign: 'right' }} 
                                                            onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                                            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F8FAFC'; }}
                                                            required 
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', paddingBottom: '2px' }}>
                                                        <button 
                                                            type="button" onClick={() => removeItem(idx)} 
                                                            style={{ 
                                                                width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                color: '#EF4444', background: '#FEF2F2', border: 'none', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s'
                                                            }}
                                                            onMouseOver={e => { e.currentTarget.style.backgroundColor = '#FEE2E2'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                                                            onMouseOut={e => { e.currentTarget.style.backgroundColor = '#FEF2F2'; e.currentTarget.style.transform = 'scale(1)'; }}
                                                            title="Eliminar ítem"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button 
                                                type="button" onClick={addItemRow} 
                                                style={{ 
                                                    background: '#E0F2FE', color: '#004797', border: '1px dashed #004797', padding: '12px', 
                                                    borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', transition: 'all 0.2s',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                                }}
                                                onMouseOver={e => { e.currentTarget.style.background = '#004797'; e.currentTarget.style.color = '#ffffff'; }}
                                                onMouseOut={e => { e.currentTarget.style.background = '#E0F2FE'; e.currentTarget.style.color = '#004797'; }}
                                            >
                                                <Plus size={16} /> Agregar otro producto
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ background: 'linear-gradient(135deg, #0f172a, #1E293B)', padding: '24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '12px' }}><ShoppingCart size={20} /></div>
                                            <span style={{ fontSize: '15px', fontWeight: 600, color: '#94A3B8' }}>Total Estimado de la Orden</span>
                                        </div>
                                        <span style={{ color: '#ffffff', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px' }}>S/ {totalOrden.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                    </div>

                                    <div>
                                        <label style={labelStyle}>Notas u Observaciones (opcional)</label>
                                        <textarea 
                                            value={data.notas} onChange={e => setData('notas', e.target.value)} 
                                            style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="Escribe observaciones, acuerdos con el proveedor o detalles de la orden..." 
                                            onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                        />
                                    </div>
                                </form>
                            </div>
                            
                            <div style={{ padding: '24px 32px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px', display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                                <button 
                                    type="button" onClick={() => setShowModal(false)} 
                                    style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#ffffff', color: '#475569', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px' }}
                                    onMouseOver={e => { e.currentTarget.style.backgroundColor = '#F1F5F9'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                                    onMouseOut={e => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" form="compra-form" disabled={processing} 
                                    style={{ 
                                        padding: '12px 32px', borderRadius: '12px', border: 'none', background: '#004797', color: 'white', 
                                        fontWeight: 600, cursor: processing ? 'not-allowed' : 'pointer', transition: 'all 0.2s', fontSize: '14px',
                                        boxShadow: '0 4px 14px rgba(0, 71, 151, 0.3)', opacity: processing ? 0.7 : 1
                                    }}
                                    onMouseOver={e => { if(!processing) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 71, 151, 0.4)'; } }}
                                    onMouseOut={e => { if(!processing) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 71, 151, 0.3)'; } }}
                                >
                                    {processing ? 'Creando...' : 'Crear Orden de Compra'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </AdminLayout>
    );
}
