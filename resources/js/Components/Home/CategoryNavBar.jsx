import { useState, useEffect, useRef } from 'react';
import { Link, router } from '@inertiajs/react';
import { useDeviceContext } from '@/Contexts/DeviceContext';
import { useLocation } from '@/Contexts/LocationContext';

const CategoryIcon = ({ name }) => {
    const icons = {
        Celulares: (
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
        ),
        Cómputo: (
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="2" y1="20" x2="22" y2="20" />
                <line x1="9" y1="17" x2="9" y2="20" />
                <line x1="15" y1="17" x2="15" y2="20" />
            </svg>
        ),
        'Mundo Gamer': (
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M12 2l4 10h-8z" />
                <path d="M12 22l-4-10h8z" />
            </svg>
        ),
        Audio: (
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            </svg>
        ),
        TV: (
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
        ),
        Videojuegos: (
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <line x1="6" y1="11" x2="10" y2="11" />
                <line x1="8" y1="9" x2="8" y2="13" />
                <line x1="15" y1="12" x2="15.01" y2="12" />
                <line x1="18" y1="10" x2="18.01" y2="10" />
                <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.544-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z" />
            </svg>
        ),
        'Cámaras y Drones': (
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
            </svg>
        ),
        Smartwatches: (
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <rect x="6" y="4" width="12" height="16" rx="3" />
                <line x1="9" y1="2" x2="15" y2="2" />
                <line x1="9" y1="22" x2="15" y2="22" />
                <polyline points="12 8 12 12 14 14" />
            </svg>
        ),
        'Smarthome y domótica': (
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
        ),
    };

    return (
        icons[name] || (
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
        )
    );
};

export default function CategoryNavBar({ categorias = [], onOpenCategories, onSelectCategory }) {
    const { isMobile } = useDeviceContext();
    const { location } = useLocation();
    const [activeId, setActiveId] = useState(null);
    const [hoverId, setHoverId] = useState(null);
    const barRef = useRef(null);
    const [isStuck, setIsStuck] = useState(false);

    useEffect(() => {
        const bar = barRef.current;
        if (!bar) return;

        const observer = new IntersectionObserver(([entry]) => setIsStuck(!entry.isIntersecting), {
            threshold: [1],
            rootMargin: '-72px 0px 0px 0px',
        });

        observer.observe(bar);
        return () => observer.disconnect();
    }, []);

    const handleClick = (cat) => {
        setActiveId(cat.id);

        // En móviles, si la categoría tiene subcategorías, tocarla debería mostrar el menú
        // desplegable en lugar de enrutar inmediatamente, para permitir ver el submenú.
        if (isMobile && cat.subcategorias && cat.subcategorias.length > 0) {
            setHoverId(hoverId === cat.id ? null : cat.id);
            return;
        }

        if (onSelectCategory) {
            onSelectCategory(cat);
            return;
        }
        router.get('/catalogo', { categoria: cat.nombre });
    };

    const handleBlur = (event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            setHoverId(null);
        }
    };

    return (
        <nav ref={barRef} className={`efe-category-bar ${isStuck ? 'is-stuck' : ''}`}>
            <div className="efe-category-bar-inner">
                <button className="efe-nav-location-btn" onClick={() => window.dispatchEvent(new CustomEvent('open-location-modal'))}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>{location.distrito ? `${location.distrito}, ${location.departamento}` : 'Ingresa tu ubicación'}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
                <span className="efe-cat-nav-sep" style={{ marginRight: '10px' }} />
                <button className="efe-cat-nav-all" onClick={onOpenCategories}>
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                    >
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                    Todas las categorias
                </button>
                <span className="efe-cat-nav-sep" />
                <div className="efe-category-nav">
                    {categorias.map((cat) => (
                        <div
                            key={cat.id}
                            onMouseEnter={() => setHoverId(cat.id)}
                            onMouseLeave={() => setHoverId(null)}
                            onFocus={() => setHoverId(cat.id)}
                            onBlur={handleBlur}
                            onKeyDown={(event) => {
                                if (event.key === 'Escape') {
                                    setHoverId(null);
                                }
                            }}
                            className="efe-cat-nav-item-wrap"
                        >
                            <button
                                className={`efe-cat-nav-item ${activeId === cat.id ? 'is-active' : ''}`}
                                onClick={() => handleClick(cat)}
                                aria-haspopup={
                                    cat.subcategorias && cat.subcategorias.length > 0
                                        ? 'menu'
                                        : undefined
                                }
                                aria-expanded={hoverId === cat.id ? 'true' : 'false'}
                                aria-controls={
                                    cat.subcategorias && cat.subcategorias.length > 0
                                        ? `cat-submenu-${cat.id}`
                                        : undefined
                                }
                            >
                                <span className="efe-cat-nav-icon">
                                    <CategoryIcon name={cat.nombre} />
                                </span>
                                {cat.nombre}
                            </button>

                            {hoverId === cat.id &&
                                cat.subcategorias &&
                                cat.subcategorias.length > 0 && (
                                    <div
                                        className="efe-cat-submenu"
                                        role="menu"
                                        id={`cat-submenu-${cat.id}`}
                                    >
                                        {cat.subcategorias.map((sub) => (
                                            <Link
                                                key={sub.id}
                                                href={`/catalogo?categoria=${encodeURIComponent(cat.nombre)}&subcategoria=${encodeURIComponent(sub.nombre)}`}
                                                className="efe-cat-sub-item"
                                                role="menuitem"
                                            >
                                                {sub.nombre}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                        </div>
                    ))}
                </div>
            </div>
        </nav>
    );
}
