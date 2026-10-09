import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';

export default function Form({ marca }) {
    const isEdit = !!marca;
    
    const { data, setData, post, put, processing, errors } = useForm({
        nombre: marca?.nombre || '',
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(`/admin/marcas/${marca.id}`);
        } else {
            post('/admin/marcas');
        }
    };

    return (
        <AdminLayout logoUrl={null}>
            <Head title={isEdit ? "Editar Marca" : "Nueva Marca"} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>
                    {isEdit ? 'Editar Marca' : 'Crear Nueva Marca'}
                </h1>
                <Link href="/admin/marcas" style={{ color: 'var(--admin-text-muted)', textDecoration: 'none', fontWeight: '500' }}>
                    &larr; Volver a Marcas
                </Link>
            </div>

            <div style={{ background: 'var(--admin-bg-panel)', borderRadius: '12px', padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', maxWidth: '600px' }}>
                <form onSubmit={submit} style={{ display: 'grid', gap: '20px' }}>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Nombre de la Marca *</label>
                        <input
                            type="text"
                            value={data.nombre}
                            onChange={e => setData('nombre', e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }}
                            required
                        />
                        {errors.nombre && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.nombre}</div>}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', paddingTop: '20px', borderTop: '1px solid var(--admin-border)' }}>
                        <Link 
                            href="/admin/marcas" 
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
                            {processing ? 'Guardando...' : (isEdit ? 'Actualizar Marca' : 'Guardar Marca')}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
