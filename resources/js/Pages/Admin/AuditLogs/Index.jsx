import React from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FileText, Shield, User, Clock, Activity, History, ChevronLeft, ChevronRight, Search, Laptop, Fingerprint } from 'lucide-react';

export default function Index({ audits }) {
    const { auth } = usePage().props;

    const renderActionBadge = (event) => {
        const colors = {
            created: { bg: '#ECFDF5', text: '#059669', icon: '+' },
            updated: { bg: '#F0F9FF', text: '#0284C7', icon: '✎' },
            deleted: { bg: '#FEF2F2', text: '#DC2626', icon: '×' },
            restored: { bg: '#FFFBEB', text: '#D97706', icon: '↺' },
        };
        const color = colors[event] || { bg: '#F8FAFC', text: '#475569', icon: '•' };

        return (
            <span style={{ 
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800,
                background: color.bg, color: color.text, textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
                <span>{color.icon}</span> {event}
            </span>
        );
    };

    return (
        <AdminLayout user={auth.user} logoUrl={null}>
            <Head title="Registro de Auditoría" />

            <div style={{ fontFamily: "'Inter', sans-serif", padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
                
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', margin: '0 0 8px 0', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#E0F2FE', padding: '10px', borderRadius: '12px', color: '#00B4FF', display: 'flex' }}>
                                <History size={24} />
                            </div>
                            Registro de Auditoría
                        </h1>
                        <p style={{ margin: 0, color: '#64748B', fontSize: '15px' }}>
                            Monitoreo en tiempo real de todas las acciones de seguridad y cambios en el sistema.
                        </p>
                    </div>
                </div>

                {/* Table Area */}
                <div style={{ background: '#ffffff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Usuario Responsable</th>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Evento</th>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Módulo Afectado</th>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dispositivo / IP</th>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Fecha y Hora</th>
                                </tr>
                            </thead>
                            <tbody>
                                {audits.data.length > 0 ? audits.data.map(audit => (
                                    <tr key={audit.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                        
                                        {/* Usuario */}
                                        <td style={{ padding: '20px 32px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: audit.user ? '#F0F9FF' : '#F1F5F9', color: audit.user ? '#00B4FF' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    {audit.user ? <User size={18} /> : <Fingerprint size={18} />}
                                                </div>
                                                <div>
                                                    <span style={{ fontWeight: 800, color: '#1E293B', fontSize: '14px', display: 'block' }}>
                                                        {audit.user ? audit.user.nombres : 'Sistema / Invitado'}
                                                    </span>
                                                    <span style={{ fontSize: '12px', color: '#64748B' }}>
                                                        {audit.user ? audit.user.email : 'Acceso Anónimo'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Evento */}
                                        <td style={{ padding: '20px 32px' }}>
                                            {renderActionBadge(audit.event)}
                                        </td>

                                        {/* Modelo */}
                                        <td style={{ padding: '20px 32px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ background: '#F1F5F9', padding: '6px', borderRadius: '8px', color: '#64748B' }}>
                                                    <FileText size={16} />
                                                </div>
                                                <div>
                                                    <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '14px', display: 'block' }}>
                                                        {audit.auditable_type.split('\\').pop()}
                                                    </span>
                                                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                                                        ID: #{audit.auditable_id}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* IP / Agent */}
                                        <td style={{ padding: '20px 32px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ color: '#94A3B8' }}>
                                                    <Laptop size={16} />
                                                </div>
                                                <div style={{ maxWidth: '220px' }}>
                                                    <div style={{ fontWeight: 700, color: '#475569', fontSize: '13px' }}>
                                                        {audit.ip_address}
                                                    </div>
                                                    <div style={{ color: '#94A3B8', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={audit.user_agent}>
                                                        {audit.user_agent}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Fecha */}
                                        <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                                            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                <span style={{ fontWeight: 700, color: '#1E293B', fontSize: '14px' }}>
                                                    {new Date(audit.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                                <span style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Clock size={12} />
                                                    {new Date(audit.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '80px 40px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1' }}>
                                                    <Activity size={40} />
                                                </div>
                                                <h3 style={{ margin: 0, color: '#1E293B', fontSize: '18px', fontWeight: 700 }}>Auditoría Limpia</h3>
                                                <p style={{ margin: 0, color: '#64748B', fontSize: '15px', maxWidth: '400px', lineHeight: '1.5' }}>
                                                    No hay registros de auditoría disponibles en este momento.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {audits.last_page > 1 && (
                        <div style={{ padding: '16px 32px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>
                                Mostrando <strong style={{ color: '#1E293B' }}>{audits.from}</strong> a <strong style={{ color: '#1E293B' }}>{audits.to}</strong> de <strong style={{ color: '#1E293B' }}>{audits.total}</strong> registros
                            </span>
                            
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {audits.prev_page_url ? (
                                    <Link href={audits.prev_page_url} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '10px', background: '#ffffff', border: '1px solid #E2E8F0', color: '#475569', transition: 'all 0.2s', textDecoration: 'none' }} onMouseOver={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#1E293B'; }} onMouseOut={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#475569'; }}>
                                        <ChevronLeft size={18} />
                                    </Link>
                                ) : (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '10px', background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#CBD5E1', cursor: 'not-allowed' }}>
                                        <ChevronLeft size={18} />
                                    </div>
                                )}
                                
                                {audits.next_page_url ? (
                                    <Link href={audits.next_page_url} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '10px', background: '#ffffff', border: '1px solid #E2E8F0', color: '#475569', transition: 'all 0.2s', textDecoration: 'none' }} onMouseOver={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#1E293B'; }} onMouseOut={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#475569'; }}>
                                        <ChevronRight size={18} />
                                    </Link>
                                ) : (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '10px', background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#CBD5E1', cursor: 'not-allowed' }}>
                                        <ChevronRight size={18} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
