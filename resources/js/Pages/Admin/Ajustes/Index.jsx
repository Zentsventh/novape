import React, { useEffect } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';

export default function Index({ configuraciones }) {
    const { flash } = usePage().props;
    const [activeTab, setActiveTab] = React.useState('general');
    
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
            alert(flash.success); // Puedes reemplazar esto con tu componente de Toast/Notificación
        }
        if (flash?.error) {
            alert(flash.error);
        }
    }, [flash]);

    return (
        <AdminLayout logoUrl={configuraciones?.logo_url || ''}>
            <Head title="Ajustes Generales" />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Ajustes del Sistema</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button 
                        onClick={() => setActiveTab('general')}
                        style={{ padding: '12px 20px', textAlign: 'left', borderRadius: '8px', border: 'none', background: activeTab === 'general' ? '#1d4ed8' : 'transparent', color: activeTab === 'general' ? 'white' : 'var(--admin-text-main)', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Configuración General
                    </button>
                    <button 
                        onClick={() => setActiveTab('omnichannel')}
                        style={{ padding: '12px 20px', textAlign: 'left', borderRadius: '8px', border: 'none', background: activeTab === 'omnichannel' ? '#1d4ed8' : 'transparent', color: activeTab === 'omnichannel' ? 'white' : 'var(--admin-text-main)', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Omnichannel (WhatsApp)
                    </button>
                </div>

                <div style={{ background: 'var(--admin-bg-panel)', borderRadius: '12px', padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', maxWidth: '800px' }}>
                    <form onSubmit={submit} style={{ display: 'grid', gap: '25px' }}>
                        {activeTab === 'general' && (
                            <>
                                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--admin-text-main)', borderBottom: '1px solid var(--admin-border)', paddingBottom: '10px', marginBottom: '20px' }}>
                                    Configuración General
                                </h2>
                        
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Nombre de la Tienda / Empresa *</label>
                            <input
                                type="text"
                                value={data.nombre_sitio}
                                onChange={e => setData('nombre_sitio', e.target.value)}
                                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }}
                                required
                            />
                            {errors.nombre_sitio && <div style={{ color: '#3b82f6', fontSize: '12px', marginTop: '4px' }}>{errors.nombre_sitio}</div>}
                        </div>
                        <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '20px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--admin-text-main)', marginBottom: '15px' }}>Configuración ERP y POS</h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Moneda Principal</label>
                                    <select style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent' }}>
                                        <option value="PEN">Soles (PEN)</option>
                                        <option value="USD">Dólares (USD)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Impuesto Base (IGV %)</label>
                                    <input 
                                        type="number" 
                                        value={data.igv_porcentaje} 
                                        onChange={e => setData('igv_porcentaje', e.target.value)} 
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent' }} 
                                    />
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                    <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px' }} />
                                    <span style={{ color: 'var(--admin-text-main)' }}>Activar Punto de Venta (POS) Físico</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                    <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px' }} />
                                    <span style={{ color: 'var(--admin-text-main)' }}>Emitir Facturación Electrónica Automática (SUNAT)</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                    <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px' }} />
                                    <span style={{ color: 'var(--admin-text-main)' }}>Notificar al Administrador sobre Stock Bajo</span>
                                </label>
                            </div>
                                </div>
                            </>
                        )}
                        
                        {activeTab === 'omnichannel' && (
                            <>
                                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--admin-text-main)', borderBottom: '1px solid var(--admin-border)', paddingBottom: '10px', marginBottom: '20px' }}>
                                    Credenciales WhatsApp Cloud API (Meta)
                                </h2>
                                
                                <p style={{ fontSize: '14px', color: 'var(--admin-text-light)', marginBottom: '15px' }}>
                                    Configura los tokens de acceso provistos por Meta for Developers para activar el Inbox Omnichannel.
                                </p>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>WhatsApp Access Token *</label>
                                    <input
                                        type="password"
                                        value={data.whatsapp_token}
                                        onChange={e => setData('whatsapp_token', e.target.value)}
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }}
                                    />
                                    <small style={{ color: 'var(--admin-text-light)', marginTop: '5px', display: 'block' }}>El token temporal o permanente de Meta.</small>
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Phone Number ID *</label>
                                        <input
                                            type="text"
                                            value={data.whatsapp_phone_number_id}
                                            onChange={e => setData('whatsapp_phone_number_id', e.target.value)}
                                            style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Verify Token (Webhook) *</label>
                                        <input
                                            type="text"
                                            value={data.whatsapp_verify_token}
                                            onChange={e => setData('whatsapp_verify_token', e.target.value)}
                                            style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }}
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>App Secret (Opcional - para validación SHA256)</label>
                                    <input
                                        type="password"
                                        value={data.whatsapp_app_secret}
                                        onChange={e => setData('whatsapp_app_secret', e.target.value)}
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)' }}
                                    />
                                </div>
                            </>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid var(--admin-border)' }}>
                            <button
                                type="submit"
                                disabled={processing}
                                style={{
                                    background: '#1d4ed8',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 30px',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: processing ? 'not-allowed' : 'pointer',
                                    opacity: processing ? 0.7 : 1,
                                    boxShadow: '0 4px 10px rgba(29, 78, 216, 0.3)'
                                }}
                            >
                                {processing ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
