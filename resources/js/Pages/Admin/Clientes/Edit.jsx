import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';

export default function Edit({ cliente, roles }) {
    const { data, setData, put, processing, errors } = useForm({
        nombres: cliente.nombres,
        apellidos: cliente.apellidos,
        email: cliente.email,
        dni: cliente.dni || '',
        telefono: cliente.telefono || '',
    });


    const submit = (e) => {
        e.preventDefault();
        put(`/admin/clientes/${cliente.id}`);
    };

    return (
        <AdminLayout logoUrl={null}>
            <Head title="Editar Usuario" />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Editar Usuario</h1>
                <Link href="/admin/clientes" style={{ color: 'var(--admin-text-muted)', textDecoration: 'none', fontWeight: '500' }}>
                    &larr; Volver a Usuarios
                </Link>
            </div>

            <div style={{ background: 'var(--admin-bg-panel)', borderRadius: '12px', padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', maxWidth: '800px' }}>
                <form onSubmit={submit} style={{ display: 'grid', gap: '20px' }}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Nombres *</label>
                            <input
                                type="text"
                                value={data.nombres}
                                onChange={e => setData('nombres', e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }}
                                required
                            />
                            {errors.nombres && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.nombres}</div>}
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Apellidos *</label>
                            <input
                                type="text"
                                value={data.apellidos}
                                onChange={e => setData('apellidos', e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }}
                                required
                            />
                            {errors.apellidos && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.apellidos}</div>}
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Email *</label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }}
                            required
                        />
                        {errors.email && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.email}</div>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>DNI</label>
                            <input
                                type="text"
                                value={data.dni}
                                onChange={e => setData('dni', e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }}
                            />
                            {errors.dni && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.dni}</div>}
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Teléfono</label>
                            <input
                                type="text"
                                value={data.telefono}
                                onChange={e => setData('telefono', e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }}
                            />
                            {errors.telefono && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.telefono}</div>}
                        </div>
                    </div>


                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', paddingTop: '20px', borderTop: '1px solid var(--admin-border)' }}>
                        <Link 
                            href="/admin/clientes" 
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
                            {processing ? 'Actualizando...' : 'Actualizar Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
