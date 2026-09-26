import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { ArrowLeft, Save, Building2, Hash, MapPin, Phone, Mail, User, CheckCircle2 } from 'lucide-react';

export default function ProveedorForm({ proveedor }) {
    const isEditing = !!proveedor;

    const { data, setData, post, put, processing, errors } = useForm({
        nombre: proveedor?.nombre || '',
        ruc: proveedor?.ruc || '',
        direccion: proveedor?.direccion || '',
        telefono: proveedor?.telefono || '',
        email: proveedor?.email || '',
        contacto: proveedor?.contacto || '',
        activo: proveedor?.activo ?? true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (isEditing) {
            put(`/admin/proveedores/${proveedor.id}`);
        } else {
            post('/admin/proveedores');
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

    const labelStyle = {
        display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px', letterSpacing: '0.5px'
    };

    const iconStyle = {
        position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none'
    };

    return (
        <AdminLayout>
            <Head title={isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'} />

            <div style={{ fontFamily: "'Inter', sans-serif", padding: '24px 32px', maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', margin: '0 0 8px 0', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.5px' }}>
                            {isEditing ? 'Editar Proveedor' : 'Crear Nuevo Proveedor'}
                        </h1>
                        <p style={{ margin: 0, color: '#64748B', fontSize: '15px' }}>
                            {isEditing ? 'Modifica los datos operativos y de contacto del proveedor.' : 'Registra los datos de facturación y contacto para este proveedor.'}
                        </p>
                    </div>
                    <Link 
                        href="/admin/proveedores" 
                        style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748B', 
                            textDecoration: 'none', fontWeight: 600, fontSize: '14px', transition: 'color 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.color = '#00B4FF'}
                        onMouseOut={e => e.currentTarget.style.color = '#64748B'}
                    >
                        <ArrowLeft size={16} /> Volver al Directorio
                    </Link>
                </div>

                <div style={{ background: '#ffffff', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                            <div>
                                <label style={labelStyle}>Nombre / Razón Social <span style={{ color: '#00B4FF' }}>*</span></label>
                                <div style={{ position: 'relative' }}>
                                    <Building2 size={18} style={iconStyle} />
                                    <input 
                                        type="text" value={data.nombre} onChange={e => setData('nombre', e.target.value)}
                                        placeholder="Ej. TechNova S.A."
                                        style={{ ...inputStyle, border: errors.nombre ? '1px solid #EF4444' : inputStyle.border }} 
                                        onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                        onBlur={e => { e.target.style.borderColor = errors.nombre ? '#EF4444' : '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                    />
                                </div>
                                {errors.nombre && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', fontWeight: 500 }}>{errors.nombre}</div>}
                            </div>
                            <div>
                                <label style={labelStyle}>RUC</label>
                                <div style={{ position: 'relative' }}>
                                    <Hash size={18} style={iconStyle} />
                                    <input 
                                        type="text" value={data.ruc} onChange={e => setData('ruc', e.target.value)}
                                        placeholder="Ej. 20123456781"
                                        style={{ ...inputStyle, border: errors.ruc ? '1px solid #EF4444' : inputStyle.border }} 
                                        onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                        onBlur={e => { e.target.style.borderColor = errors.ruc ? '#EF4444' : '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                    />
                                </div>
                                {errors.ruc && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', fontWeight: 500 }}>{errors.ruc}</div>}
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>Dirección</label>
                            <div style={{ position: 'relative' }}>
                                <MapPin size={18} style={iconStyle} />
                                <input 
                                    type="text" value={data.direccion} onChange={e => setData('direccion', e.target.value)}
                                    placeholder="Ej. Av. Principal 123"
                                    style={{ ...inputStyle, border: errors.direccion ? '1px solid #EF4444' : inputStyle.border }} 
                                    onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                    onBlur={e => { e.target.style.borderColor = errors.direccion ? '#EF4444' : '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                />
                            </div>
                            {errors.direccion && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', fontWeight: 500 }}>{errors.direccion}</div>}
                        </div>

                        <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                            <div>
                                <label style={labelStyle}>Teléfono</label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={18} style={{...iconStyle, left: '14px', width: '16px'}} />
                                    <input 
                                        type="text" value={data.telefono} onChange={e => setData('telefono', e.target.value)}
                                        placeholder="Ej. 987 654 321"
                                        style={{ ...inputStyle, padding: '12px 16px 12px 40px', background: '#ffffff', border: errors.telefono ? '1px solid #EF4444' : inputStyle.border }} 
                                        onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                        onBlur={e => { e.target.style.borderColor = errors.telefono ? '#EF4444' : '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#ffffff'; }}
                                    />
                                </div>
                                {errors.telefono && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', fontWeight: 500 }}>{errors.telefono}</div>}
                            </div>
                            <div>
                                <label style={labelStyle}>Email Comercial</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={18} style={{...iconStyle, left: '14px', width: '16px'}} />
                                    <input 
                                        type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                                        placeholder="Ej. ventas@empresa.com"
                                        style={{ ...inputStyle, padding: '12px 16px 12px 40px', background: '#ffffff', border: errors.email ? '1px solid #EF4444' : inputStyle.border }} 
                                        onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                        onBlur={e => { e.target.style.borderColor = errors.email ? '#EF4444' : '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#ffffff'; }}
                                    />
                                </div>
                                {errors.email && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', fontWeight: 500 }}>{errors.email}</div>}
                            </div>
                            <div>
                                <label style={labelStyle}>Persona de Contacto</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={18} style={{...iconStyle, left: '14px', width: '16px'}} />
                                    <input 
                                        type="text" value={data.contacto} onChange={e => setData('contacto', e.target.value)}
                                        placeholder="Ej. Juan Pérez"
                                        style={{ ...inputStyle, padding: '12px 16px 12px 40px', background: '#ffffff', border: errors.contacto ? '1px solid #EF4444' : inputStyle.border }} 
                                        onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                        onBlur={e => { e.target.style.borderColor = errors.contacto ? '#EF4444' : '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#ffffff'; }}
                                    />
                                </div>
                                {errors.contacto && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', fontWeight: 500 }}>{errors.contacto}</div>}
                            </div>
                        </div>

                        <div>
                            <label style={{ 
                                display: 'inline-flex', alignItems: 'center', cursor: 'pointer',
                                background: data.activo ? '#F0FDF4' : '#F1F5F9', border: `1px solid ${data.activo ? '#86EFAC' : '#E2E8F0'}`,
                                padding: '16px 20px', borderRadius: '16px', transition: 'all 0.2s'
                            }}>
                                <input 
                                    type="checkbox" 
                                    checked={data.activo} 
                                    onChange={e => setData('activo', e.target.checked)}
                                    style={{ width: '20px', height: '20px', marginRight: '16px', accentColor: '#22C55E', cursor: 'pointer' }}
                                />
                                <div>
                                    <div style={{ fontWeight: 700, color: data.activo ? '#166534' : '#475569', fontSize: '15px' }}>Proveedor Activo</div>
                                    <div style={{ fontSize: '13px', color: data.activo ? '#15803D' : '#94A3B8', marginTop: '2px' }}>Este proveedor aparecerá en las listas desplegables al crear órdenes de compra.</div>
                                </div>
                            </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px', borderTop: '1px solid #E2E8F0', paddingTop: '32px' }}>
                            <button 
                                type="button" 
                                onClick={() => window.history.back()}
                                style={{ 
                                    padding: '14px 28px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#ffffff', 
                                    color: '#64748B', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: '15px' 
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#64748B'; }}
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                disabled={processing}
                                style={{ 
                                    padding: '14px 28px', borderRadius: '12px', border: 'none', background: '#00B4FF', color: 'white', 
                                    fontWeight: 600, cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.7 : 1, 
                                    display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 14px rgba(0, 180, 255, 0.3)', transition: 'all 0.2s ease',
                                    fontSize: '15px'
                                }}
                                onMouseOver={e => { if(!processing) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 180, 255, 0.4)'; } }}
                                onMouseOut={e => { if(!processing) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 180, 255, 0.3)'; } }}
                            >
                                {processing ? (
                                    <>Guardando...</>
                                ) : (
                                    <><Save size={18} /> {isEditing ? 'Guardar Cambios' : 'Crear Proveedor'}</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
