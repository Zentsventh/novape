import React from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { FileText, Plus, Edit, Trash2 } from 'lucide-react';

export default function Index({ pages }) {
    const { configuraciones } = usePage().props;

    const handleDelete = (id) => {
        if (confirm('¿Estás seguro de eliminar esta página?')) {
            router.delete(`/admin/pages/${id}`);
        }
    };

    return (
        <AdminLayout logoUrl={configuraciones?.logo_url}>
            <Head title="Páginas (CMS)" />
            
            <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText /> Páginas (CMS)
                    </h1>
                    <Link href="/admin/pages/create" style={{ background: '#004797', color: 'white', padding: '10px 16px', borderRadius: '8px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> Nueva Página
                    </Link>
                </div>

                <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <tr>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#64748B' }}>Título</th>
                                <th style={{ padding: '16px', textAlign: 'left', color: '#64748B' }}>Slug</th>
                                <th style={{ padding: '16px', textAlign: 'center', color: '#64748B' }}>Estado</th>
                                <th style={{ padding: '16px', textAlign: 'right', color: '#64748B' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pages.map(page => (
                                <tr key={page.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                    <td style={{ padding: '16px', fontWeight: 'bold' }}>{page.title}</td>
                                    <td style={{ padding: '16px', color: '#64748B' }}>/{page.slug}</td>
                                    <td style={{ padding: '16px', textAlign: 'center' }}>
                                        <span style={{ padding: '4px 8px', borderRadius: '4px', background: page.is_active ? '#DCFCE7' : '#F1F5F9', color: page.is_active ? '#16A34A' : '#64748B', fontSize: '12px', fontWeight: 'bold' }}>
                                            {page.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                        <Link aria-label={`Editar ${page.title}`} href={`/admin/pages/${page.id}/edit`} style={{ color: '#004797', marginRight: '16px' }}>
                                            <Edit size={18} />
                                        </Link>
                                        <button aria-label={`Eliminar ${page.title}`} onClick={() => handleDelete(page.id)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {pages.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: '#94A3B8' }}>
                                        No hay páginas creadas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
