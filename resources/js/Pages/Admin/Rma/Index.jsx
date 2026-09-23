import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ShieldAlert, Package, CheckCircle, Clock, Search, XCircle } from 'lucide-react';


export default function RmaIndex({ rmas }) {
    const { auth } = usePage().props;

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending': return { bg: '#fef3c7', text: '#d97706', label: 'Pendiente' };
            case 'approved': return { bg: '#dcfce7', text: '#16a34a', label: 'Aprobado' };
            case 'received': return { bg: '#dbeafe', text: '#2563eb', label: 'En Revisión' };
            case 'processed': return { bg: '#f3e8ff', text: '#9333ea', label: 'Procesado' };
            case 'rejected': return { bg: '#fee2e2', text: '#dc2626', label: 'Rechazado' };
            default: return { bg: '#f1f5f9', text: '#64748b', label: status };
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'return': return 'Devolución';
            case 'exchange': return 'Cambio';
            case 'warranty': return 'Garantía';
            default: return type;
        }
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title="Gestión de Garantías y Devoluciones (RMA)" />

            <div className="efe-admin-container" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldAlert size={28} color="#e11d48" /> Garantías y Devoluciones (RMA)
                    </h1>
                </div>

                <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>
                                    <th style={{ padding: '16px', fontWeight: '600' }}>RMA ID</th>
                                    <th style={{ padding: '16px', fontWeight: '600' }}>Cliente</th>
                                    <th style={{ padding: '16px', fontWeight: '600' }}>Tipo</th>
                                    <th style={{ padding: '16px', fontWeight: '600' }}>Estado</th>
                                    <th style={{ padding: '16px', fontWeight: '600' }}>Fecha</th>
                                    <th style={{ padding: '16px', fontWeight: '600', textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rmas.data.length > 0 ? rmas.data.map(rma => (
                                    <tr key={rma.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                                            #{rma.id.toString().padStart(6, '0')}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontWeight: '500', color: '#333' }}>{rma.usuario?.nombres} {rma.usuario?.apellidos}</div>
                                            <div style={{ color: '#64748b', fontSize: '13px' }}>Pedido #{rma.pedido_id}</div>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', color: '#475569', fontWeight: '500' }}>
                                                {getTypeLabel(rma.type)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <span style={{ 
                                                background: getStatusStyle(rma.status).bg, 
                                                color: getStatusStyle(rma.status).text,
                                                padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'
                                            }}>
                                                {getStatusStyle(rma.status).label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', color: '#64748b', fontSize: '13px' }}>
                                            {new Date(rma.created_at).toLocaleDateString('es-PE')}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            <Link href={`/admin/rma/${rma.id}`} style={{ display: 'inline-block', padding: '6px 12px', background: '#eff6ff', color: '#3b82f6', borderRadius: '6px', textDecoration: 'none', fontWeight: '500', fontSize: '13px' }}>
                                                Gestionar
                                            </Link>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                            <Package size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                            <p style={{ margin: 0 }}>No hay solicitudes de RMA en este momento.</p>
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
