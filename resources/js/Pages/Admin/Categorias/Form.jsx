import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';

export default function Form({ categoria, categoriasPadre }) {
    const isEdit = !!categoria;
    
    const { data, setData, post, put, processing, errors } = useForm({
        nombre: categoria?.nombre || '',
        descripcion: categoria?.descripcion || '',
        categoria_padre_id: categoria?.categoria_padre_id || '',
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(`/admin/categorias/${categoria.id}`);
        } else {
            post('/admin/categorias');
        }
    };

    return (
        <AdminLayout logoUrl={null}>
            <Head title={isEdit ? "Editar Categoría" : "Nueva Categoría"} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>
                    {isEdit ? 'Editar Categoría' : 'Crear Nueva Categoría'}
                </h1>
                <Link href="/admin/categorias" style={{ color: 'var(--admin-text-muted)', textDecoration: 'none', fontWeight: '500' }}>
                    &larr; Volver a Categorías
                </Link>
            </div>

            <div style={{ background: 'var(--admin-bg-panel)', borderRadius: '12px', padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', maxWidth: '600px' }}>
                <form onSubmit={submit} style={{ display: 'grid', gap: '20px' }}>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Nombre de Categoría *</label>
                        <input
                            type="text"
                            value={data.nombre}
                            onChange={e => setData('nombre', e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }}
                            required
                        />
                        {errors.nombre && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.nombre}</div>}
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Categoría Padre (Opcional)</label>
                        <select
                            value={data.categoria_padre_id}
                            onChange={e => setData('categoria_padre_id', e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'var(--admin-bg-panel)', color: 'var(--admin-text-main)' }}
                        >
                            <option value="">Ninguna (Categoría Principal)</option>
                            {categoriasPadre?.map(padre => (
                                <option key={padre.id} value={padre.id}>{padre.nombre}</option>
                            ))}
                        </select>
                        {errors.categoria_padre_id && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.categoria_padre_id}</div>}
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Descripción (Opcional)</label>
                        <textarea
                            value={data.descripcion}
                            onChange={e => setData('descripcion', e.target.value)}
                            rows="4"
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }}
                        ></textarea>
                        {errors.descripcion && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.descripcion}</div>}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', paddingTop: '20px', borderTop: '1px solid var(--admin-border)' }}>
                        <Link 
                            href="/admin/categorias" 
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
                            {processing ? 'Guardando...' : (isEdit ? 'Actualizar Categoría' : 'Guardar Categoría')}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
