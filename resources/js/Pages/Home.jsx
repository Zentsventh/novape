import { cartPost } from '../utils/cartRequest';
import { ShippingBanner } from '../Components/Home/Banners';
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import FadeIn from '../Components/Animations/FadeIn';
import SlideUp from '../Components/Animations/SlideUp';

/* Componentes del Home */
import Header from '../Components/Home/Header';
import LoadingSpinner from '../Components/LoadingSpinner';
const CategoryNavBar = React.lazy(() => import('../Components/Home/CategoryNavBar'));
const CategoryDrawer = React.lazy(() => import('../Components/Home/CategoryDrawer'));
const HeroCarousel = React.lazy(() => import('../Components/Home/HeroCarousel'));
const MejorSemanaSection = React.lazy(() => import('../Components/Home/MejorSemanaSection'));
const CategorySection = React.lazy(() => import('../Components/Home/CategorySection'));
const Footer = React.lazy(() => import('../Components/Home/Footer'));
const QuickViewModal = React.lazy(() => import('../Components/Home/QuickViewModal'));


import { useLocation } from '@/Contexts/LocationContext';

import CartDrawer from '../Components/Home/CartDrawer';
import Toast from '../Components/Home/Toast';
import BrandStories from '../Components/Home/BrandStories';
import FavoriteCategories from '../Components/Home/FavoriteCategories';
import PromoSection from '../Components/Home/PromoSection';
const CintilloCarousel = React.lazy(() => import('../Components/Home/CintilloCarousel'));

const AddToListModal = React.lazy(() => import('../Components/Home/AddToListModal'));
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
import '../../css/home/brand-stories.css';

import '../../css/home/cart-drawer.css';
import '../../css/home/footer.css';

/* Página principal que compone todas las secciones del Home. */
export default function Home({ appName, categoriaProductos = [], mejorSemana = [], banners = [], topMarcas = [], logoUrl }) {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCatOpen, setIsCatOpen] = useState(false);
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    const [addingIds, setAddingIds] = useState({});
    const [isListModalOpen, setIsListModalOpen] = useState(false);
    const [listModalProduct, setListModalProduct] = useState(null);

    const { cart, flash } = usePage().props;
    const { location } = useLocation();
    const hasCategorias = Array.isArray(categoriaProductos) && categoriaProductos.length > 0;
    const heroBanners = Array.isArray(banners) ? banners.filter(b => b.posicion === 'hero' || !b.posicion) : [];
    const hasBanners = heroBanners.length > 0;
    
    const promo1Banners = Array.isArray(banners) ? banners.filter(b => b.posicion === 'promocional_1').map(b => ({ img: b.imagen_url || b.image, link: b.enlace_url || b.link_url || '#' })) : [];
    const promo2Banners = Array.isArray(banners) ? banners.filter(b => b.posicion === 'promocional_2').map(b => ({ img: b.imagen_url || b.image, link: b.enlace_url || b.link_url || '#' })) : [];
    const promo3Banners = Array.isArray(banners) ? banners.filter(b => b.posicion === 'promocional_3').map(b => ({ img: b.imagen_url || b.image, link: b.enlace_url || b.link_url || '#' })) : [];
    const hasMejorSemana = Array.isArray(mejorSemana) && mejorSemana.length > 0;

    useEffect(() => {
        const handleOpenCart = () => setIsCartOpen(true);
        const handleOpenCategories = () => setIsCatOpen(true);
        const handleOpenQuickView = (e) => {
            setQuickViewProduct(e.detail);
            setIsQuickViewOpen(true);
        };
        const handleOpenListModal = (e) => {
            setListModalProduct(e.detail);
            setIsListModalOpen(true);
        };

        window.addEventListener('open-cart', handleOpenCart);
        window.addEventListener('open-categories', handleOpenCategories);
        window.addEventListener('open-quick-view', handleOpenQuickView);
        window.addEventListener('open-list-modal', handleOpenListModal);

        return () => {
            window.removeEventListener('open-cart', handleOpenCart);
            window.removeEventListener('open-categories', handleOpenCategories);
            window.removeEventListener('open-quick-view', handleOpenQuickView);
            window.removeEventListener('open-list-modal', handleOpenListModal);
        };
    }, []);

    const handleQuickViewAddToCart = (product, quantity, event, buyNow = false) => {
        setAddingIds(prev => ({ ...prev, [product.id]: 'adding' }));
        cartPost('/cart/add', {
            producto_id: product.id,
            variante_id: product.variante_id,
            cantidad: quantity,
            precio: product.precio_actual
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setAddingIds(prev => ({ ...prev, [product.id]: 'success' }));
                setIsQuickViewOpen(false);
                if (buyNow) { router.visit('/checkout'); return; }
                window.dispatchEvent(new CustomEvent('open-cart'));
                setTimeout(() => {
                    setAddingIds(prev => ({ ...prev, [product.id]: null }));
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
                    <title>Novape | Tu tienda de electrodomésticos y tecnología</title>
                    <meta head-key="description" name="description" content="Tecnología y electrohogar en NOVAPE, con entrega en Lima Metropolitana. Consulta disponibilidad y costo de entrega antes de pagar." />
                    <meta property="og:title" content="Inicio - NOVAPE" />
                    <meta property="og:description" content="Tecnología y electrohogar en NOVAPE, con entrega en Lima Metropolitana. Consulta disponibilidad y costo de entrega antes de pagar." />
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
                        <Suspense fallback={<LoadingSpinner />}>
                            <CategoryNavBar
                                categorias={categoriaProductos}
                                onOpenCategories={() => setIsCatOpen(true)}
                            />
                        </Suspense>
                    </SlideUp>
                ) : (
                    <div className="efe-empty-state">No hay categorias disponibles.</div>
                )}

                {/* Cintillo 1: Envío Gratis (inmediatamente debajo del navbar) */}
                <FadeIn delay={0.2}>
                    <ShippingBanner />
                </FadeIn>

                {hasBanners ? (
                    <FadeIn delay={0.3}>
                        <Suspense fallback={<LoadingSpinner />}>
                            <HeroCarousel banners={heroBanners} />
                        </Suspense>
                    </FadeIn>
                ) : (
                    <div className="efe-empty-state">No hay banners activos.</div>
                )}

                <SlideUp delay={0.4}>
                    <FavoriteCategories />
                </SlideUp>

                {/* Promo Section 1: Cine en casa con Cintillos integrados */}
                <SlideUp delay={0.45}>
                    <PromoSection
                        title="Vive el cine <strong>en casa</strong>"
                        mainBanners={promo1Banners.length > 0 ? promo1Banners : [{ img: '/storage/categorias_img/cintillo_VS_01.1.webp', link: '/catalogo?categoria_id=127' }]}
                        subBanners={[
                            { img: '/storage/categorias_img/efe-destacado-b2c-1-video-01.webp', link: '/catalogo?categoria_id=136' },
                            { img: '/storage/categorias_img/efe-destacado-b2c-2-video-01.webp', link: '/catalogo?categoria_id=136' },
                            { img: '/storage/categorias_img/efe-destacado-b2c-3-video-01_1.webp', link: '/catalogo?categoria_id=136' }
                        ]}
                    />
                </SlideUp>

                {hasMejorSemana ? (
                    <SlideUp delay={0.5}>
                        <Suspense fallback={<LoadingSpinner />}>
                            <MejorSemanaSection productos={mejorSemana} />
                        </Suspense>
                    </SlideUp>
                ) : (
                    <div className="efe-empty-state">No hay promociones activas.</div>
                )}

                <SlideUp delay={0.6}>
                    <PromoSection
                        title="Renueva tu <strong>hogar</strong>"
                        mainBanners={promo2Banners.length > 0 ? promo2Banners : [{ img: '/storage/categorias_img/EFE_cintillo_hogar_01.webp', link: '/catalogo?categoria_id=254' }]}
                        subBanners={[
                            { img: '/storage/categorias_img/IMG_7247.webp', link: '/catalogo?categoria_id=229', colSpan: 2 },
                            { img: '/storage/categorias_img/efe-destacado-b2c-2-hogar-01.webp', link: '/catalogo?categoria_id=254', colSpan: 1 },
                            { img: '/storage/categorias_img/IMG_7249.webp', link: '/catalogo?categoria_id=254', colSpan: 1 },
                            { img: '/storage/categorias_img/efe-destacado-b2c-4-hogar-01_1.webp', link: '/catalogo?categoria_id=254', colSpan: 2 },
                            { img: '/storage/categorias_img/efe-destacado-b2c-5-hogar-01_1.webp', link: '/catalogo?categoria_id=254', colSpan: 2 }
                        ]}
                    />
                </SlideUp>

                {/* Electrohogar Category Section inserted here */}
                {hasCategorias && categoriaProductos.find(cat => cat.nombre.toLowerCase() === 'electrohogar' && cat.productos?.length > 0) && (
                    <SlideUp delay={0.65}>
                        <Suspense fallback={<LoadingSpinner />}>
                            <CategorySection
                                categoria={categoriaProductos.find(cat => cat.nombre.toLowerCase() === 'electrohogar')}
                                index={0}
                            />
                        </Suspense>
                    </SlideUp>
                )}
                {/* Fallback if Electrohogar doesn't exist but we have categories (render the first one) */}
                {hasCategorias && !categoriaProductos.find(cat => cat.nombre.toLowerCase() === 'electrohogar' && cat.productos?.length > 0) && categoriaProductos.filter(cat => cat.productos?.length > 0)[0] && (
                    <SlideUp delay={0.65}>
                        <Suspense fallback={<LoadingSpinner />}>
                            <CategorySection
                                categoria={categoriaProductos.filter(cat => cat.productos?.length > 0)[0]}
                                index={0}
                            />
                        </Suspense>
                    </SlideUp>
                )}

                <SlideUp delay={0.7}>
                    <PromoSection
                        title="Lo mejor en <strong>tecnología</strong>"
                        mainBanners={promo3Banners.length > 0 ? promo3Banners : [{ img: '/storage/categorias_img/EFE_cintillo_Laptop_01.webp', link: '/catalogo?categoria_id=148' }]}
                        subBanners={[
                            { img: '/storage/categorias_img/efe-destacado-b2c-1-video-01_2.webp', link: '/catalogo?categoria_id=136', colSpan: 3 }, // TV Samsung (Televisores)
                            { img: '/storage/categorias_img/efe-destacado-b2c-2-computo-01_1.webp', link: '/catalogo?categoria_id=148', colSpan: 3 }, // Laptop HP (Laptops)
                            { img: '/storage/categorias_img/efe-destacado-b2c-3-computo-01.webp', link: '/catalogo?categoria_id=17', colSpan: 2 },  // Impresora (Cómputo/Impresoras)
                            { img: '/storage/categorias_img/efe-destacado-b2c-4-audio-01.webp', link: '/catalogo?categoria_id=16', colSpan: 2 },   // Soundbar JBL (Audio)
                            { img: '/storage/categorias_img/efe-destacado-b2c-5-digital-01.webp', link: '/catalogo?categoria_id=19', colSpan: 2 }  // Nintendo Switch (Videojuegos/Consolas)
                        ]}
                    />
                </SlideUp>

                {/* Tecnologia Category Section inserted here */}
                {hasCategorias && categoriaProductos.find(cat => cat.nombre.toLowerCase().includes('tecnolog') && cat.productos?.length > 0) && (
                    <SlideUp delay={0.75}>
                        <Suspense fallback={<LoadingSpinner />}>
                            <CategorySection
                                categoria={categoriaProductos.find(cat => cat.nombre.toLowerCase().includes('tecnolog'))}
                                index={1}
                                customTitle="Tecnología"
                            />
                        </Suspense>
                    </SlideUp>
                )}
                {/* Fallback if Tecnologia doesn't exist but we have categories (render the second one) */}
                {hasCategorias && !categoriaProductos.find(cat => cat.nombre.toLowerCase().includes('tecnolog') && cat.productos?.length > 0) && categoriaProductos.filter(cat => cat.productos?.length > 0)[1] && (
                    <SlideUp delay={0.75}>
                        <Suspense fallback={<LoadingSpinner />}>
                            <CategorySection
                                categoria={categoriaProductos.filter(cat => cat.productos?.length > 0)[1]}
                                index={1}
                                customTitle="Tecnología"
                            />
                        </Suspense>
                    </SlideUp>
                )}

                {hasCategorias ? (
                    categoriaProductos
                        .filter((cat) => cat.productos?.length > 0)
                        .filter((cat, idx, arr) => {
                            const electro = arr.find(c => c.nombre.toLowerCase() === 'electrohogar');
                            const tecno = arr.find(c => c.nombre.toLowerCase().includes('tecnolog'));

                            if (electro && cat.id === electro.id) return false;
                            if (tecno && cat.id === tecno.id) return false;

                            // Si no hay electro/tecno explícitos, omitir los dos primeros (ya renderizados como fallback)
                            if (!electro && cat.id === arr[0].id) return false;
                            if (!tecno && arr[1] && cat.id === arr[1].id) return false;

                            return true;
                        })
                        .slice(0, 1) // Just render one more for the bottom, or change to 2 if needed
                        .map((cat, index) => (
                            <SlideUp key={cat.id} delay={0.8 + (index * 0.05)}>
                                <Suspense fallback={<LoadingSpinner />}>
                                    <CategorySection categoria={cat} index={index + 2} />
                                </Suspense>
                            </SlideUp>
                        ))
                ) : (
                    <div className="efe-empty-state">No hay categorias para mostrar.</div>
                )}

                <SlideUp delay={0.9}>
                    <BrandStories marcas={topMarcas} currentMarca="" />
                </SlideUp>

                <FadeIn delay={0.8}>
                    <Suspense fallback={<div className="loading">Cargando pie…</div>}>
                        <Footer />
                    </Suspense>
                </FadeIn>


                <CartDrawer
                    isOpen={isCartOpen}
                    onClose={() => setIsCartOpen(false)}
                    cart={cart}
                />

                <Suspense fallback={<LoadingSpinner />}>
                    <CategoryDrawer
                        isOpen={isCatOpen}
                        onClose={() => setIsCatOpen(false)}
                        categorias={categoriaProductos}
                    />
                </Suspense>

                <Suspense fallback={<LoadingSpinner />}>
                    <QuickViewModal
                        adding={addingIds[quickViewProduct?.id] === 'adding'}
                        isOpen={isQuickViewOpen}
                        onClose={() => setIsQuickViewOpen(false)}
                        product={quickViewProduct}
                        onAddToCart={handleQuickViewAddToCart}
                    />
                </Suspense>

            </div>
        </ErrorBoundary>
    );
}
