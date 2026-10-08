import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import Header from '../Components/Home/Header';
import Footer from '../Components/Home/Footer';

export default function LibroReclamaciones() {
    const { flash, logoUrl } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        tipo_documento: 'DNI',
        numero_documento: '',
        nombres: '',
        apellidos: '',
        telefono: '',
        email: '',
        direccion: '',
        menor_edad: false,
        nombre_apoderado: '',
        bien_contratado: 'Producto',
        monto_reclamado: '',
        pedido_relacionado: '',
        tipo_reclamo: 'Reclamo',
        detalle: '',
        pedido_consumidor: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/libro-de-reclamaciones', {
            onSuccess: () => reset(),
        });
    };

    const inputStyles = (error) => ({
        width: '100%',
        padding: '12px 16px',
        borderRadius: '10px',
        border: `1px solid ${error ? '#EF4444' : '#E2E8F0'}`,
        fontSize: '15px',
        color: '#1E293B',
        background: '#FFFFFF',
        outline: 'none',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.02)',
        fontFamily: 'inherit',
    });

    const handleFocus = (e, error) => {
        if (!error) {
            e.target.style.borderColor = '#004797';
            e.target.style.boxShadow = '0 0 0 3px rgba(0, 71, 151, 0.1)';
        }
    };

    const handleBlur = (e, error) => {
        if (!error) {
            e.target.style.borderColor = '#E2E8F0';
            e.target.style.boxShadow = '0 1px 2px rgba(15, 23, 42, 0.02)';
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <Head title="Libro de Reclamaciones" />
            <Header minimal={true} logoUrl={logoUrl} />

            <main style={{ flex: '1', display: 'flex', justifyContent: 'center', padding: 'clamp(24px, 5vw, 60px) clamp(12px, 3vw, 20px)', background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)' }}>
                <div style={{ width: '100%', maxWidth: '850px' }}>
                    
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(0, 71, 151, 0.05)', color: '#004797', marginBottom: '24px' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                        </div>
                        <h1 style={{ margin: '0 0 12px 0', fontSize: '32px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.02em' }}>Libro de Reclamaciones</h1>
                        <p style={{ margin: 0, fontSize: '15px', color: '#64748B', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.6' }}>Conforme a lo establecido en el Código de Protección y Defensa del Consumidor, este establecimiento cuenta con un Libro de Reclamaciones Virtual a tu disposición.</p>
                    </div>

                    <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', overflow: 'hidden' }}>
                        
                        <div style={{ padding: 'clamp(16px, 4vw, 40px) clamp(16px, 4vw, 48px)' }}>
                            {flash?.success && (
                                <div style={{ background: '#F0FDF4', color: '#166534', padding: '16px 20px', borderRadius: '12px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500', border: '1px solid #BBF7D0' }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                    {flash.success}
                                </div>
                            )}

                            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                
                                {/* 1. Identificación del Consumidor Reclamante */}
                                <div>
                                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', flexShrink: 0, borderRadius: '50%', background: '#004797', color: 'white', fontSize: '12px', fontWeight: '700' }}>1</span>
                                        Identificación del Consumidor Reclamante
                                    </h2>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Nombres</label>
                                            <input type="text" value={data.nombres} onChange={e => setData('nombres', e.target.value)} onFocus={e => handleFocus(e, errors.nombres)} onBlur={e => handleBlur(e, errors.nombres)} style={inputStyles(errors.nombres)} required />
                                            {errors.nombres && <div style={{ color: '#EF4444', fontSize: '13px', marginTop: '6px', fontWeight: '500' }}>{errors.nombres}</div>}
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Apellidos</label>
                                            <input type="text" value={data.apellidos} onChange={e => setData('apellidos', e.target.value)} onFocus={e => handleFocus(e, errors.apellidos)} onBlur={e => handleBlur(e, errors.apellidos)} style={inputStyles(errors.apellidos)} required />
                                            {errors.apellidos && <div style={{ color: '#EF4444', fontSize: '13px', marginTop: '6px', fontWeight: '500' }}>{errors.apellidos}</div>}
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '20px', marginTop: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Tipo Doc.</label>
                                            <select value={data.tipo_documento} onChange={e => setData('tipo_documento', e.target.value)} onFocus={e => handleFocus(e)} onBlur={e => handleBlur(e)} style={inputStyles()}>
                                                <option>DNI</option>
                                                <option>CE</option>
                                                <option>Pasaporte</option>
                                                <option>RUC</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Número de Documento</label>
                                            <input type="text" value={data.numero_documento} onChange={e => setData('numero_documento', e.target.value)} onFocus={e => handleFocus(e, errors.numero_documento)} onBlur={e => handleBlur(e, errors.numero_documento)} style={inputStyles(errors.numero_documento)} required />
                                            {errors.numero_documento && <div style={{ color: '#EF4444', fontSize: '13px', marginTop: '6px', fontWeight: '500' }}>{errors.numero_documento}</div>}
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '20px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Dirección Completa</label>
                                        <input type="text" value={data.direccion} onChange={e => setData('direccion', e.target.value)} onFocus={e => handleFocus(e, errors.direccion)} onBlur={e => handleBlur(e, errors.direccion)} style={inputStyles(errors.direccion)} placeholder="Av. / Calle / Distrito / Ciudad" required />
                                        {errors.direccion && <div style={{ color: '#EF4444', fontSize: '13px', marginTop: '6px', fontWeight: '500' }}>{errors.direccion}</div>}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px', marginTop: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Teléfono / Celular</label>
                                            <input type="tel" value={data.telefono} onChange={e => setData('telefono', e.target.value)} onFocus={e => handleFocus(e, errors.telefono)} onBlur={e => handleBlur(e, errors.telefono)} style={inputStyles(errors.telefono)} required />
                                            {errors.telefono && <div style={{ color: '#EF4444', fontSize: '13px', marginTop: '6px', fontWeight: '500' }}>{errors.telefono}</div>}
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Correo Electrónico</label>
                                            <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} onFocus={e => handleFocus(e, errors.email)} onBlur={e => handleBlur(e, errors.email)} style={inputStyles(errors.email)} required />
                                            {errors.email && <div style={{ color: '#EF4444', fontSize: '13px', marginTop: '6px', fontWeight: '500' }}>{errors.email}</div>}
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '20px', padding: '16px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={data.menor_edad} onChange={e => setData('menor_edad', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#004797' }} />
                                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>El reclamante es menor de edad</span>
                                        </label>
                                        {data.menor_edad && (
                                            <div style={{ marginTop: '16px' }}>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Nombres y Apellidos del Padre o Apoderado</label>
                                                <input type="text" value={data.nombre_apoderado} onChange={e => setData('nombre_apoderado', e.target.value)} onFocus={e => handleFocus(e, errors.nombre_apoderado)} onBlur={e => handleBlur(e, errors.nombre_apoderado)} style={inputStyles(errors.nombre_apoderado)} required={data.menor_edad} />
                                                {errors.nombre_apoderado && <div style={{ color: '#EF4444', fontSize: '13px', marginTop: '6px', fontWeight: '500' }}>{errors.nombre_apoderado}</div>}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ height: '1px', background: '#F1F5F9' }}></div>

                                {/* 2. Identificación del Bien Contratado */}
                                <div>
                                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', flexShrink: 0, borderRadius: '50%', background: '#004797', color: 'white', fontSize: '12px', fontWeight: '700' }}>2</span>
                                        Identificación del Bien Contratado
                                    </h2>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '12px' }}>Bien Contratado</label>
                                            <div style={{ display: 'flex', gap: '24px' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                    <input type="radio" value="Producto" checked={data.bien_contratado === 'Producto'} onChange={e => setData('bien_contratado', e.target.value)} style={{ width: '16px', height: '16px', accentColor: '#004797' }} />
                                                    <span style={{ fontSize: '14px', color: '#334155', fontWeight: '500' }}>Producto</span>
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                    <input type="radio" value="Servicio" checked={data.bien_contratado === 'Servicio'} onChange={e => setData('bien_contratado', e.target.value)} style={{ width: '16px', height: '16px', accentColor: '#004797' }} />
                                                    <span style={{ fontSize: '14px', color: '#334155', fontWeight: '500' }}>Servicio</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Monto Reclamado (S/)</label>
                                            <input type="number" step="0.01" min="0" value={data.monto_reclamado} onChange={e => setData('monto_reclamado', e.target.value)} onFocus={e => handleFocus(e, errors.monto_reclamado)} onBlur={e => handleBlur(e, errors.monto_reclamado)} style={inputStyles(errors.monto_reclamado)} placeholder="0.00" required />
                                            {errors.monto_reclamado && <div style={{ color: '#EF4444', fontSize: '13px', marginTop: '6px', fontWeight: '500' }}>{errors.monto_reclamado}</div>}
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '20px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Pedido o Boleta Relacionada (Opcional)</label>
                                        <input type="text" value={data.pedido_relacionado} onChange={e => setData('pedido_relacionado', e.target.value)} onFocus={e => handleFocus(e, errors.pedido_relacionado)} onBlur={e => handleBlur(e, errors.pedido_relacionado)} style={inputStyles(errors.pedido_relacionado)} placeholder="Ej: PED-12345 o B001-000123" />
                                    </div>
                                </div>

                                <div style={{ height: '1px', background: '#F1F5F9' }}></div>

                                {/* 3. Detalle del Reclamo y Pedido */}
                                <div>
                                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', flexShrink: 0, borderRadius: '50%', background: '#004797', color: 'white', fontSize: '12px', fontWeight: '700' }}>3</span>
                                        Detalle de la Solicitud
                                    </h2>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '12px' }}>Tipo de Solicitud</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '20px' }}>
                                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                                                <input type="radio" value="Reclamo" checked={data.tipo_reclamo === 'Reclamo'} onChange={e => setData('tipo_reclamo', e.target.value)} style={{ width: '18px', height: '18px', accentColor: '#004797', marginTop: '2px' }} />
                                                <div>
                                                    <span style={{ fontSize: '15px', color: '#0F172A', fontWeight: '600', display: 'block' }}>Reclamo</span>
                                                    <span style={{ fontSize: '13px', color: '#64748B' }}>Disconformidad relacionada a los productos o servicios.</span>
                                                </div>
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                                                <input type="radio" value="Queja" checked={data.tipo_reclamo === 'Queja'} onChange={e => setData('tipo_reclamo', e.target.value)} style={{ width: '18px', height: '18px', accentColor: '#004797', marginTop: '2px' }} />
                                                <div>
                                                    <span style={{ fontSize: '15px', color: '#0F172A', fontWeight: '600', display: 'block' }}>Queja</span>
                                                    <span style={{ fontSize: '13px', color: '#64748B' }}>Disconformidad no relacionada a los productos (ej. atención).</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '24px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Detalle del Reclamo/Queja</label>
                                        <textarea value={data.detalle} onChange={e => setData('detalle', e.target.value)} onFocus={e => handleFocus(e, errors.detalle)} onBlur={e => handleBlur(e, errors.detalle)} required rows="4" style={{ ...inputStyles(errors.detalle), resize: 'vertical' }} placeholder="Describa los detalles de lo sucedido..." />
                                        {errors.detalle && <div style={{ color: '#EF4444', fontSize: '13px', marginTop: '6px', fontWeight: '500' }}>{errors.detalle}</div>}
                                    </div>
                                    <div style={{ marginTop: '20px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Pedido del Consumidor</label>
                                        <textarea value={data.pedido_consumidor} onChange={e => setData('pedido_consumidor', e.target.value)} onFocus={e => handleFocus(e, errors.pedido_consumidor)} onBlur={e => handleBlur(e, errors.pedido_consumidor)} required rows="3" style={{ ...inputStyles(errors.pedido_consumidor), resize: 'vertical' }} placeholder="Especifique lo que solicita (Ej. Devolución del dinero, cambio de producto, etc.)" />
                                        {errors.pedido_consumidor && <div style={{ color: '#EF4444', fontSize: '13px', marginTop: '6px', fontWeight: '500' }}>{errors.pedido_consumidor}</div>}
                                    </div>
                                </div>

                                <div style={{ marginTop: '10px' }}>
                                    <p style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.5', textAlign: 'justify', marginBottom: '24px' }}>
                                        La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI. 
                                        El proveedor deberá dar respuesta al reclamo en un plazo no mayor a quince (15) días hábiles improrrogables.
                                    </p>
                                    <button 
                                        type="submit" 
                                        disabled={processing} 
                                        style={{ 
                                            width: '100%', 
                                            padding: '16px', 
                                            background: '#004797', 
                                            color: '#FFFFFF', 
                                            border: 'none', 
                                            borderRadius: '10px', 
                                            fontSize: '16px', 
                                            fontWeight: '600', 
                                            cursor: processing ? 'not-allowed' : 'pointer', 
                                            opacity: processing ? 0.7 : 1, 
                                            transition: 'all 0.2s ease',
                                            boxShadow: '0 4px 6px -1px rgba(0, 71, 151, 0.2), 0 2px 4px -1px rgba(0, 71, 151, 0.1)'
                                        }}
                                        onMouseOver={e => !processing && (e.currentTarget.style.transform = 'translateY(-1px)', e.currentTarget.style.boxShadow = '0 6px 8px -1px rgba(0, 71, 151, 0.25)')}
                                        onMouseOut={e => !processing && (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 71, 151, 0.2)')}
                                    >
                                        {processing ? 'Enviando Registro...' : 'Enviar Reclamo / Queja Oficial'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
