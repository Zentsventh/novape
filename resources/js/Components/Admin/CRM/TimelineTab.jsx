import React from 'react';
import { Clock, Plus, Target, Building2, User, FileText, CheckSquare, MessageCircle, AlertCircle } from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';

dayjs.extend(relativeTime);
dayjs.locale('es');

export default function TimelineTab({ events }) {
    
    const getEventIcon = (type) => {
        switch (type) {
            case 'deal_creado': return <Target size={14} color="#3b82f6" />;
            case 'deal_movido': return <Target size={14} color="#eab308" />;
            case 'estado_cambiado': return <AlertCircle size={14} color="#ef4444" />;
            case 'empresa_creada': return <Building2 size={14} color="#10b981" />;
            case 'persona_creada': return <User size={14} color="#10b981" />;
            case 'nota_creada': return <FileText size={14} color="#8b5cf6" />;
            case 'actividad_creada': return <CheckSquare size={14} color="#f97316" />;
            case 'mensaje_enviado': return <MessageCircle size={14} color="#3b82f6" />;
            case 'producto_agregado': return <Plus size={14} color="#10b981" />;
            case 'producto_eliminado': return <Plus size={14} style={{ transform: 'rotate(45deg)' }} color="#ef4444" />;
            default: return <Clock size={14} color="var(--twenty-text-muted)" />;
        }
    };

    if (!events || events.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--twenty-text-muted)' }}>
                <Clock size={32} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <p>No hay eventos en el historial todavía.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {events.map((event, index) => (
                <div key={event.id} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                    {/* Timeline Line */}
                    {index !== events.length - 1 && (
                        <div style={{ 
                            position: 'absolute', 
                            left: '15px', 
                            top: '32px', 
                            bottom: '-24px', 
                            width: '2px', 
                            background: 'var(--twenty-border)',
                            zIndex: 0
                        }} />
                    )}
                    
                    {/* Icon */}
                    <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        background: 'var(--twenty-background-tertiary)',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        zIndex: 1,
                        border: '2px solid var(--twenty-background)'
                    }}>
                        {getEventIcon(event.event_type)}
                    </div>
                    
                    {/* Content */}
                    <div style={{ flex: 1, paddingBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                            <div style={{ fontSize: '14px', color: 'var(--twenty-text-main)', fontWeight: 500 }}>
                                {event.descripcion}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--twenty-text-muted)', whiteSpace: 'nowrap', marginLeft: '12px' }} title={dayjs(event.created_at).format('LLLL')}>
                                {dayjs(event.created_at).fromNow()}
                            </div>
                        </div>
                        
                        {event.actor && (
                            <div style={{ fontSize: '12px', color: 'var(--twenty-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <img 
                                    src={event.actor.avatar_url || `https://ui-avatars.com/api/?name=${event.actor.nombres}+${event.actor.apellidos}&background=random`} 
                                    alt={event.actor.nombres}
                                    style={{ width: '16px', height: '16px', borderRadius: '50%' }}
                                />
                                {event.actor.nombres} {event.actor.apellidos}
                            </div>
                        )}
                        
                        {/* Display metadata intelligently if needed */}
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                            <div style={{ 
                                marginTop: '12px', 
                                padding: '12px', 
                                background: 'var(--twenty-background-tertiary)', 
                                borderRadius: '8px',
                                fontSize: '12px',
                                color: 'var(--twenty-text-muted)',
                                fontFamily: 'monospace'
                            }}>
                                {Object.entries(event.metadata).map(([key, value]) => (
                                    <div key={key}>
                                        <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : value}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
