import { useState, useEffect } from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import FadeIn from '../Components/Animations/FadeIn';
import SlideUp from '../Components/Animations/SlideUp';

/* Componentes del Home */
import Header from '../Components/Home/Header';
import CategoryNavBar from '../Components/Home/CategoryNavBar';
import CategoryDrawer from '../Components/Home/CategoryDrawer';
import HeroCarousel from '../Components/Home/HeroCarousel';
import MejorSemanaSection from '../Components/Home/MejorSemanaSection';
import CategorySection from '../Components/Home/CategorySection';
import Footer from '../Components/Home/Footer';

import CartDrawer from '../Components/Home/CartDrawer';
import Toast from '../Components/Home/Toast';
import RecentlyViewed from '../Components/Home/RecentlyViewed';
// Banners removed as per user request
import QuickViewModal from '../Components/Home/QuickViewModal';
import AddToListModal from '../Components/Home/AddToListModal';
import { router } from '@inertiajs/react';
import ErrorBoundary from '../Components/ErrorBoundary';

/* Estilos del Home */
import '../../css/home/base.css';
import '../../css/home/header.css';
import '../../css/home/category-nav.css';
import '../../css/home/category-drawer.css';
import '../../css/home/hero-carousel.css';
import '../../css/home/product-card.css';
import '../../css/home/product-carousel.css';
import '../../css/home/category-section.css';
import '../../css/home/recently-viewed.css';

import '../../css/home/cart-drawer.css';
import '../../css/home/footer.css';

/* Página principal que compone todas las secciones del Home. */
export default function Home({ appName, categoriaProductos = [], mejorSemana = [], banners = [], logoUrl }) {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCatOpen, setIsCatOpen] = useState(false);
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    const [addingIds, setAddingIds] = useState({});
    const [isListModalOpen, setIsListModalOpen] = useState(false);
    const [listModalProduct, setListModalProduct] = useState(null);

    const { cart, flash } = usePage().props;
    const hasCategorias = Array.isArray(categoriaProductos) && categoriaProductos.length > 0;
    const hasBanners = Array.isArray(banners) && banners.length > 0;
    const hasMejorSemana = Array.isArray(mejorSemana) && mejorSemana.length > 0;

    useEffect(() => {
        const handleOpenCart = () => setIsCartOpen(true);
        const handleOpenQuickView = (e) => {
            setQuickViewProduct(e.detail);
            setIsQuickViewOpen(true);
        };
        const handleOpenListModal = (e) => {
            setListModalProduct(e.detail);
            setIsListModalOpen(true);
        };
        
        window.addEventListener('open-cart', handleOpenCart);
        window.addEventListener('open-quick-view', handleOpenQuickView);
        window.addEventListener('open-list-modal', handleOpenListModal);
        
        return () => {
            window.removeEventListener('open-cart', handleOpenCart);
            window.removeEventListener('open-quick-view', handleOpenQuickView);
            window.removeEventListener('open-list-modal', handleOpenListModal);
        };
    }, []);

    const handleQuickViewAddToCart = (product, quantity) => {
        setAddingIds(prev => ({ ...prev, [product.id]: 'adding' }));
		router.post('/cart/add', {
			producto_id: product.id,
			cantidad: quantity,
			precio: product.precio_actual
		}, {
			preserveScroll: true,
			onSuccess: () => {
                setAddingIds(prev => ({ ...prev, [product.id]: 'success' }));
                setIsQuickViewOpen(false);
                setTimeout(() => {
                    setAddingIds(prev => ({ ...prev, [product.id]: null }));
				    window.dispatchEvent(new CustomEvent('open-cart'));
                }, 1000);
			},
			onError: () => {
                setAddingIds(prev => ({ ...prev, [product.id]: null }));
			}
		});
    };

    return (
        <ErrorBoundary>
        <div className="efe-home">
            <Head>
                <title>Inicio - NOVAPE</title>
                <meta name="description" content="Descubre los mejores productos en NOVAPE, tu tienda de confianza. Ofertas exclusivas y envíos a nivel nacional." />
                <meta property="og:title" content="Inicio - NOVAPE" />
                <meta property="og:description" content="Descubre los mejores productos en NOVAPE, tu tienda de confianza. Ofertas exclusivas y envíos a nivel nacional." />
                <meta property="og:type" content="website" />
            </Head>
            
            <Toast message={flash?.success} type="success" />
            <Toast message={flash?.error} type="error" />

            <Header 
                cartCount={cart?.count || 0} 
                onOpenCart={() => setIsCartOpen(true)} 
                onOpenCategories={() => setIsCatOpen(true)}
                logoUrl={logoUrl} 
            />

            {hasCategorias ? (
                <SlideUp delay={0.1}>
                    <CategoryNavBar
                        categorias={categoriaProductos}
                        onOpenCategories={() => setIsCatOpen(true)}
                    />
                </SlideUp>
            ) : (
                <div className="efe-empty-state">No hay categorias disponibles.</div>
            )}

            {/* Cintillo 1: Envío Gratis (inmediatamente debajo del navbar) */}
            <FadeIn delay={0.2}>
                <div className="efe-cintillo-top">
                    <Link href="/catalogo?categoria=Cyber+Bombas">
                        <img 
                            src="/images/cintillo1.webp" 
                            alt="Envío Gratis a todo el Perú" 
                            className="efe-cintillo-top-img"
                        />
                    </Link>
                </div>
            </FadeIn>

            {hasBanners ? (
                <FadeIn delay={0.3}>
                    <HeroCarousel banners={banners} />
                </FadeIn>
            ) : (
                <div className="efe-empty-state">No hay banners activos.</div>
            )}

            <SlideUp delay={0.4}>
                <RecentlyViewed />
            </SlideUp>

            {hasMejorSemana ? (
                <SlideUp delay={0.5}>
                    <MejorSemanaSection productos={mejorSemana} />
                </SlideUp>
            ) : (
                <div className="efe-empty-state">No hay promociones activas.</div>
            )}

            {hasCategorias ? (
                categoriaProductos.map((cat, index) => (
                    <SlideUp key={cat.id} delay={0.6 + (index * 0.1)}>
                        <CategorySection categoria={cat} index={index} />
                    </SlideUp>
                ))
            ) : (
                <div className="efe-empty-state">No hay categorias para mostrar.</div>
            )}


            <FadeIn delay={0.8}>
                <Footer />
            </FadeIn>

            
            <CartDrawer 
                isOpen={isCartOpen} 
                onClose={() => setIsCartOpen(false)} 
                cart={cart} 
            />

            <CategoryDrawer 
                isOpen={isCatOpen} 
                onClose={() => setIsCatOpen(false)} 
                categorias={categoriaProductos} 
            />

            <QuickViewModal 
                isOpen={isQuickViewOpen}
                onClose={() => setIsQuickViewOpen(false)}
                product={quickViewProduct}
                onAddToCart={handleQuickViewAddToCart}
            />

            {/* Cintillo 2: Fijo inferior (Fixed bottom) */}
            <div className="efe-cintillo-bottom">
                <Link href="/catalogo?categoria=Retiro+Inmediato" className="efe-cintillo-bottom-link">
                    <img 
                        src="/images/cintillo2.webp" 
                        alt="Compra hoy, recógelo hoy" 
                        className="efe-cintillo-bottom-img"
                    />
                </Link>
            </div>
        </div>
        </ErrorBoundary>
    );
}
