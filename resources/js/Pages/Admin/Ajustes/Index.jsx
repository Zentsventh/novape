import React, { useEffect, useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { Settings, MessageCircle, Store, DollarSign, Percent, Save, Check, Key, Smartphone, Link as LinkIcon, Lock, X } from 'lucide-react';

export default function Index({ configuraciones }) {
    const { flash } = usePage().props;
    const [activeTab, setActiveTab] = useState('general');
    const [alertMessage, setAlertMessage] = useState(null);
    
    const { data, setData, post, processing, errors } = useForm({
        nombre_sitio: configuraciones?.nombre_sitio || 'Novape',
        pago_tarjeta: configuraciones?.pago_tarjeta === '1',
        pago_transferencia: configuraciones?.pago_transferencia === '1',
        envio_gratis: configuraciones?.envio_gratis === '1',
        igv_porcentaje: configuraciones?.igv_porcentaje !== undefined ? configuraciones?.igv_porcentaje : '18',
        whatsapp_token: configuraciones?.whatsapp_token || '',
        whatsapp_phone_number_id: configuraciones?.whatsapp_phone_number_id || '',
        whatsapp_verify_token: configuraciones?.whatsapp_verify_token || '',
        whatsapp_app_secret: configuraciones?.whatsapp_app_secret || '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/admin/ajustes');
    };

    useEffect(() => {
        if (flash?.success) {
            setAlertMessage({ type: 'success', text: flash.success });
            setTimeout(() => setAlertMessage(null), 5000);
        }
        if (flash?.error) {
            setAlertMessage({ type: 'error', text: flash.error });
            setTimeout(() => setAlertMessage(null), 5000);
        }
    }, [flash]);

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
        <AdminLayout logoUrl={configuraciones?.logo_url || ''}>
            <Head title="Ajustes Generales" />
            
            <div style={{ fontFamily: "'Inter', sans-serif", padding: '24px 32px', maxWidth: '1200px', margin: '0 auto' }}>
                
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', margin: '0 0 8px 0', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#E0F2FE', padding: '10px', borderRadius: '12px', color: '#004797', display: 'flex' }}>
                                <Settings size={24} />
                            </div>
                            Ajustes del Sistema
                        </h1>
                        <p style={{ margin: 0, color: '#64748B', fontSize: '15px' }}>
                            Configura las preferencias globales, moneda, impuestos y conexiones de API.
                        </p>
                    </div>
                </div>

                {/* Custom Alert */}
                {alertMessage && (
                    <div style={{ 
                        background: alertMessage.type === 'success' ? '#F0FDF4' : '#FEF2F2', 
                        color: alertMessage.type === 'success' ? '#16A34A' : '#DC2626', 
                        padding: '16px 20px', borderRadius: '12px', marginBottom: '24px', fontWeight: 600, 
                        border: `1px solid ${alertMessage.type === 'success' ? '#BBF7D0' : '#FECACA'}`, 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {alertMessage.type === 'success' ? <Check size={18} /> : <Settings size={18} />}
                            {alertMessage.text}
                        </div>
                        <button onClick={() => setAlertMessage(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex' }}>
                            <X size={18} />
                        </button>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px', alignItems: 'start' }}>
                    
                    {/* Sidebar Tabs */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#ffffff', padding: '16px', borderRadius: '24px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                        <button 
                            onClick={() => setActiveTab('general')}
                            style={{ 
                                padding: '14px 16px', textAlign: 'left', borderRadius: '12px', border: 'none', 
                                background: activeTab === 'general' ? '#F0F9FF' : 'transparent', 
                                color: activeTab === 'general' ? '#0284C7' : '#475569', 
                                cursor: 'pointer', fontWeight: 700, fontSize: '15px',
                                display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s',
                                boxShadow: activeTab === 'general' ? 'inset 2px 0 0 0 #004797' : 'none'
                            }}
                            onMouseOver={e => { if (activeTab !== 'general') { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; } }}
                            onMouseOut={e => { if (activeTab !== 'general') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; } }}
                        >
                            <Store size={18} color={activeTab === 'general' ? '#004797' : '#94A3B8'} /> Configuración General
                        </button>
                        <button 
                            onClick={() => setActiveTab('omnichannel')}
                            style={{ 
                                padding: '14px 16px', textAlign: 'left', borderRadius: '12px', border: 'none', 
                                background: activeTab === 'omnichannel' ? '#F0F9FF' : 'transparent', 
                                color: activeTab === 'omnichannel' ? '#0284C7' : '#475569', 
                                cursor: 'pointer', fontWeight: 700, fontSize: '15px',
                                display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s',
                                boxShadow: activeTab === 'omnichannel' ? 'inset 2px 0 0 0 #004797' : 'none'
                            }}
                            onMouseOver={e => { if (activeTab !== 'omnichannel') { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; } }}
                            onMouseOut={e => { if (activeTab !== 'omnichannel') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; } }}
                        >
                            <MessageCircle size={18} color={activeTab === 'omnichannel' ? '#004797' : '#94A3B8'} /> Omnichannel (API)
                        </button>
                    </div>

                    {/* Main Content Area */}
                    <div style={{ background: '#ffffff', borderRadius: '24px', padding: '32px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} autoComplete="off">
                            
                            {activeTab === 'general' && (
                                <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                                    <div style={{ marginBottom: '24px' }}>
                                        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: '0 0 8px 0' }}>Datos de la Empresa</h2>
                                        <p style={{ margin: 0, color: '#64748B', fontSize: '14px' }}>Información básica visible en recibos y reportes.</p>
                                    </div>
                            
                                    <div style={{ position: 'relative', marginBottom: '32px' }}>
                                        <label style={labelStyle}>Nombre de la Tienda / Empresa *</label>
                                        <div style={{ position: 'relative' }}>
                                            <div style={iconWrapperStyle}><Store size={18} /></div>
                                            <input
                                                type="text"
                                                value={data.nombre_sitio}
                                                onChange={e => setData('nombre_sitio', e.target.value)}
                                                style={inputStyle}
                                                onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                                required
                                            />
                                        </div>
                                        {errors.nombre_sitio && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', fontWeight: 600 }}>{errors.nombre_sitio}</div>}
                                    </div>

                                    <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '32px' }}>
                                        <div style={{ marginBottom: '24px' }}>
                                            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: '0 0 8px 0' }}>Configuración Financiera (ERP/POS)</h2>
                                            <p style={{ margin: 0, color: '#64748B', fontSize: '14px' }}>Moneda predeterminada e impuestos para ventas.</p>
                                        </div>
                                        
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                                            <div style={{ position: 'relative' }}>
                                                <label style={labelStyle}>Moneda Principal</label>
                                                <div style={{ position: 'relative' }}>
                                                    <div style={iconWrapperStyle}><DollarSign size={18} /></div>
                                                    <select 
                                                        style={{ ...inputStyle, paddingLeft: '44px', appearance: 'none', cursor: 'pointer' }}
                                                        onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                                    >
                                                        <option value="PEN">Soles (PEN)</option>
                                                        <option value="USD">Dólares (USD)</option>
                                                    </select>
                                                    <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748B' }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ position: 'relative' }}>
                                                <label style={labelStyle}>Impuesto Base (IGV %)</label>
                                                <div style={{ position: 'relative' }}>
                                                    <div style={iconWrapperStyle}><Percent size={18} /></div>
                                                    <input 
                                                        type="number" 
                                                        value={data.igv_porcentaje} 
                                                        onChange={e => setData('igv_porcentaje', e.target.value)} 
                                                        style={inputStyle}
                                                        onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }} 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#F8FAFC', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#ffffff'; }} onMouseOut={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; }}>
                                                <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px', accentColor: '#004797' }} />
                                                <span style={{ color: '#1E293B', fontWeight: 600, fontSize: '15px' }}>Activar Punto de Venta (POS) Físico</span>
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#F8FAFC', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#ffffff'; }} onMouseOut={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; }}>
                                                <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px', accentColor: '#004797' }} />
                                                <span style={{ color: '#1E293B', fontWeight: 600, fontSize: '15px' }}>Emitir Facturación Electrónica Automática (SUNAT)</span>
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#F8FAFC', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#ffffff'; }} onMouseOut={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; }}>
                                                <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px', accentColor: '#004797' }} />
                                                <span style={{ color: '#1E293B', fontWeight: 600, fontSize: '15px' }}>Notificar al Administrador sobre Stock Bajo</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {activeTab === 'omnichannel' && (
                                <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                                    <div style={{ marginBottom: '32px' }}>
                                        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            Credenciales WhatsApp Cloud API <span style={{ background: '#25D366', color: '#ffffff', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Meta</span>
                                        </h2>
                                        <p style={{ fontSize: '14px', color: '#64748B', margin: 0, lineHeight: '1.5' }}>
                                            Configura los tokens de acceso provistos por Meta for Developers para habilitar las respuestas automáticas y el Inbox Omnichannel.
                                        </p>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <div style={{ position: 'relative' }}>
                                            <label style={labelStyle}>WhatsApp Access Token *</label>
                                            <div style={{ position: 'relative' }}>
                                                <div style={iconWrapperStyle}><Key size={18} /></div>
                                                <input
                                                    type="password"
                                                    value={data.whatsapp_token}
                                                    onChange={e => setData('whatsapp_token', e.target.value)}
                                                    style={inputStyle}
                                                    onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                                    placeholder="EAAI..."
                                                />
                                            </div>
                                            <small style={{ color: '#94A3B8', marginTop: '6px', display: 'block', fontSize: '12px' }}>El token temporal o permanente generado en la consola de Meta.</small>
                                        </div>
                                        
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                            <div style={{ position: 'relative' }}>
                                                <label style={labelStyle}>Phone Number ID *</label>
                                                <div style={{ position: 'relative' }}>
                                                    <div style={iconWrapperStyle}><Smartphone size={18} /></div>
                                                    <input
                                                        type="text"
                                                        value={data.whatsapp_phone_number_id}
                                                        onChange={e => setData('whatsapp_phone_number_id', e.target.value)}
                                                        style={inputStyle}
                                                        onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                                        placeholder="Identificador del número"
                                                    />
                                                </div>
                                            </div>
                                            <div style={{ position: 'relative' }}>
                                                <label style={labelStyle}>Verify Token (Webhook) *</label>
                                                <div style={{ position: 'relative' }}>
                                                    <div style={iconWrapperStyle}><LinkIcon size={18} /></div>
                                                    <input
                                                        type="text"
                                                        value={data.whatsapp_verify_token}
                                                        onChange={e => setData('whatsapp_verify_token', e.target.value)}
                                                        style={inputStyle}
                                                        onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                                        placeholder="Ej: miclavesecreta"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div style={{ position: 'relative' }}>
                                            <label style={labelStyle}>App Secret <span style={{ color: '#94A3B8', fontWeight: 500 }}>(Opcional)</span></label>
                                            <div style={{ position: 'relative' }}>
                                                <div style={iconWrapperStyle}><Lock size={18} /></div>
                                                <input
                                                    type="password"
                                                    value={data.whatsapp_app_secret}
                                                    onChange={e => setData('whatsapp_app_secret', e.target.value)}
                                                    style={inputStyle}
                                                    onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                                                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }}
                                                    placeholder="Para validación SHA256"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Botonera Fija */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '24px', borderTop: '1px solid #E2E8F0' }}>
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
                                    {processing ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                <style>{`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(5px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}</style>
            </div>
        </AdminLayout>
    );
}
