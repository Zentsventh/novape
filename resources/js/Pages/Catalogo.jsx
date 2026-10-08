import { cartPost } from '../utils/cartRequest';
import { useEffect, useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import FadeIn from '../Components/Animations/FadeIn';
import { AnimatedList } from '../Components/Animations/AnimatedList';
import Header from '../Components/Home/Header';
import CatalogFilters from '../Components/Home/CatalogFilters';
import CategoryNavBar from '../Components/Home/CategoryNavBar';
import CategoryDrawer from '../Components/Home/CategoryDrawer';
import CartDrawer from '../Components/Home/CartDrawer';
import Footer from '../Components/Home/Footer';
import Toast from '../Components/Home/Toast';
import QuickViewModal from '../Components/Home/QuickViewModal';
import AddToListModal from '../Components/Home/AddToListModal';
import { fireConfetti } from '../utils/confetti';
import { DEFAULT_IMAGE } from '../Components/Home/constants';
import ProductCardSkeleton from '../Components/Home/ProductCardSkeleton';
import { useDeviceContext } from '@/Contexts/DeviceContext';

import '../../css/home/base.css';
import '../../css/home/header.css';
import '../../css/home/category-nav.css';
import '../../css/home/category-drawer.css';
import '../../css/home/catalogo.css';
import '../../css/home/cart-drawer.css';
import '../../css/home/brand-stories.css';
import '../../css/home/footer.css';
import BrandStories from '../Components/Home/BrandStories';

const formatPrice = (price) =>
    new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
        price
    );

export default function Catalogo({
    productos = [],
    categorias = [],
    marcasDisponibles = [],
    categoriaActiva = null,
    subcategoriaActiva = null,
    filtros = {},
    totalProductos = 0,
    logoUrl,
    lateralBanners = [],
}) {
    const { cart, flash, errors = {} } = usePage().props;
    const { isMobile, isTablet } = useDeviceContext();
    const compactFilters = isMobile || isTablet;
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCatOpen, setIsCatOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [marca, setMarca] = useState(filtros.marca || '');
    const [precioMin, setPrecioMin] = useState(filtros.precio_min || '');
    const [precioMax, setPrecioMax] = useState(filtros.precio_max || '');
    const [sort, setSort] = useState(typeof filtros.sort === 'string' ? filtros.sort : 'relevancia');
    useEffect(() => {
        setMarca(filtros.marca || '');
        setPrecioMin(filtros.precio_min ?? '');
        setPrecioMax(filtros.precio_max ?? '');
        setSort(typeof filtros.sort === 'string' ? filtros.sort : 'relevancia');
    }, [filtros.marca, filtros.precio_min, filtros.precio_max, filtros.sort]);

    // Animaciones de carrito
    const [addingIds, setAddingIds] = useState({});

    // Estado de carga de filtros
    const [isLoadingFilters, setIsLoadingFilters] = useState(false);

    // Quick View State
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

    // Compatibilidad con paginación
    const productList = Array.isArray(productos) ? productos : (productos?.data || []);
    const totalCount = !Array.isArray(productos) && productos?.total !== undefined ? productos.total : totalProductos;

    useEffect(() => {
        const handleOpenCart = () => setIsCartOpen(true);
        const handleOpenCategories = () => setIsCatOpen(true);
        window.addEventListener('open-cart', handleOpenCart);
        window.addEventListener('open-categories', handleOpenCategories);
        return () => {
            window.removeEventListener('open-cart', handleOpenCart);
            window.removeEventListener('open-categories', handleOpenCategories);
        };
    }, []);

    const activeCategoryParams = useMemo(() => {
        if (filtros.categoria_id) return { categoria_id: filtros.categoria_id };
        if (subcategoriaActiva && categoriaActiva) {
            return { categoria: categoriaActiva, subcategoria: subcategoriaActiva };
        }
        if (subcategoriaActiva) {
            return { subcategoria: subcategoriaActiva };
        }
        if (categoriaActiva) {
            return { categoria: categoriaActiva };
        }
        return {};
    }, [categoriaActiva, subcategoriaActiva, filtros.categoria_id]);

    const applyFilters = () => {
        setIsLoadingFilters(true);
        router.get(
            '/catalogo',
            {
                ...activeCategoryParams,
                q: filtros.q || undefined,
                marca: marca || undefined,
                precio_min: precioMin || undefined,
                precio_max: precioMax || undefined,
                sort: sort !== 'relevancia' ? sort : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => setIsFilterOpen(false),
                onFinish: () => setIsLoadingFilters(false),
            }
        );
    };

    const clearFilters = () => {
        setMarca('');
        setPrecioMin('');
        setPrecioMax('');
        setSort('relevancia');
        setIsLoadingFilters(true);
        router.get(
            '/catalogo',
            { ...activeCategoryParams, q: filtros.q || undefined },
            {
                preserveState: false,
                preserveScroll: true,
                onSuccess: () => setIsFilterOpen(false),
                onFinish: () => setIsLoadingFilters(false),
            }
        );
    };

    const handleAddToCart = (product, quantity = 1, e = null, buyNow = false) => {
        setAddingIds((prev) => ({ ...prev, [product.id]: 'adding' }));
        cartPost(
            '/cart/add',
            {
                producto_id: product.id,
                variante_id: product.variante_id,
                cantidad: quantity,
                precio: product.precio_actual,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (e) fireConfetti(e);
                    setAddingIds((prev) => ({ ...prev, [product.id]: 'success' }));
                    setIsQuickViewOpen(false);
                    if (buyNow) { router.visit('/checkout'); return; }
                    window.dispatchEvent(new CustomEvent('open-cart'));
                    setTimeout(() => {
                        setAddingIds((prev) => ({ ...prev, [product.id]: null }));
                    }, 800);
                },
                onError: () => {
                    setAddingIds((prev) => ({ ...prev, [product.id]: null }));
                },
            }
        );
    };

    const handleQuickView = (product, e) => {
        e.stopPropagation();
        setQuickViewProduct(product);
        setIsQuickViewOpen(true);
    };

    const handleQuickViewAddToCart = (product, qty, e, buyNow = false) => {
        handleAddToCart(product, qty, e, buyNow);
    };

    return (
        <div className="efe-catalogo-page">
            {(errors.precio_min || errors.precio_max) && <p role="alert" style={{ padding: '12px 24px', color: '#991b1b' }}>{errors.precio_min || errors.precio_max}</p>}
            <Head>
                <title>
                    {filtros?.q
                        ? `Resultados para "${filtros.q}"`
                        : (subcategoriaActiva || categoriaActiva
                            ? `${subcategoriaActiva || categoriaActiva} en Oferta`
                            : 'Catálogo de Productos')}
                </title>
                <meta
                    name="description"
                    content="Explora nuestro catálogo completo de productos en NOVAPE. Filtra por categorías, marcas y precios."
                />
                <meta property="og:title" content="Catálogo de Productos - NOVAPE" />
                <meta
                    property="og:description"
                    content="Explora nuestro catálogo completo de productos en NOVAPE. Filtra por categorías, marcas y precios."
                />
            </Head>

            <Toast message={flash?.success} type="success" />
            <Toast message={flash?.error} type="error" />

            <Header
                cartCount={cart?.count || 0}
                onOpenCart={() => setIsCartOpen(true)}
                onOpenCategories={() => setIsCatOpen(true)}
                logoUrl={logoUrl}
                searchQuery={filtros.q || ''}
            />

            {categorias.length > 0 && (
                <CategoryNavBar
                    categorias={categorias}
                    onOpenCategories={() => setIsCatOpen(true)}
                    onSelectCategory={(cat) =>
                        router.get('/catalogo', { categoria: cat.nombre }, { preserveScroll: true })
                    }
                />
            )}

            <div className="catalogo-breadcrumb">
                <div className="catalogo-breadcrumb-inner">
                    <Link href="/">Inicio</Link>
                    <span className="catalogo-breadcrumb-sep">/</span>
                    <span className="catalogo-breadcrumb-active">Catalogo</span>
                    {(categoriaActiva || subcategoriaActiva) && (
                        <>
                            <span className="catalogo-breadcrumb-sep">/</span>
                            <span className="catalogo-breadcrumb-active">
                                {subcategoriaActiva || categoriaActiva}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {(categoriaActiva || subcategoriaActiva || filtros.categoria_id) && marcasDisponibles?.length > 0 && (
                <BrandStories marcas={marcasDisponibles.slice(0, 18)} currentMarca={filtros.marca || ''} />
            )}

            <div className="catalogo-layout">
                <CatalogFilters
                    categorias={categorias} marcas={marcasDisponibles || []}
                    selectedId={filtros.categoria_id} selectedName={subcategoriaActiva || categoriaActiva}
                    marca={marca} setMarca={setMarca}
                    precioMin={precioMin} setPrecioMin={setPrecioMin} precioMax={precioMax} setPrecioMax={setPrecioMax}
                    onApply={applyFilters} onClear={clearFilters} pending={isLoadingFilters}
                    mobile={compactFilters} open={isFilterOpen} onClose={() => setIsFilterOpen(false)}
                    totalCount={totalCount} banners={lateralBanners || []} error={errors.precio_min || errors.precio_max}
                />

                <main className="catalogo-main">
                    <div className="catalogo-top-bar">
                        <div className="catalogo-top-bar-left">
                            {compactFilters && (
                                <button
                                    type="button"
                                    className="btn-filter-mobile"
                                    onClick={() => setIsFilterOpen(true)}
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
                                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                                    </svg>
                                    Filtros
                                </button>
                            )}
                            <div className="catalogo-results-count">
                                <strong>{totalCount}</strong> productos encontrados
                            </div>
                        </div>
                        <div className="catalogo-sort-container">
                            <label htmlFor="sort-select" className={isMobile ? 'hide-mobile' : ''}>
                                Ordenar por:
                            </label>
                            <select
                                id="sort-select"
                                value={sort}
                                onChange={(e) => {
                                    setSort(e.target.value);
                                    setIsLoadingFilters(true);
                                    // Auto apply sort
                                    router.get(
                                        '/catalogo',
                                        {
                                            ...activeCategoryParams,
                                            q: filtros.q || undefined,
                                            marca: marca || undefined,
                                            precio_min: precioMin || undefined,
                                            precio_max: precioMax || undefined,
                                            sort:
                                                e.target.value !== 'relevancia'
                                                    ? e.target.value
                                                    : undefined,
                                        },
                                        {
                                            preserveState: true,
                                            preserveScroll: true,
                                            onFinish: () => setIsLoadingFilters(false),
                                        }
                                    );
                                }}
                                className="catalogo-sort-select"
                            >
                                <option value="relevancia">Relevancia</option>
                                <option value="descuento">Mejor descuento</option>
                                <option value="precio_desc">Mayor precio</option>
                                <option value="precio_asc">Menor precio</option>
                            </select>
                        </div>
                    </div>

                    {productList.length === 0 && !isLoadingFilters ? (
                        <div
                            className="catalogo-empty"
                            style={{
                                opacity: isLoadingFilters ? 0.5 : 1,
                                transition: 'opacity 0.2s',
                            }}
                        >
                            <h3>No encontramos productos</h3>
                            <p>Prueba ajustando los filtros o la busqueda.</p>
                        </div>
                    ) : (
                        <AnimatedList className="catalogo-grid" style={{ position: 'relative' }}>
                            {isLoadingFilters
                                ? Array.from({ length: 8 }).map((_, i) => (
                                      <ProductCardSkeleton
                                          key={i}
                                          className="catalogo-product-card"
                                      />
                                  ))
                                : productList.map((product) => (
                                      <div
                                          key={product.id}
                                          className="catalogo-product-card efe-spotlight-card"
                                      >
                                          {product.descuento > 0 && (
                                              <span className="catalogo-discount-badge">
                                                  -{product.descuento}%
                                              </span>
                                          )}
                                          <div
                                              className="catalogo-product-img"
                                              style={{ position: 'relative' }}
                                          >
                                              <Link className="catalogo-product-link" href={`/producto/${product.slug || product.id}`} aria-label={`Ver ${product.nombre}`}>
                                              {product.imagen ? (
                                                  <img
                                                      src={product.imagen}
                                                      alt={product.nombre}
                                                      loading="lazy"
                                                  />
                                              ) : (
                                                  <div className="catalogo-no-img">
                                                      <img src={DEFAULT_IMAGE} alt="Producto" />
                                                  </div>
                                              )}
                                              </Link>

                                              <button
                                                  className="catalogo-quick-view-btn"
                                                  onClick={(e) => handleQuickView(product, e)}
                                                  title="Vista rápida"
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
                                                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                      <circle cx="12" cy="12" r="3"></circle>
                                                  </svg>
                                              </button>
                                          </div>
                                          <div className="catalogo-product-info">
                                              <span className="catalogo-product-brand">
                                                  {product.marca || 'Sin marca'}
                                              </span>
                                              <h3 className="catalogo-product-name">
                                                  <Link href={`/producto/${product.slug || product.id}`}>{product.nombre}</Link>
                                              </h3>
                                              <div className="catalogo-product-prices">
                                                  {product.precio_anterior &&
                                                      product.precio_anterior >
                                                          product.precio_actual && (
                                                          <span className="catalogo-price-old">
                                                              S/{' '}
                                                              {formatPrice(product.precio_anterior)}
                                                          </span>
                                                      )}
                                                  <span className="catalogo-price-current">
                                                      S/ {formatPrice(product.precio_actual)}
                                                  </span>
                                              </div>
                                              <div className="catalogo-product-tags">
                                                  <span className="catalogo-tag">
                                                      Retiro en tienda
                                                  </span>
                                                  <span className="catalogo-tag">
                                                      Envio a domicilio
                                                  </span>
                                              </div>
                                              {product.stock > 0 ? (
                                                  <button
                                                      type="button"
                                                      className={`catalogo-add-cart ${addingIds[product.id] === 'success' ? 'btn-success-anim' : ''}`}
                                                      onClick={() => handleAddToCart(product)}
                                                      disabled={
                                                          addingIds[product.id] === 'adding' ||
                                                          addingIds[product.id] === 'success'
                                                      }
                                                      style={
                                                          addingIds[product.id] === 'success'
                                                              ? {
                                                                    backgroundColor: '#10b981',
                                                                    color: 'white',
                                                                }
                                                              : {}
                                                      }
                                                  >
                                                      {addingIds[product.id] === 'adding' ? (
                                                          <div
                                                              style={{
                                                                  width: '16px',
                                                                  height: '16px',
                                                                  border: '2px solid rgba(255,255,255,0.3)',
                                                                  borderTop: '2px solid white',
                                                                  borderRadius: '50%',
                                                                  animation:
                                                                      'spin 1s linear infinite',
                                                              }}
                                                          ></div>
                                                      ) : addingIds[product.id] === 'success' ? (
                                                          <>
                                                              <svg
                                                                  width="18"
                                                                  height="18"
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
                                                          'Agregar al carrito'
                                                      )}
                                                  </button>
                                              ) : (
                                                  <button
                                                      type="button"
                                                      className="catalogo-add-cart"
                                                      disabled
                                                      style={{
                                                          backgroundColor: '#d1d5db',
                                                          cursor: 'not-allowed',
                                                      }}
                                                  >
                                                      Sin stock
                                                  </button>
                                              )}
                                          </div>
                                      </div>
                                  ))}
                        </AnimatedList>
                    )}
                    {productos?.last_page > 1 && (
                        <nav className="store-pagination" aria-label="Páginas del catálogo">
                            <p aria-live="polite">Página {productos.current_page} de {productos.last_page}</p>
                            <div>
                                {productos.links?.map((link, index) => link.url ? (
                                    <Link key={index} href={link.url} aria-current={link.active ? 'page' : undefined}
                                        className={link.active ? 'is-active' : ''} preserveState
                                        onStart={() => setIsLoadingFilters(true)} onFinish={() => setIsLoadingFilters(false)}>
                                        {index === 0 ? 'Anterior' : index === productos.links.length - 1 ? 'Siguiente' : link.label}
                                    </Link>
                                ) : <span key={index} aria-disabled="true">{index === 0 ? 'Anterior' : index === productos.links.length - 1 ? 'Siguiente' : link.label}</span>)}
                            </div>
                        </nav>
                    )}
                </main>
            </div>

            <Footer />

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cart={cart} />

            <QuickViewModal
                adding={addingIds[quickViewProduct?.id] === 'adding'}
                isOpen={isQuickViewOpen}
                onClose={() => setIsQuickViewOpen(false)}
                product={quickViewProduct}
                onAddToCart={handleQuickViewAddToCart}
            />

            <CategoryDrawer
                isOpen={isCatOpen}
                onClose={() => setIsCatOpen(false)}
                categorias={categorias}
            />
        </div>
    );
}
