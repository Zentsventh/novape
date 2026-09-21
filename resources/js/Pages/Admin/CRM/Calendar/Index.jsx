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

            <div className="twenty-card" style={{ padding: '20px', minHeight: 'calc(100vh - 140px)' }}>
                <style>{`
                    .fc { --fc-button-bg-color: var(--twenty-bg-app); --fc-button-border-color: var(--twenty-border); --fc-button-text-color: var(--twenty-text-main); --fc-button-hover-bg-color: var(--twenty-bg-hover); --fc-button-hover-border-color: var(--twenty-border); --fc-button-active-bg-color: var(--twenty-bg-active); --fc-button-active-border-color: var(--twenty-border); --fc-today-bg-color: rgba(96, 165, 250, 0.05); }
                    .fc .fc-button-primary:disabled { background-color: var(--twenty-bg-app); border-color: var(--twenty-border); color: var(--twenty-text-muted); }
                    .fc-toolbar-title { font-size: 1.2rem !important; font-weight: 600 !important; color: var(--twenty-text-main) !important; }
                    .fc-event { border-radius: 4px; border: none; padding: 2px 4px; font-size: 11px; font-weight: 500; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
                    .fc-daygrid-day-number { color: var(--twenty-text-main); text-decoration: none; font-weight: 500; }
                    .fc-col-header-cell-cushion { color: var(--twenty-text-muted); text-transform: uppercase; font-size: 12px; font-weight: 600; text-decoration: none; }
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
                <div className="twenty-modal-overlay" onClick={closeEventModal}>
                    <div className="twenty-modal" onClick={e => e.stopPropagation()}>
                        <div className="twenty-modal-header">
                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--twenty-text-main)' }}>{selectedEvent.title}</h3>
                            <button className="twenty-btn-icon" onClick={closeEventModal}>×</button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--twenty-text-muted)', marginBottom: '4px' }}>Fecha y Hora</label>
                                <div style={{ fontSize: '14px', color: 'var(--twenty-text-main)' }}>
                                    {selectedEvent.start?.toLocaleString()}
                                </div>
                            </div>
                            
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--twenty-text-muted)', marginBottom: '4px' }}>Tipo de Actividad</label>
                                <div style={{ fontSize: '14px', textTransform: 'capitalize', color: 'var(--twenty-text-main)' }}>
                                    {selectedEvent.extendedProps?.tipo || 'Desconocido'}
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--twenty-text-muted)', marginBottom: '4px' }}>Estado</label>
                                <div style={{ fontSize: '14px', color: 'var(--twenty-text-main)' }}>
                                    {selectedEvent.extendedProps?.completada ? (
                                        <span style={{ color: '#22c55e', fontWeight: 500 }}>✓ Completada</span>
                                    ) : (
                                        <span style={{ color: '#f59e0b', fontWeight: 500 }}>⏳ Pendiente</span>
                                    )}
                                </div>
                            </div>

                            {selectedEvent.extendedProps?.contenido && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--twenty-text-muted)', marginBottom: '4px' }}>Notas</label>
                                    <div style={{ fontSize: '14px', color: 'var(--twenty-text-main)', background: 'var(--twenty-bg-app)', padding: '12px', borderRadius: '6px' }}>
                                        {selectedEvent.extendedProps.contenido}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={{ padding: '16px', borderTop: '1px solid var(--twenty-border)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="twenty-btn-secondary" onClick={closeEventModal}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </TwentyCrmLayout>
    );
}
