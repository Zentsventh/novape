import React, { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { Users, Download, UserPlus, Search, X, Shield, KeyRound, Lock, Unlock, Eye, Edit2, Trash2, ChevronLeft, ChevronRight, MoreHorizontal, UserCircle2 } from 'lucide-react';

export default function TrabajadoresIndex() {
    const confirmDialog = useConfirm();

    const { trabajadores, filtros, flash, errors } = usePage().props;
    const data = trabajadores?.data || [];
    
    const [search, setSearch] = useState(filtros?.buscar || '');

    const handleSearch = async (e) => {
        e.preventDefault();
        router.get('/admin/trabajadores', { buscar: search }, { preserveState: true });
    };

    const handleDelete = async (id) => {
        if (await confirmDialog('¿Estás seguro de eliminar este trabajador? (Mover a la papelera)')) {
            router.delete(`/admin/trabajadores/${id}`, { preserveScroll: true });
        }
    };

    const toggleBloqueo = async (id) => {
        router.post(`/admin/trabajadores/${id}/bloquear`, {}, { preserveScroll: true });
    };

    const resetPassword = async (id) => {
        if (await confirmDialog('¿Estás seguro de restablecer la contraseña a Novape2026!?')) {
            router.post(`/admin/trabajadores/${id}/reset-password`, {}, { preserveScroll: true });
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
            <Head title="Directorio de Trabajadores" />
            
            <div style={{ fontFamily: "'Inter', sans-serif", padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
                
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                    <h1 style={{ fontSize: '24px', margin: 0, fontWeight: '700', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.02em' }}>
                        <div style={{ padding: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', color: '#64748B', display: 'flex' }}>
                            <Users size={20} />
                        </div>
                        <div>
                            Directorio de Trabajadores
                            <p style={{ color: '#64748B', fontSize: '13px', margin: '4px 0 0 0', fontWeight: '500' }}>
                                Gestiona el equipo, roles, permisos y accesos al sistema CRM y ERP.
                            </p>
                        </div>
                    </h1>
                    
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <a 
                            href="/admin/exportar/trabajadores" 
                            target="_blank"
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#E2E8F0'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#475569', fontWeight: '600', fontSize: '13px', textDecoration: 'none', transition: 'all 0.2s', cursor: 'pointer' }}
                        >
                            <Download size={16} /> Exportar CSV
                        </a>
                        <Link 
                            href="/admin/trabajadores/create" 
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#003670'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 71, 151, 0.2)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#004797'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 71, 151, 0.15)'; }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#004797', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '600', fontSize: '13px', textDecoration: 'none', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0, 71, 151, 0.15)' }}
                        >
                            <UserPlus size={16} /> Nuevo Trabajador
                        </Link>
                    </div>
                </div>

                {/* Alerts */}
                {flash?.success && (
                    <div style={{ background: '#F0FDF4', color: '#16A34A', padding: '16px 20px', borderRadius: '12px', marginBottom: '24px', fontWeight: 600, border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Shield size={18} /> {flash.success}
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
                                placeholder="Buscar por nombre, email o DNI..." 
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
                            <Link href="/admin/trabajadores" 
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
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Usuario</th>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Identidad / Contacto</th>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rol Asignado</th>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pedidos</th>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado</th>
                                    <th style={{ padding: '20px 32px', color: '#64748B', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length > 0 ? data.map(trabajador => {
                                    const isBloqueado = trabajador.estado === 'bloqueado';

                                    return (
                                    <tr key={trabajador.id} style={{ 
                                        borderBottom: '1px solid #F1F5F9', transition: 'all 0.2s',
                                        background: isBloqueado ? '#FEF2F2' : 'transparent',
                                    }} onMouseOver={e => { if(!isBloqueado) e.currentTarget.style.backgroundColor = '#F8FAFC'; }} onMouseOut={e => { if(!isBloqueado) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                        <td style={{ padding: '24px 32px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isBloqueado ? '#FEF2F2' : '#F8FAFC', border: `1px solid ${isBloqueado ? '#FECACA' : '#E2E8F0'}`, color: isBloqueado ? '#DC2626' : '#004797', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <UserCircle2 size={20} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, color: isBloqueado ? '#991B1B' : '#1E293B', fontSize: '15px', textDecoration: isBloqueado ? 'line-through' : 'none', marginBottom: '2px' }}>
                                                        {trabajador.nombres} {trabajador.apellidos}
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: isBloqueado ? '#EF4444' : '#64748B' }}>{trabajador.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '24px 32px' }}>
                                            <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '14px', marginBottom: '2px' }}>{trabajador.dni || '-'}</div>
                                            <div style={{ fontSize: '13px', color: '#64748B' }}>{trabajador.telefono || '-'}</div>
                                        </td>
                                        <td style={{ padding: '24px 32px' }}>
                                            {trabajador.roles && trabajador.roles.length > 0 ? trabajador.roles.map(r => (
                                                <span key={r.id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, marginRight: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    <Shield size={12} /> {r.nombre}
                                                </span>
                                            )) : <span style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 500 }}>Sin rol</span>}
                                        </td>
                                        <td style={{ padding: '24px 32px', color: '#1E293B', fontWeight: 800, fontSize: '15px' }}>
                                            <span style={{ background: '#F8FAFC', padding: '4px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '13px', color: '#1E293B' }}>
                                                {trabajador.pedidos_count}
                                            </span>
                                        </td>
                                        <td style={{ padding: '24px 32px' }}>
                                            <span style={{ 
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                background: isBloqueado ? '#FEF2F2' : '#F0FDF4', 
                                                color: isBloqueado ? '#DC2626' : '#10B981', 
                                                border: `1px solid ${isBloqueado ? '#FEE2E2' : '#DCFCE7'}`,
                                                padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' 
                                            }}>
                                                {isBloqueado ? <Lock size={12} /> : <Unlock size={12} />}
                                                {isBloqueado ? 'Bloqueado' : 'Activo'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '24px 32px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                <Link href={`/admin/trabajadores/${trabajador.id}`} 
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = 'transparent'; }}
                                                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'transparent', color: '#94A3B8', border: '1px solid transparent', borderRadius: '6px', textDecoration: 'none', transition: 'all 0.2s' }} title="Ver Detalle">
                                                    <Eye size={16} />
                                                </Link>
                                                <Link href={`/admin/trabajadores/${trabajador.id}/edit`} 
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = 'transparent'; }}
                                                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'transparent', color: '#94A3B8', border: '1px solid transparent', borderRadius: '6px', textDecoration: 'none', transition: 'all 0.2s' }} title="Editar">
                                                    <Edit2 size={16} />
                                                </Link>
                                                <button onClick={() => resetPassword(trabajador.id)} 
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FFFBEB'; e.currentTarget.style.color = '#D97706'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
                                                    style={{ border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'transparent', color: '#94A3B8', borderRadius: '6px', transition: 'all 0.2s' }} title="Resetear Contraseña">
                                                    <KeyRound size={16} />
                                                </button>
                                                <button onClick={() => toggleBloqueo(trabajador.id)} 
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isBloqueado ? '#DC2626' : '#FEF2F2'; e.currentTarget.style.color = isBloqueado ? '#ffffff' : '#DC2626'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = isBloqueado ? '#DC2626' : '#94A3B8'; }}
                                                    style={{ border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'transparent', color: isBloqueado ? '#DC2626' : '#94A3B8', borderRadius: '6px', transition: 'all 0.2s' }} title={isBloqueado ? 'Desbloquear' : 'Bloquear'}>
                                                    {isBloqueado ? <Unlock size={16} /> : <Lock size={16} />}
                                                </button>
                                                <button onClick={() => handleDelete(trabajador.id)} 
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FEF2F2'; e.currentTarget.style.color = '#EF4444'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
                                                    style={{ border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'transparent', color: '#94A3B8', borderRadius: '6px', transition: 'all 0.2s' }} title="Eliminar">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}) : (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '80px 40px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1' }}>
                                                    <Users size={40} />
                                                </div>
                                                <h3 style={{ margin: 0, color: '#1E293B', fontSize: '18px', fontWeight: 700 }}>No hay trabajadores</h3>
                                                <p style={{ margin: 0, color: '#64748B', fontSize: '15px', maxWidth: '400px', lineHeight: '1.5' }}>
                                                    No se encontraron usuarios o miembros del equipo que coincidan con tu búsqueda.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Paginación Premium */}
                {trabajadores?.links && trabajadores.links.length > 3 && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px', gap: '8px' }}>
                        {trabajadores.links.map((link, idx) => {
                            let label = link.label;
                            if (label.includes('Previous')) label = <ChevronLeft size={18} />;
                            if (label.includes('Next')) label = <ChevronRight size={18} />;
                            if (label === '...') label = <MoreHorizontal size={18} />;

                            if (!link.url) {
                                return (
                                    <span
                                        key={idx}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '40px', height: '40px', padding: '0 12px',
                                            background: '#F8FAFC', color: '#94A3B8', borderRadius: '10px', fontSize: '14px', fontWeight: 600, pointerEvents: 'none'
                                        }}
                                    >
                                        {label}
                                    </span>
                                );
                            }
                            return (
                                <Link
                                    key={idx}
                                    href={link.url}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '40px', height: '40px', padding: '0 12px',
                                        background: link.active ? '#004797' : '#ffffff', border: link.active ? 'none' : '1px solid #E2E8F0',
                                        color: link.active ? '#ffffff' : '#475569', borderRadius: '10px', fontSize: '14px', fontWeight: link.active ? 800 : 600, textDecoration: 'none',
                                        boxShadow: link.active ? '0 4px 12px rgba(0, 71, 151, 0.3)' : '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s'
                                    }}
                                    onMouseOver={e => { if(!link.active) { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#1E293B'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                                    onMouseOut={e => { if(!link.active) { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.transform = 'none'; } }}
                                >
                                    {label}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
