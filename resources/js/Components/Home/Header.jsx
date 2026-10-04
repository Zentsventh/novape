import { useEffect, useState, useRef } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { LOGO } from './constants';
import LoginModal from './LoginModal';
import LocationModal from './LocationModal';
import Swal from 'sweetalert2';
import { useDeviceContext } from '@/Contexts/DeviceContext';
import { useLocation } from '@/Contexts/LocationContext';

/* Renderiza la cabecera principal con logo, buscador y acciones. */
export default function Header({
    cartCount = 0,
    onOpenCart,
    onOpenCategories,
    logoUrl,
    minimal = false,
    searchQuery = '',
}) {
    const currentLogo = logoUrl || LOGO;
    const { auth } = usePage().props;
    const user = auth?.user;
    const { isMobile, isTablet, isDesktop } = useDeviceContext();
    const { location, setLocation } = useLocation();
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isLocationOpen, setIsLocationOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(searchQuery || '');
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const recognitionRef = useRef(null);

    const [liveResults, setLiveResults] = useState({
        productos: [],
        marcas: [],
        categorias: [],
        sugerencias: [],
    });
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);

    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('login') === '1') {
            setIsLoginOpen(true);
            // Clean up the URL so it doesn't stay there if they refresh
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Listen for custom event to open location modal from other components
        const handleOpenLocationModal = () => setIsLocationOpen(true);
        window.addEventListener('open-location-modal', handleOpenLocationModal);
        return () => window.removeEventListener('open-location-modal', handleOpenLocationModal);
    }, []);
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            setSpeechSupported(true);
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = 'es-PE';
            recognition.continuous = false; // Fix: continuous=true causes immediate abort on HTTP/Localhost in some browsers
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                setIsListening(true);
            };

            recognition.onresult = (event) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    interimTranscript += event.results[i][0].transcript;
                }
                setSearchTerm(interimTranscript);
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                if (event.error === 'not-allowed') {
                    Swal.fire({
                        text: 'Permiso de micrófono denegado. Permite el acceso al micrófono en la barra de direcciones.',
                        icon: 'warning',
                        confirmButtonColor: '#004797',
                    });
                } else if (event.error === 'network') {
                    Swal.fire({
                        text: 'Error de red: Tu navegador (como Brave) o tu Antivirus/Adblocker está bloqueando la conexión al servidor de reconocimiento de voz. Usa Chrome/Edge o desactiva los escudos de privacidad para esta función.',
                        icon: 'error',
                        confirmButtonColor: '#004797',
                    });
                } else {
                    Swal.fire({
                        text: `El reconocimiento de voz se detuvo: ${event.error}`,
                        icon: 'info',
                        confirmButtonColor: '#004797',
                    });
                }
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
                setTimeout(() => {
                    const inputVal = document.getElementById('main-search-input')?.value;
                    if (inputVal && inputVal.trim() && isListening) {
                        // Only if it was actively listening
                        setShowSearchDropdown(false);
                        router.get(
                            '/catalogo',
                            { q: inputVal.trim() },
                            { preserveScroll: true, preserveState: true }
                        );
                    }
                }, 300);
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setSearchTerm('');
            try {
                recognitionRef.current.start();
            } catch (err) {
                console.error(err);
            }
        }
    };

    useEffect(() => {
        if (!searchTerm || searchTerm.length < 2 || searchTerm === searchQuery) {
            setLiveResults({ productos: [], marcas: [], categorias: [], sugerencias: [] });
            setShowSearchDropdown(false);
            return;
        }

        const timer = setTimeout(() => {
            setIsSearching(true);
            fetch(`/api/search/live?q=${encodeURIComponent(searchTerm)}`)
                .then((res) => res.json())
                .then((data) => {
                    setLiveResults(data);
                    setShowSearchDropdown(true);
                })
                .catch((err) => console.error(err))
                .finally(() => setIsSearching(false));
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        setSearchTerm(searchQuery || '');
    }, [searchQuery]);

    const handleLogout = (e) => {
        e.preventDefault();
        router.post('/logout');
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setShowSearchDropdown(false);
        const term = searchTerm.trim();
        router.get('/catalogo', term ? { q: term } : {}, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const handleSearchBlur = (e) => {
        // Delay to allow clicking on results
        setTimeout(() => setShowSearchDropdown(false), 200);
    };

    const handleUserBlur = (event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsUserMenuOpen(false);
        }
    };

    const handleUserKeyDown = (event) => {
        if (event.key === 'Escape') {
            setIsUserMenuOpen(false);
        }
    };

    return (
        <header className="efe-header">
            <div className={minimal ? 'efe-header-gradient is-minimal' : 'efe-header-gradient'}>
                <div className={minimal ? 'efe-header-main is-minimal' : 'efe-header-main'}>
                    {!minimal && (
                        <button
                            className="efe-header-hamburger efe-mobile-only"
                            onClick={onOpenCategories}
                        >
                            <svg
                                width="26"
                                height="26"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                            >
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                    )}

                    <Link href="/" className="efe-header-logo-link">
                        <img
                            className={minimal ? 'efe-header-logo is-minimal' : 'efe-header-logo'}
                            src={currentLogo}
                            alt="Novape"
                        />
                    </Link>

                    {!minimal && (
                        <div className="efe-header-search-wrap" style={{ position: 'relative' }}>
                            <form className="efe-header-search" onSubmit={handleSearchSubmit}>
                                <input
                                    id="main-search-input"
                                    type="text"
                                    className="efe-header-search-input"
                                    placeholder="¿Qué estás buscando?"
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    onFocus={() => {
                                        if (liveResults.length > 0) setShowSearchDropdown(true);
                                    }}
                                    onBlur={handleSearchBlur}
                                    aria-label="Buscar productos"
                                    style={{
                                        paddingRight: '80px',
                                        backgroundColor: isListening ? '#fef2f2' : '#ffffff',
                                        borderColor: isListening ? '#ef4444' : 'transparent',
                                        transition: 'all 0.3s ease',
                                    }}
                                />
                                {isSearching ? (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            right: '90px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: '20px',
                                            height: '20px',
                                            border: '2px solid rgba(0,0,0,0.1)',
                                            borderTop: '2px solid #2563eb',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite',
                                        }}
                                    ></div>
                                ) : null}

                                {speechSupported && (
                                    <button
                                        type="button"
                                        onClick={toggleListening}
                                        className={`efe-header-voice-btn ${isListening ? 'is-listening' : ''}`}
                                        aria-label="Búsqueda por voz"
                                        style={{
                                            position: 'absolute',
                                            right: '50px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: isListening ? '#ef4444' : '#6b7280',
                                            padding: '8px',
                                        }}
                                    >
                                        {isListening ? (
                                            <span className="voice-pulse-ring"></span>
                                        ) : null}
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
                                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                            <line x1="12" y1="19" x2="12" y2="22"></line>
                                        </svg>
                                    </button>
                                )}

                                <button
                                    className="efe-header-search-btn"
                                    type="submit"
                                    aria-label="Buscar"
                                >
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="white"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                    >
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                </button>
                            </form>

                            {showSearchDropdown && (
                                <>
                                    <div
                                        className="efe-search-overlay"
                                        onClick={() => setShowSearchDropdown(false)}
                                    ></div>
                                    <div className="efe-search-dropdown efe-megamenu">
                                        {liveResults?.productos?.length > 0 ||
                                            liveResults?.sugerencias?.length > 0 ? (
                                            <div className="efe-megamenu-container">
                                                <div className="efe-megamenu-sidebar">
                                                    {liveResults?.sugerencias?.length > 0 && (
                                                        <div className="efe-megamenu-section">
                                                            <h5 className="efe-megamenu-title">
                                                                Búsquedas sugeridas
                                                            </h5>
                                                            <ul className="efe-megamenu-list">
                                                                {liveResults.sugerencias.map(
                                                                    (sug, i) => (
                                                                        <li key={i}>
                                                                            <Link
                                                                                href={`/catalogo?q=${encodeURIComponent(sug)}`}
                                                                            >
                                                                                <svg
                                                                                    width="14"
                                                                                    height="14"
                                                                                    viewBox="0 0 24 24"
                                                                                    fill="none"
                                                                                    stroke="currentColor"
                                                                                    strokeWidth="2"
                                                                                >
                                                                                    <circle
                                                                                        cx="11"
                                                                                        cy="11"
                                                                                        r="8"
                                                                                    ></circle>
                                                                                    <line
                                                                                        x1="21"
                                                                                        y1="21"
                                                                                        x2="16.65"
                                                                                        y2="16.65"
                                                                                    ></line>
                                                                                </svg>{' '}
                                                                                {sug}
                                                                            </Link>
                                                                        </li>
                                                                    )
                                                                )}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {liveResults?.marcas?.length > 0 && (
                                                        <div className="efe-megamenu-section">
                                                            <h5 className="efe-megamenu-title">
                                                                Marcas
                                                            </h5>
                                                            <div className="efe-megamenu-chips">
                                                                {liveResults.marcas.map((m, i) => (
                                                                    <Link
                                                                        key={i}
                                                                        href={`/catalogo?q=${searchTerm}&marca=${encodeURIComponent(m)}`}
                                                                        className="efe-megamenu-chip"
                                                                    >
                                                                        {m}
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {liveResults?.categorias?.length > 0 && (
                                                        <div className="efe-megamenu-section">
                                                            <h5 className="efe-megamenu-title">
                                                                Categorías
                                                            </h5>
                                                            <ul className="efe-megamenu-list">
                                                                {liveResults.categorias.map(
                                                                    (c, i) => (
                                                                        <li key={i}>
                                                                            <Link
                                                                                href={`/catalogo?categoria=${encodeURIComponent(c)}`}
                                                                            >
                                                                                {c}
                                                                            </Link>
                                                                        </li>
                                                                    )
                                                                )}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="efe-megamenu-products">
                                                    <div className="efe-megamenu-header">
                                                        <h4>Productos para "{searchTerm}"</h4>
                                                        <div
                                                            className="efe-search-all-link"
                                                            onClick={handleSearchSubmit}
                                                        >
                                                            Ver todos los resultados &rarr;
                                                        </div>
                                                    </div>
                                                    <div className="efe-megamenu-grid">
                                                        {liveResults.productos.map((prod) => {
                                                            const isOffer = Math.random() > 0.6;
                                                            const offerLabels = [
                                                                '-50%',
                                                                'Oferta Relámpago',
                                                                'Envío Gratis',
                                                                'Últimos',
                                                            ];
                                                            const randomLabel =
                                                                offerLabels[
                                                                Math.floor(
                                                                    Math.random() *
                                                                    offerLabels.length
                                                                )
                                                                ];
                                                            return (
                                                                <Link
                                                                    key={prod.id}
                                                                    href={`/producto/${prod.slug || prod.id}`}
                                                                    className="efe-megamenu-card"
                                                                >
                                                                    {isOffer && (
                                                                        <span className="efe-megamenu-badge">
                                                                            {randomLabel}
                                                                        </span>
                                                                    )}
                                                                    <div className="efe-megamenu-card-img">
                                                                        <img
                                                                            src={
                                                                                prod.imagen ||
                                                                                '/storage/default.png'
                                                                            }
                                                                            alt={prod.nombre}
                                                                        />
                                                                    </div>
                                                                    <div className="efe-megamenu-card-info">
                                                                        <span className="brand">
                                                                            {prod.marca || 'NovaPe'}
                                                                        </span>
                                                                        <h5 className="title">
                                                                            {prod.nombre}
                                                                        </h5>
                                                                        <span className="price">
                                                                            S/{' '}
                                                                            {new Intl.NumberFormat(
                                                                                'es-PE',
                                                                                {
                                                                                    minimumFractionDigits: 2,
                                                                                }
                                                                            ).format(
                                                                                prod.precio_actual
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                </Link>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="efe-search-empty">
                                                No se encontraron resultados para "{searchTerm}"
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {!isMobile && !isTablet && (
                        <div
                            className={
                                minimal
                                    ? 'efe-header-actions'
                                    : 'efe-header-actions efe-desktop-actions'
                            }
                        >
                            {!minimal && (
                                <>

                                    <Link href="/seguimiento" className="efe-header-action-link">
                                        <div className="efe-header-action-icon">
                                            <svg
                                                width="26"
                                                height="26"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="white"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M3 6h18v4a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0V6z" />
                                                <path d="M4 10v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10" />
                                                <path d="M12 14v8" />
                                            </svg>
                                        </div>
                                        <span className="efe-header-icon-text">Sigue tu pedido</span>
                                    </Link>
                                </>
                            )}

                            {user ? (
                                <div
                                    className={`efe-user-dropdown ${isUserMenuOpen ? 'is-open' : ''}`}
                                    onFocus={() => setIsUserMenuOpen(true)}
                                    onBlur={handleUserBlur}
                                    onKeyDown={handleUserKeyDown}
                                >
                                    {minimal ? (
                                        <button
                                            type="button"
                                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                            className="efe-header-user-minimal"
                                            aria-haspopup="menu"
                                            aria-expanded={isUserMenuOpen}
                                        >
                                            <svg
                                                width="26"
                                                height="26"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="white"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                            <div className="efe-header-user-minimal-text">
                                                <span>Hola</span>
                                                <span className="efe-header-user-minimal-name">
                                                    {user.nombres.split(' ')[0]}{' '}
                                                    {user.apellidos?.split(' ')[0] || ''}
                                                </span>
                                            </div>
                                            <svg
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="white"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="efe-header-user-minimal-caret"
                                            >
                                                <polyline points="6 9 12 15 18 9"></polyline>
                                            </svg>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                            className="efe-header-action-link efe-header-action-btn"
                                            aria-haspopup="menu"
                                            aria-expanded={isUserMenuOpen}
                                        >
                                            <div className="efe-header-action-icon">
                                                <svg
                                                    width="26"
                                                    height="26"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="white"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                    <circle cx="12" cy="7" r="4" />
                                                </svg>
                                            </div>
                                            <span className="efe-header-icon-text">
                                                {user.nombres.split(' ')[0]}
                                            </span>
                                        </button>
                                    )}
                                    <div className="efe-dropdown-menu" role="menu">
                                        <Link
                                            href="/perfil"
                                            className="efe-dropdown-item"
                                            role="menuitem"
                                            onClick={() => setIsUserMenuOpen(false)}
                                        >
                                            Mi cuenta
                                        </Link>
                                        <Link
                                            href="/perfil?tab=compras"
                                            className="efe-dropdown-item"
                                            role="menuitem"
                                            onClick={() => setIsUserMenuOpen(false)}
                                        >
                                            Mis órdenes
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="efe-dropdown-item efe-dropdown-item-button"
                                            role="menuitem"
                                        >
                                            Cerrar sesión
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className={`efe-user-dropdown ${isUserMenuOpen ? 'is-open' : ''}`}
                                    onFocus={() => setIsUserMenuOpen(true)}
                                    onBlur={handleUserBlur}
                                    onKeyDown={handleUserKeyDown}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        className="efe-header-action-link efe-header-action-btn"
                                    >
                                        <div className="efe-header-action-icon">
                                            <svg
                                                width="26"
                                                height="26"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="white"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                        </div>
                                        <span className="efe-header-icon-text">Cuenta</span>
                                    </button>
                                    <div
                                        className="efe-dropdown-menu efe-dropdown-mega"
                                        role="menu"
                                    >
                                        <div className="efe-dropdown-mega-left">
                                            <h4>Bienvenido</h4>
                                            <p>
                                                Inicia sesión y podrás consultar el estado de tus
                                                pedidos, tu libreta de direcciones y todo lo que
                                                necesites.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsLoginOpen(true);
                                                    setIsUserMenuOpen(false);
                                                }}
                                                className="efe-btn-login-mega"
                                            >
                                                Iniciar sesión
                                            </button>
                                        </div>
                                        <div className="efe-dropdown-mega-right">
                                            <h4>¿Quieres una experiencia de compra más rápida?</h4>
                                            <ul>
                                                <li>Descuentos exclusivos</li>
                                                <li>Crear listas de deseos</li>
                                            </ul>
                                            <Link
                                                href="/registro"
                                                className="efe-btn-register-mega"
                                                onClick={() => setIsUserMenuOpen(false)}
                                            >
                                                Crea tu cuenta
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!minimal && (
                                <Link
                                    href="/carrito"
                                    className="efe-header-action-link efe-header-action-btn efe-cart-btn-anim"
                                >
                                    <div className="efe-header-action-icon">
                                        <svg
                                            width="26"
                                            height="26"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="white"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <circle cx="9" cy="21" r="2" />
                                            <circle cx="20" cy="21" r="2" />
                                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                        </svg>
                                        <span className="efe-cart-badge-new">{cartCount}</span>
                                    </div>
                                    <span className="efe-header-icon-text">Carrito</span>
                                </Link>
                            )}
                        </div>
                    )}

                    {!minimal && (
                        <Link href="/carrito" className="efe-header-cart efe-mobile-only">
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="9" cy="21" r="1" />
                                <circle cx="20" cy="21" r="1" />
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                            </svg>
                            {cartCount > 0 && <span className="efe-cart-badge">{cartCount}</span>}
                        </Link>
                    )}
                </div>
            </div>

            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
            <LocationModal
                isOpen={isLocationOpen}
                onClose={() => setIsLocationOpen(false)}
                onLocationSelect={(loc) => setLocation(loc)}
            />
        </header>
    );
}
