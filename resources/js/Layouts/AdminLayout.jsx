import { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import {
    LayoutDashboard, MonitorSmartphone, ShoppingCart, Package,
    CreditCard, Wallet, Archive, Image, Users, Truck,
    UserCog, Shield, Star, Settings, LogOut, Menu, X, Bell, Eye, Grid, Briefcase, Mail
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
                { href: '/admin', label: 'Dashboard', exact: true, permission: 'ver_dashboard', icon: <LayoutDashboard size={20} /> },
            ]
        },
        {
            title: 'Ventas y Atención',
            items: [
                { href: '/admin/crm/dashboard', label: 'CRM', permission: 'pos.vender', icon: <Users size={20} /> },
                { href: '/admin/pos', label: 'POS', permission: 'pos.vender', icon: <MonitorSmartphone size={20} /> },
                { href: '/admin/pedidos', label: 'Ventas', permission: 'pos.vender', icon: <ShoppingCart size={20} /> },
            ]
        },
        {
            title: 'Catálogo y Logística',
            items: [
                { href: '/admin/inventario', label: 'Inventario', permission: 'inventario.gestionar', icon: <LayoutDashboard size={20} /> },
                { href: '/admin/products', label: 'Productos', permission: 'inventario.gestionar', icon: <Package size={20} /> },
                { href: '/admin/almacenes', label: 'Almacén', permission: 'inventario.gestionar', icon: <Archive size={20} /> },
                { href: '/admin/zonas', label: 'Zonas Envío', permission: 'usuarios.gestionar', icon: <Truck size={20} /> },
            ]
        },
        {
            title: 'Administración',
            items: [
                { href: '/admin/compras', label: 'Compras', permission: 'inventario.gestionar', icon: <CreditCard size={20} /> },
                { href: '/admin/proveedores', label: 'Proveedores', permission: 'inventario.gestionar', icon: <Truck size={20} /> },
                { href: '/admin/gastos', label: 'Gastos', permission: 'reportes.ver', icon: <Wallet size={20} /> },
                { href: '/admin/cupones', label: 'Cupones', permission: 'gestionar_cupones', icon: <Package size={20} /> },
                { href: '/admin/banners', label: 'CMS Banners', permission: 'usuarios.gestionar', icon: <Image size={20} /> },
            ]
        },
        {
            title: 'Sistema',
            items: [
                { href: '/admin/trabajadores', label: 'Usuarios', permission: 'usuarios.gestionar', icon: <UserCog size={20} /> },
                { href: '/admin/roles', label: 'Roles y Permisos', permission: 'usuarios.gestionar', icon: <Shield size={20} /> },
                { href: '/admin/ajustes', label: 'Configuración', permission: 'usuarios.gestionar', icon: <Settings size={20} /> }
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
                            <div style={{ padding: '0 20px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', marginBottom: '5px', marginTop: idx > 0 ? '10px' : '0' }}>
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

                        {/* App Launcher */}
                        <div style={{ position: 'relative' }}>
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
                                                    onClick={() => markAsRead(n.id, '/admin/pedidos/' + n.data.pedido_id)}
                                                    style={{ padding: '16px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', gap: '12px', alignItems: 'flex-start' }}
                                                    onMouseOver={e => e.currentTarget.style.background = '#f9f9f9'}
                                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(138,43,226,0.1)', color: '#8a2be2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                                                    </div>
                                                    <div>
                                                        <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#333', fontWeight: 500 }}>{n.data.mensaje}</p>
                                                        <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>Hace {Math.round((new Date() - new Date(n.created_at)) / 60000)} min</p>
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
                    {children}
                </div>
            </main>
        </div>
    );
}
