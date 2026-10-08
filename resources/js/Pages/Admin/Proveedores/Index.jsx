import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { Plus, Search, Edit2, Trash2, ChevronUp, ChevronDown, Building2, Phone, Mail, Hash, Package, X } from 'lucide-react';

export default function ProveedorIndex({ proveedores, filters }) {
    const confirmDialog = useConfirm();
    const [search, setSearch] = useState(filters?.search || '');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/admin/proveedores', { search, sort: filters?.sort, direction: filters?.direction }, { preserveState: true });
    };

    const handleSort = (column) => {
        const direction = filters?.sort === column && filters?.direction === 'asc' ? 'desc' : 'asc';
        router.get('/admin/proveedores', { search, sort: column, direction }, { preserveState: true });
    };

    const handleDelete = async (id) => {
        if (await confirmDialog('¿Estás seguro de que deseas eliminar este proveedor?')) {
            router.delete(`/admin/proveedores/${id}`, { preserveScroll: true });
        }
    };

    const getSortIndicator = (field) => {
        if (filters?.sort !== field) return null;
        return filters?.direction === 'asc' 
            ? <ChevronUp size={14} style={{ display: 'inline', marginLeft: '4px', verticalAlign: 'middle' }} /> 
            : <ChevronDown size={14} style={{ display: 'inline', marginLeft: '4px', verticalAlign: 'middle' }} />;
    };

    return (
        <AdminLayout>
            <Head title="Proveedores" />

            <div style={{ fontFamily: "'Inter', system-ui, sans-serif", padding: '32px 40px', maxWidth: '1440px', margin: '0 auto' }}>
                
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ 
                            padding: '12px', 
                            background: '#ffffff', 
                            border: '1px solid #E2E8F0', 
                            borderRadius: '12px', 
                            color: '#1E293B', 
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}>
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '24px', margin: 0, fontWeight: '700', color: '#0F172A', letterSpacing: '-0.02em' }}>
                                Gestión de Proveedores
                            </h1>
                            <p style={{ color: '#64748B', fontSize: '14px', margin: '4px 0 0 0', fontWeight: '400' }}>
                                Directorio y administración de empresas proveedoras.
                            </p>
                        </div>
                    </div>
                    <Link 
                        href="/admin/proveedores/create" 
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '8px', 
                            background: '#004797', color: 'white', border: 'none', 
                            padding: '10px 20px', borderRadius: '10px', 
                            fontWeight: '600', fontSize: '14px', textDecoration: 'none', 
                            transition: 'all 0.2s ease', 
                            boxShadow: '0 4px 6px -1px rgba(0, 71, 151, 0.2), 0 2px 4px -1px rgba(0, 71, 151, 0.1)'
                        }}
                        onMouseEnter={(e) => { 
                            e.currentTarget.style.backgroundColor = '#003875'; 
                            e.currentTarget.style.transform = 'translateY(-1px)'; 
                        }}
                        onMouseLeave={(e) => { 
                            e.currentTarget.style.backgroundColor = '#004797'; 
                            e.currentTarget.style.transform = 'translateY(0)'; 
                        }}
                    >
                        <Plus size={18} /> <span>Nuevo Proveedor</span>
                    </Link>
                </div>

                {/* Search & Filters Card */}
                <div style={{ 
                    background: '#ffffff', 
                    padding: '20px 24px', 
                    borderRadius: '16px', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)', 
                    border: '1px solid #E2E8F0', 
                    marginBottom: '24px' 
                }}>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
                            <Search size={18} color={isSearchFocused ? '#004797' : '#94A3B8'} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', transition: 'color 0.2s' }} />
                            <input 
                                type="text" 
                                placeholder="Buscar por nombre de empresa, RUC o email..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ 
                                    width: '100%', padding: '12px 16px 12px 44px', 
                                    borderRadius: '10px', border: `1px solid ${isSearchFocused ? '#004797' : '#E2E8F0'}`, 
                                    background: isSearchFocused ? '#ffffff' : '#F8FAFC', 
                                    color: '#1E293B', fontSize: '14px', outline: 'none', transition: 'all 0.2s',
                                    boxShadow: isSearchFocused ? '0 0 0 3px rgba(0, 71, 151, 0.1)' : 'none'
                                }}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setIsSearchFocused(false)}
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => { setSearch(''); router.get('/admin/proveedores'); }}
                                    style={{
                                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer',
                                        padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        borderRadius: '50%'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#F1F5F9'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <button 
                            type="submit" 
                            style={{ 
                                padding: '0 24px', borderRadius: '10px', border: 'none', 
                                background: '#1E293B', color: 'white', fontWeight: '600', 
                                cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0F172A'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1E293B'}
                        >
                            Buscar
                        </button>
                    </form>
                </div>

                {/* Table Card */}
                <div style={{ 
                    background: '#ffffff', 
                    borderRadius: '16px', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)', 
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden'
                }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                    {['id', 'nombre', 'ruc'].map((col) => (
                                        <th 
                                            key={col}
                                            style={{ 
                                                padding: '16px 24px', cursor: 'pointer', userSelect: 'none', 
                                                color: '#475569', fontWeight: 600, fontSize: '12px', 
                                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                                transition: 'color 0.2s'
                                            }} 
                                            onClick={() => handleSort(col)}
                                            onMouseEnter={(e) => e.currentTarget.style.color = '#004797'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = '#475569'}
                                        >
                                            {col === 'nombre' ? 'Proveedor' : col.toUpperCase()} {getSortIndicator(col)}
                                        </th>
                                    ))}
                                    <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contacto</th>
                                    <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                                    <th style={{ padding: '16px 24px', color: '#475569', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {proveedores.data && proveedores.data.length > 0 ? (
                                    proveedores.data.map((prov) => (
                                        <tr 
                                            key={prov.id} 
                                            style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.2s', backgroundColor: '#ffffff' }} 
                                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#F8FAFC'} 
                                            onMouseOut={e => e.currentTarget.style.backgroundColor = '#ffffff'}
                                        >
                                            <td style={{ padding: '20px 24px', color: '#64748B', fontSize: '14px', fontWeight: 500 }}>
                                                #{prov.id}
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                    <div style={{ 
                                                        width: '40px', height: '40px', borderRadius: '10px', 
                                                        background: '#F1F5F9', display: 'flex', alignItems: 'center', 
                                                        justifyContent: 'center', color: '#004797', flexShrink: 0
                                                    }}>
                                                        <Building2 size={18} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '15px' }}>{prov.nombre}</div>
                                                        {(prov.email || prov.telefono) && (
                                                            <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '13px', color: '#64748B' }}>
                                                                {prov.email && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} /> {prov.email}</span>}
                                                                {prov.telefono && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} /> {prov.telefono}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '14px', fontWeight: 500 }}>
                                                    {prov.ruc || <span style={{ color: '#94A3B8' }}>N/A</span>}
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 24px', color: '#475569', fontSize: '14px', fontWeight: 400 }}>
                                                {prov.contacto || <span style={{color:'#94A3B8', fontStyle:'italic'}}>No asignado</span>}
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <span style={{ 
                                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                    padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, 
                                                    background: prov.activo ? '#ECFDF5' : '#F1F5F9', 
                                                    color: prov.activo ? '#059669' : '#64748B',
                                                }}>
                                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: prov.activo ? '#10B981' : '#94A3B8' }}></span>
                                                    {prov.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                                    <Link 
                                                        href={`/admin/proveedores/${prov.id}/edit`} 
                                                        style={{ 
                                                            color: '#64748B', background: 'transparent', 
                                                            padding: '8px', borderRadius: '8px', 
                                                            transition: 'all 0.2s ease', display: 'flex', 
                                                            alignItems: 'center', justifyContent: 'center' 
                                                        }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F1F5F9'; e.currentTarget.style.color = '#004797'; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={18} />
                                                    </Link>
                                                    <button 
                                                        onClick={() => handleDelete(prov.id)} 
                                                        title="Eliminar" 
                                                        style={{ 
                                                            color: '#64748B', background: 'transparent', border: 'none', 
                                                            cursor: 'pointer', padding: '8px', borderRadius: '8px', 
                                                            transition: 'all 0.2s ease', display: 'flex', 
                                                            alignItems: 'center', justifyContent: 'center' 
                                                        }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '80px 20px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                                                    <Package size={24} />
                                                </div>
                                                <p style={{ margin: 0, color: '#475569', fontSize: '14px', fontWeight: 500 }}>No se encontraron proveedores.</p>
                                                <Link 
                                                    href="/admin/proveedores/create"
                                                    style={{ 
                                                        background: '#ffffff', border: '1px solid #E2E8F0', color: '#1E293B', 
                                                        padding: '8px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '13px',
                                                        cursor: 'pointer', transition: 'all 0.2s', marginTop: '8px', textDecoration: 'none',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                    }}
                                                    onMouseOver={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                                                    onMouseOut={(e) => { e.currentTarget.style.background = '#ffffff'; }}
                                                >
                                                    Agregar Proveedor
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Paginación */}
                {proveedores.links && proveedores.links.length > 3 && (
                    <div style={{ padding: '24px 0', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {proveedores.links.map((link, k) => (
                            <Link 
                                key={k} 
                                href={link.url || '#'} 
                                style={{ 
                                    padding: '8px 14px', 
                                    background: link.active ? '#1E293B' : '#ffffff', 
                                    color: link.active ? 'white' : '#475569', 
                                    borderRadius: '8px', 
                                    border: link.active ? '1px solid #1E293B' : '1px solid #E2E8F0',
                                    textDecoration: 'none',
                                    fontWeight: 500,
                                    fontSize: '14px',
                                    opacity: link.url ? 1 : 0.5,
                                    pointerEvents: link.url ? 'auto' : 'none',
                                    transition: 'all 0.2s',
                                    boxShadow: link.active ? '0 1px 3px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.02)'
                                }}
                                onMouseOver={e => { if(!link.active && link.url) { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.color = '#0F172A'; } }}
                                onMouseOut={e => { if(!link.active && link.url) { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#475569'; } }}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
