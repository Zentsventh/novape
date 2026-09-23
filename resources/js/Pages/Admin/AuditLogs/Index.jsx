import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { FileText, Shield, User, Clock, Activity } from 'lucide-react';


export default function Index({ audits }) {
    const { auth } = usePage().props;

    const renderActionBadge = (event) => {
        const colors = {
            created: { bg: '#dcfce7', text: '#16a34a' },
            updated: { bg: '#dbeafe', text: '#2563eb' },
            deleted: { bg: '#fee2e2', text: '#dc2626' },
            restored: { bg: '#fef3c7', text: '#d97706' },
        };
        const color = colors[event] || { bg: '#f1f5f9', text: '#475569' };

        return (
            <span style={{ 
                padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500',
                background: color.bg, color: color.text, textTransform: 'uppercase'
            }}>
                {event}
            </span>
        );
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title="Audit Logs" />

            <div className="efe-admin-container" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Shield size={28} color="#3b82f6" /> Audit Trail (Logs de Seguridad)
                    </h1>
                </div>

                <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>
                                    <th style={{ padding: '16px', fontWeight: '600' }}>Usuario</th>
                                    <th style={{ padding: '16px', fontWeight: '600' }}>Evento</th>
                                    <th style={{ padding: '16px', fontWeight: '600' }}>Modelo</th>
                                    <th style={{ padding: '16px', fontWeight: '600' }}>IP / Agent</th>
                                    <th style={{ padding: '16px', fontWeight: '600' }}>Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {audits.data.length > 0 ? audits.data.map(audit => (
                                    <tr key={audit.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <User size={16} color="#64748b" />
                                                <span style={{ fontWeight: '500', color: '#333' }}>
                                                    {audit.user ? audit.user.nombres : 'Sistema / Invitado'}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            {renderActionBadge(audit.event)}
                                        </td>
                                        <td style={{ padding: '16px', color: '#475569', fontSize: '14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <FileText size={14} color="#94a3b8" />
                                                {audit.auditable_type.split('\\').pop()} (#{audit.auditable_id})
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', color: '#64748b', fontSize: '12px' }}>
                                            <div>{audit.ip_address}</div>
                                            <div style={{ opacity: 0.7, maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {audit.user_agent}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', color: '#64748b', fontSize: '13px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Clock size={14} />
                                                {new Date(audit.created_at).toLocaleString('es-PE')}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                            <Activity size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                            <p style={{ margin: 0 }}>No hay registros de auditoría disponibles.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Basic Pagination */}
                    {audits.last_page > 1 && (
                        <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <span style={{ fontSize: '13px', color: '#64748b' }}>
                                Mostrando {audits.from} a {audits.to} de {audits.total} resultados
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
