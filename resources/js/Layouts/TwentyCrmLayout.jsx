import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
    Search, Home, Target, Users, Building, 
    CheckSquare, Settings, Zap, Bell, ChevronLeft, ChevronRight, Menu, Ticket, Calendar
} from 'lucide-react';
import '../../css/admin/twenty.css'; // The new CSS file
import CrmCommandPalette from '../Components/Admin/CRM/CrmCommandPalette';

export default function TwentyCrmLayout({ children, title, headerActions }) {
    const { url, props } = usePage();
    const user = props.auth?.user;
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [notificaciones, setNotificaciones] = useState([]);
    const [showNotifs, setShowNotifs] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setPaletteOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

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

    // Minimalist navigation inspired by Twenty CRM
    const navItems = [
        { href: '/admin/crm/dashboard', label: 'Inicio', icon: <Home size={18} /> },
        { href: '/admin/crm/pipeline', label: 'Oportunidades', icon: <Target size={18} /> },
        { href: '/admin/crm/calendar', label: 'Calendario', icon: <Calendar size={18} /> },
        { href: '/admin/crm/companies', label: 'Empresas', icon: <Building size={18} /> },
        { href: '/admin/clientes', label: 'Personas', icon: <Users size={18} /> },
        { href: '/admin/crm/tasks', label: 'Tareas', icon: <CheckSquare size={18} /> },
        { href: '/admin/crm/cases', label: 'Casos (Soporte)', icon: <Ticket size={18} /> },
        { href: '/admin/crm/automations', label: 'Automations', icon: <Zap size={18} /> },
        { href: '/admin/inbox', label: 'Bandeja', icon: <Bell size={18} /> },
    ];

    const settingsItems = [
        { href: '/admin/crm/settings/objects', label: 'Configuración', icon: <Settings size={18} /> },
    ];

    const isActive = (href) => url.startsWith(href);

    return (
        <div className="twenty-layout">
            {/* Sidebar */}
            <aside className={`twenty-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="twenty-sidebar-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'space-between' }}>
                        {!sidebarCollapsed && (
                            <Link href="/admin/crm/dashboard" style={{ textDecoration: 'none', color: 'var(--twenty-text-main)', fontWeight: 700, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: 24, height: 24, background: 'var(--twenty-primary)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 14 }}>
                                    N
                                </div>
                                Novape CRM
                            </Link>
                        )}
                        {sidebarCollapsed && (
                            <div style={{ width: 24, height: 24, background: 'var(--twenty-primary)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 14 }}>
                                N
                            </div>
                        )}
                    </div>
                </div>

                <nav className="twenty-nav">
                    {!sidebarCollapsed && <div className="twenty-nav-group-title">Vistas</div>}
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`twenty-nav-item ${isActive(item.href) ? 'active' : ''}`}
                            title={sidebarCollapsed ? item.label : ''}
                            style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
                        >
                            {item.icon}
                            {!sidebarCollapsed && <span>{item.label}</span>}
                        </Link>
                    ))}
                    
                    {!sidebarCollapsed && <div className="twenty-nav-group-title" style={{ marginTop: '24px' }}>Ajustes</div>}
                    {settingsItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`twenty-nav-item ${isActive(item.href) ? 'active' : ''}`}
                            title={sidebarCollapsed ? item.label : ''}
                            style={{ justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
                        >
                            {item.icon}
                            {!sidebarCollapsed && <span>{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                {/* Sidebar Footer */}
                <div style={{ padding: '16px', borderTop: '1px solid var(--twenty-border)', display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'space-between' }}>
                    {!sidebarCollapsed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--twenty-bg-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
                                {user?.nombres?.charAt(0) || 'U'}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.nombres}</span>
                                <span style={{ fontSize: 11, color: 'var(--twenty-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</span>
                            </div>
                        </div>
                    )}
                    {sidebarCollapsed && (
                         <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--twenty-bg-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, margin: '16px auto 0' }}>
                            {user?.nombres?.charAt(0) || 'U'}
                        </div>
                    )}
                </div>

                {/* Search / Cmd+K trigger in sidebar */}
                {!sidebarCollapsed && (
                    <div style={{ marginTop: 'auto', padding: '16px' }}>
                        <button 
                            onClick={() => setPaletteOpen(true)}
                            style={{ 
                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '8px 12px', background: 'var(--twenty-background)', 
                                border: '1px solid var(--twenty-border)', borderRadius: '6px',
                                color: 'var(--twenty-text-muted)', fontSize: '13px', cursor: 'pointer'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Search size={14} /> Buscar...
                            </div>
                            <span style={{ fontSize: '11px', background: 'var(--twenty-background-tertiary)', padding: '2px 4px', borderRadius: '4px' }}>⌘K</span>
                        </button>
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <main className="twenty-main">
                {/* Topbar */}
                <header className="twenty-topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button 
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="twenty-btn-icon"
                            title={sidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
                        >
                            <Menu size={18} />
                        </button>
                        <h1 className="twenty-topbar-title">{title}</h1>
                    </div>
                    
                    <div className="twenty-topbar-actions">
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--twenty-text-muted)' }} />
                            <input 
                                type="text" 
                                placeholder="Buscar..." 
                                style={{ 
                                    padding: '6px 12px 6px 32px', 
                                    borderRadius: '6px', 
                                    border: '1px solid var(--twenty-border)', 
                                    fontSize: '13px', 
                                    outline: 'none',
                                    width: '200px',
                                    backgroundColor: 'var(--twenty-bg-app)'
                                }} 
                            />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <button
                                className="twenty-btn-icon"
                                onClick={() => setShowNotifs(!showNotifs)}
                                style={{ position: 'relative' }}
                            >
                                <Bell size={18} />
                                {notificaciones.length > 0 && <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: '#DC2626', borderRadius: '50%' }}></span>}
                            </button>

                            {showNotifs && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    width: '320px',
                                    background: 'var(--twenty-background)',
                                    borderRadius: '12px',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                    zIndex: 1000,
                                    marginTop: '8px',
                                    border: '1px solid var(--twenty-border)',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ padding: '16px', borderBottom: '1px solid var(--twenty-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--twenty-text-main)' }}>Notificaciones</h3>
                                        <span style={{ fontSize: '12px', background: 'var(--twenty-primary)', color: '#fff', padding: '2px 8px', borderRadius: '12px' }}>{notificaciones.length} nuevas</span>
                                    </div>
                                    <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                        {notificaciones.length === 0 ? (
                                            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--twenty-text-muted)', fontSize: '13px' }}>
                                                No tienes notificaciones nuevas.
                                            </div>
                                        ) : (
                                            notificaciones.map(n => (
                                                <div
                                                    key={n.id}
                                                    onClick={() => markAsRead(n.id, n.link)}
                                                    style={{ padding: '16px', borderBottom: '1px solid var(--twenty-border)', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', gap: '12px', alignItems: 'flex-start', background: n.read ? 'transparent' : 'var(--twenty-bg-active)' }}
                                                >
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `var(--admin-${n.color || 'blue'}-100, #e0f2fe)`, color: `var(--admin-${n.color || 'blue'}-600, #0284c7)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        {n.icon === 'alert-triangle' ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg> :
                                                         n.icon === 'upload' ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg> :
                                                         <Bell size={16} />}
                                                    </div>
                                                    <div>
                                                        <p style={{ margin: '0 0 2px', fontSize: '13px', color: 'var(--twenty-text-main)', fontWeight: 600 }}>{n.title}</p>
                                                        {n.body && <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--twenty-text-muted)', lineHeight: '1.4' }}>{n.body}</p>}
                                                        <p style={{ margin: 0, fontSize: '11px', color: 'var(--twenty-text-muted)' }}>{n.time}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        {headerActions}
                    </div>
                </header>

                {/* Page Content */}
                <div className="twenty-content-area">
                    {children}
                </div>
            </main>

            <CrmCommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
        </div>
    );
}
