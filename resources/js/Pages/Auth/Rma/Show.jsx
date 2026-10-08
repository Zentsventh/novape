import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import Header from '../../../Components/Home/Header';
import Footer from '../../../Components/Home/Footer';
import CategoryNavBar from '../../../Components/Home/CategoryNavBar';
import CartDrawer from '../../../Components/Home/CartDrawer';
import { ArrowLeft, Package, Clock, ShieldAlert, FileText, CheckCircle, XCircle } from 'lucide-react';
import '../../../../css/home/base.css';

export default function RmaShow({ rma, categoriaProductos = [] }) {
    const { auth, cart } = usePage().props;
    const [isCartOpen, setIsCartOpen] = useState(false);

    const getStatusInfo = (status) => {
        switch (status) {
            case 'pending': return { bg: '#fef3c7', text: '#d97706', label: 'Pendiente', icon: Clock };
            case 'approved': return { bg: '#dcfce7', text: '#16a34a', label: 'Aprobado', icon: CheckCircle };
            case 'received': return { bg: '#dbeafe', text: '#2563eb', label: 'En Revisión Técnica', icon: Package };
            case 'processed': return { bg: '#f3e8ff', text: '#9333ea', label: 'Completado', icon: CheckCircle };
            case 'rejected': return { bg: '#fee2e2', text: '#dc2626', label: 'Rechazado', icon: XCircle };
            default: return { bg: '#f1f5f9', text: '#64748b', label: status, icon: Clock };
        }
    };

    const StatusIcon = getStatusInfo(rma.status).icon;

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexWrap: 'wrap', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
            <Head title={`RMA #${rma.id}`} />
            
            <Header onOpenCart={() => setIsCartOpen(true)} cartCount={cart?.count || 0} user={auth.user} />
            <CategoryNavBar categorias={categoriaProductos} />
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cart={cart} />

            <main style={{ flex: 1, padding: '40px 20px', maxWidth: '900px', width: '100%', margin: '0 auto' }}>
                <Link href="/perfil/devoluciones" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontWeight: '500', marginBottom: '24px' }}>
                    <ArrowLeft size={18} /> Volver a mis Solicitudes
                </Link>

                <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', padding: 'clamp(0.75rem, 3vw, 2rem)' }}>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '24px', marginBottom: '24px' }}>
                        <div>
                            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 8px 0' }}>
                                Solicitud de RMA #{rma.id.toString().padStart(6, '0')}
                            </h1>
                            <div style={{ color: '#64748b', fontSize: '15px' }}>
                                Creado el {new Date(rma.created_at).toLocaleString('es-PE')}
                            </div>
                        </div>
                        <div style={{ 
                            display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px',
                            background: getStatusInfo(rma.status).bg, 
                            color: getStatusInfo(rma.status).text,
                            padding: '8px 16px', borderRadius: '24px', fontWeight: '600'
                        }}>
                            <StatusIcon size={20} />
                            {getStatusInfo(rma.status).label}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 16rem), 1fr))', gap: '24px', marginBottom: '32px' }}>
                        <div>
                            <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', marginBottom: '12px' }}>Detalles de la Solicitud</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <span style={{ color: '#64748b', fontSize: '14px', display: 'block', marginBottom: '4px' }}>Tipo</span>
                                    <span style={{ fontWeight: '500', color: '#0f172a' }}>
                                        {rma.type === 'return' ? 'Devolución' : rma.type === 'exchange' ? 'Cambio' : 'Garantía'}
                                    </span>
                                </div>
                                <div>
                                    <span style={{ color: '#64748b', fontSize: '14px', display: 'block', marginBottom: '4px' }}>Motivo</span>
                                    <span style={{ fontWeight: '500', color: '#0f172a' }}>
                                        {rma.reason === 'defective' ? 'Producto Defectuoso' : rma.reason === 'wrong_item' ? 'Artículo Equivocado' : rma.reason === 'changed_mind' ? 'Cambio de Opinión' : 'Otro'}
                                    </span>
                                </div>
                                <div>
                                    <span style={{ color: '#64748b', fontSize: '14px', display: 'block', marginBottom: '4px' }}>Pedido Relacionado</span>
                                    <Link href={`/perfil`} style={{ fontWeight: '600', color: '#3b82f6', textDecoration: 'none' }}>
                                        Ver Pedido #{rma.pedido_id}
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', marginBottom: '12px' }}>Producto Afectado</h3>
                            {rma.producto ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                                    {rma.producto.imagenes && rma.producto.imagenes[0] ? (
                                        <img src={`/storage/${rma.producto.imagenes[0]}`} alt={rma.producto.nombre} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                                    ) : (
                                        <div style={{ width: '60px', height: '60px', background: '#e2e8f0', borderRadius: '8px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                                            <Package size={24} color="#94a3b8" />
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>{rma.producto.nombre}</div>
                                        <div style={{ color: '#64748b', fontSize: '13px' }}>SKU: {rma.producto.sku}</div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', color: '#475569' }}>
                                    Aplica a todo el pedido
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', marginBottom: '12px' }}>Descripción del Problema</h3>
                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', color: '#334155', lineHeight: '1.6' }}>
                            {rma.description || 'No se proporcionó descripción detallada.'}
                        </div>
                    </div>

                    {rma.images && rma.images.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', marginBottom: '12px' }}>Imágenes Adjuntas</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                                {rma.images.map((img, i) => (
                                    <a key={i} href={img} target="_blank" rel="noreferrer" style={{ display: 'block', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                        <img src={img} alt={`Evidencia ${i+1}`} style={{ width: '120px', height: '120px', objectFit: 'cover' }} />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {rma.admin_notes && (
                        <div style={{ marginTop: '32px', background: '#fffbeb', border: '1px solid #fde68a', padding: '20px', borderRadius: '12px' }}>
                            <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#d97706', fontWeight: '700', marginBottom: '8px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                                <FileText size={16} /> Respuesta de Soporte Técnico
                            </h3>
                            <div style={{ color: '#92400e', lineHeight: '1.6' }}>
                                {rma.admin_notes}
                            </div>
                        </div>
                    )}
                    
                </div>
            </main>
            <Footer />
        </div>
    );
}
