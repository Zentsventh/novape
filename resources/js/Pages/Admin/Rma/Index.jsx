import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ShieldCheck, Package, CheckCircle2, Clock, Search, ChevronRight, RefreshCw, FileText } from 'lucide-react';

export default function RmaIndex({ rmas }) {
    const { auth } = usePage().props;

    // Paleta SaaS estricta: #004797 y derivados
    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending':
                return { 
                    bg: '#F1F5F9', 
                    border: '#E2E8F0', 
                    text: '#475569', 
                    label: 'Pendiente', 
                    icon: <Clock size={14} style={{ color: '#004797' }} /> 
                };
            case 'approved':
                return { 
                    bg: '#E6F0F9', 
                    border: '#BAE6FD', 
                    text: '#004797', 
                    label: 'Aprobado', 
                    icon: <CheckCircle2 size={14} style={{ color: '#004797' }} /> 
                };
            case 'received':
                return { 
                    bg: '#F0F7FF', 
                    border: '#E0F2FE', 
                    text: '#0284C7', 
                    label: 'En Revisión', 
                    icon: <Search size={14} style={{ color: '#0284C7' }} /> 
                };
            case 'processed':
                return { 
                    bg: '#F8FAFC', 
                    border: '#CBD5E1', 
                    text: '#002D62', 
                    label: 'Procesado', 
                    icon: <CheckCircle2 size={14} style={{ color: '#002D62' }} /> 
                };
            case 'rejected':
                return { 
                    bg: '#F8FAFC', 
                    border: '#E2E8F0', 
                    text: '#94A3B8', 
                    label: 'Rechazado', 
                    icon: <FileText size={14} style={{ color: '#94A3B8' }} /> 
                };
            default:
                return { 
                    bg: '#F8FAFC', 
                    border: '#E2E8F0', 
                    text: '#64748B', 
                    label: status, 
                    icon: <FileText size={14} style={{ color: '#004797' }} /> 
                };
        }
    };

    const getTypeStyle = (type) => {
        switch (type) {
            case 'return':
                return { 
                    bg: '#F8FAFC', 
                    border: '#E2E8F0', 
                    text: '#1E293B', 
                    label: 'Devolución', 
                    icon: <RefreshCw size={13} style={{ color: '#004797' }} /> 
                };
            case 'exchange':
                return { 
                    bg: '#E6F0F9', 
                    border: '#BAE6FD', 
                    text: '#004797', 
                    label: 'Cambio', 
                    icon: <Package size={13} style={{ color: '#004797' }} /> 
                };
            case 'warranty':
                return { 
                    bg: '#F0F7FF', 
                    border: '#E0F2FE', 
                    text: '#002D62', 
                    label: 'Garantía', 
                    icon: <ShieldCheck size={13} style={{ color: '#004797' }} /> 
                };
            default:
                return { 
                    bg: '#F8FAFC', 
                    border: '#E2E8F0', 
                    text: '#475569', 
                    label: type, 
                    icon: <FileText size={13} style={{ color: '#004797' }} /> 
                };
        }
    };

    const totalCount = rmas?.total ?? rmas?.data?.length ?? 0;

    return (
        <AdminLayout user={auth.user}>
            <Head title="Garantías y Cambios (RMA)" />

            <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '32px' }}>
                {/* Header Superior */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', margin: 0, fontWeight: 700, color: '#1E293B', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#E6F0F9', padding: '10px', borderRadius: '10px', color: '#004797', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ShieldCheck size={24} strokeWidth={2} />
                            </div>
                            Garantías y Cambios (RMA)
                        </h1>
                        <p style={{ margin: '6px 0 0', color: '#64748B', fontSize: '14px' }}>
                            Administra y audita las devoluciones, reemplazos y solicitudes de garantía.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={{
                            background: '#ffffff',
                            border: '1px solid #E2E8F0',
                            padding: '12px 20px',
                            borderRadius: '12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'all 0.2s ease'
                        }}>
                            <div style={{ background: '#E6F0F9', color: '#004797', padding: '8px', borderRadius: '8px', display: 'flex' }}>
                                <ShieldCheck size={18} strokeWidth={2} />
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Solicitudes Totales
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B', lineHeight: 1.1, marginTop: '2px' }}>
                                    {totalCount}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabla SaaS Premium */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden'
                }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                    <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID Ticket</th>
                                    <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cliente / Pedido</th>
                                    <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo de Caso</th>
                                    <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Motivo Principal</th>
                                    <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                                    <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</th>
                                    <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rmas?.data?.length > 0 ? rmas.data.map(rma => {
                                    const statusStyle = getStatusStyle(rma.status);
                                    const typeStyle = getTypeStyle(rma.type);
                                    
                                    return (
                                        <tr 
                                            key={rma.id} 
                                            style={{ borderBottom: '1px solid #E2E8F0', transition: 'background-color 0.2s ease' }} 
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'} 
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <td style={{ padding: '18px 24px', fontWeight: 700, color: '#004797', fontSize: '14px' }}>
                                                #{rma.id.toString().padStart(6, '0')}
                                            </td>
                                            <td style={{ padding: '18px 24px' }}>
                                                <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '14px', marginBottom: '4px' }}>
                                                    {rma.usuario ? `${rma.usuario.nombres} ${rma.usuario.apellidos}` : 'Cliente Registrado'}
                                                </div>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '3px 8px', borderRadius: '6px', color: '#475569', fontSize: '12px', fontWeight: 500 }}>
                                                    <Package size={13} style={{ color: '#004797' }} />
                                                    Pedido #{rma.pedido?.codigo || rma.pedido_id}
                                                </div>
                                            </td>
                                            <td style={{ padding: '18px 24px' }}>
                                                <span style={{ 
                                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                    background: typeStyle.bg, color: typeStyle.text, border: `1px solid ${typeStyle.border}`,
                                                    padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 
                                                }}>
                                                    {typeStyle.icon} {typeStyle.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '18px 24px', color: '#475569', fontSize: '13px', maxWidth: '280px' }}>
                                                <div style={{ fontWeight: 500, color: '#1E293B' }}>{rma.reason}</div>
                                                <div style={{ color: '#64748B', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                                                    {rma.description}
                                                </div>
                                            </td>
                                            <td style={{ padding: '18px 24px' }}>
                                                <span style={{ 
                                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                    background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}`,
                                                    padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600
                                                }}>
                                                    {statusStyle.icon} {statusStyle.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '18px 24px', color: '#64748B', fontSize: '13px', whiteSpace: 'nowrap' }}>
                                                {new Date(rma.created_at).toLocaleDateString('es-PE', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </td>
                                            <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                                                <Link 
                                                    href={`/admin/rma/${rma.id}`} 
                                                    style={{ 
                                                        display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', 
                                                        background: '#ffffff', color: '#004797', borderRadius: '8px', textDecoration: 'none', 
                                                        fontWeight: 600, fontSize: '13px', transition: 'all 0.2s ease', border: '1px solid #E2E8F0'
                                                    }}
                                                    onMouseEnter={e => { 
                                                        e.currentTarget.style.backgroundColor = '#E6F0F9'; 
                                                        e.currentTarget.style.borderColor = '#004797'; 
                                                        e.currentTarget.style.transform = 'translateY(-1px)'; 
                                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 71, 151, 0.1)'; 
                                                    }}
                                                    onMouseLeave={e => { 
                                                        e.currentTarget.style.backgroundColor = '#ffffff'; 
                                                        e.currentTarget.style.borderColor = '#E2E8F0'; 
                                                        e.currentTarget.style.transform = 'none'; 
                                                        e.currentTarget.style.boxShadow = 'none'; 
                                                    }}
                                                >
                                                    Revisar <ChevronRight size={14} />
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="7" style={{ padding: '64px 32px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                                                <div style={{ width: '64px', height: '64px', borderRadius: '12px', backgroundColor: '#E6F0F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#004797' }}>
                                                    <ShieldCheck size={32} strokeWidth={1.75} />
                                                </div>
                                                <h3 style={{ margin: 0, color: '#1E293B', fontSize: '16px', fontWeight: 600 }}>Sin solicitudes activas</h3>
                                                <p style={{ margin: 0, color: '#64748B', fontSize: '14px', maxWidth: '360px', lineHeight: '1.4' }}>
                                                    No hay solicitudes de garantía, cambios o devoluciones pendientes de resolución en este momento.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Paginación */}
                {rmas?.links && rmas.links.length > 3 && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px', gap: '6px' }}>
                        {rmas.links.map((link, i) => (
                            <Link 
                                key={i} 
                                href={link.url || '#'} 
                                onMouseEnter={(e) => { if(link.url && !link.active) { e.currentTarget.style.backgroundColor = '#E6F0F9'; e.currentTarget.style.color = '#004797'; } }}
                                onMouseLeave={(e) => { if(link.url && !link.active) { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#64748B'; } }}
                                style={{ 
                                    padding: '8px 16px', 
                                    background: link.active ? '#004797' : '#ffffff', 
                                    color: link.active ? '#ffffff' : '#64748B', 
                                    border: `1px solid ${link.active ? '#004797' : '#E2E8F0'}`,
                                    borderRadius: '8px', 
                                    textDecoration: 'none',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    opacity: link.url ? 1 : 0.5,
                                    pointerEvents: link.url ? 'auto' : 'none',
                                    transition: 'all 0.2s ease',
                                    boxShadow: link.active ? '0 2px 4px rgba(0, 71, 151, 0.2)' : 'none'
                                }}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
