import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { Package, Plus, Search, Filter, Image as ImageIcon, Eye, Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

export default function Index({ productos, categorias, marcas, filters }) {
    const confirmDialog = useConfirm();

    const { delete: destroy } = useForm();
    const [search, setSearch] = useState(filters?.search || '');
    const [categoriaId, setCategoriaId] = useState(filters?.categoria_id || '');
    const [marcaId, setMarcaId] = useState(filters?.marca_id || '');

    const handleFilterChange = (field, value) => {
        let newFilters = { search, categoria_id: categoriaId, marca_id: marcaId, sort: filters?.sort, direction: filters?.direction };
        newFilters[field] = value;
        
        // UX: Si cambiamos la categoría, reseteamos la marca para evitar combinaciones inválidas
        if (field === 'categoria_id') {
            newFilters.marca_id = '';
            setMarcaId('');
        }
        
        router.get('/admin/products', newFilters, { preserveState: true });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/admin/products', { search, categoria_id: categoriaId, marca_id: marcaId, sort: filters?.sort, direction: filters?.direction }, { preserveState: true });
    };

    const handleSort = (field) => {
        const direction = filters?.sort === field && filters?.direction === 'asc' ? 'desc' : 'asc';
        router.get('/admin/products', { search, categoria_id: categoriaId, marca_id: marcaId, sort: field, direction }, { preserveState: true });
    };

    const getSortIndicator = (field) => {
        if (filters?.sort !== field) return <ChevronDown size={14} style={{ opacity: 0.3 }} />;
        return filters?.direction === 'asc' ? <ChevronUp size={14} style={{ color: '#00B4FF' }} /> : <ChevronDown size={14} style={{ color: '#00B4FF' }} />;
    };

    const handleDelete = async (id) => {
        if (await confirmDialog('¿Estás seguro de que quieres eliminar este producto?')) {
            destroy(`/admin/products/${id}`);
        }
    };

    return (
        <AdminLayout>
            <Head title="Productos" />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <h1 style={{ fontSize: '24px', margin: 0, fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.02em' }}>
                    <div style={{ padding: '8px', backgroundColor: '#F0F9FF', borderRadius: '10px', color: '#00B4FF' }}>
                        <Package size={24} />
                    </div>
                    Gestión de Productos
                </h1>
                
                <Link 
                    href="/admin/products/create" 
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#009BE0'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 180, 255, 0.3)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#00B4FF'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 180, 255, 0.2)'; }}
                    style={{ background: '#00B4FF', color: 'white', padding: '10px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0, 180, 255, 0.2)' }}
                >
                    <Plus size={16} />
                    Nuevo Producto
                </Link>
            </div>

            {/* Buscador y Filtros Profesionales */}
            <div style={{ marginBottom: '24px', background: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    
                    {/* Categoria */}
                    <div style={{ minWidth: '180px', flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '8px', letterSpacing: '0.05em' }}>CATEGORÍA</div>
                        <select 
                            value={categoriaId} 
                            onChange={(e) => { setCategoriaId(e.target.value); handleFilterChange('categoria_id', e.target.value); }}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', background: '#F8FAFC', color: '#1E293B', fontSize: '13px', transition: 'all 0.2s ease', cursor: 'pointer', fontFamily: 'inherit' }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = '#00B4FF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 180, 255, 0.1)'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                            <option value="">Todas las categorías</option>
                            {categorias && categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                    </div>

                    {/* Marca */}
                    <div style={{ minWidth: '180px', flex: 1 }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '8px', letterSpacing: '0.05em' }}>MARCA</div>
                        <select 
                            value={marcaId} 
                            onChange={(e) => { setMarcaId(e.target.value); handleFilterChange('marca_id', e.target.value); }}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', background: '#F8FAFC', color: '#1E293B', fontSize: '13px', transition: 'all 0.2s ease', cursor: 'pointer', fontFamily: 'inherit' }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = '#00B4FF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 180, 255, 0.1)'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                            <option value="">Todas las marcas</option>
                            {marcas && marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                        </select>
                    </div>

                    {/* Search Input */}
                    <div style={{ flex: 2, minWidth: '300px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '8px', letterSpacing: '0.05em' }}>BUSCAR PRODUCTO (NOMBRE O SKU)</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                                    <Search size={16} />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Escribe aquí para buscar..." 
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F8FAFC', outline: 'none', color: '#1E293B', fontSize: '13px', transition: 'all 0.2s ease', boxSizing: 'border-box', fontFamily: 'inherit' }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = '#00B4FF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 180, 255, 0.1)'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
                                />
                            </div>
                            <button 
                                type="submit" 
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#009BE0'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#00B4FF'; }}
                                style={{ background: '#00B4FF', color: 'white', border: 'none', padding: '0 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s ease', fontSize: '13px' }}
                            >
                                <Filter size={16} /> Filtrar
                            </button>
                            {(filters?.search || filters?.categoria_id || filters?.marca_id) && (
                                <button 
                                    type="button" 
                                    onClick={() => { setSearch(''); setCategoriaId(''); setMarcaId(''); router.get('/admin/products'); }} 
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#E2E8F0'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                                    style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0', padding: '0 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease', fontSize: '13px' }}
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>

            {/* Data Table */}
            <div style={{ background: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                    <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('id')}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>ID {getSortIndicator('id')}</div>
                            </th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Imagen</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('nombre')}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Nombre {getSortIndicator('nombre')}</div>
                            </th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('sku_base')}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>SKU {getSortIndicator('sku_base')}</div>
                            </th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categoría</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Marca</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                            <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productos.data && productos.data.length > 0 ? (
                            productos.data.map((producto) => (
                                <tr 
                                    key={producto.id} 
                                    style={{ borderBottom: '1px solid #E2E8F0', transition: 'background 0.2s' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                    <td style={{ padding: '16px 24px', color: '#64748B', fontWeight: '500', fontSize: '13px' }}>#{producto.id}</td>
                                    <td style={{ padding: '16px 24px' }}>
                                        {producto.imagenes && producto.imagenes.length > 0 ? (
                                            <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0', background: '#fff' }}>
                                                <img src={producto.imagenes[0].url} alt={producto.nombre} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                            </div>
                                        ) : (
                                            <div style={{ width: '48px', height: '48px', background: '#F1F5F9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', border: '1px solid #E2E8F0' }}>
                                                <ImageIcon size={20} />
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '16px 24px', fontWeight: '600', color: '#1E293B', fontSize: '14px', maxWidth: '300px' }}>
                                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {producto.nombre}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 24px', color: '#64748B', fontSize: '13px', fontFamily: 'monospace', letterSpacing: '0.02em' }}>
                                        <span style={{ background: '#F1F5F9', padding: '4px 8px', borderRadius: '6px' }}>{producto.sku_base}</span>
                                    </td>
                                    <td style={{ padding: '16px 24px', color: '#64748B' }}>
                                        {producto.categorias && producto.categorias.length > 0 
                                            ? (
                                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                    {producto.categorias
                                                        .sort((a, b) => (a.categoria_padre_id === null ? -1 : (b.categoria_padre_id === null ? 1 : 0)))
                                                        .slice(0, 2)
                                                        .map((c, i) => (
                                                            <span key={i} style={{ background: c.categoria_padre_id === null ? '#F0F9FF' : '#F1F5F9', color: c.categoria_padre_id === null ? '#00B4FF' : '#64748B', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', border: c.categoria_padre_id === null ? '1px solid rgba(0, 180, 255, 0.2)' : '1px solid #E2E8F0' }}>
                                                                {c.nombre}
                                                            </span>
                                                        ))
                                                    }
                                                </div>
                                            )
                                            : <span style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '13px' }}>-</span>
                                        }
                                    </td>
                                    <td style={{ padding: '16px 24px', color: '#64748B', fontSize: '13px', fontWeight: '500' }}>{producto.marca ? producto.marca.nombre : '-'}</td>
                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{ padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', background: producto.activo ? '#ECFDF5' : '#F1F5F9', color: producto.activo ? '#10B981' : '#64748B' }}>
                                            {producto.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <Link 
                                                href={`/admin/products/${producto.id}`} 
                                                title="Ver" 
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ECFDF5'; e.currentTarget.style.color = '#059669'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#10B981'; }}
                                                style={{ color: '#10B981', background: 'transparent', textDecoration: 'none', padding: '8px', borderRadius: '8px', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <Eye size={18} />
                                            </Link>
                                            <Link 
                                                href={`/admin/products/${producto.id}/edit`} 
                                                title="Editar" 
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0F9FF'; e.currentTarget.style.color = '#009BE0'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#00B4FF'; }}
                                                style={{ color: '#00B4FF', background: 'transparent', textDecoration: 'none', padding: '8px', borderRadius: '8px', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <Edit size={18} />
                                            </Link>
                                            <button 
                                                onClick={() => handleDelete(producto.id)} 
                                                title="Eliminar" 
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#EF4444'; }}
                                                style={{ color: '#EF4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" style={{ padding: '40px 0', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                        <Package size={32} style={{ opacity: 0.5 }} />
                                        No hay productos registrados que coincidan con la búsqueda.
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            {productos.links && productos.links.length > 3 && (
                <div style={{ padding: '24px 0', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {productos.links.map((link, k) => (
                        <Link 
                            key={k} 
                            href={link.url || '#'} 
                            onMouseEnter={(e) => { 
                                if (!link.active && link.url) {
                                    e.currentTarget.style.backgroundColor = '#F1F5F9'; 
                                }
                            }}
                            onMouseLeave={(e) => { 
                                if (!link.active && link.url) {
                                    e.currentTarget.style.backgroundColor = '#ffffff'; 
                                }
                            }}
                            style={{ 
                                padding: '8px 16px', 
                                background: link.active ? '#00B4FF' : '#ffffff', 
                                color: link.active ? 'white' : '#475569', 
                                borderRadius: '8px', 
                                border: '1px solid',
                                borderColor: link.active ? '#00B4FF' : '#E2E8F0',
                                textDecoration: 'none',
                                fontWeight: link.active ? '700' : '500',
                                fontSize: '13px',
                                opacity: link.url ? 1 : 0.5,
                                pointerEvents: link.url ? 'auto' : 'none',
                                transition: 'all 0.2s ease',
                                boxShadow: link.active ? '0 2px 8px rgba(0, 180, 255, 0.2)' : '0 1px 2px rgba(0,0,0,0.02)'
                            }}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
