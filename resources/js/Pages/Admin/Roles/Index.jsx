import React, { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { ShieldCheck, Search, X, Shield, Edit2, Trash2, Users, Lock, KeyRound } from 'lucide-react';

export default function RolesIndex() {
    const confirmDialog = useConfirm();

    const { roles, filtros, flash, errors } = usePage().props;
    const data = roles?.data || [];
    
    const [search, setSearch] = useState(filtros?.buscar || '');

    const handleSearch = async (e) => {
        e.preventDefault();
        router.get('/admin/roles', { buscar: search }, { preserveState: true });
    };

    const handleDelete = async (id) => {
        if (await confirmDialog('¿Estás seguro de eliminar este rol? Esta acción no se puede deshacer.')) {
            router.delete(`/admin/roles/${id}`, { preserveScroll: true });
        }
    };

    const inputStyle = {
        width: '100%', padding: '14px 16px 14px 44px', borderRadius: '12px', border: '1px solid #E2E8F0',
        background: '#F8FAFC', color: '#1E293B', fontSize: '15px', outline: 'none', transition: 'all 0.2s',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
    };
    
    const inputFocusStyle = {
        borderColor: '#004797', boxShadow: '0 0 0 4px rgba(0, 71, 151, 0.1)', backgroundColor: '#ffffff'
    };

    return (
        <AdminLayout logoUrl={null}>
            <Head title="Roles y Permisos" />
            
            <div style={{ fontFamily: "'Inter', sans-serif", padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
                
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                    <h1 style={{ fontSize: '24px', margin: 0, fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.02em' }}>
                        <div style={{ padding: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', color: '#64748B', display: 'flex' }}>
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            Roles y Permisos
                            <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0 0', fontWeight: '500' }}>
                                Gestiona los niveles de acceso y los privilegios de los usuarios del sistema.
                            </p>
                        </div>
                    </h1>
                    
                    <Link 
                        href="/admin/roles/create" 
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#003670'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 71, 151, 0.2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#004797'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 71, 151, 0.15)'; }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#004797', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '600', fontSize: '13px', textDecoration: 'none', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0, 71, 151, 0.15)' }}
                    >
                        <Shield size={16} /> Nuevo Rol
                    </Link>
                </div>

                {/* Alerts */}
                {flash?.success && (
                    <div style={{ background: '#F0FDF4', color: '#16A34A', padding: '16px 20px', borderRadius: '12px', marginBottom: '24px', fontWeight: 600, border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck size={18} /> {flash.success}
                    </div>
                )}
                
                {(flash?.error || errors?.error) && (
                    <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '16px 20px', borderRadius: '12px', marginBottom: '24px', fontWeight: 600, border: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Lock size={18} /> {flash?.error || errors?.error}
                    </div>
                )}

                {/* Filters */}
                <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)', marginBottom: '24px', border: '1px solid #E2E8F0' }}>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                            <input 
                                type="text" 
                                placeholder="Buscar rol por nombre o descripción..." 
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={inputStyle}
                                onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                            />
                        </div>
                        <button type="submit" 
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#003670'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 71, 151, 0.2)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#004797'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 71, 151, 0.15)'; }}
                            style={{ flexShrink: 0, padding: '0 24px', borderRadius: '10px', border: 'none', background: '#004797', color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0, 71, 151, 0.15)' }}
                        >
                            Buscar
                        </button>
                        {search && (
                            <Link href="/admin/roles" 
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#E2E8F0'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0, padding: '0 24px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '13px', textDecoration: 'none', transition: 'all 0.2s' }}
                            >
                                <X size={16} /> Limpiar
                            </Link>
                        )}
                    </form>
                </div>

                {/* Table */}
                <div style={{ background: '#ffffff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rol (Slug)</th>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Descripción</th>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Asignaciones</th>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length > 0 ? data.map(rol => {
                                    const isSystemRole = ['admin', 'cajero', 'almacen'].includes(rol.nombre);
                                    
                                    return (
                                    <tr key={rol.id} style={{ 
                                        borderBottom: '1px solid #F1F5F9', transition: 'all 0.2s'
                                    }} onMouseOver={e => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                        
                                        <td style={{ padding: '24px 32px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: isSystemRole ? '#64748B' : '#004797', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <KeyRound size={20} />
                                                </div>
                                                <div>
                                                    <span style={{ fontWeight: 800, color: '#1E293B', fontSize: '15px' }}>
                                                        {rol.nombre}
                                                    </span>
                                                    {isSystemRole && (
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, marginLeft: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                            <Lock size={10} /> Sistema
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        
                                        <td style={{ padding: '24px 32px' }}>
                                            <div style={{ color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
                                                {rol.descripcion || 'Sin descripción adicional'}
                                            </div>
                                        </td>
                                        
                                        <td style={{ padding: '24px 32px' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#F8FAFC', padding: '8px 12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                                                <Users size={16} color="#94A3B8" />
                                                <span style={{ fontWeight: 800, color: '#1E293B', fontSize: '14px' }}>
                                                    {rol.usuarios_count}
                                                </span>
                                                <span style={{ color: '#64748B', fontSize: '13px' }}>usuarios</span>
                                            </div>
                                        </td>
                                        
                                        <td style={{ padding: '24px 32px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                <Link href={`/admin/roles/${rol.id}/edit`} 
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = 'transparent'; }}
                                                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'transparent', color: '#94A3B8', border: '1px solid transparent', borderRadius: '6px', textDecoration: 'none', transition: 'all 0.2s' }} title="Editar Permisos">
                                                    <Edit2 size={16} />
                                                </Link>
                                                {!isSystemRole ? (
                                                    <button onClick={() => handleDelete(rol.id)} 
                                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2'; e.currentTarget.style.color = '#EF4444'; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
                                                        style={{ border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'transparent', color: '#94A3B8', borderRadius: '6px', transition: 'all 0.2s' }} title="Eliminar Rol">
                                                        <Trash2 size={16} />
                                                    </button>
                                                ) : (
                                                    <button disabled style={{ border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'transparent', color: '#CBD5E1', borderRadius: '6px', cursor: 'not-allowed' }} title="Rol de sistema protegido">
                                                        <Lock size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}) : (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '80px 40px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1' }}>
                                                    <Shield size={40} />
                                                </div>
                                                <h3 style={{ margin: 0, color: '#1E293B', fontSize: '18px', fontWeight: 700 }}>No hay roles registrados</h3>
                                                <p style={{ margin: 0, color: '#64748B', fontSize: '15px', maxWidth: '400px', lineHeight: '1.5' }}>
                                                    No se encontraron roles que coincidan con tu búsqueda. Crea un nuevo rol para gestionar accesos.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
