import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import Header from '../../../Components/Home/Header';
import Footer from '../../../Components/Home/Footer';
import CategoryNavBar from '../../../Components/Home/CategoryNavBar';
import CartDrawer from '../../../Components/Home/CartDrawer';
import Toast from '../../../Components/Home/Toast';
import { PackageX, ChevronRight, FileText, Settings, ShieldAlert, ArrowLeft } from 'lucide-react';
import '../../../../css/home/base.css';

export default function RmaIndex({ rmas, categoriaProductos = [] }) {
    const { auth, cart, flash } = usePage().props;
    const [isCartOpen, setIsCartOpen] = useState(false);

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return { bg: '#fef3c7', text: '#d97706', label: 'Pendiente' };
            case 'approved': return { bg: '#dcfce7', text: '#16a34a', label: 'Aprobado' };
            case 'received': return { bg: '#dbeafe', text: '#2563eb', label: 'En Revisión' };
            case 'processed': return { bg: '#f3e8ff', text: '#9333ea', label: 'Completado' };
            case 'rejected': return { bg: '#fee2e2', text: '#dc2626', label: 'Rechazado' };
            default: return { bg: '#f1f5f9', text: '#64748b', label: status };
        }
    };

    const getTypeLabel = (type) => {
        switch(type) {
            case 'return': return 'Devolución de Producto';
            case 'exchange': return 'Cambio de Producto';
            case 'warranty': return 'Reclamo de Garantía';
            default: return type;
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
            <Head title="Mis Devoluciones y Garantías" />
            
            <Header onCartClick={() => setIsCartOpen(true)} cartItemCount={cart?.items?.length || 0} user={auth.user} />
            <CategoryNavBar categories={categoriaProductos} />
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cart={cart} />
            <Toast message={flash?.success || flash?.error} type={flash?.error ? 'error' : 'success'} />

            <main style={{ flex: 1, padding: '40px 20px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
                    <Link href="/perfil" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontWeight: '500' }}>
                        <ArrowLeft size={18} /> Volver a mi Perfil
                    </Link>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                        <ShieldAlert size={32} color="#3b82f6" /> 
                        Mis Devoluciones y Garantías
                    </h1>
                    <Link href="/perfil" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 20px', borderRadius: '8px', background: '#3b82f6', color: 'white', fontWeight: '600' }}>
                        Solicitar Nueva (Desde Compras)
                    </Link>
                </div>

                <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', padding: '24px' }}>
                    {rmas.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                            <PackageX size={64} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
                            <h3 style={{ fontSize: '20px', color: '#334155', marginBottom: '8px' }}>No tienes solicitudes de RMA</h3>
                            <p style={{ color: '#64748b' }}>Aquí aparecerán tus solicitudes de devoluciones, cambios y garantías.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {rmas.map(rma => (
                                <div key={rma.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', transition: 'all 0.2s' }} className="hover:border-blue-300">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#0f172a' }}>
                                                RMA #{rma.id.toString().padStart(6, '0')}
                                            </span>
                                            <span style={{ 
                                                background: getStatusColor(rma.status).bg, 
                                                color: getStatusColor(rma.status).text,
                                                padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'
                                            }}>
                                                {getStatusColor(rma.status).label}
                                            </span>
                                            <span style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', color: '#475569', fontWeight: '500' }}>
                                                {getTypeLabel(rma.type)}
                                            </span>
                                        </div>
                                        <div style={{ color: '#64748b', fontSize: '14px', display: 'flex', gap: '16px' }}>
                                            <span>Pedido #{rma.pedido_id}</span>
                                            <span>•</span>
                                            <span>{new Date(rma.created_at).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                        </div>
                                    </div>
                                    <Link href={`/perfil/devoluciones/${rma.id}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', textDecoration: 'none', fontWeight: '600', padding: '8px 16px', borderRadius: '8px', background: '#eff6ff' }}>
                                        Ver Detalles <ChevronRight size={18} />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
