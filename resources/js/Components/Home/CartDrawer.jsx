import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import LoginModal from './LoginModal';
import { DEFAULT_IMAGE } from './constants';

const formatPrice = (price) =>
    new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
        price
    );

export default function CartDrawer({ cart, isOpen, onClose }) {
    const { auth, flash } = usePage().props;
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    const FREE_SHIPPING_THRESHOLD = 299;
    const currentTotal = cart?.total || 0;
    const amountLeftForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - currentTotal);
    const progressPercentage = Math.min(100, (currentTotal / FREE_SHIPPING_THRESHOLD) * 100);

    const handleUpdate = (productoId, currentQty, amount) => {
        const newQty = currentQty + amount;
        if (newQty < 1 || newQty > 5) return;
        router.post(
            '/cart/update',
            { producto_id: productoId, cantidad: newQty },
            { preserveScroll: true }
        );
    };

    const handleRemove = (productoId) => {
        router.post('/cart/remove', { producto_id: productoId }, { preserveScroll: true });
    };

    return (
        <>
            <style>{`
                .premium-cart-drawer {
                    background: #ffffff;
                    box-shadow: -20px 0 30px -10px rgba(0, 0, 0, 0.1);
                    display: flex;
                    flex-direction: column;
                }
                .premium-cart-header {
                    background: #ffffff;
                    border-bottom: 1px solid #f1f5f9;
                    padding: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .premium-cart-title {
                    font-size: 20px;
                    font-weight: 800;
                    color: #0f172a;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .premium-cart-close {
                    background: transparent;
                    border: none;
                    padding: 6px;
                    cursor: pointer;
                    color: #94a3b8;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                    border-radius: 50%;
                }
                .premium-cart-close:hover {
                    background: #f1f5f9;
                    color: #0f172a;
                    transform: rotate(90deg);
                }
                .premium-cart-clear {
                    font-size: 13px;
                    font-weight: 600;
                    color: #64748b;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-decoration: underline;
                    text-decoration-color: transparent;
                }
                .premium-cart-clear:hover {
                    color: #dc2626;
                    text-decoration-color: #dc2626;
                }
                .premium-cart-body {
                    background: #f8fafc;
                    padding: 24px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    flex: 1;
                }
                .premium-cart-item {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 16px;
                    display: flex;
                    gap: 16px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                }
                .premium-cart-item:hover {
                    border-color: #004797;
                    box-shadow: 0 8px 20px rgba(0, 71, 151, 0.08);
                    transform: translateY(-2px);
                }
                .premium-cart-img-container {
                    width: 80px;
                    height: 80px;
                    border-radius: 8px;
                    background: #f1f5f9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    flex-shrink: 0;
                }
                .premium-cart-img-container img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    padding: 4px;
                }
                .premium-cart-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding-right: 24px;
                }
                .premium-cart-brand {
                    font-size: 11px;
                    font-weight: 700;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 4px;
                }
                .premium-cart-name {
                    font-size: 14px;
                    font-weight: 600;
                    color: #1E293B;
                    margin: 0 0 8px 0;
                    line-height: 1.3;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .premium-cart-price {
                    font-size: 16px;
                    font-weight: 800;
                    color: #0f172a;
                }
                .premium-qty-ctrl {
                    display: flex;
                    align-items: center;
                    background: #f1f5f9;
                    border-radius: 20px;
                    padding: 4px 8px;
                    gap: 12px;
                    width: fit-content;
                    margin-top: 12px;
                }
                .premium-qty-btn {
                    background: transparent;
                    border: none;
                    color: #64748b;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    padding: 0 4px;
                    transition: color 0.2s;
                }
                .premium-qty-btn:hover {
                    color: #004797;
                }
                .premium-qty-val {
                    font-size: 14px;
                    font-weight: 700;
                    color: #0f172a;
                    min-width: 12px;
                    text-align: center;
                }
                .premium-remove-btn {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: transparent;
                    border: none;
                    color: #cbd5e1;
                    cursor: pointer;
                    padding: 6px;
                    transition: all 0.2s;
                    border-radius: 8px;
                }
                .premium-remove-btn:hover {
                    background: #fef2f2;
                    color: #ef4444;
                }
                .premium-cart-footer {
                    background: #ffffff;
                    border-top: 1px solid #e2e8f0;
                    padding: 24px;
                    box-shadow: 0 -4px 10px rgba(0,0,0,0.02);
                }
                .premium-summary-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                .premium-summary-label {
                    font-size: 15px;
                    font-weight: 600;
                    color: #64748b;
                }
                .premium-summary-val {
                    font-size: 24px;
                    font-weight: 800;
                    color: #0f172a;
                }
                .premium-btn-primary {
                    background: #004797;
                    color: #ffffff;
                    border: none;
                    padding: 14px 20px;
                    border-radius: 10px;
                    font-size: 15px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 12px rgba(0, 71, 151, 0.25);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex: 1;
                }
                .premium-btn-primary:hover {
                    background: #009ce0;
                    box-shadow: 0 6px 16px rgba(0, 71, 151, 0.35);
                    transform: translateY(-2px);
                }
                .premium-btn-secondary {
                    background: #ffffff;
                    color: #334155;
                    border: 1px solid #cbd5e1;
                    padding: 14px 20px;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex: 1;
                }
                .premium-btn-secondary:hover {
                    background: #f8fafc;
                    border-color: #94a3b8;
                    color: #0f172a;
                    transform: translateY(-1px);
                }
            `}</style>

            <div className={`efe-cart-overlay ${isOpen ? 'is-open' : ''}`} onClick={onClose} style={{ backdropFilter: 'blur(4px)', transition: 'all 0.3s ease' }} />
            
            <div className={`efe-cart-drawer premium-cart-drawer ${isOpen ? 'is-open' : ''}`}>
                <div className="premium-cart-header">
                    <h2 className="premium-cart-title">
                        <button className="premium-cart-close" onClick={onClose}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                        Tu Carrito
                    </h2>
                    {cart?.items?.length > 0 && (
                        <button className="premium-cart-clear" onClick={() => router.post('/cart/clear')}>
                            Vaciar carrito
                        </button>
                    )}
                </div>

                {flash?.error && (
                    <div style={{ margin: '16px 24px 0', padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        {flash.error}
                    </div>
                )}

                <div className="premium-cart-body">
                    {!cart?.items?.length ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', textAlign: 'center', gap: '16px' }}>
                            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '50%', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="9" cy="21" r="1" />
                                    <circle cx="20" cy="21" r="1" />
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                </svg>
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '18px', fontWeight: '700' }}>Tu carrito está vacío</h3>
                                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>¡Agrega productos increíbles y aprovecha nuestras ofertas!</p>
                            </div>
                        </div>
                    ) : (
                        cart.items.map((item) => (
                            <div key={item.id} className="premium-cart-item">
                                <div className="premium-cart-img-container">
                                    <img src={item.imagen || DEFAULT_IMAGE} alt={item.nombre} />
                                </div>
                                <div className="premium-cart-info">
                                    <span className="premium-cart-brand">{item.marca || 'GENÉRICO'}</span>
                                    <h4 className="premium-cart-name">{item.nombre}</h4>
                                    <span className="premium-cart-price">S/ {formatPrice(item.precio)}</span>
                                    <div className="premium-qty-ctrl">
                                        <button className="premium-qty-btn" onClick={() => handleUpdate(item.id, item.cantidad, -1)}>-</button>
                                        <span className="premium-qty-val">{item.cantidad}</span>
                                        <button className="premium-qty-btn" onClick={() => handleUpdate(item.id, item.cantidad, 1)}>+</button>
                                    </div>
                                </div>
                                <button className="premium-remove-btn" onClick={() => handleRemove(item.id)} title="Eliminar producto">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {cart?.items?.length > 0 && (
                    <div className="premium-cart-footer">
                        <div className="premium-summary-row" style={{ marginBottom: '4px' }}>
                            <span className="premium-summary-label" style={{ fontSize: '13px', fontWeight: '500' }}>Subtotal</span>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>S/ {formatPrice(cart.total)}</span>
                        </div>
                        <div className="premium-summary-row" style={{ marginBottom: '16px', borderBottom: '1px dashed #e2e8f0', paddingBottom: '16px' }}>
                            <span className="premium-summary-label" style={{ fontSize: '13px', fontWeight: '500', color: '#10b981' }}>Descuentos</span>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>- S/ 0.00</span>
                        </div>
                        <div className="premium-summary-row">
                            <span className="premium-summary-label">Total a pagar</span>
                            <span className="premium-summary-val">S/ {formatPrice(cart.total)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <button className="premium-btn-secondary" onClick={onClose}>
                                Seguir comprando
                            </button>
                            <button className="premium-btn-primary" onClick={() => {
                                if (!auth.user) {
                                    setIsLoginOpen(true);
                                } else {
                                    onClose();
                                    router.get('/checkout');
                                }
                            }}>
                                Ir a Pagar
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <LoginModal
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
                onSuccessCallback={() => {
                    setIsLoginOpen(false);
                    onClose();
                    router.get('/checkout');
                }}
            />
        </>
    );
}
