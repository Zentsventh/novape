import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import TwentyCrmLayout from '../../../Layouts/TwentyCrmLayout';
import { CheckCircle, Circle, Clock, PhoneCall, Mail, FileText, Calendar, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Tasks({ tasks = [] }) {
    const [loadingId, setLoadingId] = useState(null);

    const toggleTask = (activity) => {
        setLoadingId(activity.id);
        router.post(`/admin/crm/tasks/${activity.id}/complete`, {
            completado: activity.estado !== 'completado'
        }, {
            preserveScroll: true,
            onFinish: () => setLoadingId(null),
            onSuccess: () => {
                const action = activity.estado !== 'completado' ? 'completada' : 'reabierta';
                Swal.fire({
                    toast: true,
                    position: 'bottom-end',
                    icon: 'success',
                    title: `Tarea ${action}`,
                    showConfirmButton: false,
                    timer: 2000
                });
            }
        });
    };

    const getIcon = (type) => {
        switch(type) {
            case 'llamada': return <PhoneCall size={18} />;
            case 'email': return <Mail size={18} />;
            case 'reunion': return <Calendar size={18} />;
            default: return <FileText size={18} />;
        }
    };

    const renderTask = (activity) => {
        const isCompleted = activity.estado === 'completado';
        
        return (
            <div 
                key={activity.id} 
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px', 
                    padding: '16px', 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    opacity: isCompleted ? 0.6 : 1,
                    transition: 'opacity 0.2s'
                }}
            >
                <button 
                    onClick={() => toggleTask(activity)}
                    disabled={loadingId === activity.id}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: isCompleted ? '#10b981' : '#9ca3af',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0
                    }}
                >
                    {isCompleted ? <CheckCircle size={24} /> : <Circle size={24} />}
                </button>

                <div style={{ padding: '10px', backgroundColor: '#f3f4f6', borderRadius: '8px', color: '#4b5563' }}>
                    {getIcon(activity.tipo)}
                </div>

                <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: isCompleted ? '#6b7280' : '#111827', textDecoration: isCompleted ? 'line-through' : 'none' }}>
                        {activity.titulo}
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                        {activity.descripcion}
                    </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                    {activity.deal && (
                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#4f46e5', marginBottom: '4px' }}>
                            {activity.deal.titulo}
                        </div>
                    )}
                    {activity.fecha_vencimiento && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', fontSize: '12px', color: '#ef4444', fontWeight: 500 }}>
                            <Clock size={14} />
                            {new Date(activity.fecha_vencimiento).toLocaleString()}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const overdueTasks = tasks.filter(t => t.time_status === 'overdue');
    const todayTasks = tasks.filter(t => t.time_status === 'today');
    const upcomingTasks = tasks.filter(t => t.time_status === 'upcoming');
    const completedTasks = tasks.filter(t => t.time_status === 'completed');

    return (
        <TwentyCrmLayout title="Mis Tareas">
            <Head title="Mis Tareas" />
            
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#111827' }}>
                        Gestor Global de Tareas
                    </h1>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '15px' }}>
                        Administra todas las actividades de tus tratos desde un solo lugar.
                    </p>
                </div>

                {/* Overdue */}
                {overdueTasks.length > 0 && (
                    <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 600, color: '#ef4444', margin: '0 0 16px 0' }}>
                            <AlertCircle size={18} /> Tareas Atrasadas ({overdueTasks.length})
                        </h3>
                        <div>{overdueTasks.map(renderTask)}</div>
                    </div>
                )}

                {/* Today */}
                <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 600, color: '#10b981', margin: '0 0 16px 0' }}>
                        <Calendar size={18} /> Para Hoy ({todayTasks.length})
                    </h3>
                    {todayTasks.length > 0 ? (
                        <div>{todayTasks.map(renderTask)}</div>
                    ) : (
                        <p style={{ color: '#9ca3af', fontSize: '14px' }}>No tienes tareas para hoy. ¡Buen trabajo!</p>
                    )}
                </div>

                {/* Upcoming */}
                {upcomingTasks.length > 0 && (
                    <div style={{ marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#374151', margin: '0 0 16px 0' }}>
                            Próximas ({upcomingTasks.length})
                        </h3>
                        <div>{upcomingTasks.map(renderTask)}</div>
                    </div>
                )}

                {/* Completed */}
                {completedTasks.length > 0 && (
                    <div style={{ marginTop: '48px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#9ca3af', margin: '0 0 16px 0' }}>
                            Completadas Recientemente
                        </h3>
                        <div style={{ opacity: 0.7 }}>
                            {completedTasks.slice(0, 10).map(renderTask)}
                        </div>
                    </div>
                )}

            </div>
        </TwentyCrmLayout>
    );
}
