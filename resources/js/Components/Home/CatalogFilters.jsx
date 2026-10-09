import { useEffect, useId, useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
import { ChevronDown, ChevronRight, Layers, Search, SlidersHorizontal, Tag, Wallet, X } from 'lucide-react';
import useStoreDialog from '../../Hooks/useStoreDialog';
import { normalizeLabel as normalize, filterCategoryTree } from '../../utils/categoryNavigation';
import '../../../css/home/catalog-filters.css';

const isSelected = (category, id, name) => id ? String(category.id) === String(id) : category.nombre === name;
const containsSelected = (category, id, name) => isSelected(category, id, name) || category.subcategorias?.some(child => containsSelected(child, id, name));

export function CategoryBranch({ category, selectedId, selectedName, searching, onNavigate }) {
    const children = category.subcategorias || [];
    const selected = isSelected(category, selectedId, selectedName);
    const inPath = containsSelected(category, selectedId, selectedName);
    const [expanded, setExpanded] = useState(Boolean(inPath));
    const childrenId = useId();
    useEffect(() => setExpanded(Boolean(inPath)), [inPath, selectedId, selectedName]);
    const open = searching || expanded;
    return <li className={`store-category-branch${selected ? ' is-selected' : ''}${inPath ? ' is-in-path' : ''}`}>
        <div className="store-category-row">
            <Link href={`/catalogo?categoria_id=${category.id}`} prefetch="hover" cacheFor="10s"
                aria-current={selected ? 'page' : undefined} onClick={onNavigate}>{category.nombre}</Link>
            {children.length > 0 && <button type="button" onClick={() => setExpanded(!expanded)}
                disabled={searching} aria-expanded={open} aria-controls={childrenId}
                aria-label={`${open ? 'Contraer' : 'Mostrar'} subcategorías de ${category.nombre}`}>
                <ChevronRight size={16} className={open ? 'is-expanded' : ''} />
            </button>}
        </div>
        {children.length > 0 && open && <ul id={childrenId} className="store-category-children">
            {children.map(child => <CategoryBranch key={child.id} category={child} selectedId={selectedId}
                selectedName={selectedName} searching={searching} onNavigate={onNavigate} />)}
        </ul>}
    </li>;
}

function FilterSection({ title, icon: Icon, children }) {
    return <details className="store-filter-section" open>
        <summary><span><Icon size={17} aria-hidden="true" />{title}</span><ChevronDown size={16} aria-hidden="true" /></summary>
        <div className="store-filter-section-content">{children}</div>
    </details>;
}

export default function CatalogFilters({ categorias, marcas, selectedId, selectedName, marca, setMarca,
    precioMin, setPrecioMin, precioMax, setPrecioMax, onApply, onClear, pending, mobile, open, onClose,
    totalCount, banners = [], error }) {
    const [categorySearch, setCategorySearch] = useState('');
    const [brandSearch, setBrandSearch] = useState('');
    const prefix = useId();
    const panel = useStoreDialog(mobile && open, onClose);
    const filteredCategories = useMemo(() => filterCategoryTree(categorias, categorySearch), [categorias, categorySearch]);
    const filteredBrands = useMemo(() => marcas.filter(brand => normalize(brand.nombre).includes(normalize(brandSearch))), [marcas, brandSearch]);
    const activeCount = Number(Boolean(marca)) + Number(precioMin !== '' && precioMin != null) + Number(precioMax !== '' && precioMax != null);
    const navigate = () => { if (mobile) onClose(); };
    if (mobile && !open) return null;

    return <>
        {mobile && <div className="store-filter-overlay" onClick={onClose} aria-hidden="true" />}
        <aside ref={panel} tabIndex={-1} className={`catalogo-sidebar store-filter-sidebar${mobile ? ' is-mobile' : ''}`}
            role={mobile ? 'dialog' : undefined} aria-modal={mobile ? true : undefined} aria-labelledby={`${prefix}-title`}>
            <form className="store-filter-panel" onSubmit={event => { event.preventDefault(); if (!pending) onApply(); }}>
                <header className="store-filter-header">
                    <div className="store-filter-heading"><span className="store-filter-heading-icon"><SlidersHorizontal size={18} /></span>
                        <div><h2 id={`${prefix}-title`}>Filtrar productos</h2><p>Encuentra lo que necesitas</p></div></div>
                    {mobile && <button type="button" className="store-filter-close" onClick={onClose} aria-label="Cerrar filtros"><X size={21} /></button>}
                </header>
                <div className="store-filter-content">
                    <FilterSection title="Categorías" icon={Layers}>
                        <label className="store-filter-search"><Search size={16} aria-hidden="true" /><input type="search"
                            value={categorySearch} onChange={event => setCategorySearch(event.target.value)} placeholder="Buscar categoría" aria-label="Buscar categoría" /></label>
                        <nav aria-label="Categorías del catálogo" className="store-filter-category-list">
                            <Link href="/catalogo" className={`store-filter-all${!selectedId && !selectedName ? ' is-selected' : ''}`}
                                aria-current={!selectedId && !selectedName ? 'page' : undefined} onClick={navigate}>Todos los productos</Link>
                            <ul className="store-category-tree">{filteredCategories.map(category => <CategoryBranch key={category.id}
                                category={category} selectedId={selectedId} selectedName={selectedName} searching={Boolean(categorySearch.trim())} onNavigate={navigate} />)}</ul>
                            {!filteredCategories.length && <p className="store-filter-empty" role="status">No encontramos esa categoría.</p>}
                        </nav>
                    </FilterSection>
                    <FilterSection title="Marcas" icon={Tag}>
                        <label className="store-filter-search"><Search size={16} aria-hidden="true" /><input type="search"
                            value={brandSearch} onChange={event => setBrandSearch(event.target.value)} placeholder="Buscar marca" aria-label="Buscar marca" /></label>
                        <fieldset className="store-filter-brands" disabled={pending}><legend className="store-filter-sr-only">Elige una marca</legend>
                            {[{ nombre: '', count: null }, ...filteredBrands].map(brand => <label key={brand.nombre} className={`store-filter-brand${marca === brand.nombre ? ' is-selected' : ''}`}>
                                <input type="radio" name="marca" value={brand.nombre} checked={marca === brand.nombre} onChange={() => setMarca(brand.nombre)} />
                                <span>{brand.nombre || 'Todas las marcas'}</span>{brand.count != null && <small>{brand.count}</small>}
                            </label>)}
                            {!filteredBrands.length && <p className="store-filter-empty" role="status">No encontramos esa marca.</p>}
                        </fieldset>
                    </FilterSection>
                    <FilterSection title="Precio" icon={Wallet}>
                        <p className="store-filter-hint">Define tu presupuesto en soles</p>
                        <div className="store-filter-price-grid">{[
                            ['min', 'Desde', precioMin, setPrecioMin], ['max', 'Hasta', precioMax, setPrecioMax],
                        ].map(([key, label, value, setValue]) => <div key={key}><label htmlFor={`${prefix}-${key}`}>{label}</label>
                            <div className="store-filter-price-input"><span aria-hidden="true">S/</span><input id={`${prefix}-${key}`} type="number" min="0" step="0.01"
                                inputMode="decimal" placeholder={key === 'min' ? '0' : 'Sin límite'} value={value} disabled={pending} onChange={event => setValue(event.target.value)} /></div>
                        </div>)}</div>
                    </FilterSection>
                </div>
                <footer className="store-filter-footer">{error && <p role="alert" className="store-filter-error">{error}</p>}<p aria-live="polite">{activeCount ? `${activeCount} ${activeCount === 1 ? 'ajuste seleccionado' : 'ajustes seleccionados'}` : `${new Intl.NumberFormat('es-PE').format(totalCount)} productos para explorar`}</p>
                    <div><button type="button" className="store-filter-reset" onClick={onClear} disabled={pending}>Restablecer</button>
                        <button type="submit" className="store-filter-apply" disabled={pending}>{pending ? 'Actualizando…' : 'Ver resultados'}</button></div>
                </footer>
            </form>
            {!mobile && banners.length > 0 && <div className="store-filter-banners">{banners.map(banner => <div key={banner.id}>
                {banner.enlace_url ? <a href={banner.enlace_url} target="_blank" rel="noreferrer"><img src={banner.imagen_url} alt={banner.titulo || 'Promoción'} loading="lazy" /></a>
                    : <img src={banner.imagen_url} alt={banner.titulo || 'Promoción'} loading="lazy" />}
            </div>)}</div>}
        </aside>
    </>;
}
