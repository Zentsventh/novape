import { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '@/Components/Animations/PageTransition';
import {
    LayoutDashboard, MonitorSmartphone, ShoppingCart, Package,
    CreditCard, Wallet, Archive, Image, Users, Truck,
    UserCog, Shield, Star, Settings, LogOut, Menu, X, Bell, Eye, Grid, Briefcase, Mail, ShieldAlert, DollarSign, Building, Zap, Tags, Map, Ticket
} from 'lucide-react';
import { useDeviceContext } from '@/Contexts/DeviceContext';
import '../../css/admin/admin.css';

const LOGO_FALLBACK = '/images/logo.png';

export default function AdminLayout({ children, logoUrl }) {
    const { url, props } = usePage();
    const { isMobile, isTablet } = useDeviceContext();
    const logo = logoUrl || props.logoUrl || LOGO_FALLBACK;

    const userPerms = props.auth?.user?.permisos || [];
    const isAdmin = props.auth?.user?.roles?.some(r => r.nombre === 'admin') || false;

    const hasPerm = (perm) => {
        if (!perm) return true;
        if (isAdmin) return true;
        return userPerms.includes(perm);
    };

    const navCategories = [
        {
            title: 'Métricas',
            items: [
                { href: '/admin', label: 'Panel Principal', exact: true, permission: 'ver_dashboard', icon: <LayoutDashboard size={20} /> },
                { href: '/admin/analiticas', label: 'Reportes y Analíticas', exact: true, permission: 'ver_dashboard', icon: <Grid size={20} /> },
            ]
        },
        {
            title: 'Ventas y CRM',
            items: [
                { href: '/admin/pos', label: 'Punto de Venta', permission: 'pos.vender', icon: <MonitorSmartphone size={20} /> },
                { href: '/admin/pedidos', label: 'Pedidos', permission: 'pos.vender', icon: <ShoppingCart size={20} /> },
                { href: '/admin/rma', label: 'Garantías y Cambios', permission: 'pos.vender', icon: <ShieldAlert size={20} /> },
                { href: '/admin/inbox', label: 'Bandeja CRM', permission: 'gestionar_omnichannel', icon: <Briefcase size={20} /> },
            ]
        },
        {
            title: 'Catálogo y Logística',
            items: [
                { href: '/admin/products', label: 'Productos', permission: 'inventario.gestionar', icon: <Package size={20} /> },
                { href: '/admin/inventario', label: 'Inventario', permission: 'inventario.gestionar', icon: <LayoutDashboard size={20} /> },
                { href: '/admin/almacenes', label: 'Almacenes', permission: 'inventario.gestionar', icon: <Archive size={20} /> },
                { href: '/admin/zonas', label: 'Zonas de Envío', permission: 'usuarios.gestionar', icon: <Map size={20} /> },
            ]
        },
        {
            title: 'Compras y Finanzas',
            items: [
                { href: '/admin/compras', label: 'Compras', permission: 'inventario.gestionar', icon: <CreditCard size={20} /> },
                { href: '/admin/proveedores', label: 'Proveedores', permission: 'inventario.gestionar', icon: <Truck size={20} /> },
                { href: '/admin/gastos', label: 'Gastos', permission: 'reportes.ver', icon: <Wallet size={20} /> },
            ]
        },
        {
            title: 'Marketing y Tienda',
            items: [
                { href: '/admin/cupones', label: 'Cupones', permission: 'gestionar_cupones', icon: <Ticket size={20} /> },
                { href: '/admin/banners', label: 'Banners Web', permission: 'usuarios.gestionar', icon: <Image size={20} /> },
            ]
        },
        {
            title: 'Sistema',
            items: [
                { href: '/admin/trabajadores', label: 'Usuarios', permission: 'usuarios.gestionar', icon: <Users size={20} /> },
                { href: '/admin/roles', label: 'Roles y Permisos', permission: 'usuarios.gestionar', icon: <Shield size={20} /> },
                { href: '/admin/ajustes', label: 'Configuración', permission: 'usuarios.gestionar', icon: <Settings size={20} /> },
                { href: '/admin/audit-logs', label: 'Registro Auditoría', permission: 'ver_dashboard', icon: <ShieldAlert size={20} /> },
            ]
        }
    ];

    // Filtrar los items de navegación según los permisos del usuario por categoría
    const visibleCategories = navCategories.map(cat => ({
        ...cat,
        items: cat.items.filter(item => hasPerm(item.permission))
    })).filter(cat => cat.items.length > 0);

    const isActive = (item) => {
        if (item.exact) return url === item.href;
        return url.startsWith(item.href);
    };

    const [notificaciones, setNotificaciones] = useState([]);
    const [showNotifs, setShowNotifs] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [appLauncherOpen, setAppLauncherOpen] = useState(false);
    const [globalSearchQuery, setGlobalSearchQuery] = useState('');
    const [globalSearchResults, setGlobalSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);

    useEffect(() => {
        if (globalSearchQuery.length > 2) {
            setIsSearching(true);
            const timer = setTimeout(() => {
                fetch(`/admin/global-search?q=${globalSearchQuery}`)
                    .then(res => res.json())
                    .then(data => {
                        setGlobalSearchResults(data);
                        setShowSearchDropdown(true);
                        setIsSearching(false);
                    });
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setGlobalSearchResults(null);
            setShowSearchDropdown(false);
            setIsSearching(false);
        }
    }, [globalSearchQuery]);

    useEffect(() => {
        if (isMobile || isTablet) {
            setSidebarOpen(false);
        }
    }, [url]);

    useEffect(() => {
        fetchNotificaciones();
        const interval = setInterval(fetchNotificaciones, 15000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotificaciones = () => {
        fetch('/admin/notificaciones')
            .then(res => res.json())
            .then(data => setNotificaciones(data))
            .catch(err => console.error("Error fetching notifications", err));
    };

    const markAsRead = (id, link) => {
        fetch(`/admin/notificaciones/${id}/read`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                'Content-Type': 'application/json'
            }
        }).then(() => {
            fetchNotificaciones();
            if (link) window.location.href = link;
        });
    };

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside
                className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}
                style={(isMobile || isTablet) ? {
                    position: 'fixed',
                    top: 0,
                    bottom: 0,
                    left: sidebarOpen ? 0 : '-280px',
                    height: '100dvh',
                    zIndex: 9999,
                    width: '280px',
                    transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: 'none'
                } : {}}
            >
                <div className="admin-brand">
                    <div className="admin-sidebar-header" style={{ padding: '20px 25px' }}>
                        <img src={logo} alt="Logo" className="admin-sidebar-logo" style={{ maxHeight: '40px' }} />
                    </div>
                </div>
                <nav className="admin-nav">
                    {visibleCategories.map((category, idx) => (
                        <div key={idx} className="admin-nav-category" style={{ marginBottom: '15px' }}>
                            <div style={{ padding: '0 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: '700', marginBottom: '5px', marginTop: idx > 0 ? '10px' : '0' }}>
                                {category.title}
                            </div>
                            {category.items.map(item => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`admin-nav-link ${isActive(item) ? 'active' : ''}`}
                                    title={item.label}
                                >
                                    {item.icon}
                                    <span className="admin-nav-label">{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    ))}
                </nav>

                {/* Sidebar Footer */}
                <div className="admin-sidebar-footer" style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <a href="/" target="_blank" className="admin-nav-link admin-sidebar-store-link" title="Ver Tienda">
                        <Eye size={20} />
                        <span className="admin-nav-label">Ver Tienda</span>
                    </a>
                    <Link href="/admin/logout" method="post" as="button" className="admin-nav-link" style={{ border: 'none', background: 'transparent', width: '100%', textAlign: 'left', cursor: 'pointer', outline: 'none' }}>
                        <LogOut size={20} />
                        <span className="admin-nav-label">Cerrar Sesión</span>
                    </Link>
                </div>
            </aside>

            {/* Sidebar Overlay (Mobile) */}
            {sidebarOpen && (
                <div
                    className="admin-sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 9998
                    }}
                />
            )}

            {/* Main Content */}
            <main className="admin-main">
                {/* Topbar */}
                <header
                    className="admin-topbar"
                    style={{
                        background: 'var(--admin-bg-panel)',
                        borderBottom: '1px solid var(--admin-border)',
                        ...((isMobile || isTablet) ? {
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            width: '100vw',
                            zIndex: 9990
                        } : {})
                    }}
                >
                    <div className="admin-topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button onClick={() => setSidebarOpen(true)} className="admin-topbar-menu">
                            <Menu size={24} />
                        </button>

                        {/* App Launcher (Hidden to prevent Tailwind purge breaking the store) */}
                        <div style={{ position: 'relative', display: 'none' }}>
                            <button 
                                onClick={() => setAppLauncherOpen(!appLauncherOpen)}
                                style={{ 
                                    background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', 
                                    color: 'var(--admin-text-main)', cursor: 'pointer', padding: '8px', borderRadius: '8px'
                                }}
                                className="app-launcher-btn hover:bg-gray-100"
                            >
                                <Grid size={22} color="#3b82f6" />
                                <span style={{ fontWeight: 600, fontSize: '15px' }}>Plataforma</span>
                            </button>

                            {appLauncherOpen && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, marginTop: '8px',
                                    width: '340px', background: '#fff', borderRadius: '12px',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)', border: '1px solid #e5e7eb',
                                    zIndex: 1000, overflow: 'hidden'
                                }}>
                                    <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6', background: '#f8fafc' }}>
                                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#111827' }}>App Launcher (Clouds)</h3>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Cambia entre las aplicaciones de Novape</p>
                                    </div>
                                    <div style={{ padding: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <Link href="/admin/crm/dashboard" onClick={() => setAppLauncherOpen(false)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 8px', borderRadius: '8px', textDecoration: 'none', color: '#1f2937', transition: 'background 0.2s' }} className="hover:bg-blue-50">
                                            <Briefcase size={28} color="#3b82f6" style={{ marginBottom: '8px' }} />
                                            <span style={{ fontSize: '13px', fontWeight: 600 }}>Sales Cloud</span>
                                        </Link>
                                        <Link href="/admin/inbox" onClick={() => setAppLauncherOpen(false)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 8px', borderRadius: '8px', textDecoration: 'none', color: '#1f2937', transition: 'background 0.2s' }} className="hover:bg-green-50">
                                            <MonitorSmartphone size={28} color="#10b981" style={{ marginBottom: '8px' }} />
                                            <span style={{ fontSize: '13px', fontWeight: 600 }}>Service Cloud</span>
                                        </Link>
                                        <Link href="/admin/pedidos" onClick={() => setAppLauncherOpen(false)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 8px', borderRadius: '8px', textDecoration: 'none', color: '#1f2937', transition: 'background 0.2s' }} className="hover:bg-purple-50">
                                            <ShoppingCart size={28} color="#8b5cf6" style={{ marginBottom: '8px' }} />
                                            <span style={{ fontSize: '13px', fontWeight: 600 }}>Commerce</span>
                                        </Link>
                                        <Link href="/admin/marketing/campaigns" onClick={() => setAppLauncherOpen(false)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 8px', borderRadius: '8px', textDecoration: 'none', color: '#1f2937', transition: 'background 0.2s' }} className="hover:bg-orange-50">
                                            <Mail size={28} color="#f59e0b" style={{ marginBottom: '8px' }} />
                                            <span style={{ fontSize: '13px', fontWeight: 600 }}>Marketing</span>
                                        </Link>
                                    </div>
                                    <div style={{ padding: '12px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
                                        <Link href="/admin" onClick={() => setAppLauncherOpen(false)} style={{ color: '#3b82f6', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                                            Ver Dashboard Principal (Analytics) →
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Global Search Autocomplete (Hidden to prevent Tailwind purge breaking the store) */}
                        <div style={{ position: 'relative', marginLeft: '20px', display: 'none' }} className="hidden md:block">
                            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--admin-bg)', borderRadius: '20px', padding: '6px 16px', border: '1px solid var(--admin-border)', width: '300px' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--admin-text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                <input 
                                    type="text" 
                                    placeholder="Buscar globalmente..." 
                                    value={globalSearchQuery}
                                    onChange={e => setGlobalSearchQuery(e.target.value)}
                                    style={{ border: 'none', background: 'transparent', outline: 'none', marginLeft: '8px', fontSize: '14px', width: '100%', color: 'var(--admin-text-main)' }}
                                />
                                {isSearching && <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>...</span>}
                            </div>
                            
                            {showSearchDropdown && globalSearchResults && (
                                <div style={{
                                    position: 'absolute', top: '100%', left: 0, marginTop: '8px',
                                    width: '100%', background: '#fff', borderRadius: '12px',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)', border: '1px solid #e5e7eb',
                                    zIndex: 1000, overflow: 'hidden', padding: '10px'
                                }}>
                                    {globalSearchResults.productos?.length > 0 && (
                                        <div style={{ marginBottom: '10px' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '5px' }}>Productos</div>
                                            {globalSearchResults.productos.map(p => (
                                                <Link key={p.id} href={`/admin/productos/${p.id}/edit`} style={{ display: 'block', padding: '6px 8px', fontSize: '13px', color: '#374151', textDecoration: 'none', borderRadius: '6px' }} className="hover:bg-gray-100">
                                                    {p.nombre} - S/ {p.precio}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                    {globalSearchResults.pedidos?.length > 0 && (
                                        <div style={{ marginBottom: '10px' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '5px' }}>Pedidos</div>
                                            {globalSearchResults.pedidos.map(p => (
                                                <Link key={p.id} href={`/admin/pedidos/${p.id}`} style={{ display: 'block', padding: '6px 8px', fontSize: '13px', color: '#374151', textDecoration: 'none', borderRadius: '6px' }} className="hover:bg-gray-100">
                                                    Pedido #{p.codigo} - {p.usuario?.nombres}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                    {(!globalSearchResults.productos?.length && !globalSearchResults.pedidos?.length && !globalSearchResults.usuarios?.length) && (
                                        <div style={{ padding: '10px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                                            No se encontraron resultados
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="admin-topbar-actions">
                        <div style={{ position: 'relative' }}>
                            <button
                                className="admin-topbar-icon-btn"
                                onClick={() => setShowNotifs(!showNotifs)}
                            >
                                <Bell size={20} />
                                {notificaciones.length > 0 && <span className="notif-dot" style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', background: '#DC2626', borderRadius: '50%' }}></span>}
                            </button>

                            {showNotifs && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    width: '320px',
                                    maxWidth: '90vw',
                                    background: '#fff',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                    zIndex: 1000,
                                    marginTop: '8px',
                                    border: '1px solid #eee',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ padding: '16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Notificaciones</h3>
                                        <span style={{ fontSize: '12px', background: '#8a2be2', color: '#fff', padding: '2px 8px', borderRadius: '12px' }}>{notificaciones.length} nuevas</span>
                                    </div>
                                    <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                        {notificaciones.length === 0 ? (
                                            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#888', fontSize: '13px' }}>
                                                No tienes notificaciones nuevas.
                                            </div>
                                        ) : (
                                            notificaciones.map(n => (
                                                <div
                                                    key={n.id}
                                                    onClick={() => markAsRead(n.id, n.link)}
                                                    style={{ padding: '16px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', gap: '12px', alignItems: 'flex-start', background: n.read ? 'transparent' : '#f0f9ff' }}
                                                    onMouseOver={e => e.currentTarget.style.background = n.read ? '#f9f9f9' : '#e0f2fe'}
                                                    onMouseOut={e => e.currentTarget.style.background = n.read ? 'transparent' : '#f0f9ff'}
                                                >
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `var(--admin-${n.color || 'blue'}-100, #e0f2fe)`, color: `var(--admin-${n.color || 'blue'}-600, #0284c7)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        {n.icon === 'alert-triangle' ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg> :
                                                         n.icon === 'upload' ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg> :
                                                         <Bell size={16} />}
                                                    </div>
                                                    <div>
                                                        <p style={{ margin: '0 0 2px', fontSize: '13px', color: '#111827', fontWeight: 600 }}>{n.title}</p>
                                                        {n.body && <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#4b5563', lineHeight: '1.4' }}>{n.body}</p>}
                                                        <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>{n.time}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="admin-avatar" title={props.auth?.user?.nombres}>
                            {props.auth?.user?.nombres ? props.auth.user.nombres.substring(0, 2).toUpperCase() : 'AD'}
                        </div>
                    </div>
                </header>

                <div
                    className="admin-content"
                    style={(isMobile || isTablet) ? {
                        marginTop: 'calc(var(--admin-topbar-height) + 16px)'
                    } : {}}
                >
                    {props.flash?.success && (
                        <div style={{ background: '#10B981', color: 'white', padding: '15px 20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(16,185,129,0.2)' }}>
                            <span style={{ fontWeight: 'bold' }}>{props.flash.success}</span>
                        </div>
                    )}
                    {props.flash?.error && (
                        <div style={{ background: '#EF4444', color: 'white', padding: '15px 20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(239,68,68,0.2)' }}>
                            <span style={{ fontWeight: 'bold' }}>{props.flash.error}</span>
                        </div>
                    )}
                    <AnimatePresence mode="wait">
                        <PageTransition key={url}>
                            {children}
                        </PageTransition>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
