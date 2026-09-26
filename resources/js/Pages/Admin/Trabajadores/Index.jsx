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
        borderColor: '#00B4FF', boxShadow: '0 0 0 4px rgba(0, 180, 255, 0.1)', backgroundColor: '#ffffff'
    };

    return (
        <AdminLayout logoUrl={null}>
            <Head title="Directorio de Trabajadores" />
            
            <div style={{ fontFamily: "'Inter', sans-serif", padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
                
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', margin: '0 0 8px 0', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#E0F2FE', padding: '10px', borderRadius: '12px', color: '#00B4FF', display: 'flex' }}>
                                <Users size={24} />
                            </div>
                            Directorio de Trabajadores
                        </h1>
                        <p style={{ margin: 0, color: '#64748B', fontSize: '15px' }}>
                            Gestiona el equipo, roles, permisos y accesos al sistema CRM y ERP.
                        </p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <a 
                            href="/admin/exportar/trabajadores" 
                            target="_blank"
                            style={{ 
                                display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px', 
                                border: '1px solid #E2E8F0', background: '#ffffff', color: '#475569', fontWeight: 700, fontSize: '14px', 
                                textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseOut={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.transform = 'none'; }}
                        >
                            <Download size={18} /> Exportar CSV
                        </a>
                        <Link 
                            href="/admin/trabajadores/create" 
                            style={{ 
                                display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px', 
                                border: 'none', background: '#00B4FF', color: '#ffffff', fontWeight: 700, fontSize: '14px', 
                                textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(0, 180, 255, 0.3)'
                            }}
                            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 180, 255, 0.4)'; }}
                            onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 180, 255, 0.3)'; }}
                        >
                            <UserPlus size={18} /> Nuevo Trabajador
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
                        <button type="submit" style={{ background: '#1E293B', color: 'white', border: 'none', padding: '0 24px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#334155'} onMouseOut={e => e.currentTarget.style.background = '#1E293B'}>
                            Buscar
                        </button>
                        {search && (
                            <Link href="/admin/trabajadores" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', border: 'none', color: '#64748B', padding: '0 20px', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.color = '#1E293B'; }} onMouseOut={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#64748B'; }}>
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
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: isBloqueado ? '#FECACA' : '#E0F2FE', color: isBloqueado ? '#DC2626' : '#00B4FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                                                <span key={r.id} style={{ background: '#F1F5F9', color: '#475569', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, marginRight: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                    <Shield size={12} /> {r.nombre}
                                                </span>
                                            )) : <span style={{ color: '#94A3B8', fontSize: '13px', fontWeight: 500 }}>Sin rol</span>}
                                        </td>
                                        <td style={{ padding: '24px 32px', color: '#1E293B', fontWeight: 800, fontSize: '15px' }}>
                                            <span style={{ background: '#F8FAFC', padding: '6px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                                {trabajador.pedidos_count}
                                            </span>
                                        </td>
                                        <td style={{ padding: '24px 32px' }}>
                                            <span style={{ 
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                background: isBloqueado ? '#FEE2E2' : '#D1FAE5', 
                                                color: isBloqueado ? '#DC2626' : '#059669', 
                                                padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' 
                                            }}>
                                                {isBloqueado ? <Lock size={14} /> : <Unlock size={14} />}
                                                {isBloqueado ? 'Bloqueado' : 'Activo'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '24px 32px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                                <Link href={`/admin/trabajadores/${trabajador.id}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: '#F1F5F9', color: '#475569', borderRadius: '10px', textDecoration: 'none', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.background = '#E0F2FE'; e.currentTarget.style.color = '#00B4FF'; }} onMouseOut={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#475569'; }} title="Ver Detalle">
                                                    <Eye size={16} />
                                                </Link>
                                                <Link href={`/admin/trabajadores/${trabajador.id}/edit`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: '#F1F5F9', color: '#475569', borderRadius: '10px', textDecoration: 'none', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.background = '#E0F2FE'; e.currentTarget.style.color = '#00B4FF'; }} onMouseOut={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#475569'; }} title="Editar">
                                                    <Edit2 size={16} />
                                                </Link>
                                                <button onClick={() => resetPassword(trabajador.id)} style={{ border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: '#F1F5F9', color: '#475569', borderRadius: '10px', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.background = '#FFFBEB'; e.currentTarget.style.color = '#D97706'; }} onMouseOut={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#475569'; }} title="Resetear Contraseña">
                                                    <KeyRound size={16} />
                                                </button>
                                                <button onClick={() => toggleBloqueo(trabajador.id)} style={{ border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: '#F1F5F9', color: isBloqueado ? '#DC2626' : '#475569', borderRadius: '10px', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.background = isBloqueado ? '#DC2626' : '#FEE2E2'; e.currentTarget.style.color = isBloqueado ? '#ffffff' : '#DC2626'; }} onMouseOut={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = isBloqueado ? '#DC2626' : '#475569'; }} title={isBloqueado ? 'Desbloquear' : 'Bloquear'}>
                                                    {isBloqueado ? <Unlock size={16} /> : <Lock size={16} />}
                                                </button>
                                                <button onClick={() => handleDelete(trabajador.id)} style={{ border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: '#FEF2F2', color: '#EF4444', borderRadius: '10px', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#ffffff'; }} onMouseOut={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#EF4444'; }} title="Eliminar">
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
                                        background: link.active ? '#00B4FF' : '#ffffff', border: link.active ? 'none' : '1px solid #E2E8F0',
                                        color: link.active ? '#ffffff' : '#475569', borderRadius: '10px', fontSize: '14px', fontWeight: link.active ? 800 : 600, textDecoration: 'none',
                                        boxShadow: link.active ? '0 4px 12px rgba(0, 180, 255, 0.3)' : '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s'
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
