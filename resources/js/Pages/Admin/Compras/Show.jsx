import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { ArrowLeft, CheckCircle2, Clock, XCircle, Package, Box, Hash, FileText, Mail, Phone, Building2, DollarSign, Check } from 'lucide-react';

export default function CompraShow({ compra, items, logoUrl }) {
    const confirmDialog = useConfirm();

    const handleCompletar = async () => {
        if (await confirmDialog('¿Estás seguro de completar esta compra? Esto añadirá el stock al inventario y actualizará los costos.')) {
            router.post(`/admin/compras/${compra.id}/completar`, {}, { preserveScroll: true });
        }
    };

    const getStatusStyle = (estado) => {
        if (estado === 'completado') return { bg: '#D1FAE5', text: '#059669', icon: <CheckCircle2 size={16} /> };
        if (estado === 'pendiente') return { bg: '#FEF3C7', text: '#D97706', icon: <Clock size={16} /> };
        return { bg: '#FEE2E2', text: '#DC2626', icon: <XCircle size={16} /> };
    };

    const statusStyle = getStatusStyle(compra.estado);

    return (
        <AdminLayout logoUrl={logoUrl}>
            <Head title={`Orden #OC-${String(compra.id).padStart(4, '0')}`} />

            <div style={{ fontFamily: "'Inter', sans-serif", padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ marginBottom: '24px' }}>
                    <Link 
                        href="/admin/compras" 
                        style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748B', 
                            textDecoration: 'none', fontWeight: 600, fontSize: '14px', transition: 'color 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.color = '#004797'}
                        onMouseOut={e => e.currentTarget.style.color = '#64748B'}
                    >
                        <ArrowLeft size={16} /> Volver al Historial
                    </Link>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '24px' }}>
                    {/* Columna Principal: Detalle de Items */}
                    <div style={{ minWidth: 0 }}>
                        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Detalle de la Transacción</div>
                                <h1 style={{ fontSize: '32px', margin: '0 0 12px 0', fontWeight: 800, color: '#1E293B', letterSpacing: '-1px' }}>
                                    Orden #OC-{String(compra.id).padStart(4, '0')}
                                </h1>
                                <div style={{ color: '#64748B', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={16} color="#94A3B8" /> {compra.fecha_compra}
                                </div>
                            </div>
                            <div>
                                <span style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    background: statusStyle.bg, color: statusStyle.text,
                                    padding: '8px 16px', borderRadius: '16px', fontSize: '14px', fontWeight: 700, textTransform: 'capitalize'
                                }}>
                                    {statusStyle.icon} {compra.estado}
                                </span>
                            </div>
                        </div>

                        <div style={{ background: '#ffffff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0' }}>
                            <div style={{ padding: '24px 32px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: '#F1F5F9', padding: '8px', borderRadius: '10px', color: '#64748B' }}>
                                    <Package size={20} />
                                </div>
                                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1E293B' }}>Productos de la Orden ({items.length} ítems)</h2>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                            <th style={{ padding: '16px 32px', textAlign: 'left', color: '#64748B', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Producto</th>
                                            <th style={{ padding: '16px 32px', textAlign: 'left', color: '#64748B', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>SKU</th>
                                            <th style={{ padding: '16px 32px', textAlign: 'center', color: '#64748B', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cant.</th>
                                            <th style={{ padding: '16px 32px', textAlign: 'right', color: '#64748B', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Costo Unit.</th>
                                            <th style={{ padding: '16px 32px', textAlign: 'right', color: '#64748B', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map(item => (
                                            <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#F8FAFC'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                                <td style={{ padding: '20px 32px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                                                            <Box size={18} />
                                                        </div>
                                                        <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '14px' }}>{item.producto_nombre || 'Producto'}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px 32px' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F1F5F9', padding: '4px 8px', borderRadius: '6px', color: '#64748B', fontSize: '12px', fontWeight: 600 }}>
                                                        <Hash size={12} /> {item.sku || '—'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '20px 32px', textAlign: 'center', fontWeight: 700, color: '#1E293B', fontSize: '14px' }}>{item.cantidad}</td>
                                                <td style={{ padding: '20px 32px', textAlign: 'right', color: '#475569', fontSize: '14px', fontWeight: 500 }}>S/ {Number(item.costo_unitario).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                                <td style={{ padding: '20px 32px', textAlign: 'right', fontWeight: 800, color: '#1E293B', fontSize: '14px' }}>S/ {Number(item.subtotal).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan="4" style={{ padding: '24px 32px', textAlign: 'right', fontWeight: 700, fontSize: '14px', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total de la Orden:</td>
                                            <td style={{ padding: '24px 32px', textAlign: 'right', fontWeight: 800, fontSize: '20px', color: '#004797' }}>S/ {Number(compra.total).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {compra.notas && (
                            <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px 32px', marginTop: '32px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                    <FileText size={18} color="#94A3B8" />
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>Notas u Observaciones</h3>
                                </div>
                                <p style={{ color: '#475569', margin: 0, lineHeight: '1.6', fontSize: '15px', background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>{compra.notas}</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar: Info del Proveedor y Financiero */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                <div style={{ background: '#E0F2FE', color: '#004797', padding: '8px', borderRadius: '10px' }}><Building2 size={18} /></div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1E293B' }}>Proveedor</h3>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Razón Social</div>
                                    <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '15px' }}>{compra.proveedor_nombre || 'No asignado'}</div>
                                </div>
                                {compra.proveedor_email && (
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Email</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#004797', fontSize: '14px', fontWeight: 500 }}>
                                            <Mail size={14} /> {compra.proveedor_email}
                                        </div>
                                    </div>
                                )}
                                {compra.proveedor_telefono && (
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>Teléfono</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '14px', fontWeight: 500 }}>
                                            <Phone size={14} /> {compra.proveedor_telefono}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ background: '#1E293B', borderRadius: '20px', padding: '24px', boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4)', color: '#ffffff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', padding: '8px', borderRadius: '10px' }}><DollarSign size={18} /></div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>Resumen Financiero</h3>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#94A3B8', fontSize: '14px' }}>Líneas de Ítems</span>
                                    <span style={{ fontWeight: 700, fontSize: '15px' }}>{items.length}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#94A3B8', fontSize: '14px' }}>Unidades Totales</span>
                                    <span style={{ fontWeight: 700, fontSize: '15px' }}>{items.reduce((sum, i) => sum + i.cantidad, 0)}</span>
                                </div>
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', marginTop: '4px' }}>
                                    <div style={{ color: '#94A3B8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 700 }}>Total Estimado</div>
                                    <div style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                        <span style={{ fontSize: '18px', color: '#94A3B8' }}>S/</span>
                                        {Number(compra.total).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {compra.estado === 'pendiente' && (
                            <button 
                                onClick={handleCompletar}
                                style={{ 
                                    width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: '#004797', color: 'white', 
                                    fontWeight: 700, fontSize: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
                                    boxShadow: '0 4px 14px rgba(0, 71, 151, 0.3)', transition: 'all 0.2s ease'
                                }}
                                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 71, 151, 0.4)'; }}
                                onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 71, 151, 0.3)'; }}
                            >
                                <Check size={20} /> Completar y Cargar Stock
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
