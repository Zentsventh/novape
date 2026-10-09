import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import AdminLayout from './AdminLayout';
import { LayoutDashboard, Kanban, Users, CheckSquare, MessageSquare } from 'lucide-react';

export default function CrmLayout({ children, title }) {
    const { url } = usePage();

    const tabs = [
        { name: 'Dashboard', href: '/admin/crm/dashboard', icon: <LayoutDashboard size={16} /> },
        { name: 'Omnicanal', href: '/admin/inbox', icon: <MessageSquare size={16} /> },
        { name: 'Pipeline', href: '/admin/crm/pipeline', icon: <Kanban size={16} /> },
        { name: 'Mis Tareas', href: '/admin/crm/tasks', icon: <CheckSquare size={16} /> },
        { name: 'Directorio', href: '/admin/clientes', icon: <Users size={16} /> },
    ];

    return (
        <AdminLayout logoUrl={null}>
            {/* Header/Tabs Section */}
            <div style={{ 
                backgroundColor: 'var(--admin-bg)', 
                borderBottom: '1px solid var(--admin-border)',
                padding: '0 32px',
                marginBottom: '24px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '20px', paddingBottom: '16px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)', margin: 0 }}>
                        {title || "CRM Enterprise 360°"}
                    </h1>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    {tabs.map((tab) => {
                        const isActive = url.startsWith(tab.href);
                        
                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 20px',
                                    color: isActive ? '#3b82f6' : 'var(--admin-text-muted)',
                                    fontWeight: isActive ? 600 : 500,
                                    borderBottom: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                                    textDecoration: 'none',
                                    transition: 'all 0.2s ease',
                                    fontSize: '14px',
                                    borderTopLeftRadius: '8px',
                                    borderTopRightRadius: '8px',
                                    backgroundColor: isActive ? 'var(--admin-bg-hover)' : 'transparent'
                                }}
                            >
                                {React.cloneElement(tab.icon, { color: isActive ? '#3b82f6' : '#9ca3af' })}
                                <span>{tab.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
            
            {/* Main Content Area */}
            <div style={{ padding: '0 32px 32px 32px', height: 'calc(100vh - 180px)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {children}
            </div>
            
        </AdminLayout>
    );
}
