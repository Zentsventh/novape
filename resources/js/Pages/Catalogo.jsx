import { useEffect, useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import FadeIn from '../Components/Animations/FadeIn';
import { AnimatedList } from '../Components/Animations/AnimatedList';
import Header from '../Components/Home/Header';
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
import '../../css/home/recently-viewed.css';
import '../../css/home/footer.css';
import RecentlyViewed from '../Components/Home/RecentlyViewed';

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
    const { cart, flash } = usePage().props;
    const { isMobile } = useDeviceContext();
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isCatOpen, setIsCatOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [marca, setMarca] = useState(filtros.marca || '');
    const [precioMin, setPrecioMin] = useState(filtros.precio_min || '');
    const [precioMax, setPrecioMax] = useState(filtros.precio_max || '');
    const [marcaSearch, setMarcaSearch] = useState('');
    const [sort, setSort] = useState(filtros.sort || 'relevancia');

    // Animaciones de carrito
    const [addingIds, setAddingIds] = useState({});

    // Estado de carga de filtros
    const [isLoadingFilters, setIsLoadingFilters] = useState(false);

    // Quick View State
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

    useEffect(() => {
        const handleOpenCart = () => setIsCartOpen(true);
        window.addEventListener('open-cart', handleOpenCart);
        return () => window.removeEventListener('open-cart', handleOpenCart);
    }, []);

    const activeCategoryParams = useMemo(() => {
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
    }, [categoriaActiva, subcategoriaActiva]);

    const filteredBrands = useMemo(() => {
        if (!marcaSearch.trim()) return marcasDisponibles;
        const term = marcaSearch.trim().toLowerCase();
        return marcasDisponibles.filter((item) => item.nombre.toLowerCase().includes(term));
    }, [marcaSearch, marcasDisponibles]);

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
            {},
            {
                preserveState: false,
                preserveScroll: true,
                onFinish: () => setIsLoadingFilters(false),
            }
        );
    };

    const handleAddToCart = (product, quantity = 1, e = null) => {
        setAddingIds((prev) => ({ ...prev, [product.id]: 'adding' }));
        router.post(
            '/cart/add',
            {
                producto_id: product.id,
                cantidad: quantity,
                precio: product.precio_actual,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (e) fireConfetti(e);
                    setAddingIds((prev) => ({ ...prev, [product.id]: 'success' }));
                    setIsQuickViewOpen(false);
                    setTimeout(() => {
                        setAddingIds((prev) => ({ ...prev, [product.id]: null }));
                        window.dispatchEvent(new CustomEvent('open-cart'));
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

    const handleQuickViewAddToCart = (product, qty, e) => {
        handleAddToCart(product, qty, e);
    };

    return (
        <div className="efe-catalogo-page">
            <Head>
                <title>Catálogo de Productos - NOVAPE</title>
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

            <RecentlyViewed />

            <div className="catalogo-layout">
                {isMobile && isFilterOpen && (
                    <div
                        className="efe-search-overlay"
                        onClick={() => setIsFilterOpen(false)}
                        style={{ zIndex: 8999 }}
                    ></div>
                )}
                <aside
                    className={`catalogo-sidebar ${isMobile && isFilterOpen ? 'bottom-sheet-mobile' : ''} ${isMobile && !isFilterOpen ? 'hide-mobile' : ''}`}
                    style={
                        isMobile && isFilterOpen
                            ? {
                                  zIndex: 9000,
                                  background: '#f3f4f6',
                                  padding: '20px',
                                  overflowY: 'auto',
                              }
                            : {}
                    }
                >
                    {isMobile && isFilterOpen && (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '16px',
                            }}
                        >
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Filtros</h2>
                            <button
                                onClick={() => setIsFilterOpen(false)}
                                style={{ background: 'none', border: 'none', padding: '8px' }}
                            >
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    )}
                    <div className="catalogo-filter-card">
                        <h3 className="catalogo-filter-title">Categorias</h3>
                        {categorias.length === 0 ? (
                            <div className="catalogo-empty">
                                <p>No hay categorias disponibles.</p>
                            </div>
                        ) : (
                            <div className="catalogo-cat-links">
                                <Link
                                    href="/catalogo"
                                    className={`catalogo-cat-link ${!categoriaActiva && !subcategoriaActiva ? 'is-active' : ''}`}
                                >
                                    Todas
                                </Link>
                                {categorias.map((cat) => (
                                    <div key={cat.id}>
                                        <Link
                                            href={`/catalogo?categoria=${encodeURIComponent(cat.nombre)}`}
                                            className={`catalogo-cat-link ${categoriaActiva === cat.nombre ? 'is-active' : ''}`}
                                        >
                                            {cat.nombre}
                                        </Link>
                                        {categoriaActiva === cat.nombre &&
                                            cat.subcategorias?.map((sub) => (
                                                <Link
                                                    key={sub.id}
                                                    href={`/catalogo?categoria=${encodeURIComponent(cat.nombre)}&subcategoria=${encodeURIComponent(sub.nombre)}`}
                                                    className={`catalogo-cat-link catalogo-cat-sub ${subcategoriaActiva === sub.nombre ? 'is-active' : ''}`}
                                                >
                                                    {sub.nombre}
                                                </Link>
                                            ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="catalogo-filter-card">
                        <h3 className="catalogo-filter-title">Marcas</h3>
                        <div className="catalogo-brand-search">
                            <input
                                type="text"
                                placeholder="Buscar marca..."
                                value={marcaSearch}
                                onChange={(e) => setMarcaSearch(e.target.value)}
                                className="catalogo-brand-input"
                            />
                        </div>
                        <div className="catalogo-marca-list">
                            <label className="catalogo-marca-item efe-custom-radio">
                                <input
                                    type="radio"
                                    name="marca"
                                    checked={marca === ''}
                                    onChange={() => setMarca('')}
                                />
                                <span className="efe-radio-mark"></span>
                                <span className="efe-radio-text">Todas las marcas</span>
                            </label>
                            {filteredBrands.map((b) => (
                                <label className="catalogo-marca-item efe-custom-radio" key={b.id}>
                                    <input
                                        type="radio"
                                        name="marca"
                                        checked={marca === b.nombre}
                                        onChange={() => setMarca(b.nombre)}
                                    />
                                    <span className="efe-radio-mark"></span>
                                    <span className="efe-radio-text">{b.nombre}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {lateralBanners && lateralBanners.length > 0 && (
                        <div
                            className="catalogo-lateral-banners"
                            style={{
                                marginTop: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                            }}
                        >
                            {lateralBanners.map((banner) => (
                                <div
                                    key={banner.id}
                                    className="lateral-banner-card"
                                    style={{
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                    }}
                                >
                                    {banner.enlace_url ? (
                                        <a
                                            href={banner.enlace_url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <img
                                                src={banner.imagen_url}
                                                alt={banner.titulo}
                                                style={{
                                                    width: '100%',
                                                    display: 'block',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                        </a>
                                    ) : (
                                        <img
                                            src={banner.imagen_url}
                                            alt={banner.titulo}
                                            style={{
                                                width: '100%',
                                                display: 'block',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="catalogo-filter-card">
                        <h3 className="catalogo-filter-title">Precio</h3>
                        <div className="catalogo-precio-inputs">
                            <div className="catalogo-precio-field">
                                <label>Min</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={precioMin}
                                    onChange={(event) => setPrecioMin(event.target.value)}
                                />
                            </div>
                            <div className="catalogo-precio-field">
                                <label>Max</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={precioMax}
                                    onChange={(event) => setPrecioMax(event.target.value)}
                                />
                            </div>
                        </div>
                        <div className="catalogo-filter-actions">
                            <button
                                type="button"
                                className="catalogo-btn-outline"
                                onClick={clearFilters}
                            >
                                Limpiar
                            </button>
                            <button
                                type="button"
                                className="catalogo-btn-primary"
                                onClick={applyFilters}
                            >
                                Aplicar
                            </button>
                        </div>
                    </div>
                </aside>

                <main className="catalogo-main">
                    <div className="catalogo-top-bar">
                        {isMobile && (
                            <button
                                type="button"
                                className="catalogo-btn-primary"
                                onClick={() => setIsFilterOpen(true)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
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
                                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                                </svg>
                                Filtros
                            </button>
                        )}
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
                        <div className="catalogo-results-count hide-mobile">
                            {totalProductos} resultados
                        </div>
                    </div>

                    {productos.length === 0 && !isLoadingFilters ? (
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
                                : productos.map((product) => (
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
                                              onClick={() =>
                                                  router.get(
                                                      `/producto/${product.slug || product.id}`
                                                  )
                                              }
                                              style={{ position: 'relative' }}
                                          >
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
                                                  {product.nombre}
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
                </main>
            </div>

            <Footer />

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cart={cart} />

            <QuickViewModal
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
