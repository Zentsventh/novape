import '../../../css/home/category-drawer.css';
import useStoreDialog from '../../Hooks/useStoreDialog';
import { useEffect, useMemo, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, X, ArrowUpRight, Search } from 'lucide-react';
import { CategoryBranch } from './CatalogFilters';
import { filterCategoryTree } from '../../utils/categoryNavigation';

export default function CategoryDrawer({ isOpen, onClose, categorias = [] }) {
    const [activeId, setActiveId] = useState(null);
    const [subCategoriesCache, setSubCategoriesCache] = useState({});
    const [loadingSub, setLoadingSub] = useState(false);
    const [search, setSearch] = useState('');
    const dialogRef = useStoreDialog(isOpen, onClose);
    const { auth, filtros = {} } = usePage().props;
    const activeCat = categorias.find((category) => category.id === activeId);
    const visibleCategories = useMemo(() => filterCategoryTree(categorias, search), [categorias, search]);
    const visibleGroups = activeCat ? filterCategoryTree([{ ...activeCat, subcategorias: subCategoriesCache[activeCat.id] || activeCat.subcategorias || [] }], search)[0]?.subcategorias || [] : [];

    useEffect(() => {
        if (!isOpen || !search.trim() || !window.matchMedia('(min-width: 1024px)').matches) return;
        setActiveId(current => visibleCategories.some(category => category.id === current) ? current : visibleCategories[0]?.id ?? null);
    }, [isOpen, search, visibleCategories]);

    // Fetch subcategories when activeId changes if not cached
    useEffect(() => {
        if (!activeId) return;
        
        // If we already have it in cache or it came fully loaded from props, skip fetching
        if (subCategoriesCache[activeId] || (activeCat && activeCat.subcategorias && activeCat.subcategorias.length > 0)) {
            return;
        }

        const fetchSubcategories = async () => {
            setLoadingSub(true);
            try {
                const response = await fetch(`/api/categorias/${activeId}/subcategorias`);
                if (response.ok) {
                    const data = await response.json();
                    setSubCategoriesCache(prev => ({
                        ...prev,
                        [activeId]: data.subcategorias
                    }));
                }
            } catch (error) {
                console.error('Error fetching subcategories:', error);
            } finally {
                setLoadingSub(false);
            }
        };

        fetchSubcategories();
    }, [activeId, activeCat, subCategoriesCache]);

    useEffect(() => {
        const selectCategory = (event) => setActiveId(event.detail.id);
        window.addEventListener('select-store-category', selectCategory);
        return () => window.removeEventListener('select-store-category', selectCategory);
    }, []);

    useEffect(() => {
        if (!isOpen) { setActiveId(null); setSearch(''); return; }
        if (window.matchMedia('(min-width: 1024px)').matches) {
            setActiveId((id) => id ?? categorias[0]?.id ?? null);
        }
    }, [isOpen]);

    if (!isOpen) return null;
    const href = (params = {}) => '/catalogo?' + new URLSearchParams({ categoria_id: activeCat?.id, ...params }).toString();

    return (
        <>
            <div className="efe-cat-drawer-overlay is-open" onClick={onClose} aria-hidden="true" />
            <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="category-drawer-title" className={`efe-cat-drawer is-open ${activeCat ? 'show-right' : ''}`}>
                <div className="efe-cat-drawer-left">
                    <header className="efe-cat-drawer-header">
                        <div><span className="cat-eyebrow">ENCUENTRA LO QUE BUSCAS</span><h2 id="category-drawer-title">{auth?.user?.nombres ? `Hola, ${auth.user.nombres.split(' ')[0]}` : 'Todas las categorías'}</h2></div>
                        <button className="cat-icon-button" onClick={onClose} aria-label="Cerrar categorías"><X size={22} /></button>
                    </header>
                    <div className="efe-cat-drawer-list">
                        <label className="store-filter-search cat-menu-search"><Search size={16} aria-hidden="true" /><input type="search" aria-label="Buscar en todas las categorías" placeholder="¿Qué estás buscando?" value={search} onChange={event => setSearch(event.target.value)} /></label>
                        {visibleCategories.map((cat) => (
                            <button key={cat.id} className={`efe-cat-drawer-item ${activeId === cat.id ? 'is-active' : ''}`} onClick={() => setActiveId(cat.id)} aria-expanded={activeId === cat.id} aria-controls="category-detail">
                                <span>{cat.nombre}</span><ChevronRight size={18} />
                            </button>
                        ))}
                        {!visibleCategories.length && <p className="store-filter-empty" role="status">No encontramos esa categoría.</p>}
                    </div>
                </div>
                <div className="efe-cat-drawer-right" id="category-detail">
                    <div className="cat-detail-top">
                        <button className="cat-back-button" onClick={() => setActiveId(null)}><ChevronLeft size={18} />Categorías</button>
                        <button className="cat-icon-button" onClick={onClose} aria-label="Cerrar menú"><X size={22} /></button>
                    </div>
                    {activeCat && (
                        <>
                            <div className="cat-detail-heading"><span className="cat-eyebrow">EXPLORA NUESTRA TIENDA</span><h3>{activeCat.nombre}</h3><Link prefetch="hover" cacheFor="10s" className="cat-explore-link" href={href()} onClick={onClose}>Ver todos los productos<ArrowUpRight size={17} /></Link></div>
                            <div className="cat-detail-content">
                                {loadingSub ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Cargando subcategorías...</div>
                                ) : (
                                    (subCategoriesCache[activeCat.id] || activeCat.subcategorias)?.length > 0 && (
                                        <section aria-label="Subcategorías" className="cat-menu-groups cat-menu-organized">
                                            <ul className="store-category-tree">
                                                {visibleGroups.map(group => (
                                                    <CategoryBranch key={group.id} category={group} selectedId={filtros.categoria_id}
                                                        selectedName={filtros.subcategoria} searching={Boolean(search.trim())} onNavigate={onClose} />
                                                ))}
                                            </ul>
                                        </section>
                                    )
                                )}
                                {activeCat.marcas?.length > 0 && <section aria-label="Marcas"><h4>Tus marcas favoritas</h4><div className="cat-brand-grid">{activeCat.marcas.map((brand) => <Link prefetch="hover" cacheFor="10s" key={brand.id} href={href({ marca: brand.nombre })} onClick={onClose} className="cat-brand-link">{brand.nombre}</Link>)}</div></section>}
                            </div>
                        </>
                    )}
                </div>
            </section>
        </>
    );
}
