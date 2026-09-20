import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import CrmLayout from '../../../Layouts/CrmLayout';
import { useConfirm } from '@/Contexts/ConfirmContext';
import Drawer from '@/Components/Admin/Drawer';
export default function Index() {
    const confirmDialog = useConfirm();

    const { clientes, filtros, flash, errors } = usePage().props;
    const data = clientes?.data || [];
    
    const [search, setSearch] = useState(filtros?.buscar || '');
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timeoutId = setTimeout(() => {
            router.get('/admin/clientes', { buscar: search }, { preserveState: true, preserveScroll: true, replace: true });
        }, 400);
        return () => clearTimeout(timeoutId);
    }, [search]);
    
    // CRM Drawer states
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [activeTab, setActiveTab] = useState('resumen');

    const fetchProfile = async (id) => {
        setDrawerOpen(true);
        setLoadingProfile(true);
        try {
            const response = await fetch(`/admin/clientes/${id}/api-profile`);
            const json = await response.json();
            setSelectedProfile(json);
        } catch (error) {
            console.error('Error fetching profile', error);
        } finally {
            setLoadingProfile(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        router.get('/admin/clientes', { buscar: search }, { preserveState: true });
    };

    const handleDelete = async (id) => {
        if (await confirmDialog('¿Estás seguro de eliminar este usuario? (Mover a la papelera)')) {
            router.delete(`/admin/clientes/${id}`, { preserveScroll: true });
        }
    };

    const toggleBloqueo = async (id) => {
        router.post(`/admin/clientes/${id}/bloquear`, {}, { preserveScroll: true });
    };

    const resetPassword = async (id) => {
        if (await confirmDialog('¿Estás seguro de restablecer la contraseña a Novape2026!?')) {
            router.post(`/admin/clientes/${id}/reset-password`, {}, { preserveScroll: true });
        }
    };

    return (
        <CrmLayout title="CRM Directorio">
            <Head title="Directorio de Clientes" />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Directorio de Clientes (CRM)</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <a 
                        href="/admin/exportar/clientes" 
                        target="_blank"
                        style={{ background: '#2563eb', color: 'white', padding: '10px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)' }}
                    >
                        Exportar CSV
                    </a>
                    <Link 
                        href="/admin/clientes/create" 
                        style={{ background: '#1d4ed8', color: 'white', padding: '10px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(29, 78, 216, 0.3)' }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                        Nuevo Usuario
                    </Link>
                </div>
            </div>

            {flash?.success && (
                <div style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: '500', border: '1px solid rgba(37,99,235,0.2)' }}>
                    {flash.success}
                </div>
            )}
            
            {(flash?.error || errors?.error) && (
                <div style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: '500', border: '1px solid rgba(59,130,246,0.2)' }}>
                    {flash?.error || errors?.error}
                </div>
            )}

            <div style={{ background: 'var(--admin-bg-panel)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre, email o DNI..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }}
                    />
                    <button type="submit" style={{ background: '#4b5563', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                        Buscar
                    </button>
                    {search && (
                        <Link href="/admin/clientes" style={{ background: 'transparent', border: '1px solid var(--admin-border)', color: 'var(--admin-text-muted)', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                            Limpiar
                        </Link>
                    )}
                </form>
            </div>

            <div style={{ background: 'var(--admin-bg-panel)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--admin-border)', color: 'var(--admin-text-muted)' }}>
                            <th style={{ padding: '12px' }}>Usuario</th>
                            <th style={{ padding: '12px' }}>DNI / Teléfono</th>
                            <th style={{ padding: '12px' }}>Pedidos</th>
                            <th style={{ padding: '12px' }}>Segmento</th>
                            <th style={{ padding: '12px' }}>Estado</th>
                            <th style={{ padding: '12px', textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length > 0 ? data.map(cliente => (
                            <tr key={cliente.id} style={{ 
                                borderBottom: '1px solid var(--admin-border)', 
                                transition: 'all 0.2s', 
                                background: cliente.estado === 'bloqueado' ? 'rgba(239,68,68,0.05)' : 'transparent',
                                opacity: cliente.estado === 'bloqueado' ? 0.75 : 1 
                            }}>
                                <td style={{ padding: '12px', color: 'var(--admin-text-main)' }}>
                                    <div style={{ fontWeight: 'bold', textDecoration: cliente.estado === 'bloqueado' ? 'line-through' : 'none' }}>{cliente.nombres} {cliente.apellidos}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{cliente.email}</div>
                                </td>
                                <td style={{ padding: '12px', color: 'var(--admin-text-main)' }}>
                                    <div>{cliente.dni || '-'}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{cliente.telefono || '-'}</div>
                                </td>
                                <td style={{ padding: '12px', color: 'var(--admin-text-main)', fontWeight: 'bold' }}>
                                    {cliente.pedidos_count}
                                </td>
                                <td style={{ padding: '12px' }}>
                                    {cliente.segmento && (
                                        <span style={{ 
                                            background: `${cliente.segmento.color}20`, 
                                            color: cliente.segmento.color, 
                                            padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' 
                                        }}>
                                            {cliente.segmento.nombre}
                                        </span>
                                    )}
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{ 
                                        background: cliente.estado === 'activo' ? 'rgba(37,99,235,0.1)' : 'rgba(59,130,246,0.1)', 
                                        color: cliente.estado === 'activo' ? '#2563eb' : '#3b82f6', 
                                        padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', textTransform: 'capitalize' 
                                    }}>
                                        {cliente.estado === 'bloqueado' ? 'Bloqueado' : 'Activo'}
                                    </span>
                                </td>
                                <td style={{ padding: '12px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                        <button onClick={() => fetchProfile(cliente.id)} style={{ color: '#3b82f6', textDecoration: 'none', padding: '6px', borderRadius: '6px', background: 'rgba(59,130,246,0.1)', border: 'none', cursor: 'pointer' }} title="Ver Perfil 360">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                        </button>
                                        <Link href={`/admin/clientes/${cliente.id}/edit`} style={{ color: '#1d4ed8', textDecoration: 'none', padding: '6px', borderRadius: '6px', background: 'rgba(29,78,216,0.1)' }} title="Editar">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                        </Link>
                                        <button onClick={() => toggleBloqueo(cliente.id)} style={{ background: cliente.estado === 'bloqueado' ? 'rgba(37,99,235,0.1)' : 'rgba(96,165,250,0.1)', color: cliente.estado === 'bloqueado' ? '#2563eb' : '#60a5fa', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px' }} title={cliente.estado === 'bloqueado' ? 'Desbloquear' : 'Bloquear'}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                        </button>
                                        <button onClick={() => resetPassword(cliente.id)} style={{ background: 'rgba(107,114,128,0.1)', color: 'var(--admin-text-main)', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px' }} title="Resetear Contraseña">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h4l2-2 4 4 4-4 4 4 2-2"/></svg>
                                        </button>
                                        <button onClick={() => handleDelete(cliente.id)} style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px' }} title="Eliminar">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                                    No hay usuarios registrados o que coincidan con la búsqueda.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {clientes?.links && clientes.links.length > 3 && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '5px' }}>
                    {clientes.links.map((link, i) => (
                        <Link 
                            key={i} 
                            href={link.url || '#'} 
                            style={{ 
                                padding: '8px 12px', 
                                background: link.active ? '#1d4ed8' : 'var(--admin-bg-panel)', 
                                color: link.active ? 'white' : 'var(--admin-text-main)', 
                                borderRadius: '6px', 
                                textDecoration: 'none',
                                opacity: link.url ? 1 : 0.5,
                                pointerEvents: link.url ? 'auto' : 'none'
                            }}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}

            {/* CRM Drawer */}
            <Drawer 
                isOpen={drawerOpen} 
                onClose={() => { setDrawerOpen(false); setSelectedProfile(null); }} 
                title="Perfil del Cliente (CRM 360)" 
                width="450px"
            >
                {loadingProfile ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--admin-text-muted)' }}>
                        <div style={{ marginBottom: '10px' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg></div>
                        Cargando perfil...
                    </div>
                ) : selectedProfile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        
                        {/* Header Info */}
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: selectedProfile.segmento?.color || '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                                {selectedProfile.nombres.charAt(0)}{selectedProfile.apellidos ? selectedProfile.apellidos.charAt(0) : ''}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: '0 0 4px', fontSize: '18px', color: 'var(--admin-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {selectedProfile.nombres} {selectedProfile.apellidos}
                                    {selectedProfile.segmento && (
                                        <span style={{ background: `${selectedProfile.segmento.color}20`, color: selectedProfile.segmento.color, padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>
                                            {selectedProfile.segmento.nombre}
                                        </span>
                                    )}
                                </h3>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '13px' }}>{selectedProfile.email}</div>
                                <div style={{ color: 'var(--admin-text-muted)', fontSize: '13px' }}>{selectedProfile.telefono || 'Sin teléfono'} • DNI: {selectedProfile.dni || 'N/A'}</div>
                            </div>
                            
                            {/* Acción Omnicanal */}
                            {selectedProfile.telefono && (
                                <a 
                                    href={`https://wa.me/${selectedProfile.telefono.replace(/\D/g,'')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#25D366', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textDecoration: 'none' }}
                                    title="Abrir Chat (WhatsApp Web)"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                                </a>
                            )}
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--admin-border)', marginBottom: '20px' }}>
                            <button onClick={() => setActiveTab('resumen')} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderBottom: activeTab === 'resumen' ? '2px solid #2563eb' : '2px solid transparent', color: activeTab === 'resumen' ? '#2563eb' : 'var(--admin-text-muted)', fontWeight: activeTab === 'resumen' ? 'bold' : 'normal', cursor: 'pointer' }}>Resumen</button>
                            <button onClick={() => setActiveTab('historial')} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderBottom: activeTab === 'historial' ? '2px solid #2563eb' : '2px solid transparent', color: activeTab === 'historial' ? '#2563eb' : 'var(--admin-text-muted)', fontWeight: activeTab === 'historial' ? 'bold' : 'normal', cursor: 'pointer' }}>Historial</button>
                            <button onClick={() => setActiveTab('direcciones')} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderBottom: activeTab === 'direcciones' ? '2px solid #2563eb' : '2px solid transparent', color: activeTab === 'direcciones' ? '#2563eb' : 'var(--admin-text-muted)', fontWeight: activeTab === 'direcciones' ? 'bold' : 'normal', cursor: 'pointer' }}>Direcciones</button>
                            <button onClick={() => setActiveTab('notas')} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderBottom: activeTab === 'notas' ? '2px solid #2563eb' : '2px solid transparent', color: activeTab === 'notas' ? '#2563eb' : 'var(--admin-text-muted)', fontWeight: activeTab === 'notas' ? 'bold' : 'normal', cursor: 'pointer' }}>Notas</button>
                        </div>

                        {/* Contenido Tabs */}
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {activeTab === 'resumen' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <div style={{ flex: 1, backgroundColor: 'white', padding: '15px', borderRadius: '12px', border: '1px solid var(--admin-border)', textAlign: 'center' }}>
                                            <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '5px' }}>Lifetime Value</div>
                                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>S/ {Number(selectedProfile.metricas.lifetime_value).toFixed(2)}</div>
                                        </div>
                                        <div style={{ flex: 1, backgroundColor: 'white', padding: '15px', borderRadius: '12px', border: '1px solid var(--admin-border)', textAlign: 'center' }}>
                                            <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '5px' }}>Total Pedidos</div>
                                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>{selectedProfile.metricas.total_pedidos}</div>
                                        </div>
                                    </div>
                                    <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '12px', border: '1px solid var(--admin-border)' }}>
                                        <h4 style={{ margin: '0 0 10px', fontSize: '13px', color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Información de Contacto</h4>
                                        <div style={{ fontSize: '13px', color: 'var(--admin-text-main)', display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px' }}>
                                            <strong>Documento:</strong> <span>{selectedProfile.dni || '-'}</span>
                                            <strong>Email:</strong> <span>{selectedProfile.email || '-'}</span>
                                            <strong>Teléfono:</strong> <span>{selectedProfile.telefono || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'historial' && (
                                <div>
                                    {selectedProfile.ultimos_pedidos.length === 0 ? (
                                        <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>No tiene pedidos registrados.</div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {selectedProfile.ultimos_pedidos.map(p => (
                                                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>#{p.codigo}</div>
                                                        <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>{p.fecha}</div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontWeight: 'bold', color: '#10b981', fontSize: '13px' }}>S/ {p.total}</div>
                                                        <div style={{ fontSize: '11px', textTransform: 'capitalize', color: '#64748b' }}>{p.estado}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'direcciones' && (
                                <div>
                                    {!selectedProfile.direcciones || selectedProfile.direcciones.length === 0 ? (
                                        <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>Sin direcciones de envío.</div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {selectedProfile.direcciones.map(d => (
                                                <div key={d.id} style={{ backgroundColor: 'white', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--admin-border)', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ marginTop: '2px' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                                    <div>
                                                        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{d.distrito} {d.principal ? <span style={{ color: 'white', background: '#2563eb', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px' }}>Principal</span> : null}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{d.direccion}</div>
                                                        {d.referencia && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Ref: {d.referencia}</div>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'notas' && (
                                <div>
                                    <form 
                                        onSubmit={async (e) => {
                                            e.preventDefault();
                                            const nota = e.target.nota.value;
                                            if(!nota.trim()) return;
                                            
                                            try {
                                                await router.post(`/admin/clientes/${selectedProfile.id}/notas`, { nota }, { preserveScroll: true });
                                                e.target.reset();
                                                fetchProfile(selectedProfile.id); // Reload
                                            } catch(err) {}
                                        }}
                                        style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}
                                    >
                                        <input type="text" name="nota" placeholder="Añadir una nota rápida..." style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--admin-border)', fontSize: '13px' }} required />
                                        <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', padding: '0 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Guardar</button>
                                    </form>

                                    {selectedProfile.notas.length === 0 ? (
                                        <div style={{ fontSize: '13px', color: 'var(--admin-text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>No hay notas para este cliente.</div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {selectedProfile.notas.map(n => (
                                                <div key={n.id} style={{ backgroundColor: '#fef3c7', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                                                    <div style={{ fontSize: '13px', color: '#92400e', marginBottom: '4px' }}>{n.nota}</div>
                                                    <div style={{ fontSize: '11px', color: '#b45309', display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>Por: {n.autor}</span>
                                                        <span>{n.fecha}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                    </div>
                ) : null}
            </Drawer>

        </CrmLayout>
    );
}
