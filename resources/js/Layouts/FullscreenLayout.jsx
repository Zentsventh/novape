import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, LogOut } from 'lucide-react';
import '../../css/admin/admin.css';

const LOGO_FALLBACK = '/images/logo.png';

export default function FullscreenLayout({ children, logoUrl, title = 'Módulo' }) {
    const { props } = usePage();
    const logo = logoUrl || props.logoUrl || LOGO_FALLBACK;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: 'var(--admin-bg-main, #f8fafc)' }}>
            {/* Topbar minimalista */}
            <header 
                style={{
                    height: 'var(--admin-topbar-height, 60px)',
                    backgroundColor: 'var(--admin-bg-panel, #ffffff)',
                    borderBottom: '1px solid var(--admin-border, #e2e8f0)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 20px',
                    flexShrink: 0,
                    zIndex: 1000
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <Link 
                        href="/admin" 
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            color: '#64748b', 
                            textDecoration: 'none',
                            fontWeight: 500,
                            fontSize: '14px'
                        }}
                    >
                        <ArrowLeft size={18} />
                        Volver al Panel
                    </Link>
                    <div style={{ height: '24px', width: '1px', backgroundColor: '#e2e8f0' }}></div>
                    <img src={logo} alt="Logo" style={{ maxHeight: '30px' }} />
                    <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '15px' }}>{title}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div className="admin-avatar" title={props.auth?.user?.nombres}>
                        {props.auth?.user?.nombres ? props.auth.user.nombres.substring(0, 2).toUpperCase() : 'AD'}
                    </div>
                </div>
            </header>

            {/* Contenido principal que ocupa todo el espacio restante */}
            <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                {children}
            </main>
        </div>
    );
}
