import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import '../../css/home/base.css';
import '../../css/home/checkout.css';

const formatPrice = (price) =>
    new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
        price
    );

export default function Cart() {
    const { cart, globalConfig } = usePage().props;
    const items = cart.items || [];

    const handleUpdate = (productoId, currentQty, amount) => {
        const newQty = currentQty + amount;
        if (newQty < 1 || newQty > 5) return;
        router.post('/cart/update', { producto_id: productoId, cantidad: newQty }, { preserveScroll: true });
    };

    const handleRemove = (productoId) => {
        router.post('/cart/remove', { producto_id: productoId }, { preserveScroll: true });
    };

    return (
        <div className="efe-checkout-page" style={{ paddingBottom: '40px', background: '#F8FAFC' }}>
            <Head title="Carrito de Compras | NovaPe" />

            {/* HEADER EXACTLY LIKE REFERENCE */}
            <header style={{ background: '#fff', borderBottom: '1px solid #E8ECF0', padding: '16px 0', position: 'sticky', top: 0, zIndex: 50 }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', position: 'relative' }}>
                    
                    {/* LOGO */}
                    <Link href="/" style={{ textDecoration: 'none', position: 'relative', zIndex: 2 }}>
                        {globalConfig?.logo_url ? (
                            <img src={globalConfig.logo_url} alt="NovaPe" style={{ height: '40px' }} />
                        ) : (
                            <div style={{ background: '#004797', color: '#fff', padding: '8px 16px', borderRadius: '50px', fontWeight: '800', fontSize: '20px', letterSpacing: '-0.5px' }}>
                                NovaPe<span style={{ color: '#E0F7FF' }}>.</span>
                            </div>
                        )}
                    </Link>

                    {/* Stepper Center (Absolute to ensure perfect centering) */}
                    <div style={{ position: 'absolute', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 1 }}>
                        <div style={{ position: 'relative', width: '380px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: '4px' }}>
                            
                            {/* Dotted line behind circles */}
                            <div style={{ position: 'absolute', top: '12px', left: '20px', right: '20px', borderBottom: '2px dotted #004797', zIndex: -1 }}></div>

                            {/* Carrito (Activo en esta página) */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: '#fff', padding: '0 10px' }}>
                                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #004797', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#004797' }}></div>
                                </div>
                                <span style={{ fontSize: '13px', color: '#004797', fontWeight: '500' }}>Carrito</span>
                            </div>

                            {/* Entrega (Inactivo) */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: '#fff', padding: '0 10px' }}>
                                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                                </div>
                                <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '400' }}>Entrega</span>
                            </div>

                            {/* Pago (Inactivo) */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: '#fff', padding: '0 10px' }}>
                                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                                </div>
                                <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '400' }}>Pago</span>
                            </div>

                        </div>
                    </div>

                </div>
            </header>

            <div className="efe-checkout-container" style={{ marginTop: '32px' }}>
                <div className="efe-checkout-main" style={{ gap: '20px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0F172A', margin: '0 0 16px 0', letterSpacing: '-0.5px' }}>
                        Carrito de compras
                    </h1>

                    {/* Banner Promocional */}
                    <div style={{ background: '#E0F7FF', border: '1px solid #BAE6FD', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '28px', height: '28px', background: '#fff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            🎁
                        </div>
                        <span style={{ color: '#0369A1', fontSize: '14px', fontWeight: '500' }}>
                            ¡Tu pedido aplica para una promoción especial! Conócela aquí
                        </span>
                    </div>

                    {/* Lista de Productos */}
                    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E8ECF0', overflow: 'hidden' }}>
                        {items.length === 0 ? (
                            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
                                <h3 style={{ fontSize: '18px', color: '#0F172A', marginBottom: '8px' }}>Tu carrito está vacío</h3>
                                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>¡Explora nuestro catálogo y descubre productos increíbles!</p>
                                <Link href="/catalogo" className="efe-btn-primary" style={{ textDecoration: 'none' }}>
                                    Ir a comprar
                                </Link>
                            </div>
                        ) : (
                            items.map((item, index) => (
                                <div key={item.id} style={{ display: 'flex', padding: '24px', borderBottom: index < items.length - 1 ? '1px solid #E8ECF0' : 'none', gap: '20px', alignItems: 'center' }}>
                                    {/* Imagen */}
                                    <div style={{ width: '80px', height: '80px', flexShrink: 0 }}>
                                        <img src={item.imagen} alt={item.nombre} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    </div>
                                    
                                    {/* Info */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: '#64748B', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>
                                            {item.marca || 'NovaPe'}
                                        </div>
                                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#0F172A', marginBottom: '4px', lineHeight: '1.4' }}>
                                            {item.nombre}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>
                                            SKU: {item.codigo || item.id}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '12px' }}>
                                            Vendido por <strong>NovaPe</strong>
                                        </div>
                                        
                                        {/* Badges */}
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0369A1', fontSize: '12px', fontWeight: '500' }}>
                                                <div style={{ width: '24px', height: '24px', background: '#E0F7FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                                                </div>
                                                Disponible envío a domicilio
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0369A1', fontSize: '12px', fontWeight: '500' }}>
                                                <div style={{ width: '24px', height: '24px', background: '#E0F7FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                                                </div>
                                                Disponible retiro en tienda
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Precio y Controles */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                S/ {formatPrice(item.precio)}
                                                {item.precio_original > item.precio && (
                                                    <span style={{ fontSize: '12px', background: '#FEF2F2', color: '#EF4444', padding: '2px 6px', borderRadius: '4px' }}>Oferta</span>
                                                )}
                                            </div>
                                            {item.precio_original > item.precio && (
                                                <div style={{ fontSize: '13px', color: '#94A3B8', textDecoration: 'line-through', marginTop: '2px' }}>
                                                    S/ {formatPrice(item.precio_original)}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #004797', borderRadius: '8px', height: '36px' }}>
                                                <button onClick={() => handleUpdate(item.id, item.cantidad, -1)} style={{ width: '32px', height: '100%', background: 'transparent', border: 'none', color: '#004797', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                                                <span style={{ width: '32px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: '#0F172A' }}>{item.cantidad}</span>
                                                <button onClick={() => handleUpdate(item.id, item.cantidad, 1)} style={{ width: '32px', height: '100%', background: 'transparent', border: 'none', color: '#004797', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                            </div>
                                            <button onClick={() => handleRemove(item.id)} style={{ background: 'transparent', border: 'none', color: '#004797', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', borderRadius: '6px' }} onMouseOver={(e) => e.currentTarget.style.background = '#E0F7FF'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* SIDEBAR */}
                {items.length > 0 && (
                    <div className="efe-checkout-sidebar" style={{ width: '380px' }}>
                        <div style={{ background: '#E0F7FF', padding: '20px 24px', borderBottom: '1px solid #BAE6FD' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px' }}>Resumen de pedido</h2>
                            <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>{cart.count} Productos</p>
                        </div>
                        
                        <div style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px', color: '#64748B' }}>
                                <span>Subtotal</span>
                                <span style={{ color: '#0369A1', fontWeight: '600' }}>S/ {formatPrice(cart.total)}</span>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #E8ECF0', fontSize: '15px', fontWeight: '700', color: '#0F172A', alignItems: 'center' }}>
                                <span>Total Pedido</span>
                                <span style={{ color: '#004797', fontSize: '22px' }}>S/ {formatPrice(cart.total)}</span>
                            </div>

                            <Link href="/checkout" style={{ display: 'block', textDecoration: 'none', marginTop: '24px' }}>
                                <button className="efe-btn-primary" style={{ width: '100%', padding: '16px', fontSize: '16px', justifyContent: 'space-between' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>Siguiente</span>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                </button>
                            </Link>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '24px', color: '#004797', fontSize: '14px', fontWeight: '600' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                                <Link href="/catalogo" style={{ color: '#004797', textDecoration: 'none' }}>
                                    Añadir más productos
                                </Link>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '16px', color: '#94A3B8', fontSize: '12px' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                                Si tienes un cupón ¡agrégalo en el paso pago!
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
