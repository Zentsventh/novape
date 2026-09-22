import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Mail, ArrowLeft, Target, Send, Save } from 'lucide-react';

export default function MarketingCreate() {
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

    return (
        <AdminLayout>
            <Head title="Nueva Campaña" />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Link href={route('admin.marketing.campaigns')} style={{ color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)', margin: 0 }}>
                            Nueva Campaña de Email
                        </h1>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                        onClick={handleSubmit} 
                        disabled={processing}
                        style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    >
                        <Save size={18} />
                        Guardar Borrador
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                <div style={{ background: 'var(--admin-bg-panel)', padding: '24px', borderRadius: '12px', border: '1px solid var(--admin-border)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: 'var(--admin-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Mail size={20} />
                        Contenido del Email
                    </h3>
                    
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--admin-text-main)' }}>Nombre Interno de la Campaña</label>
                        <input 
                            type="text" 
                            className="admin-input" 
                            style={{ width: '100%' }}
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            placeholder="Ej. Black Friday 2026 - Olla Arrocera"
                        />
                        {errors.name && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.name}</span>}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--admin-text-main)' }}>Asunto del Email</label>
                        <input 
                            type="text" 
                            className="admin-input" 
                            style={{ width: '100%' }}
                            value={data.subject}
                            onChange={e => setData('subject', e.target.value)}
                            placeholder="¡Tenemos una oferta especial para ti!"
                        />
                        {errors.subject && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.subject}</span>}
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--admin-text-main)' }}>Contenido (HTML)</label>
                        <textarea 
                            className="admin-input" 
                            style={{ width: '100%', minHeight: '300px', fontFamily: 'monospace' }}
                            value={data.content}
                            onChange={e => setData('content', e.target.value)}
                            placeholder="<h1>Hola {{ nombre }}</h1><p>Tu oferta exclusiva...</p>"
                        />
                        {errors.content && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.content}</span>}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ background: 'var(--admin-bg-panel)', padding: '24px', borderRadius: '12px', border: '1px solid var(--admin-border)' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: 'var(--admin-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Target size={20} />
                            Segmentación
                        </h3>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: 'var(--admin-text-main)' }}>Audiencia Objetivo</label>
                            <select 
                                className="admin-input" 
                                style={{ width: '100%' }}
                                value={data.segment}
                                onChange={e => setData('segment', e.target.value)}
                            >
                                <option value="all">Todos los Clientes</option>
                                <option value="vip">Clientes VIP (Más de 5 compras)</option>
                                <option value="at_risk">En Riesgo (Sin compras > 90 días)</option>
                            </select>
                            {errors.segment && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.segment}</span>}
                        </div>

                        <div style={{ padding: '16px', background: 'var(--admin-bg-hover)', borderRadius: '8px', marginTop: '16px' }}>
                            <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Tamaño estimado de la audiencia:</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-primary)' }}>
                                {data.segment === 'all' ? 'Calculando...' : data.segment === 'vip' ? 'Clientes VIP' : 'Clientes en Riesgo'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
