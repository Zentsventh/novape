import { useEffect, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import Header from '../Components/Home/Header';
import Footer from '../Components/Home/Footer';
import CartDrawer from '../Components/Home/CartDrawer';
import Toast from '../Components/Home/Toast';

import '../../css/home/base.css';
import '../../css/home/header.css';
import '../../css/home/info-pages.css';
import '../../css/home/cart-drawer.css';
import '../../css/home/footer.css';

const formatPrice = (price) =>
    new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);

export default function Seguimiento({ codigo = '', pedido = null, error = null, logoUrl }) {
    const { cart, flash } = usePage().props;
    const [trackingCode, setTrackingCode] = useState(codigo || '');
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        const handleOpenCart = () => setIsCartOpen(true);
        window.addEventListener('open-cart', handleOpenCart);
        return () => window.removeEventListener('open-cart', handleOpenCart);
    }, []);

    const handleSubmit = (event) => {
        event.preventDefault();
        const value = trackingCode.trim();
        router.get('/seguimiento', value ? { codigo: value } : {}, { preserveState: true, preserveScroll: true });
    };

    return (
        <div className="efe-home">
            <Head title="Seguimiento de pedido" />

            <Toast message={flash?.success} type="success" />
            <Toast message={flash?.error} type="error" />

            <Header
                minimal={false}
                cartCount={cart?.count || 0}
                onOpenCart={() => setIsCartOpen(true)}
                logoUrl={logoUrl}
            />

            <main className="info-page" style={{ padding: 0, minHeight: 'auto' }}>
                <div className="seguimiento-banner">
                    <div className="seguimiento-icon-wrap">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="3" width="15" height="13"></rect>
                            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                            <circle cx="5.5" cy="18.5" r="2.5"></circle>
                            <circle cx="18.5" cy="18.5" r="2.5"></circle>
                        </svg>
                    </div>
                    <h1 className="seguimiento-title">Sigue tu pedido</h1>
                    <p className="seguimiento-subtitle">Ingresa el código de tu pedido para consultar su estado.</p>
                    
                    <form className="seguimiento-form-inline" onSubmit={handleSubmit}>
                        <input
                            id="codigo"
                            type="text"
                            value={trackingCode}
                            onChange={(event) => setTrackingCode(event.target.value)}
                            placeholder="Código de pedido"
                            className="seguimiento-input-inline"
                        />
                        <button type="submit" className="seguimiento-btn-inline">Buscar</button>
                    </form>
                    
                    {error && <div className="seguimiento-error" style={{ marginTop: '20px' }}>{error}</div>}
                </div>

                {pedido && (
                    <div className="info-container" style={{ padding: '40px 16px' }}>
                        <div className="info-card">
                            <div className="seguimiento-result">
                                <div className="seguimiento-row">
                                    <span className="seguimiento-key">Codigo</span>
                                    <span className="seguimiento-value">{pedido.codigo}</span>
                                </div>
                                <div className="seguimiento-row">
                                    <span className="seguimiento-key">Estado</span>
                                    <span className="seguimiento-value">{pedido.estado}</span>
                                </div>
                                <div className="seguimiento-row">
                                    <span className="seguimiento-key">Total</span>
                                    <span className="seguimiento-value">S/ {formatPrice(pedido.total)}</span>
                                </div>
                                {pedido.fecha && (
                                    <div className="seguimiento-row">
                                        <span className="seguimiento-key">Fecha</span>
                                        <span className="seguimiento-value">{new Date(pedido.fecha).toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="seguimiento-row">
                                    <span className="seguimiento-key">Envio</span>
                                    <span className="seguimiento-value">{pedido.envio?.estado || 'Pendiente'}</span>
                                </div>
                                {pedido.envio?.tracking && (
                                    <div className="seguimiento-row">
                                        <span className="seguimiento-key">Tracking</span>
                                        <span className="seguimiento-value">{pedido.envio.tracking}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <Footer />

            <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart}
            />
        </div>
    );
}
