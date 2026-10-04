import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ShieldAlert, Package, CheckCircle, Clock, Search, XCircle, FileText, ChevronRight, RefreshCw, AlertTriangle } from 'lucide-react';

export default function RmaIndex({ rmas }) {
    const { auth } = usePage().props;

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending': return { bg: '#FEF3C7', text: '#D97706', label: 'Pendiente', icon: <Clock size={14} /> };
            case 'approved': return { bg: '#D1FAE5', text: '#059669', label: 'Aprobado', icon: <CheckCircle size={14} /> };
            case 'received': return { bg: '#DBEAFE', text: '#2563EB', label: 'En Revisión', icon: <Search size={14} /> };
            case 'processed': return { bg: '#F3E8FF', text: '#9333EA', label: 'Procesado', icon: <CheckCircle size={14} /> };
            case 'rejected': return { bg: '#FEE2E2', text: '#DC2626', label: 'Rechazado', icon: <XCircle size={14} /> };
            default: return { bg: '#F1F5F9', text: '#64748B', label: status, icon: <FileText size={14} /> };
        }
    };

    const getTypeStyle = (type) => {
        switch (type) {
            case 'return': return { bg: '#F1F5F9', text: '#475569', label: 'Devolución', icon: <RefreshCw size={14} /> };
            case 'exchange': return { bg: '#E0F2FE', text: '#0284C7', label: 'Cambio', icon: <Package size={14} /> };
            case 'warranty': return { bg: '#FFE4E6', text: '#E11D48', label: 'Garantía', icon: <ShieldAlert size={14} /> };
            default: return { bg: '#F1F5F9', text: '#475569', label: type, icon: <FileText size={14} /> };
        }
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title="Garantías y Cambios (RMA)" />

            <div style={{ fontFamily: "'Inter', sans-serif", padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', margin: '0 0 8px 0', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#FFE4E6', padding: '10px', borderRadius: '12px', color: '#E11D48', display: 'flex' }}>
                                <ShieldAlert size={24} />
                            </div>
                            Garantías y Cambios (RMA)
                        </h1>
                        <p style={{ margin: 0, color: '#64748B', fontSize: '15px' }}>Administra las devoluciones, reemplazos y solicitudes de garantía de los clientes.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', padding: '12px 20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#FEF3C7', color: '#D97706', padding: '8px', borderRadius: '10px' }}><AlertTriangle size={18} /></div>
                            <div>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Solicitudes Totales</div>
                                <div style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>{rmas.data.length}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ background: '#ffffff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ID Ticket</th>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cliente / Origen</th>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo de Solicitud</th>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado Actual</th>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fecha</th>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rmas.data.length > 0 ? rmas.data.map(rma => {
                                    const statusStyle = getStatusStyle(rma.status);
                                    const typeStyle = getTypeStyle(rma.type);
                                    
                                    return (
                                    <tr key={rma.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#F8FAFC'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        <td style={{ padding: '24px 32px', fontWeight: 800, color: '#1E293B', fontSize: '15px' }}>
                                            #{rma.id.toString().padStart(6, '0')}
                                        </td>
                                        <td style={{ padding: '24px 32px' }}>
                                            <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '15px', marginBottom: '4px' }}>{rma.usuario?.nombres} {rma.usuario?.apellidos}</div>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F1F5F9', padding: '4px 8px', borderRadius: '6px', color: '#64748B', fontSize: '12px', fontWeight: 600 }}>
                                                <Package size={12} /> Pedido #{rma.pedido_id}
                                            </div>
                                        </td>
                                        <td style={{ padding: '24px 32px' }}>
                                            <span style={{ 
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                background: typeStyle.bg, color: typeStyle.text, 
                                                padding: '6px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 
                                            }}>
                                                {typeStyle.icon} {typeStyle.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '24px 32px' }}>
                                            <span style={{ 
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                background: statusStyle.bg, color: statusStyle.text,
                                                padding: '6px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 700
                                            }}>
                                                {statusStyle.icon} {statusStyle.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '24px 32px', color: '#475569', fontSize: '14px', fontWeight: 500 }}>
                                            {new Date(rma.created_at).toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td style={{ padding: '24px 32px', textAlign: 'right' }}>
                                            <Link 
                                                href={`/admin/rma/${rma.id}`} 
                                                style={{ 
                                                    display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', 
                                                    background: '#E0F2FE', color: '#004797', borderRadius: '12px', textDecoration: 'none', 
                                                    fontWeight: 700, fontSize: '14px', transition: 'all 0.2s', border: '1px solid transparent'
                                                }}
                                                onMouseOver={e => { e.currentTarget.style.backgroundColor = '#004797'; e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 71, 151, 0.3)'; }}
                                                onMouseOut={e => { e.currentTarget.style.backgroundColor = '#E0F2FE'; e.currentTarget.style.color = '#004797'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                                            >
                                                Revisar <ChevronRight size={16} />
                                            </Link>
                                        </td>
                                    </tr>
                                )}) : (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '80px 40px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1' }}>
                                                    <ShieldAlert size={40} />
                                                </div>
                                                <h3 style={{ margin: 0, color: '#1E293B', fontSize: '18px', fontWeight: 700 }}>Sin casos activos</h3>
                                                <p style={{ margin: 0, color: '#64748B', fontSize: '15px', maxWidth: '400px', lineHeight: '1.5' }}>
                                                    Excelente noticia. No hay solicitudes de garantía, cambios ni devoluciones pendientes de revisión en este momento.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
