import React, { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { useConfirm } from '@/Contexts/ConfirmContext';


export default function Index() {
    const confirmDialog = useConfirm();

    const { categorias, flash } = usePage().props;
    const [expanded, setExpanded] = useState({});

    const toggleExpand = async (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleDelete = async (id) => {
        if (await confirmDialog('¿Estás seguro de eliminar esta categoría? Si es una categoría principal, también afectará a sus subcategorías (dependiendo de la configuración).')) {
            router.delete(`/admin/categorias/${id}`);
        }
    };

    // Agrupar categorías
    const parentCategories = categorias ? categorias.filter(c => !c.categoria_padre_id) : [];
    const getSubcategories = (parentId) => categorias ? categorias.filter(c => c.categoria_padre_id === parentId) : [];

    return (
        <AdminLayout logoUrl={null}>
            <Head title="Categorías" />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Gestión de Categorías</h1>
                <Link 
                    href="/admin/categorias/create" 
                    style={{ background: '#1d4ed8', color: 'white', padding: '10px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(29, 78, 216, 0.3)' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                    Nueva Categoría
                </Link>
            </div>

            {flash?.success && (
                <div style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: '500', border: '1px solid rgba(37,99,235,0.2)' }}>
                    {flash.success}
                </div>
            )}

            <div style={{ background: 'var(--admin-bg-panel)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--admin-border)', color: 'var(--admin-text-muted)' }}>
                            <th style={{ padding: '12px', width: '50px' }}>ID</th>
                            <th style={{ padding: '12px' }}>Jerarquía / Nombre</th>
                            <th style={{ padding: '12px' }}>Descripción</th>
                            <th style={{ padding: '12px' }}>Productos</th>
                            <th style={{ padding: '12px', textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {parentCategories.length > 0 ? parentCategories.map(parent => {
                            const subs = getSubcategories(parent.id);
                            const hasSubs = subs.length > 0;
                            const isExpanded = expanded[parent.id];
                            
                            return (
                                <React.Fragment key={parent.id}>
                                    <tr style={{ borderBottom: '1px solid var(--admin-border)', background: isExpanded ? 'rgba(138,43,226,0.03)' : 'var(--admin-bg-panel)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '12px', color: 'var(--admin-text-main)', fontWeight: 'bold' }}>#{parent.id}</td>
                                        <td style={{ padding: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {hasSubs ? (
                                                    <button 
                                                        onClick={() => toggleExpand(parent.id)}
                                                        style={{ background: 'rgba(29,78,216,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '6px', color: '#1d4ed8', transition: 'all 0.2s' }}
                                                        title={isExpanded ? 'Contraer' : 'Expandir subcategorías'}
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                                                            <polyline points="9 18 15 12 9 6"></polyline>
                                                        </svg>
                                                    </button>
                                                ) : (
                                                    <div style={{ width: '24px' }}></div>
                                                )}
                                                <div style={{ fontWeight: 'bold', color: 'var(--admin-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                                                    {parent.nombre}
                                                </div>
                                                {hasSubs && (
                                                    <span style={{ fontSize: '11px', background: 'var(--admin-border)', padding: '2px 6px', borderRadius: '12px', color: 'var(--admin-text-muted)' }}>
                                                        {subs.length} sub
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px', color: 'var(--admin-text-muted)' }}>{parent.descripcion || '-'}</td>
                                        <td style={{ padding: '12px', color: 'var(--admin-text-muted)' }}>
                                            {parent.productos_count !== undefined ? (
                                                <span style={{ background: 'rgba(29,78,216,0.1)', color: '#1d4ed8', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                                    {parent.productos_count} productos
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <Link href={`/admin/categorias/${parent.id}/edit`} style={{ color: '#3b82f6', textDecoration: 'none', padding: '6px', borderRadius: '6px', background: 'rgba(59,130,246,0.1)' }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                </Link>
                                                <button onClick={() => handleDelete(parent.id)} style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    
                                    {isExpanded && subs.map(sub => (
                                        <tr key={sub.id} style={{ borderBottom: '1px solid var(--admin-border)', background: 'rgba(0,0,0,0.01)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '12px', color: 'var(--admin-text-muted)' }}>#{sub.id}</td>
                                            <td style={{ padding: '12px 12px 12px 50px', fontWeight: '500', color: 'var(--admin-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--admin-text-muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                                                {sub.nombre}
                                            </td>
                                            <td style={{ padding: '12px', color: 'var(--admin-text-muted)' }}>{sub.descripcion || '-'}</td>
                                            <td style={{ padding: '12px', color: 'var(--admin-text-muted)' }}>
                                                {sub.productos_count !== undefined ? (
                                                    <span style={{ background: 'rgba(107,114,128,0.1)', color: 'var(--admin-text-muted)', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                                        {sub.productos_count} productos
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <Link href={`/admin/categorias/${sub.id}/edit`} style={{ color: '#3b82f6', textDecoration: 'none', padding: '6px', borderRadius: '6px', background: 'rgba(59,130,246,0.1)' }}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                    </Link>
                                                    <button onClick={() => handleDelete(sub.id)} style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            );
                        }) : (
                            <tr>
                                <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                                    No hay categorías registradas.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
