import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { Edit2, ArrowLeft, Shield, Check, Save, User, Mail, Lock, CreditCard, Phone, KeyRound } from 'lucide-react';

export default function Edit({ trabajador, roles }) {
    const { auth } = usePage().props;
    const canManageRoles = auth?.user?.roles?.some(role => role.nombre === 'admin');
    const { data, setData, put, processing, errors } = useForm({
        nombres: trabajador.nombres,
        apellidos: trabajador.apellidos,
        email: trabajador.email,
        password: '',
        roles: trabajador.roles ? trabajador.roles.map(r => r.id) : [],
        dni: trabajador.dni || '',
        telefono: trabajador.telefono || '',
    });

    const toggleRole = (roleId) => {
        if (!canManageRoles) return;
        const currentRoles = data.roles || [];
        if (currentRoles.includes(roleId)) {
            setData('roles', currentRoles.filter(id => id !== roleId));
        } else {
            setData('roles', [...currentRoles, roleId]);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        put(`/admin/trabajadores/${trabajador.id}`);
    };

    const inputStyle = {
        width: '100%', padding: '14px 16px 14px 44px', borderRadius: '12px', border: '1px solid #E2E8F0',
        background: '#F8FAFC', color: '#1E293B', fontSize: '15px', outline: 'none', transition: 'all 0.2s',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
    };
    
    const inputFocusStyle = {
        borderColor: '#004797', boxShadow: '0 0 0 4px rgba(0, 71, 151, 0.1)', backgroundColor: '#ffffff'
    };

    const labelStyle = {
        display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '13px', color: '#475569', letterSpacing: '0.5px', textTransform: 'uppercase'
    };

    const iconWrapperStyle = {
        position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none', display: 'flex'
    };

    return (
        <AdminLayout logoUrl={null}>
            <Head title="Editar Usuario" />
            
            <div style={{ fontFamily: "'Inter', sans-serif", padding: '24px 32px', maxWidth: '900px', margin: '0 auto' }}>
                
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', margin: '0 0 8px 0', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#E0F2FE', padding: '10px', borderRadius: '12px', color: '#004797', display: 'flex' }}>
                                <Edit2 size={24} />
                            </div>
                            Editar Trabajador
                        </h1>
                        <p style={{ margin: 0, color: '#64748B', fontSize: '15px' }}>
                            Modificando los datos y accesos de <strong style={{ color: '#1E293B' }}>{trabajador.nombres} {trabajador.apellidos}</strong>.
                        </p>
                    </div>
                    
                    <Link 
                        href="/admin/trabajadores" 
                        style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px', 
                            border: '1px solid #E2E8F0', background: '#ffffff', color: '#475569', fontWeight: 700, fontSize: '14px', 
                            textDecoration: 'none', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseOut={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.transform = 'none'; }}
                    >
                        <ArrowLeft size={18} /> Volver a Usuarios
                    </Link>
                </div>

                <div style={{ background: '#ffffff', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }} autoComplete="off">
                        
                        {/* Información Personal */}
                        <div>
                            <h3 style={{ margin: '0 0 16px 0', color: '#1E293B', fontSize: '16px', fontWeight: 800, borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>Información Personal</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                                <div style={{ position: 'relative' }}>
                                    <label style={labelStyle}>Nombres *</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={iconWrapperStyle}><User size={18} /></div>
                                        <input
                                            type="text"
                                            value={data.nombres}
                                            onChange={e => setData('nombres', e.target.value)}
                                            style={inputStyle}
                                            onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                            required
                                            autoComplete="off"
                                        />
                                    </div>
                                    {errors.nombres && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', fontWeight: 600 }}>{errors.nombres}</div>}
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <label style={labelStyle}>Apellidos *</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={iconWrapperStyle}><User size={18} /></div>
                                        <input
                                            type="text"
                                            value={data.apellidos}
                                            onChange={e => setData('apellidos', e.target.value)}
                                            style={inputStyle}
                                            onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                            required
                                            autoComplete="off"
                                        />
                                    </div>
                                    {errors.apellidos && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', fontWeight: 600 }}>{errors.apellidos}</div>}
                                </div>
                            </div>
                        </div>

                        {/* Credenciales de Acceso */}
                        <div>
                            <h3 style={{ margin: '0 0 16px 0', color: '#1E293B', fontSize: '16px', fontWeight: 800, borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>Credenciales de Acceso</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                                <div style={{ position: 'relative' }}>
                                    <label style={labelStyle}>Email *</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={iconWrapperStyle}><Mail size={18} /></div>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            style={inputStyle}
                                            onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                            required
                                            autoComplete="off"
                                        />
                                    </div>
                                    {errors.email && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', fontWeight: 600 }}>{errors.email}</div>}
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <label style={labelStyle}>Nueva Contraseña (Opcional)</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={iconWrapperStyle}><KeyRound size={18} /></div>
                                        <input
                                            type="password"
                                            value={data.password}
                                            onChange={e => setData('password', e.target.value)}
                                            style={inputStyle}
                                            onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                            autoComplete="new-password"
                                            placeholder="Dejar en blanco para mantener la actual"
                                        />
                                    </div>
                                    {errors.password && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', fontWeight: 600 }}>{errors.password}</div>}
                                </div>
                            </div>
                        </div>

                        {/* Datos Adicionales */}
                        <div>
                            <h3 style={{ margin: '0 0 16px 0', color: '#1E293B', fontSize: '16px', fontWeight: 800, borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>Datos Adicionales</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                                <div style={{ position: 'relative' }}>
                                    <label style={labelStyle}>DNI / Identidad</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={iconWrapperStyle}><CreditCard size={18} /></div>
                                        <input
                                            type="text"
                                            value={data.dni}
                                            onChange={e => setData('dni', e.target.value)}
                                            style={inputStyle}
                                            onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                            placeholder="Documento de Identidad"
                                        />
                                    </div>
                                    {errors.dni && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', fontWeight: 600 }}>{errors.dni}</div>}
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <label style={labelStyle}>Teléfono de Contacto</label>
                                    <div style={{ position: 'relative' }}>
                                        <div style={iconWrapperStyle}><Phone size={18} /></div>
                                        <input
                                            type="text"
                                            value={data.telefono}
                                            onChange={e => setData('telefono', e.target.value)}
                                            style={inputStyle}
                                            onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                            onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                            placeholder="+51 999 999 999"
                                        />
                                    </div>
                                    {errors.telefono && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', fontWeight: 600 }}>{errors.telefono}</div>}
                                </div>
                            </div>
                        </div>

                        {/* Selección de Roles */}
                        <div>
                            <h3 style={{ margin: '0 0 16px 0', color: '#1E293B', fontSize: '16px', fontWeight: 800, borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>Roles y Permisos *</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                                {roles.map(r => {
                                    const isSelected = data.roles.includes(r.id);
                                    return (
                                        <div 
                                            key={r.id}
                                            role={canManageRoles ? 'checkbox' : undefined}
                                            aria-checked={canManageRoles ? isSelected : undefined}
                                            tabIndex={canManageRoles ? 0 : undefined}
                                            onKeyDown={e => { if (canManageRoles && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); toggleRole(r.id); } }}
                                            onClick={() => toggleRole(r.id)}
                                            style={{
                                                padding: '20px',
                                                borderRadius: '16px',
                                                border: `2px solid ${isSelected ? '#004797' : '#E2E8F0'}`,
                                                background: isSelected ? '#F0F9FF' : '#ffffff',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: '16px',
                                                boxShadow: isSelected ? '0 4px 12px rgba(0, 71, 151, 0.15)' : 'none'
                                            }}
                                            onMouseOver={e => { if(!isSelected) { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; } }}
                                            onMouseOut={e => { if(!isSelected) { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; } }}
                                        >
                                            <div style={{ 
                                                width: '24px', height: '24px', borderRadius: '8px', 
                                                background: isSelected ? '#004797' : '#F1F5F9', 
                                                border: `2px solid ${isSelected ? '#004797' : '#CBD5E1'}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                transition: 'all 0.2s', marginTop: '2px'
                                            }}>
                                                <Check size={14} color="#ffffff" style={{ opacity: isSelected ? 1 : 0, transform: isSelected ? 'scale(1)' : 'scale(0.5)', transition: 'all 0.2s' }} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, color: isSelected ? '#0284C7' : '#1E293B', textTransform: 'capitalize', fontSize: '15px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Shield size={16} /> {r.nombre}
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.5' }}>
                                                    {r.descripcion}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {errors.roles && <div style={{ color: '#EF4444', fontSize: '13px', marginTop: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><Shield size={14} /> Debe seleccionar al menos un rol.</div>}
                        </div>

                        {/* Botonera Fija */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '20px', paddingTop: '24px', borderTop: '1px solid #E2E8F0' }}>
                            <Link 
                                href="/admin/trabajadores" 
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
                                    background: '#004797',
                                    color: 'white',
                                    border: 'none',
                                    padding: '14px 32px',
                                    borderRadius: '12px',
                                    fontWeight: 800,
                                    fontSize: '15px',
                                    cursor: processing ? 'not-allowed' : 'pointer',
                                    opacity: processing ? 0.7 : 1,
                                    boxShadow: '0 4px 14px rgba(0, 71, 151, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={e => { if(!processing) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 71, 151, 0.4)'; } }}
                                onMouseOut={e => { if(!processing) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 71, 151, 0.3)'; } }}
                            >
                                <Save size={18} />
                                {processing ? 'Actualizando...' : 'Actualizar Usuario'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
