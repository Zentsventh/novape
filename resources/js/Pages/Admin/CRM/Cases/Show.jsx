import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import TwentyCrmLayout from '../../../../Layouts/TwentyCrmLayout';
import { Ticket, User, Package, Clock, CheckCircle, ChevronLeft, Save, Calendar, MessageSquare, Send, CalendarClock } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Show({ crmCase = {} }) {
    const { data, setData, post, processing, reset } = useForm({
        contenido: ''
    });

    const [isSavingStatus, setIsSavingStatus] = useState(false);

    const getPriorityColor = (prioridad) => {
        switch(prioridad) {
            case 'urgente': return 'bg-red-100 text-red-700';
            case 'alta': return 'bg-orange-100 text-orange-700';
            case 'media': return 'bg-yellow-100 text-yellow-700';
            case 'baja': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const handleQuickUpdate = (field, value) => {
        setIsSavingStatus(true);
        router.put(`/admin/crm/cases/${crmCase.id}`, {
            [field]: value
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSavingStatus(false);
                Swal.fire({
                    toast: true,
                    position: 'bottom-end',
                    icon: 'success',
                    title: 'Actualizado correctamente',
                    showConfirmButton: false,
                    timer: 1500
                });
            },
            onError: () => setIsSavingStatus(false)
        });
    };

    const handleAddNote = (e) => {
        e.preventDefault();
        if (!data.contenido.trim()) return;

        post(`/admin/crm/cases/${crmCase.id}/notes`, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                Swal.fire({
                    toast: true,
                    position: 'bottom-end',
                    icon: 'success',
                    title: 'Nota añadida',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        });
    };

    // Combine notes and activities into a single timeline sorted by date
    const notes = crmCase.notas || [];
    const activities = crmCase.actividades || [];
    const timeline = [...notes, ...activities].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    return (
        <TwentyCrmLayout title={`Caso #${crmCase.id}`}>
            <Head title={`Caso #${crmCase.id} - CRM`} />

            <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
                {/* Left Sidebar (Static Details) */}
                <div style={{ width: '320px', borderRight: '1px solid var(--twenty-border)', background: 'var(--twenty-bg-surface)', padding: '24px', overflowY: 'auto' }}>
                    <Link href="/admin/crm/cases" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--twenty-text-muted)', textDecoration: 'none', marginBottom: '24px', fontSize: '14px', fontWeight: 500 }}>
                        <ChevronLeft size={16} />
                        Volver a Casos
                    </Link>

                    <div style={{ marginBottom: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <div style={{ width: 48, height: 48, background: 'var(--twenty-primary-bg)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--twenty-primary)' }}>
                                <Ticket size={24} />
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--twenty-text-muted)' }}>#{crmCase.id}</span>
                        </div>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--twenty-text-main)', marginBottom: '16px', lineHeight: 1.3 }}>
                            {crmCase.titulo}
                        </h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        
                        {/* Quick Controls */}
                        <div style={{ background: 'var(--twenty-background)', padding: '16px', borderRadius: '12px', border: '1px solid var(--twenty-border)' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--twenty-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Estado del Ticket</label>
                                <select 
                                    className="twenty-input" 
                                    style={{ width: '100%', cursor: 'pointer', background: crmCase.estado === 'resuelto' ? '#f0fdf4' : 'var(--twenty-bg-surface)' }} 
                                    value={crmCase.estado} 
                                    onChange={(e) => handleQuickUpdate('estado', e.target.value)}
                                    disabled={isSavingStatus}
                                >
                                    <option value="abierto">Abierto</option>
                                    <option value="en_progreso">En Progreso</option>
                                    <option value="resuelto">Resuelto</option>
                                    <option value="cerrado">Cerrado</option>
                                </select>
                            </div>
                            
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--twenty-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Prioridad</label>
                                <select 
                                    className="twenty-input" 
                                    style={{ width: '100%', cursor: 'pointer' }} 
                                    value={crmCase.prioridad} 
                                    onChange={(e) => handleQuickUpdate('prioridad', e.target.value)}
                                    disabled={isSavingStatus}
                                >
                                    <option value="baja">Baja</option>
                                    <option value="media">Media</option>
                                    <option value="alta">Alta</option>
                                    <option value="urgente">Urgente</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--twenty-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Vencimiento SLA</label>
                                <input 
                                    type="datetime-local" 
                                    className="twenty-input" 
                                    style={{ width: '100%', cursor: 'pointer' }} 
                                    value={crmCase.fecha_vencimiento ? new Date(crmCase.fecha_vencimiento).toISOString().slice(0, 16) : ''}
                                    onChange={(e) => handleQuickUpdate('fecha_vencimiento', e.target.value)}
                                    disabled={isSavingStatus}
                                />
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--twenty-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Cliente</label>
                            {crmCase.cliente ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--twenty-background)', padding: '12px', borderRadius: '12px', border: '1px solid var(--twenty-border)' }}>
                                    <div className="crm-avatar" style={{ width: 36, height: 36, fontSize: '14px' }}>
                                        {crmCase.cliente.nombres?.charAt(0) || 'C'}
                                    </div>
                                    <div style={{ overflow: 'hidden' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--twenty-text-main)', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{crmCase.cliente.nombres} {crmCase.cliente.apellidos}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--twenty-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{crmCase.cliente.email}</div>
                                    </div>
                                </div>
                            ) : (
                                <span style={{ color: 'var(--twenty-text-muted)', fontSize: '14px' }}>Sin asignar</span>
                            )}
                        </div>

                        {crmCase.pedido_id && (
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--twenty-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Pedido Relacionado</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--twenty-primary)', fontWeight: 500 }}>
                                    <Package size={16} />
                                    Pedido #{crmCase.pedido_id}
                                </div>
                            </div>
                        )}

                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--twenty-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Agente Asignado</label>
                            {crmCase.asignadoA ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: 'var(--twenty-text-main)' }}>
                                    <User size={16} style={{ color: 'var(--twenty-text-muted)' }} />
                                    {crmCase.asignadoA.nombres}
                                </div>
                            ) : (
                                <span style={{ color: 'var(--twenty-text-muted)', fontSize: '14px' }}>Sin agente asignado</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content (Timeline & Chat) */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--twenty-background)' }}>
                    
                    {/* Header Info */}
                    <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--twenty-border)', background: 'var(--twenty-bg-surface)', display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--twenty-text-muted)', fontSize: '13px' }}>
                            <Calendar size={14} />
                            Reportado: {new Date(crmCase.created_at).toLocaleString()}
                        </div>
                        {crmCase.fecha_vencimiento && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: new Date(crmCase.fecha_vencimiento) < new Date() ? 'var(--twenty-danger)' : 'var(--twenty-primary)', fontSize: '13px', fontWeight: 600 }}>
                                <CalendarClock size={14} />
                                Vence: {new Date(crmCase.fecha_vencimiento).toLocaleString()}
                            </div>
                        )}
                        <span style={{ background: 'var(--twenty-bg-hover)', color: 'var(--twenty-text-secondary)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize', marginLeft: 'auto' }}>
                            Caso tipo: {crmCase.tipo}
                        </span>
                    </div>

                    {/* Timeline (Scrollable) */}
                    <div style={{ flex: 1, padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Initial Description */}
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div className="crm-avatar" style={{ width: 40, height: 40, fontSize: '14px', flexShrink: 0 }}>
                                {crmCase.cliente?.nombres?.charAt(0) || 'C'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--twenty-text-main)' }}>{crmCase.cliente?.nombres || 'Cliente'}</span>
                                    <span style={{ fontSize: '12px', color: 'var(--twenty-text-muted)' }}>{new Date(crmCase.created_at).toLocaleString()}</span>
                                </div>
                                <div style={{ background: 'var(--twenty-bg-surface)', padding: '16px', borderRadius: '0px 12px 12px 12px', border: '1px solid var(--twenty-border)', fontSize: '14px', lineHeight: 1.6, color: 'var(--twenty-text-main)', whiteSpace: 'pre-wrap' }}>
                                    {crmCase.descripcion || <span style={{ color: 'var(--twenty-text-muted)', fontStyle: 'italic' }}>Sin descripción adicional provista por el cliente.</span>}
                                </div>
                            </div>
                        </div>

                        {/* Thread (Notes and Activities) */}
                        {timeline.map((item, index) => {
                            const isActivity = !!item.event_type;
                            if (isActivity) {
                                return (
                                    <div key={`act-${item.id}`} style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                                        <div style={{ background: 'var(--twenty-bg-hover)', padding: '4px 16px', borderRadius: '16px', fontSize: '12px', color: 'var(--twenty-text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <CheckCircle size={12} />
                                            {item.descripcion} - {new Date(item.created_at).toLocaleTimeString()}
                                        </div>
                                    </div>
                                );
                            }

                            // It's a note
                            return (
                                <div key={`note-${item.id}`} style={{ display: 'flex', gap: '16px', flexDirection: 'row-reverse' }}>
                                    <div className="crm-avatar" style={{ width: 40, height: 40, fontSize: '14px', flexShrink: 0, background: 'var(--twenty-primary)', color: 'white' }}>
                                        {item.autor?.nombres?.charAt(0) || 'A'}
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexDirection: 'row-reverse' }}>
                                            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--twenty-text-main)' }}>{item.autor?.nombres || 'Agente'}</span>
                                            <span style={{ fontSize: '12px', color: 'var(--twenty-text-muted)' }}>{new Date(item.created_at).toLocaleString()}</span>
                                        </div>
                                        <div style={{ background: 'var(--twenty-primary-bg)', color: 'var(--twenty-primary)', padding: '16px', borderRadius: '12px 0px 12px 12px', fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap', textAlign: 'right', maxWidth: '85%' }}>
                                            {item.contenido}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Input Area (Bottom) */}
                    <div style={{ padding: '24px 32px', borderTop: '1px solid var(--twenty-border)', background: 'var(--twenty-bg-surface)' }}>
                        <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--twenty-text-main)', fontWeight: 600, fontSize: '14px' }}>
                                <MessageSquare size={16} /> Añadir Nota Interna
                            </div>
                            <div style={{ position: 'relative' }}>
                                <textarea 
                                    className="twenty-input" 
                                    style={{ width: '100%', minHeight: '100px', paddingBottom: '48px', resize: 'vertical' }} 
                                    placeholder="Escribe una actualización o nota sobre este caso..."
                                    value={data.contenido}
                                    onChange={e => setData('contenido', e.target.value)}
                                    disabled={processing}
                                />
                                <div style={{ position: 'absolute', bottom: '12px', right: '12px' }}>
                                    <button 
                                        type="submit" 
                                        className="twenty-btn-primary" 
                                        disabled={processing || !data.contenido.trim()}
                                        style={{ padding: '8px 16px' }}
                                    >
                                        <Send size={16} /> Enviar Nota
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </TwentyCrmLayout>
    );
}
