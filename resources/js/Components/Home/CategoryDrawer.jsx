import '../../../css/home/category-drawer.css';
import { useEffect, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, X, ArrowUpRight } from 'lucide-react';

export default function CategoryDrawer({ isOpen, onClose, categorias = [] }) {
    const [activeId, setActiveId] = useState(null);
    const dialogRef = useRef(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    const { auth } = usePage().props;
    const activeCat = categorias.find((category) => category.id === activeId);

    useEffect(() => {
        const selectCategory = (event) => setActiveId(event.detail.id);
        window.addEventListener('select-store-category', selectCategory);
        return () => window.removeEventListener('select-store-category', selectCategory);
    }, []);

    useEffect(() => {
        if (!isOpen) { setActiveId(null); return; }
        if (window.matchMedia('(min-width: 1024px)').matches) {
            setActiveId((id) => id ?? categorias[0]?.id ?? null);
        }
        const previousFocus = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        dialogRef.current?.focus();
        const handleKey = (event) => {
            if (event.key === 'Escape') onCloseRef.current();
            if (event.key !== 'Tab') return;
            const items = [...dialogRef.current.querySelectorAll('button, a[href]')].filter((el) => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');
            const first = items[0];
            const last = items.at(-1);
            if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
                event.preventDefault(); last?.focus();
            } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) {
                event.preventDefault(); first?.focus();
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKey);
            previousFocus?.focus();
        };
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
                        {categorias.map((cat) => (
                            <button key={cat.id} className={`efe-cat-drawer-item ${activeId === cat.id ? 'is-active' : ''}`} onClick={() => setActiveId(cat.id)} aria-expanded={activeId === cat.id} aria-controls="category-detail">
                                <span>{cat.nombre}</span><ChevronRight size={18} />
                            </button>
                        ))}
                    </div>
                </div>
                <div className="efe-cat-drawer-right" id="category-detail">
                    <div className="cat-detail-top">
                        <button className="cat-back-button" onClick={() => setActiveId(null)}><ChevronLeft size={18} />Categorías</button>
                        <button className="cat-icon-button" onClick={onClose} aria-label="Cerrar menú"><X size={22} /></button>
                    </div>
                    {activeCat && (
                        <>
                            <div className="cat-detail-heading"><span className="cat-eyebrow">EXPLORA NUESTRA TIENDA</span><h3>{activeCat.nombre}</h3><Link className="cat-explore-link" href={href()} onClick={onClose}>Ver todos los productos<ArrowUpRight size={17} /></Link></div>
                            <div className="cat-detail-content">
                                {activeCat.subcategorias?.length > 0 && <section aria-label="Subcategorías" className="cat-menu-groups">
                                    {activeCat.subcategorias.map((group) => (
                                        <article className="cat-menu-group" key={group.id}>
                                            <h4><Link href={href({ categoria_id: group.id })} onClick={onClose}>{group.nombre}</Link></h4>
                                            {group.subcategorias?.length > 0 ? <ul className="cat-menu-leaves">
                                                {group.subcategorias.map((sub) => <li key={sub.id}><Link href={href({ categoria_id: sub.id })} onClick={onClose} className="cat-subcategory-link">{sub.nombre}</Link></li>)}
                                            </ul> : <Link href={href({ categoria_id: group.id })} onClick={onClose} className="cat-subcategory-link">Explorar {group.nombre}<ChevronRight size={16} /></Link>}
                                            <Link href={href({ categoria_id: group.id })} onClick={onClose} className="cat-group-explore">Ver todo<ArrowUpRight size={14} /></Link>
                                        </article>
                                    ))}
                                </section>}
                                {activeCat.marcas?.length > 0 && <section aria-label="Marcas"><h4>Tus marcas favoritas</h4><div className="cat-brand-grid">{activeCat.marcas.map((brand) => <Link key={brand.id} href={href({ marca: brand.nombre })} onClick={onClose} className="cat-brand-link">{brand.nombre}</Link>)}</div></section>}
                            </div>
                        </>
                    )}
                </div>
            </section>
        </>
    );
}
