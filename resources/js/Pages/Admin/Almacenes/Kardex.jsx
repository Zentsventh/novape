import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { ArrowLeft, Box, ArrowDownRight, ArrowUpRight, ArrowRightLeft, Hash, Calendar, FileText, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

export default function Kardex({ almacen, movimientos, logoUrl }) {
    const data = movimientos.data || [];
    
    const getTypeStyle = (tipo) => {
        switch (tipo) {
            case 'entrada': return { bg: '#D1FAE5', text: '#059669', icon: <ArrowDownRight size={14} /> };
            case 'salida': return { bg: '#FEE2E2', text: '#DC2626', icon: <ArrowUpRight size={14} /> };
            case 'transferencia': return { bg: '#E0F2FE', text: '#0284C7', icon: <ArrowRightLeft size={14} /> };
            default: return { bg: '#F1F5F9', text: '#475569', icon: <FileText size={14} /> };
        }
    };

    return (
        <AdminLayout logoUrl={logoUrl}>
            <Head title={`Kardex - ${almacen.nombre}`} />

            <div style={{ fontFamily: "'Inter', sans-serif", padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ marginBottom: '24px' }}>
                    <Link 
                        href="/admin/almacenes" 
                        style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748B', 
                            textDecoration: 'none', fontWeight: 600, fontSize: '14px', transition: 'color 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.color = '#004797'}
                        onMouseOut={e => e.currentTarget.style.color = '#64748B'}
                    >
                        <ArrowLeft size={16} /> Volver a Almacenes
                    </Link>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', margin: '0 0 8px 0', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#E0F2FE', padding: '10px', borderRadius: '12px', color: '#004797', display: 'flex' }}>
                                <Box size={24} />
                            </div>
                            Kardex: {almacen.nombre}
                        </h1>
                        <p style={{ margin: 0, color: '#64748B', fontSize: '15px' }}>
                            Historial detallado de movimientos, entradas, salidas y transferencias.
                        </p>
                    </div>
                </div>

                <div style={{ background: '#ffffff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fecha</th>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo</th>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Producto / SKU</th>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Cantidad</th>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Referencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length > 0 ? data.map(m => {
                                    const typeStyle = getTypeStyle(m.tipo);
                                    const dateObj = new Date(m.created_at);
                                    
                                    return (
                                    <tr key={m.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#F8FAFC'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        <td style={{ padding: '24px 32px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E293B', fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>
                                                <Calendar size={14} color="#94A3B8" /> {dateObj.toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </div>
                                            <div style={{ color: '#64748B', fontSize: '12px', marginLeft: '22px' }}>
                                                {dateObj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td style={{ padding: '24px 32px' }}>
                                            <span style={{ 
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                background: typeStyle.bg, color: typeStyle.text,
                                                padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px'
                                            }}>
                                                {typeStyle.icon} {m.tipo}
                                            </span>
                                        </td>
                                        <td style={{ padding: '24px 32px' }}>
                                            <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '15px', marginBottom: '6px' }}>{m.producto_nombre}</div>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F1F5F9', padding: '4px 8px', borderRadius: '6px', color: '#64748B', fontSize: '12px', fontWeight: 600 }}>
                                                <Hash size={12} /> {m.sku}
                                            </span>
                                        </td>
                                        <td style={{ padding: '24px 32px', textAlign: 'right' }}>
                                            <div style={{ 
                                                display: 'inline-block', padding: '8px 16px', borderRadius: '12px',
                                                background: m.cantidad > 0 ? '#F0FDF4' : '#FEF2F2',
                                                color: m.cantidad > 0 ? '#16A34A' : '#DC2626',
                                                fontWeight: 800, fontSize: '16px'
                                            }}>
                                                {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                                            </div>
                                        </td>
                                        <td style={{ padding: '24px 32px' }}>
                                            <div style={{ color: '#475569', fontSize: '14px', fontWeight: 500, lineHeight: '1.5' }}>
                                                {m.referencia || '—'}
                                            </div>
                                            {m.destino_nombre && m.cantidad < 0 && (
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '8px', color: '#004797', fontSize: '12px', fontWeight: 600, background: '#E0F2FE', padding: '4px 8px', borderRadius: '6px' }}>
                                                    <ArrowRightLeft size={12} /> Hacia: {m.destino_nombre}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )}) : (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '80px 40px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1' }}>
                                                    <FileText size={40} />
                                                </div>
                                                <h3 style={{ margin: 0, color: '#1E293B', fontSize: '18px', fontWeight: 700 }}>Almacén sin movimientos</h3>
                                                <p style={{ margin: 0, color: '#64748B', fontSize: '15px', maxWidth: '400px', lineHeight: '1.5' }}>
                                                    Aún no se ha registrado ninguna entrada, salida o transferencia en este almacén.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                {/* Paginación Premium */}
                {movimientos.links && movimientos.links.length > 3 && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px', gap: '8px' }}>
                        {movimientos.links.map((link, idx) => {
                            let label = link.label;
                            if (label.includes('Previous')) label = <ChevronLeft size={18} />;
                            if (label.includes('Next')) label = <ChevronRight size={18} />;
                            if (label === '...') label = <MoreHorizontal size={18} />;

                            if (!link.url) {
                                return (
                                    <span
                                        key={idx}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '40px', height: '40px', padding: '0 12px',
                                            background: '#F8FAFC', color: '#94A3B8', borderRadius: '10px', fontSize: '14px', fontWeight: 600, pointerEvents: 'none'
                                        }}
                                    >
                                        {label}
                                    </span>
                                );
                            }
                            return (
                                <Link
                                    key={idx}
                                    href={link.url}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '40px', height: '40px', padding: '0 12px',
                                        background: link.active ? '#004797' : '#ffffff', border: link.active ? 'none' : '1px solid #E2E8F0',
                                        color: link.active ? '#ffffff' : '#475569', borderRadius: '10px', fontSize: '14px', fontWeight: link.active ? 800 : 600, textDecoration: 'none',
                                        boxShadow: link.active ? '0 4px 12px rgba(0, 71, 151, 0.3)' : '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s'
                                    }}
                                    onMouseOver={e => { if(!link.active) { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#1E293B'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                                    onMouseOut={e => { if(!link.active) { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.transform = 'none'; } }}
                                >
                                    {label}
                                </Link>
                            );
                        })}
                    </div>
                )}

            </div>
        </AdminLayout>
    );
}
