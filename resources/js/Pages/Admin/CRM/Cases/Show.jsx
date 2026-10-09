import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import TwentyCrmLayout from '../../../../Layouts/TwentyCrmLayout';
import { Ticket, User, Package, CheckCircle, ChevronLeft, Calendar, MessageSquare, Send, CalendarClock } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Show({ crmCase = {} }) {
    const { data, setData, post, processing, reset } = useForm({
        contenido: ''
    });

    const [isSavingStatus, setIsSavingStatus] = useState(false);
    const [slaDate, setSlaDate] = useState(crmCase.fecha_vencimiento ? new Date(crmCase.fecha_vencimiento).toISOString().slice(0, 16) : '');

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

            <div style={{ display: 'flex', height: '100%', overflow: 'hidden', backgroundColor: '#F8FAFC', fontFamily: "'Inter', -apple-system, sans-serif" }}>
                {/* Left Sidebar (Static Details) */}
                <div style={{ 
                    width: '340px', 
                    borderRight: '1px solid #E2E8F0', 
                    background: '#ffffff', 
                    padding: '32px 24px', 
                    overflowY: 'auto',
                    boxShadow: '4px 0 24px rgba(0,0,0,0.02)',
                    zIndex: 10
                }}>
                    <Link 
                        href="/admin/crm/cases" 
                        style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: '8px', 
                            color: '#64748B', textDecoration: 'none', marginBottom: '32px', 
                            fontSize: '13px', fontWeight: 600, transition: 'all 0.2s ease',
                            padding: '8px 12px', borderRadius: '8px', marginLeft: '-12px'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.color = '#004797'; e.currentTarget.style.backgroundColor = '#F1F5F9'; }}
                        onMouseOut={(e) => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                        <ChevronLeft size={16} />
                        Volver a Casos
                    </Link>

                    <div style={{ marginBottom: '40px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #004797, #009BE0)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', boxShadow: '0 4px 12px rgba(0, 71, 151, 0.3)' }}>
                                <Ticket size={20} />
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#004797', letterSpacing: '0.5px' }}>CASO #{crmCase.id}</span>
                        </div>
                        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1E293B', marginBottom: '8px', lineHeight: 1.3, letterSpacing: '-0.3px' }}>
                            {crmCase.titulo}
                        </h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        
                        {/* Quick Controls */}
                        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', display: 'block' }}>Estado del Ticket</label>
                                <div style={{ position: 'relative' }}>
                                    <select 
                                        style={{ 
                                            width: '100%', cursor: 'pointer', background: crmCase.estado === 'resuelto' ? '#F0FDF4' : '#F8FAFC',
                                            border: crmCase.estado === 'resuelto' ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                                            padding: '10px 14px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, color: '#1E293B',
                                            outline: 'none', transition: 'all 0.2s', appearance: 'none',
                                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                        }} 
                                        value={crmCase.estado} 
                                        onChange={(e) => handleQuickUpdate('estado', e.target.value)}
                                        disabled={isSavingStatus}
                                        onFocus={e => { e.target.style.borderColor = '#004797'; e.target.style.boxShadow = '0 0 0 4px rgba(0, 71, 151, 0.1)'; }}
                                        onBlur={e => { e.target.style.borderColor = crmCase.estado === 'resuelto' ? '#BBF7D0' : '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; }}
                                    >
                                        <option value="abierto">Abierto</option>
                                        <option value="en_progreso">En Progreso</option>
                                        <option value="resuelto">Resuelto</option>
                                        <option value="cerrado">Cerrado</option>
                                    </select>
                                    <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94A3B8' }}>
                                        <ChevronLeft size={16} style={{ transform: 'rotate(-90deg)' }} />
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', display: 'block' }}>Prioridad</label>
                                <div style={{ position: 'relative' }}>
                                    <select 
                                        style={{ 
                                            width: '100%', cursor: 'pointer', background: '#F8FAFC', border: '1px solid #E2E8F0',
                                            padding: '10px 14px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, color: '#1E293B',
                                            outline: 'none', transition: 'all 0.2s', appearance: 'none',
                                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                        }} 
                                        value={crmCase.prioridad} 
                                        onChange={(e) => handleQuickUpdate('prioridad', e.target.value)}
                                        disabled={isSavingStatus}
                                        onFocus={e => { e.target.style.borderColor = '#004797'; e.target.style.boxShadow = '0 0 0 4px rgba(0, 71, 151, 0.1)'; }}
                                        onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; }}
                                    >
                                        <option value="baja">Baja</option>
                                        <option value="media">Media</option>
                                        <option value="alta">Alta</option>
                                        <option value="urgente">Urgente</option>
                                    </select>
                                    <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94A3B8' }}>
                                        <ChevronLeft size={16} style={{ transform: 'rotate(-90deg)' }} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', display: 'block' }}>Vencimiento SLA</label>
                                <input 
                                    type="datetime-local" 
                                    style={{ 
                                        width: '100%', cursor: 'pointer', background: '#F8FAFC', border: '1px solid #E2E8F0',
                                        padding: '10px 14px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, color: '#1E293B',
                                        outline: 'none', transition: 'all 0.2s',
                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                    }} 
                                    value={slaDate}
                                    onChange={(e) => setSlaDate(e.target.value)}
                                    disabled={isSavingStatus}
                                    onFocus={e => { e.target.style.borderColor = '#004797'; e.target.style.boxShadow = '0 0 0 4px rgba(0, 71, 151, 0.1)'; }}
                                    onBlur={e => { 
                                        e.target.style.borderColor = '#E2E8F0'; 
                                        e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)';
                                        const originalDate = crmCase.fecha_vencimiento ? new Date(crmCase.fecha_vencimiento).toISOString().slice(0, 16) : '';
                                        if (e.target.value !== originalDate) {
                                            handleQuickUpdate('fecha_vencimiento', e.target.value);
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'block' }}>Cliente</label>
                            {crmCase.cliente ? (
                                <div style={{ 
                                    display: 'flex', alignItems: 'center', gap: '12px', background: '#ffffff', 
                                    padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.02)', transition: 'transform 0.2s ease', cursor: 'pointer'
                                }}
                                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #E0F2FE, #BAE6FD)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0369A1', fontWeight: 800, fontSize: '16px', flexShrink: 0 }}>
                                        {crmCase.cliente.nombres?.charAt(0) || 'C'}
                                    </div>
                                    <div style={{ overflow: 'hidden' }}>
                                        <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{crmCase.cliente.nombres} {crmCase.cliente.apellidos}</div>
                                        <div style={{ fontSize: '12px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>{crmCase.cliente.email}</div>
                                    </div>
                                </div>
                            ) : (
                                <span style={{ color: '#94A3B8', fontSize: '14px', fontStyle: 'italic' }}>Sin asignar</span>
                            )}
                        </div>

                        {crmCase.pedido_id && (
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'block' }}>Pedido Relacionado</label>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#004797', fontWeight: 600, background: '#E0F2FE', padding: '8px 16px', borderRadius: '8px' }}>
                                    <Package size={16} />
                                    Pedido #{crmCase.pedido_id}
                                </div>
                            </div>
                        )}

                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'block' }}>Agente Asignado</label>
                            {crmCase.asignadoA ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#1E293B', background: '#F8FAFC', padding: '10px 16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                                    <User size={16} style={{ color: '#004797' }} />
                                    {crmCase.asignadoA.nombres}
                                </div>
                            ) : (
                                <span style={{ color: '#94A3B8', fontSize: '14px', fontStyle: 'italic' }}>Sin agente asignado</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content (Timeline & Chat) */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
                    
                    {/* Header Info */}
                    <div style={{ 
                        padding: '24px 40px', borderBottom: '1px solid #E2E8F0', background: 'rgba(255, 255, 255, 0.8)', 
                        backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: '32px', zIndex: 5 
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '13px', fontWeight: 500 }}>
                            <Calendar size={16} />
                            Reportado: <span style={{ color: '#1E293B', fontWeight: 600 }}>{new Date(crmCase.created_at).toLocaleString()}</span>
                        </div>
                        {crmCase.fecha_vencimiento && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: new Date(crmCase.fecha_vencimiento) < new Date() ? '#EF4444' : '#004797', fontSize: '13px', fontWeight: 600 }}>
                                <CalendarClock size={16} />
                                Vence: {new Date(crmCase.fecha_vencimiento).toLocaleString()}
                            </div>
                        )}
                        <span style={{ background: '#E2E8F0', color: '#475569', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginLeft: 'auto' }}>
                            {crmCase.tipo}
                        </span>
                        {crmCase.omnichannel_conversation_id && (
                            <Link href="/admin/inbox" style={{
                                display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#10b981', color: 'white',
                                padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', transition: 'all 0.2s ease'
                            }}
                            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)'; }}
                            onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'; }}
                            >
                                <MessageSquare size={16} />
                                Abrir en Inbox
                            </Link>
                        )}
                    </div>

                    {/* Timeline (Scrollable) */}
                    <div style={{ flex: 1, padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {/* Initial Description */}
                        <div style={{ display: 'flex', gap: '20px', maxWidth: '85%' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #004797, #009BE0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 800, fontSize: '18px', flexShrink: 0, boxShadow: '0 4px 12px rgba(0, 71, 151, 0.2)' }}>
                                {crmCase.cliente?.nombres?.charAt(0) || 'C'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '6px' }}>
                                    <span style={{ fontWeight: 700, fontSize: '15px', color: '#1E293B' }}>{crmCase.cliente?.nombres || 'Cliente'}</span>
                                    <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>{new Date(crmCase.created_at).toLocaleString()}</span>
                                </div>
                                <div style={{ 
                                    background: '#ffffff', padding: '20px', borderRadius: '4px 20px 20px 20px', 
                                    border: '1px solid #E2E8F0', fontSize: '14px', lineHeight: 1.6, color: '#334155', 
                                    whiteSpace: 'pre-wrap', boxShadow: '0 4px 16px -4px rgba(0,0,0,0.03)',
                                    transition: 'transform 0.2s', cursor: 'default'
                                }}
                                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    {crmCase.descripcion || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Sin descripción adicional provista por el cliente.</span>}
                                </div>
                            </div>
                        </div>

                        {/* Thread (Notes and Activities) */}
                        {timeline.map((item, index) => {
                            const isActivity = !!item.event_type;
                            if (isActivity) {
                                return (
                                    <div key={`act-${item.id}`} style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
                                        <div style={{ background: '#ffffff', padding: '8px 20px', borderRadius: '24px', fontSize: '12px', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #E2E8F0' }}>
                                            <CheckCircle size={14} color="#10b981" />
                                            {item.descripcion} <span style={{ opacity: 0.5 }}>•</span> {new Date(item.created_at).toLocaleTimeString()}
                                        </div>
                                    </div>
                                );
                            }

                            // It's a note
                            return (
                                <div key={`note-${item.id}`} style={{ display: 'flex', gap: '20px', flexDirection: 'row-reverse', maxWidth: '85%', alignSelf: 'flex-end' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontWeight: 800, fontSize: '18px', flexShrink: 0, border: '1px solid #E2E8F0' }}>
                                        {item.autor?.nombres?.charAt(0) || 'A'}
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '6px', flexDirection: 'row-reverse' }}>
                                            <span style={{ fontWeight: 700, fontSize: '15px', color: '#1E293B' }}>{item.autor?.nombres || 'Agente'}</span>
                                            <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>{new Date(item.created_at).toLocaleString()}</span>
                                        </div>
                                        <div style={{ 
                                            background: '#F1F5F9', color: '#334155', padding: '20px', 
                                            borderRadius: '20px 4px 20px 20px', border: '1px solid #E2E8F0',
                                            fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap', textAlign: 'right', 
                                            boxShadow: '0 4px 16px -4px rgba(0,0,0,0.03)', transition: 'transform 0.2s', cursor: 'default'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            {item.contenido}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Input Area (Bottom) */}
                    <div style={{ padding: '32px 40px', borderTop: '1px solid #E2E8F0', background: '#ffffff', zIndex: 10, boxShadow: '0 -4px 24px rgba(0,0,0,0.02)' }}>
                        <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1E293B', fontWeight: 700, fontSize: '15px' }}>
                                <MessageSquare size={18} color="#004797" /> Añadir Nota Interna
                            </div>
                            <div style={{ position: 'relative' }}>
                                <textarea 
                                    style={{ 
                                        width: '100%', minHeight: '120px', padding: '20px', paddingBottom: '64px', resize: 'none',
                                        borderRadius: '16px', border: '1px solid #E2E8F0', background: '#F8FAFC',
                                        fontSize: '15px', color: '#1E293B', outline: 'none', transition: 'all 0.2s ease',
                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                    }} 
                                    placeholder="Escribe una actualización o nota interna sobre este caso (sólo visible para agentes)..."
                                    value={data.contenido}
                                    onChange={e => setData('contenido', e.target.value)}
                                    disabled={processing}
                                    onFocus={e => { e.target.style.borderColor = '#004797'; e.target.style.boxShadow = '0 0 0 4px rgba(0, 71, 151, 0.1)'; e.target.style.background = '#ffffff'; }}
                                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.background = '#F8FAFC'; }}
                                />
                                <div style={{ position: 'absolute', bottom: '16px', right: '16px' }}>
                                    <button 
                                        type="submit" 
                                        disabled={processing || !data.contenido.trim()}
                                        style={{ 
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            background: (processing || !data.contenido.trim()) ? '#CBD5E1' : '#004797', 
                                            color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '12px',
                                            fontSize: '14px', fontWeight: 600, cursor: (processing || !data.contenido.trim()) ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s', boxShadow: (processing || !data.contenido.trim()) ? 'none' : '0 4px 14px rgba(0, 71, 151, 0.3)'
                                        }}
                                        onMouseOver={e => { if(!processing && data.contenido.trim()) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 71, 151, 0.4)'; } }}
                                        onMouseOut={e => { if(!processing && data.contenido.trim()) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 71, 151, 0.3)'; } }}
                                    >
                                        <Send size={16} /> {processing ? 'Enviando...' : 'Enviar Nota'}
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
