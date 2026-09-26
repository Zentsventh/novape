import React, { useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import TwentyCrmLayout from '../../../../Layouts/TwentyCrmLayout';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function CalendarIndex() {
    const calendarRef = useRef(null);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const handleEventClick = (info) => {
        // Prevent browser from following the event's url
        info.jsEvent.preventDefault(); 
        setSelectedEvent({
            title: info.event.title,
            start: info.event.start,
            end: info.event.end,
            extendedProps: info.event.extendedProps
        });
    };

    const closeEventModal = () => {
        setSelectedEvent(null);
    };

    return (
        <TwentyCrmLayout title="Calendario">
            <Head title="Calendario CRM" />

            <div 
                style={{ 
                    padding: '24px', 
                    minHeight: 'calc(100vh - 140px)', 
                    background: '#ffffff', 
                    borderRadius: '12px', 
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                    maxWidth: '1400px',
                    margin: '0 auto'
                }}
            >
                <style>{`
                    .fc { 
                        --fc-border-color: #E2E8F0;
                        --fc-button-bg-color: #ffffff; 
                        --fc-button-border-color: #E2E8F0; 
                        --fc-button-text-color: #475569; 
                        --fc-button-hover-bg-color: #F8FAFC; 
                        --fc-button-hover-border-color: #94A3B8; 
                        --fc-button-active-bg-color: #F1F5F9; 
                        --fc-button-active-border-color: #00B4FF; 
                        --fc-today-bg-color: rgba(0, 180, 255, 0.04); 
                        --fc-event-bg-color: #00B4FF;
                        --fc-event-border-color: #00B4FF;
                        font-family: inherit;
                    }
                    .fc .fc-button-primary {
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 13px;
                        padding: 8px 16px;
                        transition: all 0.2s ease;
                        box-shadow: 0 1px 2px rgba(0,0,0,0.02);
                        text-transform: capitalize;
                    }
                    .fc .fc-button-primary:not(:disabled):active, 
                    .fc .fc-button-primary:not(:disabled).fc-button-active {
                        background-color: #F0F9FF;
                        border-color: #00B4FF;
                        color: #00B4FF;
                    }
                    .fc .fc-button-primary:disabled { 
                        background-color: #F8FAFC; 
                        border-color: #E2E8F0; 
                        color: #94A3B8; 
                    }
                    .fc-toolbar-title { 
                        font-size: 1.25rem !important; 
                        font-weight: 700 !important; 
                        color: #1E293B !important; 
                        text-transform: capitalize;
                    }
                    .fc-event { 
                        border-radius: 6px; 
                        border: none; 
                        padding: 3px 6px; 
                        font-size: 11px; 
                        font-weight: 600; 
                        cursor: pointer; 
                        box-shadow: 0 2px 4px rgba(0,180,255,0.2); 
                        transition: transform 0.2s ease, box-shadow 0.2s ease;
                    }
                    .fc-event:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 4px 6px rgba(0,180,255,0.3);
                    }
                    .fc-daygrid-day-number { 
                        color: #1E293B; 
                        text-decoration: none; 
                        font-weight: 600; 
                        padding: 8px !important;
                    }
                    .fc-col-header-cell-cushion { 
                        color: #64748B; 
                        text-transform: uppercase; 
                        font-size: 11px; 
                        font-weight: 700; 
                        text-decoration: none; 
                        padding: 12px 0 !important;
                        letter-spacing: 0.05em;
                    }
                    .fc-theme-standard th {
                        border-color: #E2E8F0;
                        background: #F8FAFC;
                    }
                    .fc-theme-standard td {
                        border-color: #E2E8F0;
                    }
                `}</style>
                
                <FullCalendar
                    ref={calendarRef}
                    plugins={[ dayGridPlugin, timeGridPlugin, interactionPlugin ]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    events="/admin/crm/calendar/events"
                    eventClick={handleEventClick}
                    height="auto"
                    locale="es"
                    buttonText={{
                        today: 'Hoy',
                        month: 'Mes',
                        week: 'Semana',
                        day: 'Día',
                        list: 'Lista'
                    }}
                    slotMinTime="08:00:00"
                    slotMaxTime="20:00:00"
                    allDaySlot={false}
                />
            </div>

            {/* Modal for Event Details */}
            {selectedEvent && (
                <div 
                    onClick={closeEventModal}
                    style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
                        padding: '20px'
                    }}
                >
                    <div 
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '450px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            overflow: 'hidden', transform: 'translateY(0)', transition: 'all 0.3s ease'
                        }}
                    >
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', margin: 0 }}>
                                {selectedEvent.title}
                            </h3>
                            <button 
                                onClick={closeEventModal}
                                style={{
                                    background: 'transparent', border: 'none', fontSize: '20px', color: '#94A3B8',
                                    cursor: 'pointer', padding: '4px', borderRadius: '50%', transition: 'all 0.2s ease',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.color = '#1E293B'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
                            >
                                &times;
                            </button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha y Hora</label>
                                <div style={{ fontSize: '15px', color: '#1E293B', fontWeight: 500 }}>
                                    {selectedEvent.start?.toLocaleString()}
                                </div>
                            </div>
                            
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo de Actividad</label>
                                <div style={{ fontSize: '15px', textTransform: 'capitalize', color: '#00B4FF', fontWeight: 600, display: 'inline-flex', padding: '4px 10px', background: '#F0F9FF', borderRadius: '8px' }}>
                                    {selectedEvent.extendedProps?.tipo || 'Desconocido'}
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</label>
                                <div style={{ fontSize: '15px' }}>
                                    {selectedEvent.extendedProps?.completada ? (
                                        <span style={{ color: '#10B981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#D1FAE5', borderRadius: '8px' }}>✓ Completada</span>
                                    ) : (
                                        <span style={{ color: '#F59E0B', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#FEF3C7', borderRadius: '8px' }}>⏳ Pendiente</span>
                                    )}
                                </div>
                            </div>

                            {selectedEvent.extendedProps?.contenido && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notas</label>
                                    <div style={{ fontSize: '14px', color: '#334155', background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0', lineHeight: '1.5' }}>
                                        {selectedEvent.extendedProps.contenido}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', background: '#F8FAFC' }}>
                            <button 
                                onClick={closeEventModal}
                                style={{
                                    background: '#ffffff', color: '#1E293B', border: '1px solid #E2E8F0',
                                    borderRadius: '8px', padding: '8px 20px', fontWeight: 600, fontSize: '14px',
                                    cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#94A3B8'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </TwentyCrmLayout>
    );
}
