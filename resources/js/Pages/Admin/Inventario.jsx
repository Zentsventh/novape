import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '../../Layouts/AdminLayout';
import { Package, DollarSign, Users, AlertTriangle, Box, Activity, ArrowRight, CheckCircle, TrendingUp } from 'lucide-react';

export default function Inventario({ 
    totalProductos, totalCategorias, totalProveedores,
    valorInventario, stockBajo, productos, logoUrl
}) {
    return (
        <AdminLayout logoUrl={logoUrl}>
            <Head title="Panel de Inventario" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <h1 style={{ fontSize: '24px', margin: 0, fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.02em' }}>
                    <div style={{ padding: '8px', backgroundColor: '#F0F9FF', borderRadius: '10px', color: '#00B4FF' }}>
                        <Box size={24} />
                    </div>
                    <div>
                        Panel de Inventario
                        <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0 0', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Activity size={14} /> Control de mercadería, proveedores y valoraciones.
                        </p>
                    </div>
                </h1>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Link 
                        href="/admin/productos" 
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; e.currentTarget.style.color = '#1E293B'; e.currentTarget.style.borderColor = '#94A3B8'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', color: '#475569', textDecoration: 'none', padding: '10px 14px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', border: '1px solid #E2E8F0', transition: 'all 0.2s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                    >
                        Ver Productos
                    </Link>
                    <Link 
                        href="/admin/almacen/entradas" 
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#009BE0'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 180, 255, 0.3)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#00B4FF'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 180, 255, 0.2)'; }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#00B4FF', color: 'white', textDecoration: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0, 180, 255, 0.2)' }}
                    >
                        <ArrowRight size={16} />
                        Registrar Entrada
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                
                <div 
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0, 0, 0, 0.05)'; }}
                    style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.3s ease' }}
                >
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00B4FF', flexShrink: 0 }}>
                        <Package size={24} />
                    </div>
                    <div>
                        <div style={{ color: '#64748B', fontSize: '12px', fontWeight: '600', letterSpacing: '0.05em' }}>PRODUCTOS CATÁLOGO</div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', letterSpacing: '-0.02em', marginTop: '2px' }}>{totalProductos}</div>
                        <div style={{ fontSize: '12px', color: '#00B4FF', marginTop: '4px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <TrendingUp size={12} /> Activos
                        </div>
                    </div>
                </div>

                <div 
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0, 0, 0, 0.05)'; }}
                    style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.3s ease' }}
                >
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', flexShrink: 0 }}>
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <div style={{ color: '#64748B', fontSize: '12px', fontWeight: '600', letterSpacing: '0.05em' }}>VALOR INVENTARIO</div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', letterSpacing: '-0.02em', marginTop: '2px' }}>S/ {valorInventario.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        <div style={{ fontSize: '12px', color: '#10B981', marginTop: '4px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Activity size={12} /> Valuación Actual
                        </div>
                    </div>
                </div>

                <div 
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0, 0, 0, 0.05)'; }}
                    style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.3s ease' }}
                >
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6', flexShrink: 0 }}>
                        <Users size={24} />
                    </div>
                    <div>
                        <div style={{ color: '#64748B', fontSize: '12px', fontWeight: '600', letterSpacing: '0.05em' }}>PROVEEDORES</div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', letterSpacing: '-0.02em', marginTop: '2px' }}>{totalProveedores}</div>
                        <div style={{ fontSize: '12px', color: '#8B5CF6', marginTop: '4px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle size={12} /> Activos
                        </div>
                    </div>
                </div>

                <div 
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0, 0, 0, 0.05)'; }}
                    style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px', transition: 'all 0.3s ease' }}
                >
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', flexShrink: 0 }}>
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <div style={{ color: '#64748B', fontSize: '12px', fontWeight: '600', letterSpacing: '0.05em' }}>BAJO STOCK</div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', letterSpacing: '-0.02em', marginTop: '2px' }}>{stockBajo.length}</div>
                        <div style={{ fontSize: '12px', color: '#EF4444', marginTop: '4px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={12} /> Requieren Atención
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '24px', marginBottom: '32px', alignItems: 'start' }}>
                
                {/* Listado de Stock */}
                <div style={{ background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 20px 24px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Package size={18} style={{ color: '#00B4FF' }} /> Resumen de Stock
                        </h2>
                        <Link href="/admin/productos" style={{ color: '#00B4FF', fontSize: '13px', textDecoration: 'none', fontWeight: '600', transition: 'color 0.2s ease' }} onMouseEnter={e => e.target.style.color = '#009BE0'} onMouseLeave={e => e.target.style.color = '#00B4FF'}>
                            Ver Catálogo
                        </Link>
                    </div>

                    <div style={{ width: '100%', overflowX: 'auto' }}>
                        <table style={{ width: '100%', minWidth: '500px', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                                    <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Producto</th>
                                    <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Marca</th>
                                    <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Proveedor</th>
                                    <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Costo</th>
                                    <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Stock Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productos.length > 0 ? productos.map(p => (
                                    <tr 
                                        key={p.id}
                                        style={{ borderBottom: '1px solid #E2E8F0', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                    >
                                        <td style={{ padding: '16px 24px', color: '#1E293B', fontWeight: '600', fontSize: '14px', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {p.nombre}
                                        </td>
                                        <td style={{ padding: '16px 24px', color: '#64748B', fontSize: '13px' }}>{p.marca || '-'}</td>
                                        <td style={{ padding: '16px 24px', color: '#64748B', fontSize: '13px' }}>{p.proveedor || '-'}</td>
                                        <td style={{ padding: '16px 24px', color: '#1E293B', fontWeight: '600', fontSize: '14px' }}>
                                            S/ {p.costo ? Number(p.costo).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                            <span style={{ background: '#F1F5F9', color: '#1E293B', padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '700' }}>
                                                {p.stock}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '40px 0', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>No hay productos registrados.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Alertas Stock */}
                <div style={{ background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #FCA5A5', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#EF4444' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 20px 24px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#EF4444', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertTriangle size={18} /> ¡Alerta de Stock Bajo!
                        </h2>
                    </div>

                    <div style={{ width: '100%', overflowX: 'auto', maxHeight: '420px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', minWidth: '250px', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#FEF2F2', borderTop: '1px solid #FEE2E2', borderBottom: '1px solid #FEE2E2' }}>
                                    <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Producto</th>
                                    <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Stock</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stockBajo.length === 0 ? (
                                    <tr>
                                        <td colSpan="2" style={{ padding: '40px 0', textAlign: 'center', color: '#94A3B8' }}>
                                            <CheckCircle size={32} style={{ color: '#10B981', margin: '0 auto 12px auto', opacity: 0.5 }} />
                                            <div style={{ fontSize: '14px', fontWeight: '500' }}>Excelente. No hay stock bajo.</div>
                                        </td>
                                    </tr>
                                ) : stockBajo.map(p => (
                                    <tr 
                                        key={p.id}
                                        style={{ borderBottom: '1px solid #FEE2E2', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                    >
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ color: '#1E293B', fontWeight: '600', fontSize: '14px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={p.nombre}>
                                                {p.nombre}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{p.proveedor_nombre || 'Sin Proveedor'}</div>
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                            <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '700' }}>
                                                {p.stock_total} u.
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
