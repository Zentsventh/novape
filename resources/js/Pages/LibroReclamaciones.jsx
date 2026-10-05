import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function LibroReclamaciones() {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        tipo_documento: 'DNI',
        numero_documento: '',
        nombres: '',
        apellidos: '',
        telefono: '',
        email: '',
        tipo_reclamo: 'Reclamo',
        detalle: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/libro-de-reclamaciones', {
            onSuccess: () => reset(),
        });
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '60px 20px' }}>
            <Head title="Libro de Reclamaciones" />
            
            <div style={{ maxWidth: '700px', margin: '0 auto', background: 'white', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                <div style={{ background: 'var(--color-primary, #0073D8)', padding: 'clamp(1rem, 4vw, 2.5rem) clamp(0.75rem, 3vw, 1.875rem)', textAlign: 'center', color: 'white' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>Libro de Reclamaciones</h1>
                    <p style={{ margin: '10px 0 0', opacity: 0.9, fontSize: '15px' }}>Conforme a lo establecido en el Código de Protección y Defensa del Consumidor</p>
                </div>

                <div style={{ padding: 'clamp(1rem, 4vw, 2.5rem) clamp(0.75rem, 3vw, 1.875rem)' }}>
                    {flash?.success && (
                        <div style={{ background: '#dcfce7', color: '#166534', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontWeight: '500' }}>
                            {flash.success}
                        </div>
                    )}

                    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 16rem), 1fr))', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Nombres</label>
                                <input type="text" value={data.nombres} onChange={e => setData('nombres', e.target.value)} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                                {errors.nombres && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.nombres}</div>}
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Apellidos</label>
                                <input type="text" value={data.apellidos} onChange={e => setData('apellidos', e.target.value)} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                                {errors.apellidos && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.apellidos}</div>}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 16rem), 1fr))', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Documento</label>
                                <select value={data.tipo_documento} onChange={e => setData('tipo_documento', e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>
                                    <option>DNI</option>
                                    <option>CE</option>
                                    <option>Pasaporte</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>N° Documento</label>
                                <input type="text" value={data.numero_documento} onChange={e => setData('numero_documento', e.target.value)} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 16rem), 1fr))', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Teléfono / Celular</label>
                                <input type="tel" value={data.telefono} onChange={e => setData('telefono', e.target.value)} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Correo Electrónico</label>
                                <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '10px 0' }} />

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '12px' }}>Tipo de Solicitud</label>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input type="radio" name="tipo_reclamo" value="Reclamo" checked={data.tipo_reclamo === 'Reclamo'} onChange={e => setData('tipo_reclamo', e.target.value)} style={{ accentColor: 'var(--color-primary)' }} />
                                    <span style={{ fontSize: '14px', color: '#334155' }}>Reclamo</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input type="radio" name="tipo_reclamo" value="Queja" checked={data.tipo_reclamo === 'Queja'} onChange={e => setData('tipo_reclamo', e.target.value)} style={{ accentColor: 'var(--color-primary)' }} />
                                    <span style={{ fontSize: '14px', color: '#334155' }}>Queja</span>
                                </label>
                            </div>
                            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '10px' }}>
                                <strong>Reclamo:</strong> Disconformidad relacionada a los productos o servicios.<br/>
                                <strong>Queja:</strong> Disconformidad no relacionada a los productos o servicios (ej. atención).
                            </p>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Detalle de la solicitud</label>
                            <textarea value={data.detalle} onChange={e => setData('detalle', e.target.value)} required rows="5" style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }} placeholder="Describa los detalles de su reclamo o queja aquí..."></textarea>
                        </div>

                        <button type="submit" disabled={processing} style={{ width: '100%', padding: '14px', background: 'var(--color-primary, #0073D8)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: processing ? 'not-allowed' : 'pointer', opacity: processing ? 0.7 : 1, transition: 'background 0.2s' }}>
                            {processing ? 'Enviando...' : 'Enviar Solicitud'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
