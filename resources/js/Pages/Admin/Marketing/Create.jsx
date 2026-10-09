import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Mail, ArrowLeft, Target, Save, Info, Users } from 'lucide-react';

export default function MarketingCreate({ stats = {} }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        subject: '',
        segment: 'all',
        content: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.marketing.campaigns.store'));
    };

    const audienceSize = stats[data.segment] || 0;

    return (
        <AdminLayout>
            <Head title="Nueva Campaña" />
            
            <style>{`
                .premium-card {
                    background: #ffffff;
                    border: 1px solid #E2E8F0;
                    border-radius: 12px;
                    padding: 24px;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
                }
                .premium-card:hover {
                    box-shadow: 0 12px 24px -8px rgba(0, 71, 151, 0.08);
                    border-color: #CBD5E1;
                }
                .primary-btn {
                    background: #004797;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 4px rgba(0, 71, 151, 0.2);
                }
                .primary-btn:hover:not(:disabled) {
                    background: #003675;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(0, 71, 151, 0.3);
                }
                .primary-btn:disabled {
                    background: #94A3B8;
                    cursor: not-allowed;
                    box-shadow: none;
                }
                .back-btn {
                    color: #64748B;
                    background: #F1F5F9;
                    padding: 8px;
                    border-radius: 8px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }
                .back-btn:hover {
                    background: #E2E8F0;
                    color: #1E293B;
                    transform: translateX(-2px);
                }
                .premium-input {
                    width: 100%;
                    padding: 12px 14px;
                    border-radius: 8px;
                    border: 1px solid #E2E8F0;
                    background: #F8FAFC;
                    color: #1E293B;
                    font-size: 14px;
                    transition: all 0.2s ease;
                    font-family: inherit;
                }
                .premium-input:focus {
                    outline: none;
                    border-color: #004797;
                    background: #ffffff;
                    box-shadow: 0 0 0 3px rgba(0, 71, 151, 0.1);
                }
                .premium-input::placeholder {
                    color: #94A3B8;
                }
                .premium-label {
                    display: block;
                    font-size: 13px;
                    font-weight: 700;
                    color: #475569;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .error-text {
                    color: #EF4444;
                    font-size: 13px;
                    margin-top: 6px;
                    display: block;
                    font-weight: 500;
                }
                .audience-box {
                    background: rgba(0, 71, 151, 0.04);
                    border: 1px solid rgba(0, 71, 151, 0.1);
                    border-radius: 10px;
                    padding: 20px;
                    margin-top: 24px;
                    transition: all 0.3s ease;
                    text-align: center;
                }
                .audience-box:hover {
                    background: rgba(0, 71, 151, 0.06);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px -4px rgba(0, 71, 151, 0.1);
                }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link href={route('admin.marketing.campaigns')} className="back-btn">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1E293B', margin: 0, letterSpacing: '-0.02em' }}>
                            Nueva Campaña de Email
                        </h1>
                        <p style={{ color: '#64748B', margin: '4px 0 0 0', fontSize: '14px' }}>
                            Redacta y segmenta tu próxima campaña promocional.
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        onClick={handleSubmit} 
                        disabled={processing}
                        className="primary-btn"
                    >
                        <Save size={18} />
                        {processing ? 'Guardando...' : 'Guardar Borrador'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
                {/* Editor Principal */}
                <div className="premium-card">
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: 'rgba(0, 71, 151, 0.08)', padding: '8px', borderRadius: '8px' }}>
                            <Mail size={18} color="#004797" />
                        </div>
                        Contenido del Email
                    </h3>
                    
                    <div style={{ marginBottom: '24px' }}>
                        <label className="premium-label">Nombre Interno de la Campaña</label>
                        <input 
                            type="text" 
                            className="premium-input" 
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            placeholder="Ej. Promoción Verano VIP 2026"
                        />
                        {errors.name && <span className="error-text">{errors.name}</span>}
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label className="premium-label">Asunto del Email</label>
                        <input 
                            type="text" 
                            className="premium-input" 
                            value={data.subject}
                            onChange={e => setData('subject', e.target.value)}
                            placeholder="¡Tenemos una oferta exclusiva esperándote!"
                        />
                        {errors.subject && <span className="error-text">{errors.subject}</span>}
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                        <label className="premium-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Contenido (HTML)
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B', textTransform: 'none', fontWeight: '500', fontSize: '12px' }}>
                                <Info size={14} /> Admite variables como {'{{ nombre }}'}
                            </span>
                        </label>
                        <textarea 
                            className="premium-input" 
                            style={{ minHeight: '320px', fontFamily: '"Fira Code", monospace', lineHeight: '1.6', fontSize: '13px' }}
                            value={data.content}
                            onChange={e => setData('content', e.target.value)}
                            placeholder="<h1>Hola {{ nombre }}</h1>&#10;<p>Tenemos descuentos especiales para ti.</p>"
                        />
                        {errors.content && <span className="error-text">{errors.content}</span>}
                    </div>
                </div>

                {/* Segmentación Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="premium-card">
                        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '8px' }}>
                                <Target size={18} color="#10B981" />
                            </div>
                            Segmentación
                        </h3>

                        <div>
                            <label className="premium-label">Audiencia Objetivo</label>
                            <select 
                                className="premium-input" 
                                style={{ cursor: 'pointer' }}
                                value={data.segment}
                                onChange={e => setData('segment', e.target.value)}
                            >
                                <option value="all">Todos los Clientes ({stats.all || 0})</option>
                                <option value="vip">Clientes VIP (Más de 5 compras)</option>
                                <option value="at_risk">En Riesgo (Sin compras &gt; 90 días)</option>
                            </select>
                            {errors.segment && <span className="error-text">{errors.segment}</span>}
                        </div>

                        <div className="audience-box">
                            <Users size={28} color="#004797" style={{ marginBottom: '12px', opacity: 0.8 }} />
                            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                                Alcance Estimado
                            </div>
                            <div style={{ fontSize: '36px', fontWeight: '800', color: '#004797', lineHeight: '1' }}>
                                {audienceSize.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '13px', color: '#64748B', marginTop: '8px', fontWeight: '500' }}>
                                destinatarios
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
