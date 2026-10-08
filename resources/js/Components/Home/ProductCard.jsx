import { cartPost } from '../../utils/cartRequest';
import '../../../css/home/product-card.css';
import { useState } from 'react';
import { useShipping } from '@/Contexts/ShippingContext';
import { Link, router, usePage } from '@inertiajs/react';
import { DEFAULT_IMAGE } from './constants';
import { fireConfetti } from '../../utils/confetti';

/* Formatea un número como precio en soles peruanos. */
const formatPrice = (price) =>
    new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
        price
    );

/* Renderiza una tarjeta de producto con imagen, precios y acciones. */
export default function ProductCard({ product }) {

    const [isWished, setIsWished] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
  const { shipping } = useShipping();
    const [isHovering, setIsHovering] = useState(false);

    const { auth, commercePolicy = {} } = usePage().props;
    if (!product) return null;
    const isBombaCyber = product.categorias && product.categorias.includes('cyber-bombas');
    const isRetiroInmediato = product.categorias && product.categorias.includes('retiro-inmediato');

    const showFreeShipping = commercePolicy.free_shipping_enabled !== false && product.envio_domicilio && product.precio_actual >= (commercePolicy.free_shipping_threshold ?? 299);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    };

    const handleAddToCart = (e) => {
        if (e) e.preventDefault();
        if (isAdding) return;

        cartPost(
            '/cart/add',
            {
                producto_id: product.id,
                variante_id: product.variante_id,
                cantidad: 1,
                precio: product.precio_actual,
            },
            {
                preserveScroll: true,
                onStart: () => setIsAdding(true),
                onSuccess: () => {
                    if (e) fireConfetti(e);
                    window.dispatchEvent(new CustomEvent('open-cart'));
                },
                onFinish: () => setIsAdding(false),
            }
        );
    };

    return (
        <div
            className="efe-product-card efe-spotlight-card"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            style={{
                '--mouse-x': '0px',
                '--mouse-y': '0px',
            }}
        >
            <div className="efe-product-badges">
                {product.descuento > 0 && (
                    <div className="efe-badge-discount">-{product.descuento}%</div>
                )}
                {showFreeShipping && (
                    <div className="efe-badge-shipping">ENVÍO<br/>GRATIS</div>
                )}
            </div>

            <div className="efe-product-actions-top">
                <button
                    className="efe-action-btn efe-quick-view-btn"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.dispatchEvent(new CustomEvent('open-quick-view', { detail: product }));
                    }}
                    title="Vista rápida"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <polyline points="9 21 3 21 3 15"></polyline>
                        <line x1="21" y1="3" x2="14" y2="10"></line>
                        <line x1="3" y1="21" x2="10" y2="14"></line>
                    </svg>
                </button>
                <button
                    className="efe-action-btn efe-wishlist-btn"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (auth?.user) {
                            window.dispatchEvent(new CustomEvent('open-list-modal', { detail: product }));
                        } else {
                            router.get('/login');
                        }
                    }}
                    title="Añadir a Mis listas"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
            </div>

            <Link
                className="efe-product-img-wrap efe-product-img-click"
                href={`/producto/${product.slug || product.id}`}
            >
                <img src={product.imagen || DEFAULT_IMAGE} alt={product.nombre} loading="lazy" />
            </Link>

            <div className="efe-product-info">
                <span className="efe-brand-name">
                    {typeof product.marca === 'object' && product.marca !== null
                        ? product.marca.nombre
                        : product.marca}
                </span>
                <h3
                    className="efe-product-name efe-product-name-click"
                >
                    <Link href={`/producto/${product.slug || product.id}`}>{product.nombre}</Link>
                </h3>
                <div className="efe-price-row">
                    <span className="efe-price-old">
                        {product.precio_anterior && product.precio_anterior > product.precio_actual
                            ? `S/ ${formatPrice(product.precio_anterior)}`
                            : ''}
                    </span>
                    <span className="efe-price-current">
                        S/ {formatPrice(product.precio_actual)}
                    </span>
                </div>
                <div className="efe-product-delivery-options">
                    <div className="efe-delivery-option">
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#8a2be2"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <span>Retiro en tienda</span>
                    </div>
                    <div className="efe-delivery-option">
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#8a2be2"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <rect x="1" y="3" width="15" height="13" rx="2" />
                            <path d="M16 8h4l3 3v5h-7V8z" />
                            <circle cx="5.5" cy="18.5" r="2.5" />
                            <circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                        <span>Envío a domicilio</span>
                    </div>
                </div>
                {shipping.costo > 0 && (
                  <div className="efe-product-shipping-cost" style={{
                    marginTop: '8px',
                    color: '#004797',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>
                    Costo de envío: S/ {new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(shipping.costo)}
                  </div>
                )}
            </div>

            <div className="efe-product-actions">
                {product?.stock > 0 ? (
                    <button
                        className={`efe-btn-cart ${isAdding ? 'is-loading' : ''} ${isAdding === 'success' ? 'is-success' : ''}`}
                        onClick={handleAddToCart}
                        disabled={isAdding}
                    >
                        {isAdding ? (
                            <>
                                Agregando...
                                <svg
                                    className="efe-spinner"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                >
                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                </svg>
                            </>
                        ) : (
                            <>
                                Agregar a carrito
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                >
                                    <circle cx="9" cy="21" r="1" />
                                    <circle cx="20" cy="21" r="1" />
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                </svg>
                            </>
                        )}
                    </button>
                ) : (
                    <button
                        className="efe-btn-cart"
                        disabled
                        style={{
                            backgroundColor: '#d1d5db',
                            cursor: 'not-allowed',
                            color: '#6b7280',
                        }}
                    >
                        Sin stock
                    </button>
                )}
            </div>
        </div>
    );
}
