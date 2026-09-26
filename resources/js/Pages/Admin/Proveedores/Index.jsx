import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { Plus, Search, Edit2, Trash2, ChevronUp, ChevronDown, Building2, Phone, Mail, Hash, Package } from 'lucide-react';

export default function ProveedorIndex({ proveedores, filters }) {
    const confirmDialog = useConfirm();
    const [search, setSearch] = useState(filters?.search || '');

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
            router.delete(`/admin/proveedores/${id}`);
        }
    };

    const getSortIndicator = (field) => {
        if (filters?.sort !== field) return null;
        return filters?.direction === 'asc' ? <ChevronUp size={14} style={{ display: 'inline', marginLeft: '4px' }} /> : <ChevronDown size={14} style={{ display: 'inline', marginLeft: '4px' }} />;
    };

    return (
        <AdminLayout>
            <Head title="Proveedores" />

            <div style={{ fontFamily: "'Inter', sans-serif", padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', margin: '0 0 8px 0', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.5px' }}>Gestión de Proveedores</h1>
                        <p style={{ margin: 0, color: '#64748B', fontSize: '15px' }}>Directorio y administración de empresas proveedoras.</p>
                    </div>
                    <Link 
                        href="/admin/proveedores/create" 
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '8px', background: '#00B4FF', color: 'white', 
                            padding: '12px 24px', borderRadius: '12px', textDecoration: 'none', fontWeight: 600, fontSize: '14px',
                            boxShadow: '0 4px 14px rgba(0, 180, 255, 0.3)', transition: 'all 0.2s ease'
                        }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 180, 255, 0.4)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 180, 255, 0.3)'; }}
                    >
                        <Plus size={18} /> Nuevo Proveedor
                    </Link>
                </div>

                {/* Buscador */}
                <div style={{ background: '#ffffff', padding: '20px 24px', borderRadius: '20px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0', marginBottom: '32px' }}>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input 
                                type="text" 
                                placeholder="Buscar por nombre de empresa, RUC o email..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ 
                                    width: '100%', padding: '14px 16px 14px 44px', borderRadius: '12px', border: '1px solid #E2E8F0', 
                                    background: '#F8FAFC', color: '#1E293B', fontSize: '15px', outline: 'none', transition: 'all 0.2s',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                }}
                                onFocus={e => { e.target.style.borderColor = '#00B4FF'; e.target.style.boxShadow = '0 0 0 4px rgba(0, 180, 255, 0.1)'; e.target.style.backgroundColor = '#ffffff'; }}
                                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                            />
                        </div>
                        <button 
                            type="submit" 
                            style={{ 
                                background: '#1E293B', color: 'white', border: 'none', padding: '0 24px', borderRadius: '12px', 
                                fontWeight: 600, cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(30, 41, 59, 0.2)'
                            }}
                            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(30, 41, 59, 0.3)'; }}
                            onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 41, 59, 0.2)'; }}
                        >
                            Buscar
                        </button>
                        {filters?.search && (
                            <button 
                                type="button" 
                                onClick={() => { setSearch(''); router.get('/admin/proveedores'); }} 
                                style={{ 
                                    background: '#F1F5F9', color: '#475569', border: 'none', padding: '0 24px', borderRadius: '12px', 
                                    fontWeight: 600, cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s'
                                }}
                                onMouseOver={e => { e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.color = '#1E293B'; }}
                                onMouseOut={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#475569'; }}
                            >
                                Limpiar
                            </button>
                        )}
                    </form>
                </div>

                <div style={{ background: '#ffffff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                    <th style={{ padding: '16px 24px', cursor: 'pointer', userSelect: 'none', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }} onClick={() => handleSort('id')}>
                                        ID{getSortIndicator('id')}
                                    </th>
                                    <th style={{ padding: '16px 24px', cursor: 'pointer', userSelect: 'none', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }} onClick={() => handleSort('nombre')}>
                                        Proveedor{getSortIndicator('nombre')}
                                    </th>
                                    <th style={{ padding: '16px 24px', cursor: 'pointer', userSelect: 'none', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }} onClick={() => handleSort('ruc')}>
                                        RUC{getSortIndicator('ruc')}
                                    </th>
                                    <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contacto</th>
                                    <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                                    <th style={{ padding: '16px 24px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {proveedores.data && proveedores.data.length > 0 ? (
                                    proveedores.data.map((prov) => (
                                        <tr key={prov.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.2s', backgroundColor: '#ffffff' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#F8FAFC'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#ffffff'}>
                                            <td style={{ padding: '20px 24px', color: '#94A3B8', fontSize: '14px', fontWeight: 600 }}>#{prov.id}</td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #E0F2FE, #BAE6FD)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369A1' }}>
                                                        <Building2 size={20} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '15px' }}>{prov.nombre}</div>
                                                        {(prov.email || prov.telefono) && (
                                                            <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '13px', color: '#64748B' }}>
                                                                {prov.email && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {prov.email}</span>}
                                                                {prov.telefono && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {prov.telefono}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', padding: '6px 10px', borderRadius: '8px', color: '#475569', fontSize: '13px', fontWeight: 600 }}>
                                                    <Hash size={14} /> {prov.ruc || 'N/A'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 24px', color: '#475569', fontSize: '14px', fontWeight: 500 }}>{prov.contacto || <span style={{color:'#CBD5E1', fontStyle:'italic'}}>No asignado</span>}</td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <span style={{ 
                                                    padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, 
                                                    background: prov.activo ? '#D1FAE5' : '#FEE2E2', 
                                                    color: prov.activo ? '#059669' : '#DC2626' 
                                                }}>
                                                    {prov.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <Link 
                                                        href={`/admin/proveedores/${prov.id}/edit`} 
                                                        style={{ 
                                                            color: '#00B4FF', background: '#E0F2FE', padding: '8px', borderRadius: '8px', 
                                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', textDecoration: 'none'
                                                        }}
                                                        onMouseOver={e => { e.currentTarget.style.backgroundColor = '#00B4FF'; e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                                                        onMouseOut={e => { e.currentTarget.style.backgroundColor = '#E0F2FE'; e.currentTarget.style.color = '#00B4FF'; e.currentTarget.style.transform = 'scale(1)'; }}
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={18} />
                                                    </Link>
                                                    <button 
                                                        onClick={() => handleDelete(prov.id)} 
                                                        style={{ 
                                                            color: '#EF4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px',
                                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                                                        }}
                                                        onMouseOver={e => { e.currentTarget.style.backgroundColor = '#FEE2E2'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                                                        onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '60px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                                                    <Package size={32} />
                                                </div>
                                                <p style={{ margin: 0, color: '#64748B', fontSize: '15px', fontWeight: 500 }}>No se encontraron proveedores.</p>
                                                <Link 
                                                    href="/admin/proveedores/create"
                                                    style={{ background: 'transparent', border: '1px solid #00B4FF', color: '#00B4FF', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', marginTop: '8px', textDecoration: 'none' }}
                                                    onMouseOver={(e) => { e.currentTarget.style.background = '#00B4FF'; e.currentTarget.style.color = '#fff'; }}
                                                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#00B4FF'; }}
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
                {proveedores.links && (
                    <div style={{ padding: '24px 0', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {proveedores.links.map((link, k) => (
                            <Link 
                                key={k} 
                                href={link.url || '#'} 
                                style={{ 
                                    padding: '8px 14px', 
                                    background: link.active ? '#1E293B' : '#ffffff', 
                                    color: link.active ? 'white' : '#64748B', 
                                    borderRadius: '8px', 
                                    border: link.active ? '1px solid #1E293B' : '1px solid #E2E8F0',
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    opacity: link.url ? 1 : 0.5,
                                    pointerEvents: link.url ? 'auto' : 'none',
                                    transition: 'all 0.2s',
                                    boxShadow: link.active ? '0 4px 10px rgba(30, 41, 59, 0.2)' : 'none'
                                }}
                                onMouseOver={e => { if(!link.active && link.url) { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; } }}
                                onMouseOut={e => { if(!link.active && link.url) { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#64748B'; } }}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
