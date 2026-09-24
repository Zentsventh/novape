import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import Header from '../../Components/Home/Header';
import Footer from '../../Components/Home/Footer';
import '../../../css/home/base.css';
import '../../../css/home/header.css';
import '../../../css/home/footer.css';

export default function OrderDetails({ pedido }) {
    const { auth } = usePage().props;
    const [downloading, setDownloading] = useState(false);

    if (!pedido) {
        return (
            <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                <Head title="Pedido no encontrado" />
                <Header />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', color: '#64748b' }}>
                        <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Pedido no encontrado</h2>
                        <Link href="/perfil?tab=compras" style={{ color: '#00B4FF', textDecoration: 'none', fontWeight: '600' }}>← Volver a Mis Compras</Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const items = pedido.items || [];
    const formatCurrency = (val) => 'S/ ' + new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2 }).format(val || 0);

    const estadoColor = {
        'Pendiente': { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' },
        'Pagado': { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
        'Procesando': { bg: '#e0e7ff', text: '#3730a3', border: '#6366f1' },
        'Enviado': { bg: '#cffafe', text: '#0e7490', border: '#06b6d4' },
        'Completado': { bg: '#dcfce7', text: '#166534', border: '#22c55e' },
        'Cancelado': { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
    };

    const colors = estadoColor[pedido.estado] || estadoColor['Pendiente'];

    const subtotal = items.reduce((acc, item) => acc + (item.precio_unitario * item.cantidad), 0);
    const envio = pedido.costo_envio || 0;
    const descuento = pedido.descuento || 0;
    const total = pedido.total || subtotal + envio - descuento;

    const dirEnvio = typeof pedido.direccion_envio_snapshot === 'string'
        ? JSON.parse(pedido.direccion_envio_snapshot || '{}')
        : (pedido.direccion_envio_snapshot || {});

    const handleDescargar = () => {
        setDownloading(true);
        window.open(`/factura/ecommerce/${pedido.id}/descargar`, '_blank');
        setTimeout(() => setDownloading(false), 3000);
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
            <Head title={`Pedido ${pedido.codigo}`} />
            <Header />

            <div style={{ flex: 1, maxWidth: '1100px', margin: '30px auto', padding: '0 20px', width: '100%' }}>
                {/* Breadcrumb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#94a3b8', marginBottom: '25px' }}>
                    <Link href="/perfil" style={{ color: '#94a3b8', textDecoration: 'none' }}>Mi cuenta</Link>
                    <span>›</span>
                    <Link href="/perfil?tab=compras" style={{ color: '#94a3b8', textDecoration: 'none' }}>Mis compras</Link>
                    <span>›</span>
                    <span style={{ color: '#333', fontWeight: '500' }}>{pedido.codigo}</span>
                </div>

                {/* Header con estado */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '12px' }}>
                                <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#1e293b', margin: 0 }}>Pedido {pedido.codigo}</h1>
                                <span style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                                    {pedido.estado}
                                </span>
                            </div>
                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                                Realizado el {new Date(pedido.created_at).toLocaleString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={handleDescargar} disabled={downloading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: '#00B4FF', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: downloading ? 'wait' : 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,180,255,0.3)' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                {downloading ? 'Generando...' : 'Descargar Comprobante'}
                            </button>
                            <Link href={`/seguimiento?codigo=${pedido.codigo}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'white', color: '#00B4FF', border: '2px solid #00B4FF', borderRadius: '10px', fontSize: '14px', fontWeight: '600', textDecoration: 'none', transition: 'all 0.2s' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                Ver seguimiento
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', alignItems: 'start' }}>
                    {/* Left Column: Products */}
                    <div>
                        <div style={{ background: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00B4FF" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                                Artículos ({items.length})
                            </h2>

                            {items.map((item, idx) => {
                                const producto = item.variante?.producto;
                                const imagenUrl = producto?.imagenes?.[0]?.ruta || '/img/placeholder.jpg';
                                return (
                                    <div key={idx} style={{ display: 'flex', gap: '15px', padding: '15px 0', borderBottom: idx < items.length - 1 ? '1px solid #f1f5f9' : 'none', alignItems: 'center' }}>
                                        <div style={{ width: '75px', height: '75px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #f1f5f9', flexShrink: 0 }}>
                                            <img src={imagenUrl} alt={producto?.nombre || 'Producto'} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', marginBottom: '4px' }}>
                                                {producto?.nombre || 'Producto'}
                                            </div>
                                            {item.variante && (item.variante.talla || item.variante.color) && (
                                                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                                                    {item.variante.talla && `Talla: ${item.variante.talla}`}
                                                    {item.variante.talla && item.variante.color && ' | '}
                                                    {item.variante.color && `Color: ${item.variante.color}`}
                                                </div>
                                            )}
                                            <div style={{ fontSize: '12px', color: '#64748b' }}>Cantidad: {item.cantidad}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{formatCurrency(item.precio_unitario * item.cantidad)}</div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{formatCurrency(item.precio_unitario)} c/u</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Información de envío y facturación */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                            <div style={{ background: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00B4FF" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                    Dirección de envío
                                </h3>
                                {Object.keys(dirEnvio).length > 0 ? (
                                    <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.7' }}>
                                        <div style={{ fontWeight: '500', color: '#333' }}>{dirEnvio.direccion}</div>
                                        {dirEnvio.referencia && <div>Ref: {dirEnvio.referencia}</div>}
                                        <div>{dirEnvio.distrito}, {dirEnvio.provincia}</div>
                                        <div>{dirEnvio.departamento}</div>
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>Recojo en tienda</div>
                                )}
                            </div>

                            <div style={{ background: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00B4FF" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                                    Facturación
                                </h3>
                                <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.7' }}>
                                    <div style={{ fontWeight: '500', color: '#333' }}>{pedido.tipo_comprobante || 'Boleta'}</div>
                                    {pedido.nombre_facturacion && <div>{pedido.nombre_facturacion}</div>}
                                    {pedido.documento_cliente && <div>Doc: {pedido.documento_cliente}</div>}
                                    {pedido.direccion_facturacion && <div>{pedido.direccion_facturacion}</div>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Summary (Sticky) */}
                    <div style={{ position: 'sticky', top: '100px' }}>
                        <div style={{ background: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>Resumen del pedido</h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#64748b' }}>
                                    <span>Subtotal ({items.length} artículo{items.length > 1 ? 's' : ''})</span>
                                    <span style={{ fontWeight: '500', color: '#333' }}>{formatCurrency(subtotal)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#64748b' }}>
                                    <span>Envío</span>
                                    <span style={{ fontWeight: '500', color: envio > 0 ? '#333' : '#22c55e' }}>{envio > 0 ? formatCurrency(envio) : 'Gratis'}</span>
                                </div>
                                {descuento > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#e11d48' }}>
                                        <span>Descuento</span>
                                        <span style={{ fontWeight: '500' }}>-{formatCurrency(descuento)}</span>
                                    </div>
                                )}

                                <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '15px', marginTop: '5px', display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                                    <span>Total</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                            </div>

                            {/* Método de pago */}
                            <div style={{ background: '#f0f9ff', borderRadius: '10px', padding: '15px', marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '28px', background: '#e0f2fe', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: '600' }}>Pago con tarjeta (Niubiz)</div>
                                    <div style={{ fontSize: '11px', color: '#0284c7' }}>Pago verificado y seguro</div>
                                </div>
                            </div>
                        </div>

                        {/* Ayuda */}
                        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginTop: '15px', textAlign: 'center' }}>
                            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px' }}>¿Necesitas ayuda con este pedido?</div>
                            <Link href="/ayuda" style={{ color: '#00B4FF', fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>Contactar soporte →</Link>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
