import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';

export default function Form({ banner }) {
    const isEdit = !!banner;
    
    const { data, setData, post, put, processing, errors } = useForm({
        titulo: banner?.titulo || '',
        imagen_url: banner?.imagen_url || '',
        link_url: banner?.link_url || '',
        activo: banner ? banner.activo : true,
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(`/admin/banners/${banner.id}`);
        } else {
            post('/admin/banners');
        }
    };

    return (
        <AdminLayout logoUrl={null}>
            <Head title={isEdit ? "Editar Banner" : "Nuevo Banner"} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>
                    {isEdit ? 'Editar Banner' : 'Crear Nuevo Banner'}
                </h1>
                <Link href="/admin/banners" style={{ color: 'var(--admin-text-muted)', textDecoration: 'none', fontWeight: '500' }}>
                    &larr; Volver a Banners
                </Link>
            </div>

            <div style={{ background: 'var(--admin-bg-panel)', borderRadius: '12px', padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', maxWidth: '600px' }}>
                <form onSubmit={submit} style={{ display: 'grid', gap: '20px' }}>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Título (Opcional)</label>
                        <input
                            type="text"
                            value={data.titulo}
                            onChange={e => setData('titulo', e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }}
                        />
                        {errors.titulo && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.titulo}</div>}
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>URL de la Imagen *</label>
                        <input
                            type="url"
                            value={data.imagen_url}
                            onChange={e => setData('imagen_url', e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }}
                            required
                        />
                        {errors.imagen_url && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.imagen_url}</div>}
                        {data.imagen_url && (
                            <div style={{ marginTop: '10px', height: '100px', background: '#333', borderRadius: '8px', overflow: 'hidden' }}>
                                <img src={data.imagen_url} alt="Vista previa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.target.style.display = 'none'} />
                            </div>
                        )}
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Enlace de Destino (URL - Opcional)</label>
                        <input
                            type="url"
                            value={data.link_url}
                            onChange={e => setData('link_url', e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }}
                        />
                        {errors.link_url && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.link_url}</div>}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="checkbox"
                            id="activo"
                            checked={data.activo}
                            onChange={e => setData('activo', e.target.checked)}
                            style={{ width: '18px', height: '18px' }}
                        />
                        <label htmlFor="activo" style={{ fontWeight: 'bold', color: 'var(--admin-text-main)', cursor: 'pointer' }}>Banner Activo</label>
                        {errors.activo && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.activo}</div>}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', paddingTop: '20px', borderTop: '1px solid var(--admin-border)' }}>
                        <Link 
                            href="/admin/banners" 
                            style={{ padding: '10px 20px', borderRadius: '8px', color: 'var(--admin-text-main)', textDecoration: 'none', fontWeight: '500' }}
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            style={{
                                background: '#1d4ed8',
                                color: 'white',
                                border: 'none',
                                padding: '10px 24px',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                cursor: processing ? 'not-allowed' : 'pointer',
                                opacity: processing ? 0.7 : 1,
                                boxShadow: '0 4px 10px rgba(29, 78, 216, 0.3)'
                            }}
                        >
                            {processing ? 'Guardando...' : (isEdit ? 'Actualizar Banner' : 'Guardar Banner')}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
