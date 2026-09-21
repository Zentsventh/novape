import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import TwentyCrmLayout from '../../../../Layouts/TwentyCrmLayout';
import { Building, Users, Target, CheckSquare, Sparkles, Building2, MapPin, Globe, Phone, Mail, Clock } from 'lucide-react';
import Swal from 'sweetalert2';
import TimelineTab from '../../../../Components/Admin/CRM/TimelineTab';

export default function Show({ company = {}, evidenceLedger = [], customFieldsSchema = [] }) {
    const [activeTab, setActiveTab] = useState('resumen');
    
    const handleResolveEvidence = (id, action, evidence) => {
        router.post(`/admin/crm/settings/evidence/${id}/resolve`, {
            action,
            model_type: evidence.model_type,
            model_id: evidence.model_id,
            field_name: evidence.field_name,
            suggested_value: evidence.suggested_value
        }, {
            preserveScroll: true,
            onSuccess: () => {
                if (action === 'accept') {
                    Swal.fire({
                        toast: true,
                        position: 'bottom-end',
                        icon: 'success',
                        title: 'Sugerencia aceptada y guardada',
                        showConfirmButton: false,
                        timer: 2000
                    });
                }
            }
        });
    };

    return (
        <TwentyCrmLayout title={company.nombre}>
            <Head title={`${company.nombre} - Empresas`} />

            <div style={{ display: 'flex', height: '100%' }}>
                {/* Main Content Area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--twenty-border)', background: 'var(--twenty-background)' }}>
                    
                    {/* Header */}
                    <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--twenty-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                            <div style={{ 
                                width: '48px', height: '48px', 
                                background: 'var(--twenty-background-tertiary)', 
                                borderRadius: '8px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden'
                            }}>
                                {company.logo_url ? (
                                    <img src={company.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <Building2 size={24} color="var(--twenty-text-muted)" />
                                )}
                            </div>
                            <div>
                                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: 'var(--twenty-text-main)' }}>
                                    {company.nombre}
                                </h1>
                                {company.dominio && (
                                    <a href={`https://${company.dominio}`} target="_blank" rel="noreferrer" style={{ color: 'var(--twenty-text-muted)', fontSize: '13px', textDecoration: 'none' }}>
                                        {company.dominio}
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--twenty-border)' }}>
                            <button 
                                onClick={() => setActiveTab('resumen')}
                                style={{ 
                                    background: 'none', border: 'none', padding: '0 0 12px 0', 
                                    color: activeTab === 'resumen' ? 'var(--twenty-primary)' : 'var(--twenty-text-muted)',
                                    fontWeight: activeTab === 'resumen' ? 600 : 500,
                                    borderBottom: activeTab === 'resumen' ? '2px solid var(--twenty-primary)' : '2px solid transparent',
                                    cursor: 'pointer', fontSize: '14px'
                                }}
                            >
                                Resumen
                            </button>
                            <button 
                                onClick={() => setActiveTab('personas')}
                                style={{ 
                                    background: 'none', border: 'none', padding: '0 0 12px 0', 
                                    color: activeTab === 'personas' ? 'var(--twenty-primary)' : 'var(--twenty-text-muted)',
                                    fontWeight: activeTab === 'personas' ? 600 : 500,
                                    borderBottom: activeTab === 'personas' ? '2px solid var(--twenty-primary)' : '2px solid transparent',
                                    cursor: 'pointer', fontSize: '14px'
                                }}
                            >
                                Contactos ({company.personas?.length || 0})
                            </button>
                            <button 
                                onClick={() => setActiveTab('deals')}
                                style={{ 
                                    background: 'none', border: 'none', padding: '0 0 12px 0', 
                                    color: activeTab === 'deals' ? 'var(--twenty-primary)' : 'var(--twenty-text-muted)',
                                    fontWeight: activeTab === 'deals' ? 600 : 500,
                                    borderBottom: activeTab === 'deals' ? '2px solid var(--twenty-primary)' : '2px solid transparent',
                                    cursor: 'pointer', fontSize: '14px'
                                }}
                            >
                                Oportunidades ({company.deals?.length || 0})
                            </button>
                            <button 
                                onClick={() => setActiveTab('actividad')}
                                style={{ 
                                    background: 'none', border: 'none', padding: '0 0 12px 0', 
                                    color: activeTab === 'actividad' ? 'var(--twenty-primary)' : 'var(--twenty-text-muted)',
                                    fontWeight: activeTab === 'actividad' ? 600 : 500,
                                    borderBottom: activeTab === 'actividad' ? '2px solid var(--twenty-primary)' : '2px solid transparent',
                                    cursor: 'pointer', fontSize: '14px'
                                }}
                            >
                                Actividad
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
                        {activeTab === 'resumen' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {/* Basic Info Box */}
                                <div className="twenty-card">
                                    <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: 'var(--twenty-text-main)' }}>Información General</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <div style={{ color: 'var(--twenty-text-muted)', fontSize: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Globe size={12} /> Industria
                                            </div>
                                            <div style={{ color: 'var(--twenty-text-main)', fontSize: '14px' }}>{company.industria || '-'}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--twenty-text-muted)', fontSize: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Users size={12} /> Tamaño
                                            </div>
                                            <div style={{ color: 'var(--twenty-text-main)', fontSize: '14px', textTransform: 'capitalize' }}>{company.tamaño || '-'}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--twenty-text-muted)', fontSize: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Phone size={12} /> Teléfono
                                            </div>
                                            <div style={{ color: 'var(--twenty-text-main)', fontSize: '14px' }}>{company.telefono || '-'}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--twenty-text-muted)', fontSize: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Mail size={12} /> Email
                                            </div>
                                            <div style={{ color: 'var(--twenty-text-main)', fontSize: '14px' }}>{company.email || '-'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Custom Fields (Enriched by AI or manual) */}
                                {customFieldsSchema.length > 0 && (
                                    <div className="twenty-card">
                                        <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: 'var(--twenty-text-main)' }}>Campos Personalizados</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            {customFieldsSchema.map(field => (
                                                <div key={field.id}>
                                                    <div style={{ color: 'var(--twenty-text-muted)', fontSize: '12px', marginBottom: '4px' }}>
                                                        {field.label}
                                                    </div>
                                                    <div style={{ color: 'var(--twenty-text-main)', fontSize: '14px' }}>
                                                        {company.custom_fields && company.custom_fields[field.name] ? company.custom_fields[field.name] : '-'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'personas' && (
                            <div className="twenty-card" style={{ padding: 0, overflow: 'hidden' }}>
                                <table className="twenty-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Email</th>
                                            <th>Teléfono</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {company.personas?.length > 0 ? (
                                            company.personas.map(p => (
                                                <tr key={p.id}>
                                                    <td>
                                                        <Link href={`/admin/clientes/${p.id}`} style={{ color: 'var(--twenty-text-main)', textDecoration: 'none', fontWeight: 500 }}>
                                                            {p.nombres} {p.apellidos}
                                                        </Link>
                                                    </td>
                                                    <td>{p.email}</td>
                                                    <td>{p.telefono || '-'}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" style={{ textAlign: 'center', padding: '32px', color: 'var(--twenty-text-muted)' }}>
                                                    No hay contactos asociados a esta empresa.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'deals' && (
                            <div className="twenty-card" style={{ padding: 0, overflow: 'hidden' }}>
                                <table className="twenty-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>
                                            <th>Oportunidad</th>
                                            <th>Etapa</th>
                                            <th>Valor</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {company.deals?.length > 0 ? (
                                            company.deals.map(d => (
                                                <tr key={d.id}>
                                                    <td>
                                                        <Link href={`/admin/crm/pipeline?search=${encodeURIComponent(d.titulo)}`} style={{ color: 'var(--twenty-text-main)', textDecoration: 'none', fontWeight: 500 }}>
                                                            {d.titulo}
                                                        </Link>
                                                    </td>
                                                    <td>
                                                        <span style={{ background: 'var(--twenty-background-tertiary)', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                                                            {d.stage?.nombre || '-'}
                                                        </span>
                                                    </td>
                                                    <td>S/ {Number(d.valor).toFixed(2)}</td>
                                                    <td>
                                                        {d.estado === 'open' && <span style={{ color: '#eab308' }}>Abierto</span>}
                                                        {d.estado === 'won' && <span style={{ color: '#22c55e' }}>Ganado</span>}
                                                        {d.estado === 'lost' && <span style={{ color: '#ef4444' }}>Perdido</span>}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: 'var(--twenty-text-muted)' }}>
                                                    No hay oportunidades abiertas para esta empresa.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        
                        {activeTab === 'actividad' && (
                            <div className="twenty-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                                <TimelineTab events={company.timeline_events || []} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar - Agent Tab & Activity */}
                <div style={{ width: '350px', background: 'var(--twenty-background-secondary)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--twenty-border)', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--twenty-background)' }}>
                        <Sparkles size={16} color="var(--twenty-primary)" />
                        <span style={{ fontWeight: 600, color: 'var(--twenty-text-main)', fontSize: '14px' }}>CompAI Agent</span>
                    </div>
                    
                    <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
                        {evidenceLedger.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <p style={{ fontSize: '13px', color: 'var(--twenty-text-muted)', margin: '0 0 8px' }}>
                                    El agente ha investigado esta empresa y tiene sugerencias:
                                </p>
                                
                                {evidenceLedger.map(ev => {
                                    const field = customFieldsSchema.find(f => f.name === ev.field_name);
                                    return (
                                        <div key={ev.id} style={{ background: 'var(--twenty-background)', border: '1px solid var(--twenty-border)', borderRadius: '8px', padding: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--twenty-text-main)' }}>
                                                    {field ? field.label : ev.field_name}
                                                </span>
                                                <span style={{ fontSize: '11px', background: 'var(--twenty-background-tertiary)', padding: '2px 6px', borderRadius: '4px', color: 'var(--twenty-text-muted)' }}>
                                                    Confianza: {ev.confidence_score}%
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '13px', color: 'var(--twenty-text-main)', marginBottom: '12px', wordBreak: 'break-all' }}>
                                                {ev.suggested_value}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button 
                                                    onClick={() => handleResolveEvidence(ev.id, 'accept', ev)}
                                                    className="twenty-btn twenty-btn-primary" style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }}
                                                >
                                                    Aceptar
                                                </button>
                                                <button 
                                                    onClick={() => handleResolveEvidence(ev.id, 'reject', ev)}
                                                    className="twenty-btn twenty-btn-secondary" style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }}
                                                >
                                                    Descartar
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--twenty-text-muted)' }}>
                                <Sparkles size={24} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                                <p style={{ margin: 0, fontSize: '13px' }}>El agente de IA no tiene sugerencias pendientes para esta empresa.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </TwentyCrmLayout>
    );
}
