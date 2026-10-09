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

            <style>{`
                .premium-wrapper {
                    display: flex;
                    height: 100%;
                    font-family: inherit;
                    background-color: #F8FAFC;
                }
                .premium-main-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    border-right: 1px solid #E2E8F0;
                    background: #FAFAFA;
                }
                .premium-header-area {
                    padding: 32px 40px 0;
                    background: #FFFFFF;
                    border-bottom: 1px solid #E2E8F0;
                }
                .premium-company-title {
                    font-size: 24px;
                    font-weight: 700;
                    color: #1E293B;
                    margin: 0 0 4px 0;
                    letter-spacing: -0.02em;
                }
                .premium-company-domain {
                    color: #64748B;
                    font-size: 14px;
                    text-decoration: none;
                    transition: color 0.2s ease;
                }
                .premium-company-domain:hover {
                    color: #004797;
                }
                .premium-avatar-container {
                    width: 56px;
                    height: 56px;
                    background: #F1F5F9;
                    border-radius: 12px;
                    border: 1px solid #E2E8F0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                }
                .premium-tabs {
                    display: flex;
                    gap: 28px;
                    margin-top: 24px;
                }
                .premium-tab-btn {
                    background: none;
                    border: none;
                    padding: 0 0 14px 0;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                }
                .premium-tab-btn.active {
                    color: #004797;
                    font-weight: 600;
                }
                .premium-tab-btn:not(.active) {
                    color: #64748B;
                    font-weight: 500;
                }
                .premium-tab-btn:not(.active):hover {
                    color: #1E293B;
                }
                .premium-tab-btn.active::after {
                    content: '';
                    position: absolute;
                    bottom: -1px;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: #004797;
                    border-radius: 2px 2px 0 0;
                }
                .premium-content-area {
                    flex: 1;
                    overflow-y: auto;
                    padding: 32px 40px;
                }
                .premium-card {
                    background: #FFFFFF;
                    border-radius: 12px;
                    border: 1px solid #E2E8F0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02), 0 4px 6px -1px rgba(0,0,0,0.02);
                    padding: 24px;
                    transition: all 0.3s ease;
                }
                .premium-card:hover {
                    box-shadow: 0 4px 6px rgba(0,0,0,0.03), 0 10px 15px -3px rgba(0,0,0,0.03);
                }
                .premium-card-title {
                    margin: 0 0 20px 0;
                    font-size: 15px;
                    font-weight: 600;
                    color: #1E293B;
                }
                .premium-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 20px;
                }
                .premium-field-label {
                    color: #64748B;
                    font-size: 12px;
                    margin-bottom: 6px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-weight: 500;
                }
                .premium-field-value {
                    color: #1E293B;
                    font-size: 14px;
                    font-weight: 500;
                }
                .premium-sidebar {
                    width: 360px;
                    background: #FFFFFF;
                    display: flex;
                    flex-direction: column;
                }
                .premium-sidebar-header {
                    padding: 20px 24px;
                    border-bottom: 1px solid #E2E8F0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: #F8FAFC;
                }
                .premium-sidebar-content {
                    flex: 1;
                    padding: 24px;
                    overflow-y: auto;
                }
                .ai-suggestion-card {
                    background: #FFFFFF;
                    border: 1px solid #E2E8F0;
                    border-radius: 10px;
                    padding: 16px;
                    margin-bottom: 16px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                    transition: all 0.2s ease;
                }
                .ai-suggestion-card:hover {
                    border-color: #CBD5E1;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04);
                    transform: translateY(-2px);
                }
                .premium-btn {
                    padding: 6px 12px;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                }
                .premium-btn-primary {
                    background: #004797;
                    color: #FFFFFF;
                }
                .premium-btn-primary:hover {
                    background: #00A2E8;
                    box-shadow: 0 2px 4px rgba(0, 71, 151, 0.2);
                }
                .premium-btn-secondary {
                    background: #FFFFFF;
                    color: #475569;
                    border: 1px solid #E2E8F0;
                }
                .premium-btn-secondary:hover {
                    background: #F8FAFC;
                    color: #1E293B;
                    border-color: #CBD5E1;
                }
                .premium-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .premium-table th {
                    text-align: left;
                    padding: 12px 16px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #64748B;
                    border-bottom: 1px solid #E2E8F0;
                    background: #F8FAFC;
                }
                .premium-table td {
                    padding: 16px;
                    font-size: 14px;
                    color: #1E293B;
                    border-bottom: 1px solid #F1F5F9;
                }
                .premium-table tr:hover td {
                    background: #F8FAFC;
                }
            `}</style>

            <div className="premium-wrapper">
                {/* Main Content Area */}
                <div className="premium-main-content">
                    
                    {/* Header */}
                    <div className="premium-header-area">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div className="premium-avatar-container">
                                {company.logo_url ? (
                                    <img src={company.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <Building2 size={24} color="#94A3B8" />
                                )}
                            </div>
                            <div>
                                <h1 className="premium-company-title">
                                    {company.nombre}
                                </h1>
                                {company.dominio && (
                                    <a href={`https://${company.dominio}`} target="_blank" rel="noreferrer" className="premium-company-domain">
                                        <Globe size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                                        {company.dominio}
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="premium-tabs">
                            <button 
                                onClick={() => setActiveTab('resumen')}
                                className={`premium-tab-btn ${activeTab === 'resumen' ? 'active' : ''}`}
                            >
                                Resumen
                            </button>
                            <button 
                                onClick={() => setActiveTab('personas')}
                                className={`premium-tab-btn ${activeTab === 'personas' ? 'active' : ''}`}
                            >
                                Contactos ({company.personas?.length || 0})
                            </button>
                            <button 
                                onClick={() => setActiveTab('deals')}
                                className={`premium-tab-btn ${activeTab === 'deals' ? 'active' : ''}`}
                            >
                                Oportunidades ({company.deals?.length || 0})
                            </button>
                            <button 
                                onClick={() => setActiveTab('actividad')}
                                className={`premium-tab-btn ${activeTab === 'actividad' ? 'active' : ''}`}
                            >
                                Actividad
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="premium-content-area">
                        {activeTab === 'resumen' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {/* Basic Info Box */}
                                <div className="premium-card">
                                    <h3 className="premium-card-title">Información General</h3>
                                    <div className="premium-grid">
                                        <div>
                                            <div className="premium-field-label">
                                                <Target size={14} /> Industria
                                            </div>
                                            <div className="premium-field-value">{company.industria || '-'}</div>
                                        </div>
                                        <div>
                                            <div className="premium-field-label">
                                                <CheckSquare size={14} /> RUC
                                            </div>
                                            <div className="premium-field-value">{company.ruc || '-'}</div>
                                        </div>
                                        <div>
                                            <div className="premium-field-label">
                                                <Users size={14} /> Tamaño
                                            </div>
                                            <div className="premium-field-value" style={{ textTransform: 'capitalize' }}>{company.tamaño || '-'}</div>
                                        </div>
                                        <div>
                                            <div className="premium-field-label">
                                                <Phone size={14} /> Teléfono
                                            </div>
                                            <div className="premium-field-value">{company.telefono || '-'}</div>
                                        </div>
                                        <div>
                                            <div className="premium-field-label">
                                                <Mail size={14} /> Email
                                            </div>
                                            <div className="premium-field-value">{company.email || '-'}</div>
                                        </div>
                                        <div>
                                            <div className="premium-field-label">
                                                <MapPin size={14} /> Dirección
                                            </div>
                                            <div className="premium-field-value">{company.direccion || '-'} {company.ciudad ? `, ${company.ciudad}` : ''} {company.pais ? `(${company.pais})` : ''}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Custom Fields (Enriched by AI or manual) */}
                                {customFieldsSchema.length > 0 && (
                                    <div className="premium-card">
                                        <h3 className="premium-card-title">Campos Personalizados</h3>
                                        <div className="premium-grid">
                                            {customFieldsSchema.map(field => (
                                                <div key={field.id}>
                                                    <div className="premium-field-label">
                                                        {field.label}
                                                    </div>
                                                    <div className="premium-field-value">
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
                            <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
                                <table className="premium-table">
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
                                                        <Link href={`/admin/clientes/${p.id}`} style={{ color: '#1E293B', textDecoration: 'none', fontWeight: 500 }}>
                                                            {p.nombres} {p.apellidos}
                                                        </Link>
                                                    </td>
                                                    <td>{p.email}</td>
                                                    <td>{p.telefono || '-'}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                                                    No hay contactos asociados a esta empresa.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'deals' && (
                            <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
                                <table className="premium-table">
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
                                                        <Link href={`/admin/crm/pipeline?search=${encodeURIComponent(d.titulo)}`} style={{ color: '#1E293B', textDecoration: 'none', fontWeight: 500 }}>
                                                            {d.titulo}
                                                        </Link>
                                                    </td>
                                                    <td>
                                                        <span style={{ background: '#F1F5F9', color: '#475569', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500 }}>
                                                            {d.stage?.nombre || '-'}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontWeight: 500 }}>S/ {Number(d.valor).toFixed(2)}</td>
                                                    <td>
                                                        {d.estado === 'open' && <span style={{ color: '#D97706', background: '#FEF3C7', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Abierto</span>}
                                                        {d.estado === 'won' && <span style={{ color: '#059669', background: '#D1FAE5', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Ganado</span>}
                                                        {d.estado === 'lost' && <span style={{ color: '#E11D48', background: '#FFE4E6', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Perdido</span>}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                                                    No hay oportunidades abiertas para esta empresa.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        
                        {activeTab === 'actividad' && (
                            <div className="premium-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '32px' }}>
                                <TimelineTab events={company.timeline_events || []} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar - Agent Tab & Activity */}
                <div className="premium-sidebar">
                    <div className="premium-sidebar-header">
                        <div style={{ background: 'rgba(0, 71, 151, 0.1)', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                            <Sparkles size={16} color="#004797" />
                        </div>
                        <span style={{ fontWeight: 600, color: '#1E293B', fontSize: '15px' }}>CompAI Agent</span>
                    </div>
                    
                    <div className="premium-sidebar-content">
                        {evidenceLedger.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px', lineHeight: '1.5' }}>
                                    El agente ha investigado esta empresa y tiene sugerencias:
                                </p>
                                
                                {evidenceLedger.map(ev => {
                                    const field = customFieldsSchema.find(f => f.name === ev.field_name);
                                    return (
                                        <div key={ev.id} className="ai-suggestion-card">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>
                                                    {field ? field.label : ev.field_name}
                                                </span>
                                                <span style={{ fontSize: '11px', background: '#F1F5F9', color: '#475569', padding: '4px 8px', borderRadius: '12px', fontWeight: 600 }}>
                                                    {ev.confidence_score}% Confianza
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '14px', color: '#334155', marginBottom: '16px', wordBreak: 'break-word', lineHeight: '1.5', padding: '10px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #F1F5F9' }}>
                                                {ev.suggested_value}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button 
                                                    onClick={() => handleResolveEvidence(ev.id, 'accept', ev)}
                                                    className="premium-btn premium-btn-primary" style={{ flex: 1 }}
                                                >
                                                    Aceptar
                                                </button>
                                                <button 
                                                    onClick={() => handleResolveEvidence(ev.id, 'reject', ev)}
                                                    className="premium-btn premium-btn-secondary" style={{ flex: 1 }}
                                                >
                                                    Descartar
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94A3B8' }}>
                                <div style={{ width: '48px', height: '48px', background: '#F8FAFC', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                    <Sparkles size={24} style={{ opacity: 0.5 }} color="#64748B" />
                                </div>
                                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>El agente de IA no tiene sugerencias pendientes para esta empresa.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </TwentyCrmLayout>
    );
}
