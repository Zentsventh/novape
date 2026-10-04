import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { useDeviceContext } from '@/Contexts/DeviceContext';

/**
 * CategoryDrawer: Panel lateral tipo Mega-Menú.
 * - Panel izquierdo: lista las categorías padre.
 * - Panel derecho: muestra las subcategorías de la categoría seleccionada.
 */
export default function CategoryDrawer({ isOpen, onClose, categorias = [] }) {
    const [activeId, setActiveId] = useState(null);
    const { auth } = usePage().props;
    const { isMobile } = useDeviceContext();
    const user = auth?.user;
    const activeCat = categorias.find((c) => c.id === activeId);

    const handleCatHover = (id) => {
        if (!isMobile) setActiveId(id);
    };

    const handleCatClick = (cat) => {
        if (isMobile) {
            setActiveId(cat.id);
        } else {
            handleVerTodo(cat.nombre);
        }
    };

    const handleSubClick = (subNombre) => {
        router.get(
            '/catalogo',
            { categoria: activeCat.nombre, subcategoria: subNombre },
            {
                preserveScroll: true,
                onFinish: onClose,
            }
        );
    };

    const handleVerTodo = (catNombre) => {
        router.get(
            '/catalogo',
            { categoria: catNombre },
            {
                preserveScroll: true,
                onFinish: onClose,
            }
        );
    };

    const handleBack = () => {
        setActiveId(null);
    };

    return (
        <>
            <style>{`
                .premium-cat-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    padding: 12px 16px;
                    background: transparent;
                    color: #1E293B;
                    border: none;
                    border-radius: 8px;
                    font-weight: 500;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin-bottom: 6px;
                    text-align: left;
                }
                .premium-cat-item:hover {
                    background: #f8fafc;
                    color: #004797;
                    transform: translateX(4px);
                }
                .premium-cat-item.is-active {
                    background: rgba(0, 71, 151, 0.08);
                    color: #004797;
                    font-weight: 700;
                }
                .premium-sub-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    text-align: left;
                    padding: 14px 16px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #1E293B;
                    cursor: pointer;
                    width: 100%;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                }
                .premium-sub-item:hover {
                    border-color: #004797;
                    box-shadow: 0 8px 16px rgba(0, 71, 151, 0.12);
                    transform: translateY(-3px);
                    color: #004797;
                }
                .premium-sub-item:hover svg {
                    stroke: #004797;
                    transform: translateX(3px);
                }
                .premium-sub-item svg {
                    transition: all 0.2s ease;
                }
                .premium-btn-outline {
                    font-size: 12px;
                    font-weight: 600;
                    color: #004797;
                    background: rgba(0, 71, 151, 0.05);
                    padding: 6px 16px;
                    border-radius: 20px;
                    border: 1px solid rgba(0, 71, 151, 0.2);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .premium-btn-outline:hover {
                    background: #004797;
                    color: #ffffff;
                    box-shadow: 0 4px 12px rgba(0, 71, 151, 0.3);
                    border-color: #004797;
                    transform: translateY(-1px);
                }
            `}</style>

            {/* Overlay */}
            <div
                className={`efe-cat-drawer-overlay ${isOpen ? 'is-open' : ''}`}
                onClick={onClose}
                style={{ backdropFilter: 'blur(4px)', transition: 'all 0.3s ease' }}
            />

            {/* Drawer */}
            <div
                className={`efe-cat-drawer ${isOpen ? 'is-open' : ''} ${isMobile && activeId ? 'show-right' : ''}`}
                style={{ boxShadow: '20px 0 25px -5px rgba(0, 0, 0, 0.1), 8px 0 10px -6px rgba(0, 0, 0, 0.1)' }}
            >
                {/* Panel Izquierdo - Categorías Padre */}
                <div className="efe-cat-drawer-left" style={{ borderRight: '1px solid #f1f5f9', background: '#ffffff' }}>
                    <div className="efe-cat-drawer-header" style={{ background: '#ffffff', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px', paddingTop: '20px', marginBottom: '16px', paddingLeft: '20px', paddingRight: '20px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                            {user?.nombres ? `¡Hola, ${user.nombres.split(' ')[0]}!` : '¡Hola!'}
                        </h3>
                        <button 
                            className="efe-cat-drawer-close" 
                            onClick={onClose}
                            style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                padding: '4px', 
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                color: '#94a3b8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.transform = 'rotate(90deg)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.transform = 'rotate(0deg)'; }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    <div className="efe-cat-drawer-list">
                        {categorias.map((cat) => (
                            <button
                                key={cat.id}
                                className={`premium-cat-item ${activeId === cat.id ? 'is-active' : ''}`}
                                onMouseEnter={() => handleCatHover(cat.id)}
                                onClick={() => handleCatClick(cat)}
                            >
                                <span>{cat.nombre}</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Panel Derecho - Subcategorías */}
                <div className="efe-cat-drawer-right" style={{ background: '#f8fafc', padding: '32px' }}>
                    {activeCat ? (
                        <>
                            <div
                                className="efe-cat-drawer-sub-header"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '15px',
                                    marginBottom: '24px',
                                    borderBottom: '1px solid #e2e8f0',
                                    paddingBottom: '20px',
                                }}
                            >
                                {isMobile && (
                                    <button
                                        onClick={handleBack}
                                        style={{
                                            alignSelf: 'flex-start',
                                            background: '#ffffff',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            color: '#64748b',
                                            fontSize: '13px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            cursor: 'pointer',
                                            padding: '8px 12px',
                                            fontWeight: '600',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="19" y1="12" x2="5" y2="12" />
                                            <polyline points="12 19 5 12 12 5" />
                                        </svg>
                                        Volver
                                    </button>
                                )}

                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        width: '100%',
                                    }}
                                >
                                    <h4
                                        style={{
                                            fontSize: '22px',
                                            fontWeight: '800',
                                            color: '#0f172a',
                                            position: 'relative',
                                            margin: 0,
                                            letterSpacing: '-0.5px',
                                        }}
                                    >
                                        {activeCat.nombre}
                                        <span
                                            style={{
                                                position: 'absolute',
                                                bottom: '-22px',
                                                left: 0,
                                                width: '48px',
                                                height: '4px',
                                                background: '#004797',
                                                borderRadius: '4px',
                                            }}
                                        ></span>
                                    </h4>
                                    <button
                                        onClick={() => handleVerTodo(activeCat.nombre)}
                                        className="premium-btn-outline"
                                    >
                                        Explorar todo
                                    </button>
                                </div>
                            </div>

                            <div
                                className="efe-cat-drawer-sub-list"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                                    gap: '16px',
                                    marginTop: '24px',
                                    overflowY: 'auto',
                                    paddingBottom: '20px',
                                }}
                            >
                                {activeCat.subcategorias && activeCat.subcategorias.length > 0 ? (
                                    activeCat.subcategorias.map((sub) => (
                                        <button
                                            key={sub.id}
                                            className="premium-sub-item"
                                            type="button"
                                            onClick={() => handleSubClick(sub.nombre)}
                                        >
                                            <span>{sub.nombre}</span>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                                <polyline points="9 18 15 12 9 6" />
                                            </svg>
                                        </button>
                                    ))
                                ) : (
                                    <div
                                        style={{
                                            gridColumn: '1 / -1',
                                            background: '#ffffff',
                                            borderRadius: '12px',
                                            padding: '40px 30px',
                                            border: '1px dashed #cbd5e1',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <div style={{ color: '#64748b', fontWeight: '500', fontSize: '14px' }}>
                                            No hay subcategorías disponibles.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div
                            className="efe-cat-drawer-empty"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                color: '#94a3b8',
                                gap: '16px',
                                fontSize: '15px',
                                textAlign: 'center',
                                padding: '40px',
                                fontWeight: '500'
                            }}
                        >
                            <div style={{ background: '#ffffff', padding: '20px', borderRadius: '50%', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                            </div>
                            <span>
                                Desliza el cursor sobre una categoría
                                <br />
                                para explorar sus opciones
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
