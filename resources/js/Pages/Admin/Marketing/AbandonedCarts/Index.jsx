import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '../../../../Layouts/AdminLayout';
import { ShoppingCart, Mail, Clock, User, CheckCircle } from 'lucide-react';

export default function Index({ carts }) {
    const { configuraciones, flash } = usePage().props;
    const { post, processing } = useForm();

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
    };

    const handleNotify = (cartId) => {
        if (confirm('¿Enviar notificación de recuperación al cliente?')) {
            post(`/admin/abandoned-carts/${cartId}/notify`);
        }
    };

    return (
        <AdminLayout logoUrl={configuraciones?.logo_url}>
            <Head title="Carritos Abandonados" />
            
            <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShoppingCart /> Carritos Abandonados
                    </h1>
                </div>

                {flash?.success && (
                    <div style={{ padding: '16px', background: '#DCFCE7', color: '#16A34A', borderRadius: '8px', marginBottom: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle size={20} /> {flash.success}
                    </div>
                )}

                <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <tr>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#64748B' }}>Cliente</th>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#64748B' }}>Total</th>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#64748B' }}>Última Actividad</th>
                                <th style={{ padding: '16px', textAlign: 'center', color: '#64748B' }}>Estado</th>
                                <th style={{ padding: '16px', textAlign: 'right', color: '#64748B' }}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {carts.data.map(cart => {
                                const total = cart.items.reduce((sum, item) => sum + (item.variante?.producto?.precio || 0) * item.cantidad, 0);
                                
                                return (
                                    <tr key={cart.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <User size={16} color="#64748B" /> {cart.usuario?.nombres} {cart.usuario?.apellidos}
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>{cart.usuario?.email}</div>
                                            {cart.usuario?.telefono && <div style={{ fontSize: '13px', color: '#64748B' }}>{cart.usuario?.telefono}</div>}
                                        </td>
                                        <td style={{ padding: '16px', fontWeight: 'bold', color: '#0F172A' }}>
                                            {formatMoney(total)}
                                        </td>
                                        <td style={{ padding: '16px', color: '#64748B' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Clock size={14} /> {new Date(cart.updated_at).toLocaleString('es-PE')}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            {cart.notified_at ? (
                                                <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#DBEAFE', color: '#1D4ED8', fontSize: '12px', fontWeight: 'bold' }}>
                                                    Notificado ({new Date(cart.notified_at).toLocaleDateString()})
                                                </span>
                                            ) : (
                                                <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#FEF3C7', color: '#D97706', fontSize: '12px', fontWeight: 'bold' }}>
                                                    Sin notificar
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            <button 
                                                onClick={() => handleNotify(cart.id)}
                                                disabled={processing}
                                                style={{ background: '#004797', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold' }}
                                            >
                                                <Mail size={16} /> Notificar
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {carts.data.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>
                                        No hay carritos abandonados recientes.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
