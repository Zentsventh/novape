import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { ShieldAlert, ArrowLeft, Check, Save, Shield, Type, AlignLeft } from 'lucide-react';

export default function Edit({ rol, permisos }) {
    const { data, setData, put, processing, errors } = useForm({
        nombre: rol.nombre,
        descripcion: rol.descripcion,
        permisos: rol.permisos ? rol.permisos.map(p => p.id) : [],
    });

    const isCoreRole = ['admin', 'cajero', 'almacen'].includes(rol.nombre);

    const togglePermiso = (permisoId) => {
        const currentPermisos = data.permisos || [];
        if (currentPermisos.includes(permisoId)) {
            setData('permisos', currentPermisos.filter(id => id !== permisoId));
        } else {
            setData('permisos', [...currentPermisos, permisoId]);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        put(`/admin/roles/${rol.id}`);
    };

    const inputStyle = {
        width: '100%', padding: '12px 16px 12px 40px', borderRadius: '10px', border: '1px solid #E2E8F0',
        background: '#F8FAFC', color: '#1E293B', fontSize: '14px', outline: 'none', transition: 'all 0.2s'
    };
    
    const inputFocusStyle = {
        borderColor: '#004797', backgroundColor: '#ffffff', boxShadow: '0 0 0 3px rgba(0, 71, 151, 0.1)'
    };

    const labelStyle = {
        display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '13px', color: '#475569'
    };

    const iconWrapperStyle = {
        position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none', display: 'flex'
    };

    return (
        <AdminLayout logoUrl={null}>
            <Head title="Editar Rol" />
            
            <div style={{ fontFamily: "'Inter', sans-serif", padding: '24px 32px', maxWidth: '900px', margin: '0 auto' }}>
                
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '12px', color: '#004797', display: 'flex', border: '1px solid #E2E8F0' }}>
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1E293B', margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>
                                Editar Rol
                            </h1>
                            <p style={{ margin: 0, color: '#64748B', fontSize: '14px' }}>
                                Modificando el rol <strong style={{ color: '#1E293B' }}>{rol.nombre}</strong> y sus niveles de acceso.
                            </p>
                        </div>
                    </div>
                    
                    <Link 
                        href="/admin/roles" 
                        style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', 
                            border: '1px solid #E2E8F0', background: '#ffffff', color: '#475569', fontWeight: 600, fontSize: '13px', 
                            textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseOut={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.transform = 'none'; }}
                    >
                        <ArrowLeft size={16} /> Volver a Roles
                    </Link>
                </div>

                <div style={{ background: '#ffffff', borderRadius: '20px', padding: '32px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        
                        {/* Información del Rol */}
                        <div>
                            <h3 style={{ margin: '0 0 20px 0', color: '#1E293B', fontSize: '16px', fontWeight: 800, borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>Identificación del Rol</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                                <div style={{ position: 'relative' }}>
                                    <label style={labelStyle}>Nombre Corto (Slug) *</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={iconWrapperStyle}><Type size={18} /></div>
                                        <input
                                            type="text"
                                            value={data.nombre}
                                            onChange={e => setData('nombre', e.target.value)}
                                            style={{ ...inputStyle, background: isCoreRole ? '#F1F5F9' : '#F8FAFC', color: isCoreRole ? '#94A3B8' : '#1E293B', cursor: isCoreRole ? 'not-allowed' : 'text' }}
                                            onFocus={e => !isCoreRole && Object.assign(e.target.style, inputFocusStyle)}
                                            onBlur={e => { if(!isCoreRole) { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; } }}
                                            required
                                            disabled={isCoreRole}
                                        />
                                    </div>
                                    {isCoreRole && (
                                        <small style={{ color: '#0284C7', background: '#E0F2FE', padding: '6px 12px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '12px', fontWeight: 700 }}>
                                            <Shield size={14} /> Rol protegido del sistema. El nombre no se puede cambiar.
                                        </small>
                                    )}
                                    {errors.nombre && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', fontWeight: 600 }}>{errors.nombre}</div>}
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <label style={labelStyle}>Descripción Detallada *</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={iconWrapperStyle}><AlignLeft size={18} /></div>
                                        <input
                                            type="text"
                                            value={data.descripcion}
                                            onChange={e => setData('descripcion', e.target.value)}
                                            style={inputStyle}
                                            onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                            required
                                        />
                                    </div>
                                    {errors.descripcion && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', fontWeight: 600 }}>{errors.descripcion}</div>}
                                </div>
                            </div>
                        </div>

                        {/* Asignación de Permisos */}
                        <div>
                            <div style={{ marginBottom: '20px' }}>
                                <h3 style={{ margin: '0 0 8px 0', color: '#1E293B', fontSize: '16px', fontWeight: 800 }}>Módulos y Permisos del Sistema *</h3>
                                <p style={{ color: '#64748B', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>Activa o desactiva las áreas y acciones del sistema a las que tendrá acceso este rol.</p>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                                {permisos && permisos.map(p => {
                                    const isSelected = data.permisos.includes(p.id);
                                    return (
                                        <div 
                                            key={p.id}
                                            onClick={() => togglePermiso(p.id)}
                                            style={{
                                                padding: '16px',
                                                borderRadius: '12px',
                                                border: `1px solid ${isSelected ? '#004797' : '#E2E8F0'}`,
                                                background: isSelected ? '#F0F9FF' : '#ffffff',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: '12px'
                                            }}
                                            onMouseOver={e => { if(!isSelected) { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)'; } }}
                                            onMouseOut={e => { if(!isSelected) { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; } }}
                                        >
                                            <div style={{ 
                                                width: '20px', height: '20px', borderRadius: '6px', 
                                                background: isSelected ? '#004797' : '#F8FAFC', 
                                                border: `1px solid ${isSelected ? '#004797' : '#CBD5E1'}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                transition: 'all 0.2s', marginTop: '2px'
                                            }}>
                                                <Check size={12} color="#ffffff" style={{ opacity: isSelected ? 1 : 0, transform: isSelected ? 'scale(1)' : 'scale(0.5)', transition: 'all 0.2s' }} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: isSelected ? '#004797' : '#1E293B', fontSize: '14px', marginBottom: '4px' }}>
                                                    {p.nombre}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.4' }}>
                                                    {p.descripcion}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {errors.permisos && <div style={{ color: '#EF4444', fontSize: '13px', marginTop: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><Shield size={14} /> Debe seleccionar al menos un permiso.</div>}
                        </div>

                        {/* Botonera Fija */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '10px', paddingTop: '24px', borderTop: '1px solid #E2E8F0' }}>
                            <Link 
                                href="/admin/roles" 
                                style={{ padding: '10px 20px', borderRadius: '10px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', textDecoration: 'none', fontWeight: 600, fontSize: '14px', transition: 'all 0.2s' }}
                                onMouseOver={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#1E293B'; }}
                                onMouseOut={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#475569'; }}
                            >
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                style={{
                                    background: '#004797',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 24px',
                                    borderRadius: '10px',
                                    fontWeight: 600,
                                    fontSize: '14px',
                                    cursor: processing ? 'not-allowed' : 'pointer',
                                    opacity: processing ? 0.7 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={e => { if(!processing) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 71, 151, 0.2)'; } }}
                                onMouseOut={e => { if(!processing) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; } }}
                            >
                                <Save size={16} />
                                {processing ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
