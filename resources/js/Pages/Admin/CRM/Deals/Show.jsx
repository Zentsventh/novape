import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import TwentyCrmLayout from '../../../../Layouts/TwentyCrmLayout';
import { Target, Building, User, Calendar, DollarSign, List, Tag, Package, Sparkles } from 'lucide-react';
import TimelineTab from '../../../../Components/Admin/CRM/TimelineTab';
import Swal from 'sweetalert2';

export default function Show({ deal = {}, evidenceLedger = [], customFieldsSchema = [] }) {
    const [activeTab, setActiveTab] = useState('resumen');
    
    const formatMoney = (value) => {
        return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value || 0);
    };

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
        <TwentyCrmLayout title={deal.titulo}>
            <Head title={`${deal.titulo} - Oportunidades`} />

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
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Target size={24} color="var(--twenty-primary)" />
                            </div>
                            <div>
                                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600, color: 'var(--twenty-text-main)' }}>
                                    {deal.titulo}
                                </h1>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px' }}>
                                    <span style={{ color: 'var(--twenty-text-muted)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Tag size={14} /> {deal.stage?.nombre || 'Sin Etapa'}
                                    </span>
                                    <span style={{ color: 'var(--twenty-text-muted)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <DollarSign size={14} /> {formatMoney(deal.valor)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--twenty-border)' }}>
                            <button onClick={() => setActiveTab('resumen')} style={getTabStyle(activeTab === 'resumen')}>
                                Resumen
                            </button>
                            <button onClick={() => setActiveTab('actividad')} style={getTabStyle(activeTab === 'actividad')}>
                                Actividad
                            </button>
                            <button onClick={() => setActiveTab('productos')} style={getTabStyle(activeTab === 'productos')}>
                                Productos ({deal.products?.length || 0})
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
                        {activeTab === 'resumen' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                
                                <div className="twenty-card">
                                    <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: 'var(--twenty-text-main)' }}>Detalles de la Oportunidad</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <div style={{ color: 'var(--twenty-text-muted)', fontSize: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Building size={12} /> Empresa Asociada
                                            </div>
                                            <div style={{ color: 'var(--twenty-text-main)', fontSize: '14px' }}>
                                                {deal.empresa ? (
                                                    <Link href={`/admin/crm/companies/${deal.empresa.id}`} style={{ color: 'var(--twenty-primary)', textDecoration: 'none' }}>
                                                        {deal.empresa.nombre}
                                                    </Link>
                                                ) : '-'}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--twenty-text-muted)', fontSize: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <User size={12} /> Persona Asociada
                                            </div>
                                            <div style={{ color: 'var(--twenty-text-main)', fontSize: '14px' }}>
                                                {deal.cliente ? (
                                                    <Link href={`/admin/clientes/${deal.cliente.id}`} style={{ color: 'var(--twenty-primary)', textDecoration: 'none' }}>
                                                        {deal.cliente.nombres} {deal.cliente.apellidos}
                                                    </Link>
                                                ) : '-'}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--twenty-text-muted)', fontSize: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <List size={12} /> Estado
                                            </div>
                                            <div style={{ color: 'var(--twenty-text-main)', fontSize: '14px', textTransform: 'capitalize' }}>
                                                {deal.estado === 'open' && <span style={{ color: '#eab308' }}>Abierto</span>}
                                                {deal.estado === 'won' && <span style={{ color: '#22c55e' }}>Ganado</span>}
                                                {deal.estado === 'lost' && <span style={{ color: '#ef4444' }}>Perdido</span>}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--twenty-text-muted)', fontSize: '12px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Calendar size={12} /> Cierre Esperado
                                            </div>
                                            <div style={{ color: 'var(--twenty-text-main)', fontSize: '14px' }}>
                                                {deal.fecha_cierre_esperada ? new Date(deal.fecha_cierre_esperada).toLocaleDateString('es-PE') : '-'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Custom Fields (Enriched by AI or manual) */}
                                {customFieldsSchema.length > 0 && (
                                    <div className="twenty-card">
                                        <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: 'var(--twenty-text-main)' }}>Campos Adicionales</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            {customFieldsSchema.map(field => (
                                                <div key={field.id}>
                                                    <div style={{ color: 'var(--twenty-text-muted)', fontSize: '12px', marginBottom: '4px' }}>
                                                        {field.label}
                                                    </div>
                                                    <div style={{ color: 'var(--twenty-text-main)', fontSize: '14px' }}>
                                                        {deal.custom_fields && deal.custom_fields[field.name] ? deal.custom_fields[field.name] : '-'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'actividad' && (
                            <div className="twenty-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                                <TimelineTab events={deal.timeline_events || []} />
                            </div>
                        )}

                        {activeTab === 'productos' && (
                            <div className="twenty-card" style={{ padding: 0, overflow: 'hidden' }}>
                                <table className="twenty-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th>Cantidad</th>
                                            <th>Precio Unit.</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deal.products?.length > 0 ? (
                                            deal.products.map(p => (
                                                <tr key={p.id}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <Package size={16} color="var(--twenty-text-muted)" />
                                                            {p.producto ? p.producto.nombre : 'Producto genérico'}
                                                        </div>
                                                    </td>
                                                    <td>{p.cantidad}</td>
                                                    <td>{formatMoney(p.precio_unitario)}</td>
                                                    <td style={{ fontWeight: 500 }}>{formatMoney(p.subtotal)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: 'var(--twenty-text-muted)' }}>
                                                    No hay productos cotizados en esta oportunidad.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar - Agent Tab */}
                <div style={{ width: '350px', background: 'var(--twenty-background-secondary)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--twenty-border)', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--twenty-background)' }}>
                        <Sparkles size={16} color="var(--twenty-primary)" />
                        <span style={{ fontWeight: 600, color: 'var(--twenty-text-main)', fontSize: '14px' }}>CompAI Agent</span>
                    </div>
                    
                    <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
                        {evidenceLedger.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <p style={{ fontSize: '13px', color: 'var(--twenty-text-muted)', margin: '0 0 8px' }}>
                                    El agente tiene sugerencias para esta oportunidad:
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
                                <p style={{ margin: 0, fontSize: '13px' }}>El agente de IA no tiene sugerencias pendientes para esta oportunidad.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </TwentyCrmLayout>
    );
}

function getTabStyle(isActive) {
    return {
        background: 'none', border: 'none', padding: '0 0 12px 0', 
        color: isActive ? 'var(--twenty-primary)' : 'var(--twenty-text-muted)',
        fontWeight: isActive ? 600 : 500,
        borderBottom: isActive ? '2px solid var(--twenty-primary)' : '2px solid transparent',
        cursor: 'pointer', fontSize: '14px'
    };
}
