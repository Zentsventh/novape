import { cartPost } from '../utils/cartRequest';
import { useState, useEffect } from 'react';
import { Head, usePage, router, Link } from '@inertiajs/react';
import { fireConfetti } from '../utils/confetti';
import { useDeviceContext } from '@/Contexts/DeviceContext';

/* Componentes */
import Header from '../Components/Home/Header';
import CategoryNavBar from '../Components/Home/CategoryNavBar';
import CategoryDrawer from '../Components/Home/CategoryDrawer';
import Footer from '../Components/Home/Footer';
import ProductReviews from '../Components/Home/ProductReviews';
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

const BundleSection = ({ producto, recomendados, fireConfetti, cartPost }) => {
    const accesorios = recomendados?.filter(r => r.categoria_id !== producto.categoria_id) || [];
    if (accesorios.length === 0) return null;

    const [selectedItems, setSelectedItems] = useState(accesorios.length > 0 ? [accesorios[0].id] : []);
    const [isAddingBundle, setIsAddingBundle] = useState(false);

    const toggleItem = (id) => {
        setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const totalPaquete = producto.precio_actual + accesorios.filter(a => selectedItems.includes(a.id)).reduce((sum, a) => sum + a.precio_actual, 0);

    const handleAdd = () => {
        setIsAddingBundle(true);
        cartPost('/cart/add', {
            producto_id: producto.id,
            variante_id: producto.variante_id,
            cantidad: 1,
            precio: producto.precio_actual,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                if (selectedItems.length === 0) {
                    setIsAddingBundle(false);
                    fireConfetti();
                    window.dispatchEvent(new CustomEvent('open-cart'));
                    return;
                }
                const addNext = (index) => {
                    if (index >= selectedItems.length) {
                        setIsAddingBundle(false);
                        fireConfetti();
                        window.dispatchEvent(new CustomEvent('open-cart'));
                        return;
                    }
                    const accId = selectedItems[index];
                    const acc = accesorios.find(a => a.id === accId);
                    cartPost('/cart/add', {
                        producto_id: acc.id,
                        cantidad: 1,
                        precio: acc.precio_actual,
                    }, {
                        preserveScroll: true,
                        onSuccess: () => addNext(index + 1),
                        onError: () => addNext(index + 1)
                    });
                };
                addNext(0);
            },
            onError: () => { setIsAddingBundle(false); }
        });
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '60px auto 40px', padding: '0 20px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#1e293b' }}>
                Comprados frecuentemente juntos
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)', border: '1px solid #f1f5f9' }}>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '160px' }}>
                        <div style={{ width: '100%', aspectRatio: '1', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                            <img src={producto.imagen || DEFAULT_IMAGE} alt={producto.nombre} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_IMAGE; }} />
                        </div>
                        <span style={{ fontSize: '13px', textAlign: 'center', fontWeight: '600', color: '#334155', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{producto.nombre}</span>
                    </div>

                    <div style={{ fontSize: '24px', fontWeight: '300', color: '#cbd5e1' }}>+</div>

                    {accesorios.slice(0, 3).map((acc, idx) => (
                        <div key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '160px', cursor: 'pointer', transition: 'all 0.2s ease', opacity: selectedItems.includes(acc.id) ? 1 : 0.6 }} onClick={() => toggleItem(acc.id)}>
                                <div style={{ width: '100%', aspectRatio: '1', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', backgroundColor: selectedItems.includes(acc.id) ? '#f0f9ff' : '#f8fafc', borderRadius: '12px', border: `1px solid ${selectedItems.includes(acc.id) ? '#004797' : '#e2e8f0'}`, marginBottom: '12px', transition: 'all 0.2s ease', position: 'relative' }}>
                                    <img src={acc.imagen || DEFAULT_IMAGE} alt={acc.nombre} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_IMAGE; }} />
                                    <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 4, border: `2px solid ${selectedItems.includes(acc.id) ? '#004797' : '#cbd5e1'}`, backgroundColor: selectedItems.includes(acc.id) ? '#004797' : 'white', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        {selectedItems.includes(acc.id) && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                    </div>
                                </div>
                                <span style={{ fontSize: '13px', textAlign: 'center', fontWeight: selectedItems.includes(acc.id) ? '600' : '500', color: selectedItems.includes(acc.id) ? '#004797' : '#64748b', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{acc.nombre}</span>
                                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', marginTop: 4 }}>S/ {formatPrice(acc.precio_actual)}</span>
                            </div>
                            {idx < accesorios.slice(0, 3).length - 1 && <div style={{ fontSize: '24px', fontWeight: '300', color: '#cbd5e1' }}>+</div>}
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '24px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Precio total de tu selección ({selectedItems.length + 1} productos)</span>
                        <span style={{ fontSize: '28px', fontWeight: '800', color: '#004797' }}>S/ {formatPrice(totalPaquete)}</span>
                    </div>
                    <button onClick={handleAdd} disabled={isAddingBundle} style={{ padding: '14px 32px', backgroundColor: '#004797', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: isAddingBundle ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0, 71, 151, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', minWidth: '220px' }} onMouseEnter={(e) => { if (!isAddingBundle) e.currentTarget.style.backgroundColor = '#003370'; }} onMouseLeave={(e) => { if (!isAddingBundle) e.currentTarget.style.backgroundColor = '#004797'; }}>
                        {isAddingBundle ? 'Agregando paquete...' : 'Agregar al carrito'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function Producto() {
    const { producto: baseProducto, detalles, auth, logoUrl, recomendados, flash, cart, categorias, canonicalUrl } =
        usePage().props;
    const [selectedVariantId, setSelectedVariantId] = useState(baseProducto?.variante_id);
    const selectedVariant = baseProducto?.variantes?.find(v => v.variante_id === Number(selectedVariantId));
    const producto = { ...baseProducto, ...selectedVariant };
    producto.descuento = producto.precio_anterior > producto.precio_actual ? Math.round(100*(1-producto.precio_actual/producto.precio_anterior)) : 0;
    useEffect(()=>setSelectedVariantId(baseProducto?.variante_id),[baseProducto?.id,baseProducto?.variante_id]);
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
    }, [producto.id]);

    // Producto
    const [quantity, setQuantity] = useState(1);
    const images =
        detalles?.todas_imagenes?.length > 0
            ? detalles.todas_imagenes
            : [producto?.imagen || DEFAULT_IMAGE];
    const [activeImage, setActiveImage] = useState(images[0] || DEFAULT_IMAGE);

    useEffect(() => {
        setQuantity(1);
        setActiveImage(images[0] || DEFAULT_IMAGE);
    }, [producto?.id]);

    const handleMouseMove = (e) => {
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setZoomPos({ x, y });
    };

    // Obtener max permitido
    const maxPermitido = Math.min(usePage().props.commercePolicy?.max_quantity || 5, producto?.stock || 0);

    // Animación de agregar
    const [isAdding, setIsAdding] = useState(false);
    const [addSuccess, setAddSuccess] = useState(false);

    // Tabs
    const [activeTab, setActiveTab] = useState('desc'); // 'desc', 'specs', 'warranty'

    const handleBuyNow = (e) => {
        setIsAdding(true);
        // Agregar al carrito y redirigir al checkout o mostrar éxito
        cartPost(
            '/cart/add',
            {
                producto_id: producto.id,
                variante_id: producto.variante_id,
                cantidad: quantity,
                precio: producto.precio_actual,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (e?.currentTarget) fireConfetti(e);
                    setIsAdding(false);
                    setAddSuccess(true);
                    window.dispatchEvent(new CustomEvent('open-cart'));
                    setTimeout(() => {
                        setAddSuccess(false);
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
        cartPost(
            '/cart/add',
            {
                producto_id: producto.id,
                variante_id: producto.variante_id,
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
        cartPost(
            '/cart/add',
            {
                producto_id: producto.id,
                variante_id: producto.variante_id,
                cantidad: 1,
                precio: producto.precio_actual,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    // Añadir recomendado
                    cartPost(
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
                <link head-key="canonical" rel="canonical" href={canonicalUrl} />
                <title>
                    {producto?.nombre ? producto.nombre : 'Producto no encontrado'}
                </title>
                <meta
                    head-key="description" name="description"
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
                {detalles?.todas_imagenes?.[0] && (
                    <meta property="og:image" content={detalles.todas_imagenes[0]} />
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
                <style>{`
                    .premium-product-main {
                        display: grid;
                        grid-template-columns: 1fr;
                        gap: 48px;
                        background: #ffffff;
                        border-radius: 24px;
                        padding: 32px;
                        box-shadow: 0 4px 20px -2px rgba(0,0,0,0.03);
                        margin-bottom: 40px;
                        border: 1px solid #f1f5f9;
                    }
                    @media (min-width: 992px) {
                        .premium-product-main {
                            grid-template-columns: repeat(2, minmax(0, 1fr));
                            padding: 40px;
                        }
                    }
                    .premium-gallery-container {
                        display: flex;
                        gap: 24px;
                        height: 540px;
                    }
                    .premium-thumbs {
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                        width: 88px;
                        overflow-y: auto;
                        padding-right: 4px;
                    }
                    .premium-thumb {
                        width: 100%;
                        height: 88px;
                        border-radius: 14px;
                        border: 2px solid transparent;
                        cursor: pointer;
                        transition: all 0.25s ease;
                        object-fit: contain;
                        padding: 8px;
                        background: #f8fafc;
                        opacity: 0.6;
                    }
                    .premium-thumb:hover {
                        opacity: 1;
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                    }
                    .premium-thumb.is-active {
                        border-color: #004797;
                        opacity: 1;
                        background: #ffffff;
                        box-shadow: 0 4px 12px rgba(0, 71, 151, 0.15);
                    }
                    .premium-main-img {
                        flex: 1;
                        border-radius: 20px;
                        background: #f8fafc;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        overflow: hidden;
                        position: relative;
                        border: 1px solid #e2e8f0;
                    }
                    .premium-product-info {
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                    }
                    .premium-brand {
                        font-size: 13px;
                        font-weight: 700;
                        color: #004797;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        margin-bottom: 12px;
                    }
                    .premium-title {
                        font-size: clamp(22px, 3vw, 26px);
                        font-weight: 700;
                        color: #1e293b;
                        line-height: 1.35;
                        margin: 0 0 16px 0;
                        letter-spacing: -0.3px;
                    }
                    .premium-price {
                        font-size: clamp(26px, 4vw, 32px);
                        font-weight: 800;
                        color: #0f172a;
                        margin-bottom: 28px;
                        display: flex;
                        align-items: center;
                        gap: 16px;
                    }
                    .premium-price span {
                        font-size: 18px;
                        font-weight: 600;
                        color: #94a3b8;
                        text-decoration: line-through;
                    }
                    .premium-qty-wrapper {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        margin-bottom: 32px;
                    }
                    .premium-qty-label {
                        font-size: 14px;
                        font-weight: 600;
                        color: #64748b;
                    }
                    .premium-qty-box {
                        display: flex;
                        align-items: center;
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 12px;
                        width: fit-content;
                        padding: 4px;
                        transition: all 0.2s;
                    }
                    .premium-qty-box:focus-within {
                        border-color: #004797;
                        box-shadow: 0 0 0 3px rgba(0, 71, 151, 0.15);
                    }
                    .premium-qty-btn {
                        width: 40px;
                        height: 40px;
                        border-radius: 8px;
                        border: none;
                        background: transparent;
                        color: #64748b;
                        font-size: 20px;
                        cursor: pointer;
                        transition: all 0.2s;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .premium-qty-btn:hover:not(:disabled) {
                        background: #ffffff;
                        color: #0f172a;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.05);
                    }
                    .premium-qty-btn:disabled {
                        opacity: 0.4;
                        cursor: not-allowed;
                    }
                    .premium-qty-val {
                        width: 48px;
                        text-align: center;
                        font-weight: 700;
                        font-size: 16px;
                        color: #0f172a;
                    }
                    .premium-actions {
                        display: flex;
                        gap: 16px;
                        margin-bottom: 32px;
                    }
                    .premium-btn-cart {
                        flex: 1;
                        background: #f8fafc;
                        color: #0f172a;
                        border: 1px solid #e2e8f0;
                        border-radius: 14px;
                        padding: 16px;
                        font-size: 16px;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                    }
                    .premium-btn-cart:hover:not(:disabled) {
                        border-color: #cbd5e1;
                        background: #f1f5f9;
                        transform: translateY(-2px);
                    }
                    .premium-btn-buy {
                        flex: 1;
                        background: #004797;
                        color: #ffffff;
                        border: none;
                        border-radius: 14px;
                        padding: 16px;
                        font-size: 16px;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        box-shadow: 0 4px 14px rgba(0, 71, 151, 0.3);
                    }
                    .premium-btn-buy:hover:not(:disabled) {
                        background: #009ce0;
                        box-shadow: 0 6px 20px rgba(0, 71, 151, 0.4);
                        transform: translateY(-2px);
                    }
                    .premium-delivery-card {
                        background: #ffffff;
                        border: 1px solid #e2e8f0;
                        border-radius: 16px;
                        padding: 24px;
                    }
                    .premium-delivery-title {
                        font-size: 15px;
                        font-weight: 700;
                        color: #0f172a;
                        margin-bottom: 20px;
                    }
                    .premium-delivery-item {
                        display: flex;
                        align-items: flex-start;
                        gap: 16px;
                        margin-bottom: 20px;
                    }
                    .premium-delivery-item:last-child {
                        margin-bottom: 0;
                    }
                    .premium-delivery-icon {
                        background: #f8fafc;
                        width: 44px;
                        height: 44px;
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #64748b;
                        flex-shrink: 0;
                        border: 1px solid #f1f5f9;
                    }
                    .premium-delivery-content {
                        flex: 1;
                    }
                    .premium-delivery-name {
                        font-size: 15px;
                        font-weight: 600;
                        color: #0f172a;
                        margin-bottom: 6px;
                    }
                    .premium-delivery-status {
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        font-size: 13px;
                        font-weight: 600;
                        padding: 4px 10px;
                        border-radius: 20px;
                    }
                    .status-ok { background: #dcfce7; color: #166534; }
                    .status-no { background: #fee2e2; color: #991b1b; }

                    .premium-tabs-container {
                        margin-top: 48px;
                        border-radius: 20px;
                        background: #ffffff;
                        box-shadow: 0 4px 20px -2px rgba(0,0,0,0.03);
                        overflow: hidden;
                        border: 1px solid #e2e8f0;
                    }
                    .premium-tabs-header {
                        display: flex;
                        border-bottom: 1px solid #e2e8f0;
                        background: #f8fafc;
                        padding: 0 24px;
                    }
                    .premium-tab-btn {
                        padding: 24px 32px;
                        background: transparent;
                        border: none;
                        font-size: 14px;
                        font-weight: 700;
                        color: #64748b;
                        cursor: pointer;
                        transition: all 0.2s;
                        border-bottom: 3px solid transparent;
                        margin-bottom: -1px;
                        letter-spacing: 0.5px;
                    }
                    .premium-tab-btn:hover {
                        color: #0f172a;
                    }
                    .premium-tab-btn.is-active {
                        color: #004797;
                        border-bottom-color: #004797;
                        background: #ffffff;
                    }
                `}</style>
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

                <div className="premium-product-main">
                    <div className="premium-gallery-container">
                        <div className="premium-thumbs">
                            {images.map((imgUrl, idx) => (
                                <img
                                    onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_IMAGE; }}
                                    key={idx}
                                    src={imgUrl}
                                    alt={`Thumb ${idx}`}
                                    className={`premium-thumb ${activeImage === imgUrl ? 'is-active' : ''}`}
                                    onClick={() => setActiveImage(imgUrl)}
                                />
                            ))}
                        </div>
                        <div className="premium-main-img" style={{ position: 'relative' }}>
                            <div
                                className="efe-zoom-container"
                                onMouseMove={isZooming ? handleMouseMove : undefined}
                                onClick={() => setIsZooming(!isZooming)}
                                onMouseLeave={() => setIsZooming(false)}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    position: 'relative',
                                    backgroundImage: `url(${activeImage || DEFAULT_IMAGE})`,
                                    backgroundPosition: isZooming
                                        ? `${zoomPos.x}% ${zoomPos.y}%`
                                        : 'center',
                                    backgroundSize: isZooming ? '150%' : 'contain',
                                    backgroundRepeat: 'no-repeat',
                                    cursor: isZooming ? 'zoom-out' : 'zoom-in',
                                    transition:
                                        'background-size 0.3s ease-out',
                                }}
                            >
                                <img
                                    onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_IMAGE; setActiveImage(DEFAULT_IMAGE); }}
                                    src={activeImage || DEFAULT_IMAGE}
                                    alt={producto.nombre}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                        padding: 'clamp(0.75rem, 3vw, 1.5rem)',
                                        opacity: isZooming ? 0 : 1,
                                        transition: 'opacity 0.2s ease',
                                    }}
                                />
                            </div>
                            
                            {!isZooming && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '20px',
                                    right: '20px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    padding: '10px',
                                    borderRadius: '50%',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                    pointerEvents: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#475569'
                                }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Información y Compra */}
                    <div className="premium-product-info">
                        <div className="premium-brand">{producto?.marca || 'Generico'}</div>
                        <h1 className="premium-title">{producto?.nombre}</h1>
                        <div className="premium-price">
                            S/ {formatPrice(producto?.precio_actual || 0)}
                            {producto?.precio_anterior && (
                                <span>S/ {formatPrice(producto.precio_anterior)}</span>
                            )}
                        </div>

                        {flash?.error && (
                            <div style={{ color: '#991b1b', backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                {flash.error}
                            </div>
                        )}

                        {/* Neuromarketing: Indicador de Urgencia */}
                        {producto?.stock > 0 && producto?.stock <= 5 && (
                            <div style={{ 
                                backgroundColor: '#fef2f2', 
                                border: '1px solid #fecaca', 
                                color: '#991b1b', 
                                padding: '14px 18px', 
                                borderRadius: '10px', 
                                marginBottom: '24px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px', 
                                fontWeight: '500', 
                                fontSize: '14px',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                                transition: 'all 0.2s ease',
                                cursor: 'default'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)';
                            }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                <span>Solo quedan <strong>{producto.stock} unidades</strong> en stock.</span>
                            </div>
                        )}

                        <div className="premium-qty-wrapper">
                            <label className="premium-qty-label">Cantidad (Máx. {maxPermitido})</label>
                            <div className="premium-qty-box">
                                <button className="premium-qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1 || isAdding || addSuccess}>-</button>
                                <span className="premium-qty-val">{quantity}</span>
                                <button className="premium-qty-btn" onClick={() => setQuantity(Math.min(maxPermitido, quantity + 1))} disabled={quantity >= maxPermitido || isAdding || addSuccess}>+</button>
                            </div>
                        </div>

                        {baseProducto?.variantes?.length > 1 && <label style={{display:'block',marginBottom:16}}>Elige tu opción
                            <select value={selectedVariantId || ''} onChange={e => { setSelectedVariantId(Number(e.target.value)); setQuantity(1); }} style={{display:'block',width:'100%',padding:12}}>
                                {baseProducto.variantes.map(v => <option key={v.variante_id} value={v.variante_id}>{v.label || v.sku} · S/ {formatPrice(v.precio_actual)}{v.stock <= 0 ? ' · Agotado' : ''}</option>)}
                            </select></label>}
                        {producto.stock > 0 ? (
                            <div className="premium-actions">
                                <button className="premium-btn-cart" onClick={(e) => handleBuyNow(e)} disabled={isAdding || addSuccess}>
                                    {isAdding ? (
                                        <div style={{ width: '20px', height: '20px', border: '3px solid rgba(0,0,0,0.1)', borderTop: '3px solid #111827', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                    ) : addSuccess ? (
                                        <>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            <span style={{ color: '#10b981' }}>¡Añadido!</span>
                                        </>
                                    ) : (
                                        <>
                                            Al carrito
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
                                        </>
                                    )}
                                </button>
                                <button className="premium-btn-buy" onClick={handleQuickBuy} disabled={isAdding || addSuccess}>
                                    Comprar Ahora
                                </button>
                            </div>
                        ) : (
                            <div className="premium-actions">
                                <button className="premium-btn-cart" disabled style={{ opacity: 0.5, cursor: 'not-allowed', width: '100%' }}>Sin stock</button>
                            </div>
                        )}

                        <div style={{ marginBottom: '24px' }}>
                            <button onClick={() => { if (auth?.user) { setIsListModalOpen(true); } else { router.get('/login'); } }} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: '#64748b', fontSize: '14px', fontWeight: '600', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#004797'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                Agregar a Mis listas
                            </button>
                        </div>

                        <div className="premium-delivery-card">
                            <h4 className="premium-delivery-title">Opciones de entrega</h4>
                            <div className="premium-delivery-item">
                                <div className="premium-delivery-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                                </div>
                                <div className="premium-delivery-content">
                                    <div className="premium-delivery-name">Envío a domicilio</div>
                                    {producto?.envio_domicilio ? (
                                        <div className="premium-delivery-status status-ok">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                            Disponible
                                        </div>
                                    ) : (
                                        <div className="premium-delivery-status status-no">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            No disponible
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="premium-delivery-item">
                                <div className="premium-delivery-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                                </div>
                                <div className="premium-delivery-content">
                                    <div className="premium-delivery-name">Retiro en tienda</div>
                                    {producto?.retiro_tienda ? (
                                        <div className="premium-delivery-status status-ok">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                            Disponible
                                        </div>
                                    ) : (
                                        <div className="premium-delivery-status status-no">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            No disponible
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                    {/* Secciones inferiores - TABS */}
                    <div className="premium-tabs-container">
                        {/* Tab Header */}
                        <div className="premium-tabs-header">
                            <button
                                onClick={() => setActiveTab('desc')}
                                className={`premium-tab-btn ${activeTab === 'desc' ? 'is-active' : ''}`}
                            >
                                DESCRIPCIÓN DEL PRODUCTO
                            </button>
                            <button
                                onClick={() => setActiveTab('specs')}
                                className={`premium-tab-btn ${activeTab === 'specs' ? 'is-active' : ''}`}
                            >
                                ESPECIFICACIONES
                            </button>
                            <button
                                onClick={() => setActiveTab('warranty')}
                                className={`premium-tab-btn ${activeTab === 'warranty' ? 'is-active' : ''}`}
                            >
                                CAMBIOS Y DEVOLUCIONES
                            </button>
                        </div>

                    {/* Tab Content */}
                    <div style={{ padding: 'clamp(0.75rem, 3vw, 1.875rem)', backgroundColor: 'white' }}>
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
            <BundleSection producto={producto} recomendados={recomendados} fireConfetti={fireConfetti} cartPost={cartPost} />

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
                            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 13.75rem), 1fr))',
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
                                        e.currentTarget.style.borderColor = '#004797';
                                        e.currentTarget.style.boxShadow =
                                            '0 10px 25px rgba(0, 71, 151, 0.1)';
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
                                    onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_IMAGE; }}
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
                                                    color: '#004797',
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
                                                    color: '#004797',
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
                        onClick={handleBuyNow}
                        className={`efe-producto-btn efe-producto-btn-buy efe-btn-anim ${isAdding ? 'is-adding' : ''}`}
                        disabled={!producto?.stock || producto.stock <= 0 || isAdding || addSuccess}
                        style={{ width: '100%', minHeight: '44px' }}
                    >
                        {isAdding ? 'Agregando...' : 'Comprar ahora'}
                    </button>
                </div>
            )}

            <ProductReviews productId={producto.id} />
            <div style={{ flexGrow: 1 }}></div>
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
                onSuccessCallback={() => handleBuyNow()}
            />

            <AddToListModal
                isOpen={isListModalOpen}
                onClose={() => setIsListModalOpen(false)}
                producto={producto}
            />
        </div>
    );
}
