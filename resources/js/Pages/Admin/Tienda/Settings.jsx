import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { Store, ShieldCheck, MapPin, CheckCircle, AlertCircle, FileText, Settings2, Plus, Trash2, ChevronDown, ChevronRight, Save } from 'lucide-react';

const labels = { 
    contact_hours: 'Horario de atención', 
    telefono_contacto: 'Teléfono de atención', 
    email_contacto: 'Correo de atención', 
    facebook_url: 'Perfil de Facebook', 
    instagram_url: 'Perfil de Instagram', 
    pickup_hours: 'Horario de retiro', 
    delivery_eta: 'Plazos de entrega', 
    return_policy: 'Condiciones y plazos de devoluciones', 
    business_identity: 'Razón social, RUC y domicilio del negocio' 
};

const pagesLabels = { 
    nosotros: 'Quiénes somos', 
    'trabaja-con-nosotros': 'Trabaja con nosotros', 
    terminos: 'Términos y condiciones', 
    privacidad: 'Privacidad', 
    ayuda: 'Centro de ayuda', 
    devoluciones: 'Devoluciones', 
    faq: 'Preguntas frecuentes' 
};

const businessRules = {
    store_max_quantity: 'Máximo de unidades por opción',
    store_minimum_payment: 'Importe final mínimo (S/)',
    store_free_shipping_threshold: 'Umbral de envío gratis (S/)',
    store_shipping_base: 'Tarifa base de entrega (S/)',
    store_shipping_extra_kg: 'Adicional por kg después del primero (S/)',
    store_delivery_min_days: 'Entrega estimada mínima (días hábiles)',
    store_delivery_max_days: 'Entrega estimada máxima (días hábiles)',
    store_return_window_days: 'Ventana de devolución (días calendario)'
};

export default function Settings({ settings, pickupWarehouse }) {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors } = useForm(settings);
    const [openPage, setOpenPage] = useState(null);

    const updateSection = (slug, i, key, value) => {
        setData('pages', { 
            ...data.pages, 
            [slug]: data.pages[slug].map((section, index) => index === i ? { ...section, [key]: value } : section) 
        });
    };

    const Card = ({ title, icon: Icon, children, description }) => (
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)', marginBottom: '32px', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} color="#004797" />
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1E293B', letterSpacing: '-0.01em' }}>{title}</h2>
                    {description && <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748B', lineHeight: '1.4' }}>{description}</p>}
                </div>
            </div>
            <div style={{ padding: '28px 24px' }}>
                {children}
            </div>
        </div>
    );

    const InputField = ({ label, id, value, onChange, error, type = "text", ...props }) => {
        const baseStyle = {
            width: '100%', 
            padding: '10px 16px', 
            borderRadius: '8px', 
            border: `1px solid ${error ? '#EF4444' : '#CBD5E1'}`, 
            fontSize: '14px', 
            color: '#1E293B',
            outline: 'none', 
            transition: 'all 0.2s ease', 
            background: '#ffffff',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)',
            fontFamily: 'inherit'
        };

        return (
            <div style={{ marginBottom: '20px' }}>
                <label htmlFor={id} style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#334155', marginBottom: '8px' }}>{label}</label>
                {type === 'textarea' ? (
                    <textarea 
                        id={id} value={value} onChange={onChange} 
                        style={{ ...baseStyle, resize: 'vertical', minHeight: '80px' }} 
                        onFocus={(e) => !error && (e.target.style.borderColor = '#004797', e.target.style.boxShadow = '0 0 0 3px rgba(0, 71, 151, 0.1)')}
                        onBlur={(e) => !error && (e.target.style.borderColor = '#CBD5E1', e.target.style.boxShadow = '0 1px 2px rgba(15, 23, 42, 0.02)')}
                        {...props} 
                    />
                ) : (
                    <input 
                        type={type} id={id} value={value} onChange={onChange} 
                        style={baseStyle} 
                        onFocus={(e) => !error && (e.target.style.borderColor = '#004797', e.target.style.boxShadow = '0 0 0 3px rgba(0, 71, 151, 0.1)')}
                        onBlur={(e) => !error && (e.target.style.borderColor = '#CBD5E1', e.target.style.boxShadow = '0 1px 2px rgba(15, 23, 42, 0.02)')}
                        {...props} 
                    />
                )}
                {error && <span style={{ color: '#DC2626', fontSize: '13px', marginTop: '6px', display: 'block', fontWeight: '500' }}>{error}</span>}
            </div>
        );
    };

    return (
        <AdminLayout>
            <Head title="Información de la tienda" />
            
            <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
                <form onSubmit={e => { e.preventDefault(); post('/admin/tienda/configuracion'); }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                        <div>
                            <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 8px', fontSize: '24px', fontWeight: '700', color: '#0F172A', letterSpacing: '-0.02em' }}>
                                <Settings2 size={28} color="#004797" /> 
                                Información Comercial
                            </h1>
                            <p style={{ color: '#64748B', fontSize: '15px', margin: 0, lineHeight: '1.5' }}>
                                Configura los parámetros operativos, reglas de negocio y el CMS de tu tienda.
                            </p>
                        </div>
                        <button type="submit" disabled={processing} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#004797', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.7 : 1, transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 71, 151, 0.1), 0 2px 4px -1px rgba(0, 71, 151, 0.06)' }}>
                            <Save size={18} /> {processing ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>

                    {flash?.success && (
                        <div style={{ background: '#F0FDF4', color: '#166534', padding: '16px 20px', borderRadius: '10px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500', border: '1px solid #BBF7D0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                            <CheckCircle size={20} color="#15803D" /> {flash.success}
                        </div>
                    )}

                    {Object.values(errors).length > 0 && (
                        <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '20px', borderRadius: '10px', marginBottom: '32px', display: 'flex', alignItems: 'flex-start', gap: '16px', border: '1px solid #FECACA', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                            <AlertCircle size={24} style={{ flexShrink: 0, marginTop: '2px', color: '#DC2626' }} />
                            <div>
                                <p style={{ margin: '0 0 10px 0', fontWeight: '600', fontSize: '15px', color: '#7F1D1D' }}>Por favor, corrige los siguientes errores:</p>
                                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: '1.6', color: '#991B1B' }}>
                                    {Object.entries(errors).map(([key, value]) => <li key={key}>{value}</li>)}
                                </ul>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '32px', alignItems: 'start' }}>
                        
                        {/* Columna Principal */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <Card title="Identidad Corporativa" icon={Store} description="Información visible para los clientes en la tienda y comunicaciones oficiales.">
                                <InputField label={labels.business_identity} id="business_identity" value={data.business_identity} onChange={e => setData('business_identity', e.target.value)} error={errors.business_identity} type="textarea" />
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0 24px' }}>
                                    <InputField label={labels.email_contacto} id="email_contacto" value={data.email_contacto} onChange={e => setData('email_contacto', e.target.value)} error={errors.email_contacto} />
                                    <InputField label={labels.telefono_contacto} id="telefono_contacto" value={data.telefono_contacto} onChange={e => setData('telefono_contacto', e.target.value)} error={errors.telefono_contacto} />
                                    <InputField label={labels.facebook_url} id="facebook_url" value={data.facebook_url} onChange={e => setData('facebook_url', e.target.value)} error={errors.facebook_url} />
                                    <InputField label={labels.instagram_url} id="instagram_url" value={data.instagram_url} onChange={e => setData('instagram_url', e.target.value)} error={errors.instagram_url} />
                                </div>
                            </Card>

                            <Card title="Logística y Devoluciones" icon={ShieldCheck} description="Políticas legales y parámetros logísticos mostrados al cliente.">
                                <InputField label={labels.delivery_eta} id="delivery_eta" value={data.delivery_eta} onChange={e => setData('delivery_eta', e.target.value)} error={errors.delivery_eta} type="textarea" />
                                <InputField label={labels.return_policy} id="return_policy" value={data.return_policy} onChange={e => setData('return_policy', e.target.value)} error={errors.return_policy} type="textarea" rows={4} />
                                
                                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '24px', marginTop: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
                                        <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                                            <MapPin size={20} color="#475569" />
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#1E293B' }}>Punto de Retiro en Tienda</h3>
                                            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748B', lineHeight: '1.5' }}>
                                                {pickupWarehouse ? (
                                                    <span style={{ color: '#334155', fontWeight: '500' }}>{pickupWarehouse.nombre} <br/><span style={{ fontWeight: '400', color: '#64748B' }}>{pickupWarehouse.direccion}</span></span>
                                                ) : (
                                                    <span style={{ color: '#DC2626' }}>No configurado. Asigna el almacén en la configuración.</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <InputField label={labels.pickup_hours} id="pickup_hours" value={data.pickup_hours} onChange={e => setData('pickup_hours', e.target.value)} error={errors.pickup_hours} />
                                    
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginTop: '8px', padding: '12px', background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '8px', transition: 'border-color 0.2s' }}>
                                        <input type="checkbox" checked={data.pickup_enabled} onChange={e => setData('pickup_enabled', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#004797', cursor: 'pointer' }} />
                                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>Habilitar retiro en esta sede para los clientes</span>
                                    </label>
                                    {errors.pickup_enabled && <p style={{ color: '#DC2626', fontSize: '13px', margin: '8px 0 0' }}>{errors.pickup_enabled}</p>}
                                </div>
                            </Card>

                            <Card title="Páginas del Sistema (CMS)" icon={FileText} description="Redacta y organiza el contenido estático de tu tienda online.">
                                <div style={{ border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden', background: '#F8FAFC' }}>
                                    {Object.entries(pagesLabels).map(([slug, label], idx) => {
                                        const isOpen = openPage === slug;
                                        return (
                                            <div key={slug} style={{ borderBottom: idx !== Object.entries(pagesLabels).length - 1 ? '1px solid #E2E8F0' : 'none' }}>
                                                <button type="button" onClick={() => setOpenPage(isOpen ? null : slug)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', background: isOpen ? '#F1F5F9' : '#ffffff', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }}>
                                                    <span style={{ fontSize: '15px', fontWeight: '600', color: '#1E293B' }}>
                                                        {label} <span style={{ color: '#94A3B8', fontWeight: '400', fontSize: '13px', marginLeft: '6px' }}>({data.pages[slug]?.length || 0} secciones)</span>
                                                    </span>
                                                    {isOpen ? <ChevronDown size={18} color="#64748B" /> : <ChevronRight size={18} color="#64748B" />}
                                                </button>
                                                
                                                {isOpen && (
                                                    <div style={{ padding: '24px', background: '#ffffff', borderTop: '1px solid #E2E8F0' }}>
                                                        {data.pages[slug].map((section, i) => (
                                                            <div key={i} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '24px', marginBottom: '20px', position: 'relative', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        <div style={{ background: '#E2E8F0', color: '#475569', fontSize: '12px', fontWeight: '700', padding: '4px 8px', borderRadius: '6px' }}>SECCIÓN {i + 1}</div>
                                                                    </div>
                                                                    <button type="button" onClick={() => setData('pages', { ...data.pages, [slug]: data.pages[slug].filter((_, index) => index !== i) })} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', padding: '6px 12px', borderRadius: '6px', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#FEE2E2'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                                                        <Trash2 size={16} /> Eliminar
                                                                    </button>
                                                                </div>
                                                                <InputField label="Título (Opcional)" value={section.heading} onChange={e => updateSection(slug, i, 'heading', e.target.value)} required maxLength={150} />
                                                                <InputField label="Contenido HTML o Texto enriquecido" type="textarea" value={section.body} onChange={e => updateSection(slug, i, 'body', e.target.value)} required maxLength={10000} rows={5} />
                                                            </div>
                                                        ))}
                                                        <button type="button" onClick={() => setData('pages', { ...data.pages, [slug]: [...data.pages[slug], { heading: '', body: '' }] })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '14px', background: '#F1F5F9', border: '1px dashed #CBD5E1', borderRadius: '10px', color: '#475569', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.borderColor = '#94A3B8'; }} onMouseOut={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#CBD5E1'; }}>
                                                            <Plus size={18} /> Añadir nueva sección de contenido
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        </div>

                        {/* Columna Lateral (Reglas de Compra) */}
                        <div style={{ position: 'sticky', top: '24px' }}>
                            <Card title="Reglas de Negocio" icon={Settings2} description="Límites financieros y operativos del carrito.">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {Object.entries(businessRules).map(([key, label]) => (
                                        <div key={key}>
                                            <label htmlFor={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                                                {label.replace(' (S/)', '').replace(' (días hábiles)', '').replace(' (días calendario)', '')}
                                                {(label.includes('(S/)') || label.includes('(días hábiles)') || label.includes('(días calendario)')) && (
                                                    <span style={{ color: '#94A3B8', fontWeight: '400' }}>
                                                        {label.includes('(S/)') ? 'Soles' : label.includes('hábiles') ? 'Días' : 'Días'}
                                                    </span>
                                                )}
                                            </label>
                                            <input 
                                                required type="number" id={key} step={key.includes('shipping') || key.includes('payment') ? '0.01' : '1'} min="0" 
                                                value={data[key]} onChange={e => setData(key, e.target.value)} 
                                                style={{ width: '100%', padding: '10px 16px', borderRadius: '8px', border: `1px solid ${errors[key] ? '#EF4444' : '#CBD5E1'}`, fontSize: '14px', color: '#1E293B', outline: 'none', background: '#ffffff', transition: 'all 0.2s ease', boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)' }} 
                                                onFocus={(e) => !errors[key] && (e.target.style.borderColor = '#004797', e.target.style.boxShadow = '0 0 0 3px rgba(0, 71, 151, 0.1)')}
                                                onBlur={(e) => !errors[key] && (e.target.style.borderColor = '#CBD5E1', e.target.style.boxShadow = '0 1px 2px rgba(15, 23, 42, 0.02)')}
                                            />
                                            {errors[key] && <span style={{ color: '#DC2626', fontSize: '13px', marginTop: '6px', display: 'block', fontWeight: '500' }}>{errors[key]}</span>}
                                        </div>
                                    ))}

                                    <div style={{ height: '1px', background: '#E2E8F0', margin: '4px 0' }} />
                                    
                                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', padding: '12px', borderRadius: '8px', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#F8FAFC'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                        <input type="checkbox" checked={data.envio_gratis} onChange={e => setData('envio_gratis', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#004797', marginTop: '2px', cursor: 'pointer' }} />
                                        <span style={{ fontSize: '13px', color: '#334155', lineHeight: '1.5', fontWeight: '500' }}>Habilitar envío gratis automático al superar el umbral definido</span>
                                    </label>
                                    
                                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', padding: '12px', borderRadius: '8px', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#F8FAFC'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                        <input type="checkbox" checked={data.store_coupon_points_combinable} onChange={e => setData('store_coupon_points_combinable', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#004797', marginTop: '2px', cursor: 'pointer' }} />
                                        <span style={{ fontSize: '13px', color: '#334155', lineHeight: '1.5', fontWeight: '500' }}>Permitir combinar cupones y puntos de lealtad en la misma orden</span>
                                    </label>
                                </div>
                                
                                <div style={{ marginTop: '32px', padding: '16px', background: '#F8FAFC', borderRadius: '10px', fontSize: '13px', color: '#64748B', lineHeight: '1.6', border: '1px solid #E2E8F0' }}>
                                    <span style={{ fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Auditoría de Cambios</span>
                                    Las nuevas reglas aplicarán inmediatamente a los carritos activos. Los pedidos históricos ya facturados no sufrirán recálculos retroactivos.
                                </div>
                            </Card>
                        </div>

                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
