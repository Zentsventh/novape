import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import axios from 'axios';
import { useConfirm } from '@/Contexts/ConfirmContext';


export default function Form({ producto, marcas, categorias, proveedores, listaEspecificaciones = [] }) {
    const confirmDialog = useConfirm();

    const isEditing = !!producto;
    
    const precioActual = producto?.variantes?.[0]?.precio || '';
    const stockActual = producto?.variantes?.[0]?.stock ?? 10;
    const pesoActual = producto?.variantes?.[0]?.peso ?? 1.0;
    
    let defaultImages = ['', '', ''];
    if (producto?.imagenes) {
        for (let i = 0; i < Math.min(producto.imagenes.length, 3); i++) {
            defaultImages[i] = producto.imagenes[i].url;
        }
    }

    const { data, setData, post, put, processing, errors, transform } = useForm({
        nombre: producto?.nombre || '',
        marca_id: producto?.marca_id || '',
        proveedor_id: producto?.proveedor_id || '',
        sku_base: producto?.sku_base || '',
        descripcion: producto?.descripcion || '',
        garantias: producto?.garantias || '',
        activo: producto?.activo ?? true,
        precio: precioActual,
        peso_kg: pesoActual,
        stock: stockActual,
        categorias: producto?.categorias?.map(c => c.id) || [],
        imagenes: defaultImages,
        especificaciones: producto?.producto_especificaciones?.map(pe => ({
            nombre: pe.clave || '',
            valor: pe.valor
        })) || [],
    });

    const [localCategorias, setLocalCategorias] = useState(categorias);
    const [selectedMainCategory, setSelectedMainCategory] = useState('');
    
    // Modal state for category creation
    const [showCatModal, setShowCatModal] = useState(false);
    const [newCatNombre, setNewCatNombre] = useState('');
    const [newCatPadreId, setNewCatPadreId] = useState('');
    const [isSavingCat, setIsSavingCat] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        // Filtrar imagenes vacias o nulas
        const currentImages = data.imagenes.filter(img => img !== null && img !== '');
        
        if (isEditing) {
            // Inertia doesn't support put with filtered object directly on the helper easily without transforming, 
            // but we can use the `transform` method or just use `post` with `_method: 'put'` or similar.
            // Inertia's router.put or form.put uses the form data. Let's mutate `data` or use `transform`.
        }
    };
    
    transform((data) => ({
        ...data,
        _method: isEditing ? 'put' : 'post',
        imagenes: data.imagenes ? data.imagenes.filter(img => img !== null && img !== '') : []
    }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!await confirmDialog(
            isEditing ? '¿Estás seguro de que quieres actualizar este producto?' : '¿Estás seguro de que quieres crear este producto?',
            { confirmText: 'Guardar' }
        )) {
            return;
        }

        if (isEditing) {
            post(`/admin/products/${producto.id}`, {
                preserveScroll: true,
                forceFormData: true,
            });
        } else {
            post(`/admin/products`, {
                preserveScroll: true,
                forceFormData: true,
            });
        }
    };

    const handleImageChange = (index, value) => {
        const newImages = [...data.imagenes];
        newImages[index] = value;
        setData('imagenes', newImages);
    };

    const handleCategoryToggle = (catId) => {
        const has = data.categorias.includes(catId);
        if (has) {
            setData('categorias', data.categorias.filter(id => id !== catId));
        } else {
            setData('categorias', [...data.categorias, catId]);
        }
    };

    const handleSaveNewCategory = async (e) => {
        e.preventDefault();
        setIsSavingCat(true);
        try {
            const res = await axios.post('/api/categorias', {
                nombre: newCatNombre,
                categoria_padre_id: newCatPadreId || null
            });
            if (res.data.success) {
                setLocalCategorias([...localCategorias, res.data.categoria]);
                setShowCatModal(false);
                setNewCatNombre('');
                setNewCatPadreId('');
                if (res.data.categoria.categoria_padre_id) {
                    setData('categorias', [...data.categorias, res.data.categoria.id]);
                }
            }
        } catch (error) {
            alert('Error al crear categoría');
        } finally {
            setIsSavingCat(false);
        }
    };

    const addEspecificacion = () => {
        setData('especificaciones', [...data.especificaciones, { nombre: '', valor: '' }]);
    };

    const updateEspecificacion = (index, field, val) => {
        const newSpecs = [...data.especificaciones];
        newSpecs[index][field] = val;
        setData('especificaciones', newSpecs);
    };

    const removeEspecificacion = (index) => {
        const newSpecs = [...data.especificaciones];
        newSpecs.splice(index, 1);
        setData('especificaciones', newSpecs);
    };

    return (
        <AdminLayout>
            <Head title={isEditing ? 'Editar Producto' : 'Nuevo Producto'} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>
                    {isEditing ? 'Editar Producto' : 'Crear Nuevo Producto'}
                </h1>
                <Link href="/admin/products" style={{ color: 'var(--admin-text-muted)', textDecoration: 'none', fontWeight: '500' }}>
                    &larr; Volver a Productos
                </Link>
            </div>

            <div style={{ background: 'var(--admin-bg-panel)', borderRadius: '12px', padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '24px' }}>
                    
                    {/* Información Básica */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Nombre del Producto</label>
                            <input 
                                type="text" 
                                value={data.nombre} 
                                onChange={e => setData('nombre', e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }} 
                            />
                            {errors.nombre && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.nombre}</div>}
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>SKU Base</label>
                            <input 
                                type="text" 
                                value={data.sku_base} 
                                onChange={e => setData('sku_base', e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }} 
                            />
                        </div>
                    </div>

                    {/* Precios, Stock y Marca */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Precio Base (S/)</label>
                            <input 
                                type="number" step="0.01" 
                                value={data.precio} 
                                onChange={e => setData('precio', e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }} 
                            />
                            {errors.precio && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.precio}</div>}
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Peso (Kg)</label>
                            <input 
                                type="number" step="0.01" 
                                value={data.peso_kg} 
                                onChange={e => setData('peso_kg', parseFloat(e.target.value) || 0)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }} 
                            />
                            {errors.peso_kg && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.peso_kg}</div>}
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Stock Actual</label>
                            <input 
                                type="number" 
                                value={data.stock} 
                                onChange={e => setData('stock', parseInt(e.target.value) || 0)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }} 
                            />
                            {errors.stock && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.stock}</div>}
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Marca *</label>
                            <select 
                                value={data.marca_id} 
                                onChange={e => setData('marca_id', e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'var(--admin-bg-body)', color: 'var(--admin-text-main)', appearance: 'none' }} 
                            >
                                <option value="">Seleccione una marca</option>
                                {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                            </select>
                            {errors.marca_id && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.marca_id}</div>}
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Proveedor Principal</label>
                            <select 
                                value={data.proveedor_id} 
                                onChange={e => setData('proveedor_id', e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'var(--admin-bg-body)', color: 'var(--admin-text-main)', appearance: 'none' }} 
                            >
                                <option value="">Seleccione un proveedor</option>
                                {proveedores && proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                            </select>
                            {errors.proveedor_id && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.proveedor_id}</div>}
                        </div>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Descripción</label>
                        <textarea 
                            rows="4"
                            value={data.descripcion} 
                            onChange={e => setData('descripcion', e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }} 
                        />
                    </div>

                    {/* Cambios y Devoluciones */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Cambios y Devoluciones</label>
                        <textarea 
                            rows="4"
                            value={data.garantias} 
                            onChange={e => setData('garantias', e.target.value)}
                            placeholder="Ej: Condiciones para devoluciones..."
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }} 
                        />
                    </div>

                    {/* Imágenes (3 Slots) */}
                    <div style={{ background: 'rgba(0, 123, 255, 0.03)', padding: '20px', borderRadius: '12px', border: '1px dashed rgba(0, 123, 255, 0.3)' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--admin-text-main)' }}>Galería de Imágenes</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                            {[0, 1, 2].map(index => (
                                <div key={index}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold', color: 'var(--admin-text-muted)' }}>Imagen {index + 1}</label>
                                    {data.imagenes[index] && typeof data.imagenes[index] === 'string' && (
                                        <div style={{ marginBottom: '10px', width: '100%', height: '120px', borderRadius: '8px', background: 'var(--admin-border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <img src={data.imagenes[index].startsWith('http') || data.imagenes[index].startsWith('/storage') ? data.imagenes[index] : `/storage/${data.imagenes[index]}`} alt={`Preview ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                                            <span style={{ display: 'none', color: 'var(--admin-text-muted)', fontSize: '12px' }}>URL Inválida</span>
                                        </div>
                                    )}
                                    {data.imagenes[index] && typeof data.imagenes[index] === 'object' && (
                                        <div style={{ marginBottom: '10px', width: '100%', height: '120px', borderRadius: '8px', background: 'var(--admin-border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <img src={URL.createObjectURL(data.imagenes[index])} alt={`Preview ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    )}
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={e => handleImageChange(index, e.target.files[0])}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--admin-border)', background: 'var(--admin-bg-panel)', color: 'var(--admin-text-main)', fontSize: '13px' }} 
                                    />
                                    {data.imagenes[index] && (
                                        <button type="button" onClick={() => handleImageChange(index, '')} style={{ marginTop: '8px', background: '#3b82f6', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Quitar</button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {errors.imagenes && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '8px' }}>Verifica que las imágenes sean válidas.</div>}
                        {errors['imagenes.0'] && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors['imagenes.0']}</div>}
                        {errors['imagenes.1'] && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors['imagenes.1']}</div>}
                        {errors['imagenes.2'] && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors['imagenes.2']}</div>}
                    </div>

                    {/* Especificaciones */}
                    <div style={{ background: 'var(--admin-bg-panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--admin-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Ficha Técnica / Especificaciones</h3>
                            <button 
                                type="button" 
                                onClick={addEspecificacion}
                                style={{ background: '#007BFF', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                + Agregar Fila
                            </button>
                        </div>
                        
                        {data.especificaciones.length === 0 ? (
                            <div style={{ color: 'var(--admin-text-muted)', fontSize: '14px', fontStyle: 'italic' }}>No hay especificaciones.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {data.especificaciones.map((spec, index) => (
                                    <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <input
                                            type="text"
                                            placeholder="Nombre (Ej: Peso)"
                                            value={spec.nombre}
                                            onChange={(e) => updateEspecificacion(index, 'nombre', e.target.value)}
                                            style={{ flex: '1', padding: '10px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'var(--admin-bg-panel)', color: 'var(--admin-text-main)' }}
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Valor (Ej: 4.00 kg)"
                                            value={spec.valor}
                                            onChange={(e) => updateEspecificacion(index, 'valor', e.target.value)}
                                            style={{ flex: '2', padding: '10px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }}
                                            required
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => removeEspecificacion(index)}
                                            style={{ background: '#3b82f6', color: 'white', border: 'none', width: '38px', height: '38px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            title="Eliminar fila"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {errors.especificaciones && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '8px' }}>Verifique los datos de la ficha técnica.</div>}
                    </div>

                    {/* Categorías y Estado */}
                    <div className="admin-grid-charts">
                        <div style={{ background: 'var(--admin-bg-panel)', padding: '20px', borderRadius: '12px', border: '1px solid var(--admin-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <label style={{ display: 'block', margin: 0, fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Categorías del Producto</label>
                                <button type="button" onClick={() => setShowCatModal(true)} style={{ background: 'var(--admin-bg-body)', color: '#004797', border: '1px solid #004797', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>+ Nueva Categoría</button>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--admin-text-muted)' }}>1. Categoría Principal</label>
                                    <select 
                                        value={selectedMainCategory} 
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSelectedMainCategory(val);
                                            if (val && !data.categorias.includes(parseInt(val))) {
                                                setData('categorias', [...data.categorias, parseInt(val)]);
                                            }
                                        }} 
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent' }}
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {localCategorias.filter(c => !c.categoria_padre_id).map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--admin-text-muted)' }}>2. Subcategorías (Opcional)</label>
                                    {selectedMainCategory ? (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '150px', overflowY: 'auto', padding: '5px' }}>
                                            {localCategorias.filter(c => c.categoria_padre_id == selectedMainCategory).length > 0 ? (
                                                localCategorias.filter(c => c.categoria_padre_id == selectedMainCategory).map(cat => (
                                                    <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--admin-bg-body)', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', border: data.categorias.includes(cat.id) ? '1px solid #004797' : '1px solid var(--admin-border)' }}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={data.categorias.includes(cat.id)}
                                                            onChange={() => handleCategoryToggle(cat.id)}
                                                            style={{ display: 'none' }}
                                                        />
                                                        <span style={{ fontSize: '12px', color: data.categorias.includes(cat.id) ? '#004797' : 'var(--admin-text-main)', fontWeight: data.categorias.includes(cat.id) ? 'bold' : 'normal' }}>{cat.nombre}</span>
                                                    </label>
                                                ))
                                            ) : (
                                                <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>No hay subcategorías</span>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ padding: '10px', background: 'var(--admin-bg-body)', borderRadius: '8px', color: 'var(--admin-text-muted)', fontSize: '12px', textAlign: 'center' }}>Selecciona primero una principal</div>
                                    )}
                                </div>
                            </div>
                            
                            {data.categorias.length > 0 && (
                                <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px dashed var(--admin-border)' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--admin-text-muted)', display: 'block', marginBottom: '5px' }}>Seleccionadas:</span>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                        {data.categorias.map(id => {
                                            const c = localCategorias.find(cat => cat.id === id);
                                            return c ? <span key={id} style={{ background: 'rgba(0, 71, 151, 0.1)', color: '#004797', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>{c.nombre} <button type="button" onClick={() => handleCategoryToggle(id)} style={{ background:'none',border:'none',color:'#004797',cursor:'pointer',marginLeft:'5px',padding:0 }}>×</button></span> : null;
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Estado</label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                <input 
                                    type="checkbox" 
                                    checked={data.activo}
                                    onChange={e => setData('activo', e.target.checked)}
                                    style={{ width: '18px', height: '18px', accentColor: '#007BFF' }}
                                />
                                <span style={{ color: 'var(--admin-text-main)' }}>Producto Activo en Tienda</span>
                            </label>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', paddingTop: '20px', borderTop: '1px solid var(--admin-border)' }}>
                        <Link href="/admin/products" style={{ padding: '10px 20px', borderRadius: '8px', color: 'var(--admin-text-main)', textDecoration: 'none', fontWeight: '500' }}>
                            Cancelar
                        </Link>
                        <button 
                            type="submit" 
                            disabled={processing}
                            style={{ background: '#007BFF', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.7 : 1, boxShadow: '0 4px 10px rgba(0, 123, 255, 0.3)' }}
                        >
                            {processing ? 'Guardando...' : (isEditing ? 'Actualizar Producto' : 'Guardar Producto')}
                        </button>
                    </div>
                </form>
            </div>

            {/* Modal Nueva Categoria */}
            {showCatModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '400px' }}>
                        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Nueva Categoría</h2>
                        <form onSubmit={handleSaveNewCategory} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>Nombre</label>
                                <input type="text" value={newCatNombre} onChange={e => setNewCatNombre(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} required placeholder="Ej: Smartphones" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>Categoría Padre (Opcional)</label>
                                <select value={newCatPadreId} onChange={e => setNewCatPadreId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                                    <option value="">Ninguna (Será Principal)</option>
                                    {localCategorias.filter(c => !c.categoria_padre_id).map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setShowCatModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: 'transparent', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" disabled={isSavingCat} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', background: '#004797', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                                    {isSavingCat ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
