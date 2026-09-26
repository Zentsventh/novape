import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { Edit, ArrowLeft, Image as ImageIcon, DollarSign, TrendingUp, Package, Tag, Layers, CheckCircle, AlertCircle, ShoppingCart } from 'lucide-react';

export default function Show({ producto, costoPromedio, historialCompras = [], comparativaProveedores = [] }) {
    const precio = parseFloat(producto.variantes?.[0]?.precio || 0);
    const ganancia = precio - costoPromedio;
    const margen = precio > 0 ? (ganancia / precio) * 100 : 0;

    return (
        <AdminLayout>
            <Head title={`Producto: ${producto.nombre}`} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <h1 style={{ fontSize: '24px', margin: 0, fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.02em' }}>
                    <div style={{ padding: '8px', backgroundColor: '#F0F9FF', borderRadius: '10px', color: '#00B4FF' }}>
                        <Package size={24} />
                    </div>
                    Detalle del Producto
                </h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Link 
                        href="/admin/products" 
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; e.currentTarget.style.color = '#1E293B'; e.currentTarget.style.borderColor = '#94A3B8'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff', color: '#475569', textDecoration: 'none', padding: '10px 14px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', border: '1px solid #E2E8F0', transition: 'all 0.2s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}
                    >
                        <ArrowLeft size={16} />
                        Volver
                    </Link>
                    <Link 
                        href={`/admin/products/${producto.id}/edit`} 
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#009BE0'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 180, 255, 0.3)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#00B4FF'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 180, 255, 0.2)'; }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#00B4FF', color: 'white', textDecoration: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0, 180, 255, 0.2)' }}
                    >
                        <Edit size={16} />
                        Editar Producto
                    </Link>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '24px', alignItems: 'start' }}>
                
                {/* Info Principal */}
                <div style={{ background: '#ffffff', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                    <div style={{ width: '180px', height: '180px', borderRadius: '12px', overflow: 'hidden', background: '#F8FAFC', flexShrink: 0, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {producto.imagenes && producto.imagenes.length > 0 ? (
                            <img src={`/storage/${producto.imagenes[0].url.replace('/storage/', '')}`} alt={producto.nombre} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }} onError={(e) => e.target.src = producto.imagenes[0].url} />
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#94A3B8' }}>
                                <ImageIcon size={32} />
                                <span style={{ fontSize: '13px', fontWeight: '500' }}>Sin imagen</span>
                            </div>
                        )}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 16px 0', color: '#1E293B', letterSpacing: '-0.02em' }}>{producto.nombre}</h2>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <p style={{ margin: '0 0 4px 0', color: '#64748B', fontSize: '12px', fontWeight: '600', letterSpacing: '0.05em' }}>SKU BASE</p>
                                <p style={{ margin: '0', color: '#1E293B', fontWeight: '600', fontSize: '14px', fontFamily: 'monospace', background: '#F1F5F9', padding: '4px 8px', borderRadius: '6px', display: 'inline-block' }}>{producto.sku_base}</p>
                            </div>
                            
                            <div>
                                <p style={{ margin: '0 0 4px 0', color: '#64748B', fontSize: '12px', fontWeight: '600', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}><Tag size={12} /> MARCA</p>
                                <p style={{ margin: '0', color: '#1E293B', fontWeight: '500', fontSize: '14px' }}>{producto.marca ? producto.marca.nombre : 'Genérica'}</p>
                            </div>
                            
                            <div>
                                <p style={{ margin: '0 0 4px 0', color: '#64748B', fontSize: '12px', fontWeight: '600', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}><Layers size={12} /> CATEGORÍA</p>
                                <p style={{ margin: '0', color: '#1E293B', fontWeight: '500', fontSize: '14px' }}>{producto.categorias && producto.categorias.length > 0 ? producto.categorias[0].nombre : 'Sin categoría'}</p>
                            </div>
                            
                            <div>
                                <p style={{ margin: '0 0 4px 0', color: '#64748B', fontSize: '12px', fontWeight: '600', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}><Package size={12} /> STOCK ACTUAL</p>
                                <p style={{ margin: '0', color: '#1E293B', fontWeight: '700', fontSize: '14px' }}>{producto.variantes?.[0]?.stock || 0} unidades</p>
                            </div>
                        </div>

                        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ color: '#64748B', fontSize: '13px', fontWeight: '600' }}>Estado del sistema:</span>
                            {producto.activo ? (
                                <span style={{ padding: '6px 16px', borderRadius: '9999px', fontSize: '13px', fontWeight: '700', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CheckCircle size={14} /> Activo en catálogo
                                </span>
                            ) : (
                                <span style={{ padding: '6px 16px', borderRadius: '9999px', fontSize: '13px', fontWeight: '700', background: '#F1F5F9', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <AlertCircle size={14} /> Inactivo / Oculto
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Información de Venta */}
                <div style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', margin: '0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DollarSign size={20} style={{ color: '#00B4FF' }} />
                        Datos de Venta
                    </h3>

                    <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px dashed #CBD5E1' }}>
                            <span style={{ color: '#64748B', fontSize: '14px', fontWeight: '500' }}>Precio Venta Público:</span>
                            <span style={{ fontWeight: '800', fontSize: '20px', color: '#1E293B' }}>S/ {Number(precio).toLocaleString('en-US', {minimumFractionDigits:2})}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#64748B', fontSize: '14px', fontWeight: '500' }}>Costo Promedio:</span>
                            <span style={{ fontWeight: '700', fontSize: '14px', color: '#475569' }}>S/ {Number(costoPromedio).toLocaleString('en-US', {minimumFractionDigits:2})}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comparativa de Proveedores */}
            <div style={{ marginTop: '40px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={20} style={{ color: '#00B4FF' }} />
                    Comparativa de Rentabilidad por Proveedor
                </h3>
                
                {comparativaProveedores.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                        {comparativaProveedores.sort((a,b) => a.ultimo_costo - b.ultimo_costo).map((prov, index) => {
                            const gananciaProv = precio - prov.ultimo_costo;
                            const margenProv = precio > 0 ? (gananciaProv / precio) * 100 : 0;
                            return (
                                <div 
                                    key={prov.proveedor_id} 
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0, 0, 0, 0.05)'; }}
                                    style={{ 
                                        background: index === 0 ? '#F0F9FF' : '#ffffff', 
                                        border: index === 0 ? '1px solid #00B4FF' : '1px solid #E2E8F0', 
                                        borderRadius: '12px', 
                                        padding: '24px', 
                                        position: 'relative', 
                                        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {index === 0 && (
                                        <div style={{ position: 'absolute', top: '-12px', right: '24px', background: '#00B4FF', color: 'white', fontSize: '11px', fontWeight: '700', padding: '4px 12px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 180, 255, 0.3)' }}>
                                            Mayor Margen / Mejor Precio
                                        </div>
                                    )}
                                    <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <ShoppingCart size={18} style={{ color: index === 0 ? '#00B4FF' : '#94A3B8' }} />
                                        {prov.proveedor_nombre}
                                    </h4>
                                    
                                    {/* Costos y Compras */}
                                    <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: index === 0 ? '1px dashed rgba(0, 180, 255, 0.2)' : '1px dashed #E2E8F0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <span style={{ color: '#64748B', fontSize: '13px', fontWeight: '500' }}>Último costo ud:</span>
                                            <span style={{ fontWeight: '700', color: '#1E293B', fontSize: '14px' }}>S/ {Number(prov.ultimo_costo).toLocaleString('en-US', {minimumFractionDigits:2})}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <span style={{ color: '#64748B', fontSize: '13px', fontWeight: '500' }}>Unidades / Órdenes:</span>
                                            <span style={{ fontWeight: '600', color: '#475569', fontSize: '13px' }}>{prov.total_unidades} uds. en {prov.frecuencia} orden(es)</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#64748B', fontSize: '13px', fontWeight: '500' }}>Última compra:</span>
                                            <span style={{ fontWeight: '600', color: '#475569', fontSize: '13px' }}>{prov.ultima_compra}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Rentabilidad con ese proveedor */}
                                    <div style={{ background: index === 0 ? '#ffffff' : '#F8FAFC', padding: '16px', borderRadius: '8px', border: index === 0 ? 'none' : '1px solid #E2E8F0', boxShadow: index === 0 ? '0 1px 3px rgba(0,0,0,0.05)' : 'none' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ color: index === 0 ? '#009BE0' : '#64748B', fontSize: '13px', fontWeight: '700' }}>Ganancia Neta:</span>
                                            <span style={{ fontWeight: '800', color: index === 0 ? '#00B4FF' : '#1E293B', fontSize: '15px' }}>S/ {Number(gananciaProv).toLocaleString('en-US', {minimumFractionDigits:2})}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: index === 0 ? '#009BE0' : '#64748B', fontSize: '13px', fontWeight: '700' }}>Margen de utilidad:</span>
                                            <span style={{ fontWeight: '700', color: index === 0 ? '#00B4FF' : '#1E293B', fontSize: '14px' }}>{margenProv.toFixed(2)}%</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ padding: '40px', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1', color: '#64748B', textAlign: 'center' }}>
                        <ShoppingCart size={32} style={{ opacity: 0.3, margin: '0 auto 12px auto' }} />
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>No hay historial de compras de este producto aún.</div>
                        <div style={{ fontSize: '13px', marginTop: '4px' }}>Registra una compra para ver comparativas de rentabilidad.</div>
                    </div>
                )}
            </div>
            
            {/* Historial de Órdenes Relacionadas */}
            {historialCompras.length > 0 && (
                <div style={{ marginTop: '40px', marginBottom: '40px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', marginBottom: '24px' }}>
                        Órdenes de Compra Relacionadas
                    </h3>
                    <div style={{ background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Orden</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Proveedor</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Cantidad</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Costo Unitario</th>
                                    <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historialCompras.map((hc, i) => (
                                    <tr 
                                        key={i} 
                                        style={{ borderBottom: '1px solid #E2E8F0', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                    >
                                        <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>{hc.numero_orden}</td>
                                        <td style={{ padding: '16px 24px', fontSize: '13px', color: '#64748B' }}>{hc.fecha_compra}</td>
                                        <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>{hc.proveedor_nombre || 'Sin proveedor'}</td>
                                        <td style={{ padding: '16px 24px', fontSize: '13px', color: '#64748B', textAlign: 'right' }}>{hc.cantidad}</td>
                                        <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: '#1E293B', textAlign: 'right' }}>S/ {Number(hc.costo_unitario).toLocaleString('en-US', {minimumFractionDigits:2})}</td>
                                        <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '700', color: '#059669', textAlign: 'right' }}>S/ {Number(hc.subtotal).toLocaleString('en-US', {minimumFractionDigits:2})}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
