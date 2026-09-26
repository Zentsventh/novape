import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { ShieldPlus, ArrowLeft, Check, Save, Shield, Type, AlignLeft } from 'lucide-react';

export default function Create({ permisos }) {
    const { data, setData, post, processing, errors } = useForm({
        nombre: '',
        descripcion: '',
        permisos: [],
    });

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
        post('/admin/roles');
    };

    const inputStyle = {
        width: '100%', padding: '14px 16px 14px 44px', borderRadius: '12px', border: '1px solid #E2E8F0',
        background: '#F8FAFC', color: '#1E293B', fontSize: '15px', outline: 'none', transition: 'all 0.2s',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
    };
    
    const inputFocusStyle = {
        borderColor: '#00B4FF', boxShadow: '0 0 0 4px rgba(0, 180, 255, 0.1)', backgroundColor: '#ffffff'
    };

    const labelStyle = {
        display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '13px', color: '#475569', letterSpacing: '0.5px', textTransform: 'uppercase'
    };

    const iconWrapperStyle = {
        position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none', display: 'flex'
    };

    return (
        <AdminLayout logoUrl={null}>
            <Head title="Nuevo Rol" />
            
            <div style={{ fontFamily: "'Inter', sans-serif", padding: '24px 32px', maxWidth: '900px', margin: '0 auto' }}>
                
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', margin: '0 0 8px 0', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#E0F2FE', padding: '10px', borderRadius: '12px', color: '#00B4FF', display: 'flex' }}>
                                <ShieldPlus size={24} />
                            </div>
                            Crear Nuevo Rol
                        </h1>
                        <p style={{ margin: 0, color: '#64748B', fontSize: '15px' }}>
                            Define un nuevo grupo de accesos y asigna los permisos correspondientes.
                        </p>
                    </div>
                    
                    <Link 
                        href="/admin/roles" 
                        style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px', 
                            border: '1px solid #E2E8F0', background: '#ffffff', color: '#475569', fontWeight: 700, fontSize: '14px', 
                            textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseOut={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.transform = 'none'; }}
                    >
                        <ArrowLeft size={18} /> Volver a Roles
                    </Link>
                </div>

                <div style={{ background: '#ffffff', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
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
                                            style={inputStyle}
                                            onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                            required
                                            placeholder="ej: soporte, contador, vendedor_externo"
                                        />
                                    </div>
                                    <small style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '13px' }}>
                                        Este nombre se usará internamente. Es preferible usar minúsculas y sin espacios.
                                    </small>
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
                                            placeholder="ej: Acceso solo a ver reportes financieros"
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
                                <p style={{ color: '#64748B', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>Selecciona las áreas y acciones del sistema a las que tendrá acceso este rol.</p>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                                {permisos && permisos.map(p => {
                                    const isSelected = data.permisos.includes(p.id);
                                    return (
                                        <div 
                                            key={p.id}
                                            onClick={() => togglePermiso(p.id)}
                                            style={{
                                                padding: '20px',
                                                borderRadius: '16px',
                                                border: `2px solid ${isSelected ? '#00B4FF' : '#E2E8F0'}`,
                                                background: isSelected ? '#F0F9FF' : '#ffffff',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: '16px',
                                                boxShadow: isSelected ? '0 4px 12px rgba(0, 180, 255, 0.15)' : 'none'
                                            }}
                                            onMouseOver={e => { if(!isSelected) { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; } }}
                                            onMouseOut={e => { if(!isSelected) { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; } }}
                                        >
                                            <div style={{ 
                                                width: '24px', height: '24px', borderRadius: '8px', 
                                                background: isSelected ? '#00B4FF' : '#F1F5F9', 
                                                border: `2px solid ${isSelected ? '#00B4FF' : '#CBD5E1'}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                transition: 'all 0.2s', marginTop: '2px'
                                            }}>
                                                <Check size={14} color="#ffffff" style={{ opacity: isSelected ? 1 : 0, transform: isSelected ? 'scale(1)' : 'scale(0.5)', transition: 'all 0.2s' }} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, color: isSelected ? '#0284C7' : '#1E293B', fontSize: '15px', marginBottom: '4px' }}>
                                                    {p.nombre}
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.5' }}>
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
                                style={{ padding: '14px 24px', borderRadius: '12px', background: '#F1F5F9', color: '#475569', textDecoration: 'none', fontWeight: 700, fontSize: '15px', transition: 'all 0.2s' }}
                                onMouseOver={e => { e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.color = '#1E293B'; }}
                                onMouseOut={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#475569'; }}
                            >
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                style={{
                                    background: '#00B4FF',
                                    color: 'white',
                                    border: 'none',
                                    padding: '14px 32px',
                                    borderRadius: '12px',
                                    fontWeight: 800,
                                    fontSize: '15px',
                                    cursor: processing ? 'not-allowed' : 'pointer',
                                    opacity: processing ? 0.7 : 1,
                                    boxShadow: '0 4px 14px rgba(0, 180, 255, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={e => { if(!processing) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 180, 255, 0.4)'; } }}
                                onMouseOut={e => { if(!processing) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 180, 255, 0.3)'; } }}
                            >
                                <Save size={18} />
                                {processing ? 'Guardando...' : 'Crear Rol'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
