import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';

export default function Form({ promocion, productos }) {
    const isEdit = !!promocion;
    
    const [selectedProducts, setSelectedProducts] = useState(
        isEdit ? promocion.productos.map(p => p.id) : []
    );

    const { data, setData, post, put, processing, errors } = useForm({
        nombre: promocion?.nombre || '',
        tipo_descuento: promocion?.tipo_descuento || 'porcentaje',
        valor_descuento: promocion?.valor_descuento || '',
        fecha_inicio: promocion?.fecha_inicio ? promocion.fecha_inicio.split('T')[0] : '',
        fecha_fin: promocion?.fecha_fin ? promocion.fecha_fin.split('T')[0] : '',
        activa: promocion ? promocion.activa : true,
        combinable_coupon: promocion?.combinable_coupon ?? false,
        productos: isEdit ? promocion.productos.map(p => p.id) : [],
    });

    const handleProductChange = (e) => {
        const value = parseInt(e.target.value);
        let newSelected = [...selectedProducts];
        
        if (e.target.checked) {
            newSelected.push(value);
        } else {
            newSelected = newSelected.filter(id => id !== value);
        }
        
        setSelectedProducts(newSelected);
        setData('productos', newSelected);
    };

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(`/admin/promociones/${promocion.id}`);
        } else {
            post('/admin/promociones');
        }
    };

    return (
        <AdminLayout logoUrl={null}>
            <Head title={isEdit ? "Editar Promoción" : "Nueva Promoción"} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>
                    {isEdit ? 'Editar Promoción' : 'Crear Nueva Promoción'}
                </h1>
                <Link href="/admin/promociones" style={{ color: 'var(--admin-text-muted)', textDecoration: 'none', fontWeight: '500' }}>
                    &larr; Volver a Promociones
                </Link>
            </div>

            <div style={{ background: 'var(--admin-bg-panel)', borderRadius: '12px', padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', maxWidth: '800px' }}>
                <form onSubmit={submit} style={{ display: 'grid', gap: '20px' }}>
                    <p>Se aplica el mejor precio vigente por producto; las promociones no se suman entre sí.</p>
                    <label><input type="checkbox" checked={data.combinable_coupon} onChange={e=>setData('combinable_coupon',e.target.checked)} /> Permitir cupones adicionales sobre esta promoción</label>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Nombre de la Promoción *</label>
                        <input
                            type="text"
                            value={data.nombre}
                            onChange={e => setData('nombre', e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }}
                            required
                        />
                        {errors.nombre && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.nombre}</div>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Tipo de Descuento *</label>
                            <select
                                value={data.tipo_descuento}
                                onChange={e => setData('tipo_descuento', e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'var(--admin-bg-panel)', color: 'var(--admin-text-main)' }}
                            >
                                <option value="porcentaje">Porcentaje (%)</option>
                                <option value="fijo">Monto Fijo (S/)</option>
                            </select>
                            {errors.tipo_descuento && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.tipo_descuento}</div>}
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Valor del Descuento *</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={data.valor_descuento}
                                onChange={e => setData('valor_descuento', e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }}
                                required
                            />
                            {errors.valor_descuento && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.valor_descuento}</div>}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Fecha de Inicio</label>
                            <input
                                type="date"
                                value={data.fecha_inicio}
                                onChange={e => setData('fecha_inicio', e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }}
                            />
                            {errors.fecha_inicio && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.fecha_inicio}</div>}
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Fecha de Fin</label>
                            <input
                                type="date"
                                value={data.fecha_fin}
                                onChange={e => setData('fecha_fin', e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }}
                            />
                            {errors.fecha_fin && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.fecha_fin}</div>}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="checkbox"
                            id="activa"
                            checked={data.activa}
                            onChange={e => setData('activa', e.target.checked)}
                            style={{ width: '18px', height: '18px' }}
                        />
                        <label htmlFor="activa" style={{ fontWeight: 'bold', color: 'var(--admin-text-main)', cursor: 'pointer' }}>Promoción Activa</label>
                        {errors.activa && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.activa}</div>}
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Productos en la Promoción</label>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--admin-border)' }}>
                            {productos && productos.length > 0 ? productos.map(prod => (
                                <div key={prod.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                    <input
                                        type="checkbox"
                                        id={`prod_${prod.id}`}
                                        value={prod.id}
                                        checked={selectedProducts.includes(prod.id)}
                                        onChange={handleProductChange}
                                        style={{ width: '16px', height: '16px' }}
                                    />
                                    <label htmlFor={`prod_${prod.id}`} style={{ color: 'var(--admin-text-main)', cursor: 'pointer' }}>{prod.nombre}</label>
                                </div>
                            )) : (
                                <span style={{ color: 'var(--admin-text-muted)' }}>No hay productos disponibles.</span>
                            )}
                        </div>
                        {errors.productos && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.productos}</div>}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', paddingTop: '20px', borderTop: '1px solid var(--admin-border)' }}>
                        <Link 
                            href="/admin/promociones" 
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
                            {processing ? 'Guardando...' : (isEdit ? 'Actualizar Promoción' : 'Guardar Promoción')}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
