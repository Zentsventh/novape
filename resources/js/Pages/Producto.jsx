import { useState, useEffect } from 'react';
import { Head, usePage, router, Link } from '@inertiajs/react';
import { fireConfetti } from '../utils/confetti';
import { useDeviceContext } from '@/Contexts/DeviceContext';

/* Componentes */
import Header from '../Components/Home/Header';
import CategoryNavBar from '../Components/Home/CategoryNavBar';
import CategoryDrawer from '../Components/Home/CategoryDrawer';
import Footer from '../Components/Home/Footer';
import LoginModal from '../Components/Home/LoginModal';
import AddToListModal from '../Components/Home/AddToListModal';
import { DEFAULT_IMAGE } from '../Components/Home/constants';

/* Estilos */
import '../../css/home/base.css';
import '../../css/home/header.css';
import '../../css/home/category-nav.css';
import '../../css/home/category-drawer.css';
import '../../css/home/footer.css';
import '../../css/home/producto.css';
import CartDrawer from '../Components/Home/CartDrawer';

/* Formateador de precios */
const formatPrice = (price) =>
    new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
        price
    );

export default function Producto() {
    const { producto, detalles, auth, logoUrl, recomendados, flash, cart, categorias } =
        usePage().props;
    const { isMobile } = useDeviceContext();
    const [isCatOpen, setIsCatOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isListModalOpen, setIsListModalOpen] = useState(false);
    const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
    const [isZooming, setIsZooming] = useState(false);

    useEffect(() => {
        const handleOpenCart = () => setIsCartOpen(true);
        const handleOpenCategories = () => setIsCatOpen(true);
        window.addEventListener('open-cart', handleOpenCart);
        window.addEventListener('open-categories', handleOpenCategories);

        // Track recently viewed products
        if (producto?.id) {
            try {
                let viewed = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
                // Remove if already exists
                viewed = viewed.filter((p) => p.id !== producto.id);
                // Add to beginning
                viewed.unshift({
                    id: producto.id,
                    nombre: producto.nombre,
                    imagen: producto.imagen || detalles?.todas_imagenes?.[0] || DEFAULT_IMAGE,
                    slug: producto.slug || producto.id, // Assuming slug or id is enough
                });
                // Keep only last 10
                if (viewed.length > 10) viewed = viewed.slice(0, 10);
                localStorage.setItem('recently_viewed', JSON.stringify(viewed));
            } catch (e) {
                console.error('Error saving recently viewed', e);
            }
        }

        return () => {
            window.removeEventListener('open-cart', handleOpenCart);
            window.removeEventListener('open-categories', handleOpenCategories);
        };
    }, [producto]);

    // Producto
    const [quantity, setQuantity] = useState(1);
    const images =
        detalles?.todas_imagenes?.length > 0
            ? detalles.todas_imagenes
            : [producto?.imagen || DEFAULT_IMAGE];
    const [activeImage, setActiveImage] = useState(images[0] || DEFAULT_IMAGE);

    const handleMouseMove = (e) => {
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setZoomPos({ x, y });
    };

    // Obtener max permitido
    const maxPermitido = Math.min(5, producto?.stock || 0);

    // Animación de agregar
    const [isAdding, setIsAdding] = useState(false);
    const [addSuccess, setAddSuccess] = useState(false);

    // Tabs
    const [activeTab, setActiveTab] = useState('desc'); // 'desc', 'specs', 'warranty'

    const handleBuyNow = (e) => {
        setIsAdding(true);
        // Agregar al carrito y redirigir al checkout o mostrar éxito
        router.post(
            '/cart/add',
            {
                producto_id: producto.id,
                cantidad: quantity,
                precio: producto.precio_actual,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (e) fireConfetti(e);
                    setIsAdding(false);
                    setAddSuccess(true);
                    setTimeout(() => {
                        setAddSuccess(false);
                        window.dispatchEvent(new CustomEvent('open-cart'));
                    }, 800);
                },
                onError: () => {
                    setIsAdding(false);
                },
            }
        );
    };

    const handleQuickBuy = (e) => {
        setIsAdding(true);
        router.post(
            '/cart/add',
            {
                producto_id: producto.id,
                cantidad: quantity,
                precio: producto.precio_actual,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    router.get('/checkout');
                },
                onError: () => {
                    setIsAdding(false);
                },
            }
        );
    };

    const handleAddBundle = (recId, recPrice) => {
        setIsAdding(true);
        // Añadir principal
        router.post(
            '/cart/add',
            {
                producto_id: producto.id,
                cantidad: 1,
                precio: producto.precio_actual,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    // Añadir recomendado
                    router.post(
                        '/cart/add',
                        {
                            producto_id: recId,
                            cantidad: 1,
                            precio: recPrice,
                        },
                        {
                            preserveScroll: true,
                            onSuccess: () => {
                                setIsAdding(false);
                                fireConfetti();
                                window.dispatchEvent(new CustomEvent('open-cart'));
                            },
                            onError: () => setIsAdding(false),
                        }
                    );
                },
                onError: () => setIsAdding(false),
            }
        );
    };

    return (
        <div className="efe-producto-page">
            <Head>
                <title>
                    {producto?.nombre ? `${producto.nombre} - NOVAPE` : 'Producto no encontrado'}
                </title>
                <meta
                    name="description"
                    content={
                        producto?.descripcion?.substring(0, 150) ||
                        'Descubre nuestros productos en NOVAPE.'
                    }
                />
                <meta
                    property="og:title"
                    content={
                        producto?.nombre ? `${producto.nombre} - NOVAPE` : 'Producto no encontrado'
                    }
                />
                <meta
                    property="og:description"
                    content={
                        producto?.descripcion?.substring(0, 150) ||
                        'Descubre nuestros productos en NOVAPE.'
                    }
                />
                <meta property="og:type" content="product" />
                {detalles?.imagenes?.[0] && (
                    <meta property="og:image" content={detalles.imagenes[0].url} />
                )}
                <meta property="product:price:amount" content={producto?.precio_actual} />
                <meta property="product:price:currency" content="PEN" />
            </Head>

            {/* Header General */}
            <Header
                cartCount={cart?.count || 0}
                onOpenCart={() => window.dispatchEvent(new CustomEvent('open-cart'))}
                onOpenCategories={() => setIsCatOpen(true)}
                logoUrl={logoUrl}
            />
            <CategoryNavBar
                categorias={categorias || []}
                onOpenCategories={() => setIsCatOpen(true)}
            />

            <div className="efe-producto-container">
                <div className="efe-breadcrumb">
                    <Link href="/">Inicio</Link>
                    <span>&gt;</span>
                    {producto?.marca ? (
                        <>
                            <span>{producto.marca}</span>
                            <span>&gt;</span>
                        </>
                    ) : null}
                    <span>{producto?.nombre}</span>
                </div>

                <div className="efe-producto-main">
                    <div className="efe-producto-gallery">
                        <div className="efe-producto-thumbnails">
                            {images.map((imgUrl, idx) => (
                                <img
                                    key={idx}
                                    src={imgUrl}
                                    alt={`Thumb ${idx}`}
                                    className={`efe-thumb-img ${activeImage === imgUrl ? 'is-active' : ''}`}
                                    onClick={() => setActiveImage(imgUrl)}
                                />
                            ))}
                        </div>
                        <div className="efe-producto-image-main">
                            <div
                                className="efe-zoom-container"
                                onMouseMove={handleMouseMove}
                                onMouseEnter={() => setIsZooming(true)}
                                onMouseLeave={() => setIsZooming(false)}
                                style={{
                                    width: '100%',
                                    height: '500px',
                                    position: 'relative',
                                    backgroundImage: `url(${activeImage || DEFAULT_IMAGE})`,
                                    backgroundPosition: isZooming
                                        ? `${zoomPos.x}% ${zoomPos.y}%`
                                        : 'center',
                                    backgroundSize: isZooming ? '140%' : 'contain',
                                    backgroundRepeat: 'no-repeat',
                                    cursor: 'crosshair',
                                    borderRadius: '12px',
                                    transition:
                                        'background-size 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                }}
                            >
                                <img
                                    src={activeImage || DEFAULT_IMAGE}
                                    alt={producto.nombre}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                        opacity: isZooming ? 0 : 1,
                                        transition: 'opacity 0.4s ease',
                                    }}
                                />
                            </div>
                            <div className="efe-producto-image-hint" style={{ marginTop: '10px' }}>
                                Pase el cursor sobre la imagen para ampliarla
                            </div>
                            <div className="efe-producto-share">
                                Comparte:
                                <span style={{ fontWeight: 'bold', cursor: 'pointer' }}>f</span>
                                <span style={{ fontWeight: 'bold', cursor: 'pointer' }}>X</span>
                                <span style={{ fontWeight: 'bold', cursor: 'pointer' }}>G+</span>
                            </div>
                        </div>
                    </div>

                    {/* Información y Compra */}
                    <div className="efe-producto-info">
                        <div className="efe-producto-brand">{producto?.marca || 'Generico'}</div>
                        <h1 className="efe-producto-title">{producto?.nombre}</h1>
                        <div className="efe-producto-price">
                            S/ {formatPrice(producto?.precio_actual || 0)}
                        </div>

                        {flash?.error && (
                            <div
                                style={{
                                    color: '#dc2626',
                                    backgroundColor: '#fef2f2',
                                    border: '1px solid #f87171',
                                    padding: '10px',
                                    borderRadius: '4px',
                                    marginBottom: '15px',
                                    fontSize: '14px',
                                }}
                            >
                                {flash.error}
                            </div>
                        )}

                        {/* Neuromarketing: Indicador de Urgencia */}
                        {producto?.stock > 0 && producto?.stock <= 5 && (
                            <div
                                className="efe-urgency-indicator"
                                style={{
                                    backgroundColor: '#fff7ed',
                                    border: '1px solid #fdba74',
                                    color: '#ea580c',
                                    padding: '10px 15px',
                                    borderRadius: '6px',
                                    marginBottom: '20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    animation: 'pulse-urgency 2s infinite',
                                }}
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                <span>
                                    ¡Date prisa! Solo quedan {producto.stock} unidades disponibles.
                                </span>
                            </div>
                        )}

                        <div
                            className="efe-producto-quantity"
                            style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}
                        >
                            <label>Cantidad (Máx. {maxPermitido})</label>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '4px',
                                    width: 'fit-content',
                                    overflow: 'hidden',
                                }}
                            >
                                <button
                                    className="efe-qty-btn"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    disabled={quantity <= 1 || isAdding || addSuccess}
                                    style={{
                                        padding: '8px 12px',
                                        background: '#f9fafb',
                                        border: 'none',
                                        borderRight: '1px solid #e5e7eb',
                                        cursor:
                                            quantity <= 1 || isAdding ? 'not-allowed' : 'pointer',
                                        fontSize: '16px',
                                    }}
                                >
                                    -
                                </button>
                                <span
                                    style={{
                                        width: '40px',
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {quantity}
                                </span>
                                <button
                                    className="efe-qty-btn"
                                    onClick={() =>
                                        setQuantity(Math.min(maxPermitido, quantity + 1))
                                    }
                                    disabled={quantity >= maxPermitido || isAdding || addSuccess}
                                    style={{
                                        padding: '8px 12px',
                                        background: '#f9fafb',
                                        border: 'none',
                                        borderLeft: '1px solid #e5e7eb',
                                        cursor:
                                            quantity >= maxPermitido || isAdding
                                                ? 'not-allowed'
                                                : 'pointer',
                                        fontSize: '16px',
                                    }}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {producto.stock > 0 ? (
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button
                                    className={`efe-producto-add-btn ${addSuccess ? 'btn-success-anim' : ''}`}
                                    onClick={(e) => handleBuyNow(e)}
                                    disabled={isAdding || addSuccess}
                                    style={{
                                        flex: 1,
                                        backgroundColor: addSuccess ? '#10b981' : '#f3f4f6',
                                        color: addSuccess ? 'white' : '#111827',
                                        border: '1px solid #d1d5db',
                                    }}
                                >
                                    {isAdding ? (
                                        <div
                                            style={{
                                                width: '20px',
                                                height: '20px',
                                                border: '3px solid rgba(0,0,0,0.1)',
                                                borderTop: '3px solid #111827',
                                                borderRadius: '50%',
                                                animation: 'spin 1s linear infinite',
                                            }}
                                        ></div>
                                    ) : addSuccess ? (
                                        <>
                                            <svg
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                            ¡Añadido!
                                        </>
                                    ) : (
                                        <>
                                            Al carrito
                                            <svg
                                                width="20"
                                                height="20"
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
                                <button
                                    className="efe-producto-add-btn"
                                    onClick={handleQuickBuy}
                                    disabled={isAdding || addSuccess}
                                    style={{
                                        flex: 1,
                                        backgroundColor: 'var(--color-primary)',
                                        color: 'white',
                                    }}
                                >
                                    Comprar Ahora
                                </button>
                            </div>
                        ) : (
                            <button
                                className="efe-producto-add-btn"
                                disabled
                                style={{ backgroundColor: '#d1d5db', cursor: 'not-allowed' }}
                            >
                                Sin stock
                            </button>
                        )}

                        <div style={{ marginTop: '15px' }}>
                            <button
                                onClick={() => {
                                    if (auth?.user) {
                                        setIsListModalOpen(true);
                                    } else {
                                        router.get('/login');
                                    }
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: 'none',
                                    border: 'none',
                                    color: '#64748b',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    padding: '5px 0',
                                }}
                            >
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                                Agregar a Mis listas
                            </button>
                        </div>

                        <div className="efe-producto-delivery">
                            <div className="efe-delivery-types">
                                <h4>Tipo de entrega</h4>
                                <div className="efe-delivery-option">
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#666"
                                        strokeWidth="1.5"
                                    >
                                        <rect x="1" y="3" width="15" height="13" rx="2" />
                                        <path d="M16 8h4l3 3v5h-7V8z" />
                                        <circle cx="5.5" cy="18.5" r="2.5" />
                                        <circle cx="18.5" cy="18.5" r="2.5" />
                                    </svg>
                                    Envío a domicilio
                                    {producto?.envio_domicilio ? (
                                        <svg
                                            className="efe-delivery-check"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                        >
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    ) : (
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#ef4444"
                                            strokeWidth="3"
                                            style={{ marginLeft: 'auto' }}
                                        >
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    )}
                                </div>
                                <div
                                    style={{
                                        fontSize: '11px',
                                        color: producto?.envio_domicilio ? '#22c55e' : '#ef4444',
                                        marginLeft: '30px',
                                        marginBottom: '10px',
                                    }}
                                >
                                    {producto?.envio_domicilio ? 'Disponible' : 'No disponible'}
                                </div>

                                <div className="efe-delivery-option">
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#666"
                                        strokeWidth="1.5"
                                    >
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                        <polyline points="9 22 9 12 15 12 15 22" />
                                    </svg>
                                    Retiro en tienda
                                    {producto?.retiro_tienda ? (
                                        <svg
                                            className="efe-delivery-check"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                        >
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    ) : (
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#ef4444"
                                            strokeWidth="3"
                                            style={{ marginLeft: 'auto' }}
                                        >
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    )}
                                </div>
                                <div
                                    style={{
                                        fontSize: '11px',
                                        color: producto?.retiro_tienda ? '#22c55e' : '#ef4444',
                                        marginLeft: '30px',
                                    }}
                                >
                                    {producto?.retiro_tienda ? 'Disponible' : 'No disponible'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secciones inferiores - TABS */}
                <div
                    className="efe-producto-sections"
                    style={{
                        marginTop: '40px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        overflow: 'hidden',
                    }}
                >
                    {/* Tab Header */}
                    <div style={{ display: 'flex', backgroundColor: '#002f5a', color: 'white' }}>
                        <button
                            onClick={() => setActiveTab('desc')}
                            style={{
                                flex: 1,
                                padding: '16px',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                backgroundColor: activeTab === 'desc' ? '#001a35' : 'transparent',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                borderBottom:
                                    activeTab === 'desc'
                                        ? '4px solid #00a4e4'
                                        : '4px solid transparent',
                                transition: 'all 0.2s',
                            }}
                        >
                            DESCRIPCIÓN DEL PRODUCTO
                        </button>
                        <button
                            onClick={() => setActiveTab('specs')}
                            style={{
                                flex: 1,
                                padding: '16px',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                backgroundColor: activeTab === 'specs' ? '#001a35' : 'transparent',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                borderBottom:
                                    activeTab === 'specs'
                                        ? '4px solid #00a4e4'
                                        : '4px solid transparent',
                                transition: 'all 0.2s',
                            }}
                        >
                            ESPECIFICACIONES
                        </button>
                        <button
                            onClick={() => setActiveTab('warranty')}
                            style={{
                                flex: 1,
                                padding: '16px',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                backgroundColor:
                                    activeTab === 'warranty' ? '#001a35' : 'transparent',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                borderBottom:
                                    activeTab === 'warranty'
                                        ? '4px solid #00a4e4'
                                        : '4px solid transparent',
                                transition: 'all 0.2s',
                            }}
                        >
                            CAMBIOS Y DEVOLUCIONES
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div style={{ padding: '30px', backgroundColor: 'white' }}>
                        {activeTab === 'desc' && (
                            <div
                                style={{ lineHeight: '1.6', color: '#333' }}
                                dangerouslySetInnerHTML={{
                                    __html:
                                        producto?.descripcion ||
                                        'No hay descripción disponible para este producto.',
                                }}
                            />
                        )}

                        {activeTab === 'specs' && (
                            <div>
                                <table
                                    className="efe-specs-table"
                                    style={{ width: '100%', borderCollapse: 'collapse' }}
                                >
                                    <tbody>
                                        {detalles?.especificaciones?.length > 0
                                            ? detalles.especificaciones.map((spec, idx) => (
                                                  <tr
                                                      key={idx}
                                                      style={{ borderBottom: '1px solid #f1f5f9' }}
                                                  >
                                                      <td
                                                          style={{
                                                              padding: '12px 16px',
                                                              fontWeight: 'bold',
                                                              width: '40%',
                                                              color: '#475569',
                                                          }}
                                                      >
                                                          {spec.nombre || 'Especificación'}
                                                      </td>
                                                      <td
                                                          style={{
                                                              padding: '12px 16px',
                                                              color: '#333',
                                                          }}
                                                      >
                                                          {spec.valor}
                                                      </td>
                                                  </tr>
                                              ))
                                            : null}
                                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td
                                                style={{
                                                    padding: '12px 16px',
                                                    fontWeight: 'bold',
                                                    width: '40%',
                                                    color: '#475569',
                                                }}
                                            >
                                                Stock Disponible
                                            </td>
                                            <td style={{ padding: '12px 16px', color: '#333' }}>
                                                {producto?.stock > 0
                                                    ? `${producto.stock} unidades`
                                                    : 'Agotado'}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'warranty' && (
                            <div
                                style={{ lineHeight: '1.6', color: '#333', whiteSpace: 'pre-line' }}
                            >
                                {producto?.garantias ||
                                    'No hay información de cambios y devoluciones disponible para este producto.'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Frecuentemente comprados juntos */}
            {recomendados && recomendados.length > 0 && (
                <div style={{ maxWidth: '1200px', margin: '50px auto 30px', padding: '0 20px' }}>
                    <h2
                        style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            marginBottom: '24px',
                            color: '#1e293b',
                        }}
                    >
                        Comprados frecuentemente juntos
                    </h2>

                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: '30px',
                            backgroundColor: '#ffffff',
                            padding: '30px',
                            borderRadius: '16px',
                            boxShadow: '0 4px 20px rgba(0, 180, 255, 0.08)',
                            border: '1px solid rgba(0, 180, 255, 0.15)',
                        }}
                    >
                        {/* Producto Principal */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                width: '160px',
                                position: 'relative',
                            }}
                        >
                            <div
                                style={{
                                    width: '100%',
                                    aspectRatio: '1',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    padding: '15px',
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    marginBottom: '12px',
                                }}
                            >
                                <img
                                    src={producto.imagen || DEFAULT_IMAGE}
                                    alt={producto.nombre}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        objectFit: 'contain',
                                    }}
                                />
                            </div>
                            <span
                                style={{
                                    fontSize: '13px',
                                    textAlign: 'center',
                                    fontWeight: '600',
                                    color: '#334155',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                }}
                            >
                                {producto.nombre}
                            </span>
                        </div>

                        <div style={{ fontSize: '28px', fontWeight: '300', color: '#00B4FF' }}>
                            +
                        </div>

                        {/* Producto Recomendado (Primer elemento) */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                width: '160px',
                                position: 'relative',
                            }}
                        >
                            <Link
                                href={`/producto/${recomendados[0].id}`}
                                style={{
                                    width: '100%',
                                    aspectRatio: '1',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    padding: '15px',
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    marginBottom: '12px',
                                    transition: 'all 0.3s ease',
                                    textDecoration: 'none',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#00B4FF';
                                    e.currentTarget.style.boxShadow =
                                        '0 4px 12px rgba(0, 180, 255, 0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <img
                                    src={recomendados[0].imagen || DEFAULT_IMAGE}
                                    alt={recomendados[0].nombre}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        objectFit: 'contain',
                                    }}
                                />
                            </Link>
                            <Link
                                href={`/producto/${recomendados[0].id}`}
                                style={{
                                    fontSize: '13px',
                                    textAlign: 'center',
                                    fontWeight: '600',
                                    color: '#334155',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    textDecoration: 'none',
                                    transition: 'color 0.2s',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#00B4FF')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#334155')}
                            >
                                {recomendados[0].nombre}
                            </Link>
                        </div>

                        <div style={{ fontSize: '28px', fontWeight: '300', color: '#00B4FF' }}>
                            =
                        </div>

                        {/* Total y Botón */}
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '15px',
                                marginLeft: 'auto',
                                minWidth: '240px',
                                padding: '20px',
                                backgroundColor: '#f0f9ff',
                                borderRadius: '12px',
                                border: '1px dashed rgba(0, 180, 255, 0.4)',
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span
                                    style={{
                                        fontSize: '13px',
                                        color: '#64748b',
                                        fontWeight: '500',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                    }}
                                >
                                    Precio total del paquete
                                </span>
                                <span
                                    style={{
                                        fontSize: '28px',
                                        fontWeight: '800',
                                        color: '#00B4FF',
                                    }}
                                >
                                    S/{' '}
                                    {formatPrice(
                                        (producto.precio_actual || 0) +
                                            (recomendados[0].precio_actual || 0)
                                    )}
                                </span>
                            </div>
                            <button
                                onClick={() =>
                                    handleAddBundle(
                                        recomendados[0].id,
                                        recomendados[0].precio_actual
                                    )
                                }
                                disabled={isAdding}
                                style={{
                                    width: '100%',
                                    padding: '14px 20px',
                                    backgroundColor: '#00B4FF',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    cursor: isAdding ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 4px 12px rgba(0, 180, 255, 0.3)',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isAdding)
                                        e.currentTarget.style.backgroundColor = '#0096d6';
                                }}
                                onMouseLeave={(e) => {
                                    if (!isAdding)
                                        e.currentTarget.style.backgroundColor = '#00B4FF';
                                }}
                            >
                                {isAdding ? (
                                    <>
                                        <svg
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            style={{ animation: 'spin 1s linear infinite' }}
                                        >
                                            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                                        </svg>
                                        Agregando...
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                            <line x1="3" y1="6" x2="21" y2="6"></line>
                                            <path d="M16 10a4 4 0 0 1-8 0"></path>
                                        </svg>
                                        Agregar ambos al carrito
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {recomendados && recomendados.length > 1 && (
                <div style={{ maxWidth: '1200px', margin: '40px auto 60px', padding: '0 20px' }}>
                    <h2
                        style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            marginBottom: '24px',
                            color: '#1e293b',
                        }}
                    >
                        Clientes también compraron
                    </h2>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                            gap: '24px',
                        }}
                    >
                        {recomendados.map((rec) => (
                            <Link
                                href={`/producto/${rec.id}`}
                                key={rec.id}
                                style={{
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    display: 'block',
                                    height: '100%',
                                }}
                            >
                                <div
                                    style={{
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '12px',
                                        padding: '20px',
                                        background: 'white',
                                        transition: 'all 0.3s ease',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        position: 'relative',
                                        overflow: 'hidden',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = '#00B4FF';
                                        e.currentTarget.style.boxShadow =
                                            '0 10px 25px rgba(0, 180, 255, 0.1)';
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '100%',
                                            height: '180px',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginBottom: '16px',
                                        }}
                                    >
                                        <img
                                            src={rec.imagen || DEFAULT_IMAGE}
                                            alt={rec.nombre}
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '100%',
                                                objectFit: 'contain',
                                                transition: 'transform 0.3s ease',
                                            }}
                                        />
                                    </div>

                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            flexGrow: 1,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: '11px',
                                                fontWeight: '600',
                                                color: '#94a3b8',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                marginBottom: '4px',
                                            }}
                                        >
                                            {rec.marca || 'S/M'}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: '#334155',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                marginBottom: '12px',
                                                lineHeight: '1.4',
                                            }}
                                        >
                                            {rec.nombre}
                                        </span>

                                        <div
                                            style={{
                                                marginTop: 'auto',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: '18px',
                                                    fontWeight: '800',
                                                    color: '#00B4FF',
                                                }}
                                            >
                                                S/ {formatPrice(rec.precio_actual)}
                                            </span>
                                            <div
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#f0f9ff',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    color: '#00B4FF',
                                                }}
                                            >
                                                <svg
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                                    <polyline points="12 5 19 12 12 19"></polyline>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {isMobile && (
                <div className="sticky-bottom-cta">
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '8px',
                        }}
                    >
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                            S/ {formatPrice(producto?.precio_actual)}
                        </div>
                        {producto?.precio_anterior > 0 && (
                            <div
                                style={{
                                    fontSize: '12px',
                                    textDecoration: 'line-through',
                                    color: '#9ca3af',
                                }}
                            >
                                S/ {formatPrice(producto?.precio_anterior)}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={(e) => handleBuyNow(false, e)}
                        className={`efe-producto-btn efe-producto-btn-buy efe-btn-anim ${isAdding ? 'is-adding' : ''}`}
                        disabled={!producto?.stock || producto.stock <= 0}
                        style={{ width: '100%', minHeight: '44px' }}
                    >
                        {isAdding ? 'Agregando...' : 'Comprar ahora'}
                    </button>
                </div>
            )}

            <Footer />

            <CategoryDrawer
                isOpen={isCatOpen}
                onClose={() => setIsCatOpen(false)}
                categorias={categorias || []}
            />

            <CartDrawer cart={cart} isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

            <LoginModal
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
                onSuccessCallback={() => handleBuyNow(true)}
            />

            <AddToListModal
                isOpen={isListModalOpen}
                onClose={() => setIsListModalOpen(false)}
                producto={producto}
            />
        </div>
    );
}
