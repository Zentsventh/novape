import React, { useState, useEffect } from 'react';
import { Head, router, Link, useForm } from '@inertiajs/react';
import TwentyCrmLayout from '../../../Layouts/TwentyCrmLayout';
import { CheckCircle, Circle, Clock, PhoneCall, Mail, FileText, Calendar, AlertCircle, Trash2, Search, Filter, Plus, Edit2 } from 'lucide-react';
import Swal from 'sweetalert2';
import TwentyRecordDrawer from '../../../Components/Admin/CRM/TwentyRecordDrawer';
import RemoteSelect from '../../../Components/Admin/RemoteSelect';

export default function Tasks({ tasks = [] }) {
    const [loadingId, setLoadingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('todas');

    const { data, setData, post, put, reset, errors, clearErrors, processing } = useForm({
        id: null,
        deal_id: '',
        empresa_id: '',
        tipo: 'tarea',
        contenido: '',
        fecha_vencimiento: ''
    });

    const [drawerOpen, setDrawerOpen] = useState(false);

    const openDrawer = (task = null) => {
        clearErrors();
        if (task) {
            setData({
                id: task.id,
                deal_id: task.deal_id || '',
                empresa_id: task.empresa_id || '',
                tipo: task.tipo || 'tarea',
                contenido: task.contenido || '',
                // Slicing to correctly format datetime-local input YYYY-MM-DDTHH:mm
                fecha_vencimiento: task.fecha_vencimiento ? (() => { const date = new Date(task.fecha_vencimiento); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`; })() : ''
            });
        } else {
            reset();
        }
        setDrawerOpen(true);
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        reset();
    };
    useEffect(() => { if (new URLSearchParams(window.location.search).get('create') === 'true') openDrawer(); }, []);

    const submitTask = (e) => {
        e.preventDefault();
        if (processing) return;
        const isUpdate = !!data.id;
        const routeStr = isUpdate ? `/admin/crm/tasks/${data.id}` : '/admin/crm/tasks';
        
        const method = isUpdate ? put : post;
        
        method(routeStr, {
            onSuccess: () => {
                closeDrawer();
                Swal.fire({
                    toast: true,
                    position: 'bottom-end',
                    icon: 'success',
                    title: isUpdate ? 'Tarea actualizada' : 'Tarea creada',
                    showConfirmButton: false,
                    timer: 2000,
                    customClass: { popup: 'premium-toast' }
                });
            }
        });
    };

    const deleteTask = (id) => {
        Swal.fire({
            title: '¿Eliminar tarea?',
            text: 'Esta acción no se puede deshacer y borrará la tarea permanentemente.',
            icon: 'warning',
            iconColor: '#EF4444',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            customClass: {
                popup: 'premium-swal-popup',
                title: 'premium-swal-title',
                htmlContainer: 'premium-swal-text',
                confirmButton: 'premium-swal-confirm',
                cancelButton: 'premium-swal-cancel',
                actions: 'premium-swal-actions',
                icon: 'premium-swal-icon'
            },
            buttonsStyling: false
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(`/admin/crm/tasks/${id}`, {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire({
                            toast: true,
                            position: 'bottom-end',
                            icon: 'success',
                            title: 'Tarea eliminada',
                            showConfirmButton: false,
                            timer: 2000,
                            customClass: { popup: 'premium-toast' }
                        });
                    }
                });
            }
        });
    };

    const toggleTask = (activity) => {
        setLoadingId(activity.id);
        router.post(`/admin/crm/tasks/${activity.id}/complete`, {
            completado: !activity.completada
        }, {
            preserveScroll: true,
            onFinish: () => setLoadingId(null),
            onSuccess: () => {
                const action = !activity.completada ? 'completada' : 'reabierta';
                Swal.fire({
                    toast: true,
                    position: 'bottom-end',
                    icon: 'success',
                    title: `Tarea ${action}`,
                    showConfirmButton: false,
                    timer: 2000,
                    customClass: {
                        popup: 'premium-toast'
                    }
                });
            }
        });
    };

    const getIcon = (type) => {
        switch(type) {
            case 'llamada': return <PhoneCall size={16} />;
            case 'email': return <Mail size={16} />;
            case 'reunion': return <Calendar size={16} />;
            default: return <FileText size={16} />;
        }
    };

    const renderTask = (activity) => {
        const isCompleted = activity.completada;
        const isOverdue = activity.time_status === 'overdue';
        const isToday = activity.time_status === 'today';
        
        return (
            <div 
                key={activity.id} 
                className={`premium-task-card ${isCompleted ? 'completed' : ''}`}
            >
                <button 
                    onClick={() => toggleTask(activity)}
                    disabled={loadingId === activity.id}
                    className={`premium-checkbox-btn ${isCompleted ? 'checked' : ''}`}
                >
                    {isCompleted ? <CheckCircle size={22} /> : <Circle size={22} />}
                </button>

                <div className="premium-icon-box">
                    {getIcon(activity.tipo)}
                </div>

                <div className="premium-task-content">
                    <h4 className="premium-task-title">
                        {activity.contenido || 'Sin descripción'}
                    </h4>
                </div>

                <div className="premium-task-meta">
                    {activity.deal && (
                        <Link href={`/admin/crm/pipeline?search=${encodeURIComponent(activity.deal.titulo)}`} className="premium-task-deal">
                            {activity.deal.titulo}
                        </Link>
                    )}
                    {!activity.deal && activity.empresa && (
                        <Link href={`/admin/crm/companies/${activity.empresa.id}`} className="premium-task-deal">
                            {activity.empresa.nombre}
                        </Link>
                    )}
                    {activity.fecha_vencimiento && (
                        <div className={`premium-task-date ${isOverdue ? 'overdue' : isToday ? 'today' : ''}`}>
                            <Clock size={13} style={{ flexShrink: 0 }} />
                            {new Date(activity.fecha_vencimiento).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                    )}
                </div>

                <div className="premium-task-actions">
                    <button 
                        onClick={() => openDrawer(activity)}
                        className="premium-action-btn edit"
                        title="Editar tarea"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button 
                        onClick={() => deleteTask(activity.id)}
                        className="premium-action-btn delete"
                        title="Eliminar tarea"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        );
    };

    const filteredTasks = tasks.filter(t => {
        const titleMatch = t.titulo ? t.titulo.toLowerCase().includes(searchQuery.toLowerCase()) : false;
        const descMatch = t.descripcion ? t.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) : false;
        const contentMatch = t.contenido ? t.contenido.toLowerCase().includes(searchQuery.toLowerCase()) : false;
        
        const matchesSearch = titleMatch || descMatch || contentMatch;
        const matchesType = filterType === 'todas' || t.tipo === filterType;
        
        return matchesSearch && matchesType;
    });

    const overdueTasks = filteredTasks.filter(t => t.time_status === 'overdue');
    const todayTasks = filteredTasks.filter(t => t.time_status === 'today');
    const upcomingTasks = filteredTasks.filter(t => t.time_status === 'upcoming');
    const completedTasks = filteredTasks.filter(t => t.time_status === 'completed');

    return (
        <TwentyCrmLayout title="Mis Tareas">
            <Head title="Mis Tareas" />
            
            <style>{`
                .premium-tasks-wrapper {
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 40px 32px;
                    font-family: inherit;
                }
                .premium-page-title {
                    font-size: 28px;
                    font-weight: 700;
                    margin: 0 0 8px 0;
                    color: #1E293B;
                    letter-spacing: -0.02em;
                }
                .premium-page-subtitle {
                    margin: 0;
                    color: #64748B;
                    font-size: 15px;
                }
                .premium-section-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 15px;
                    font-weight: 600;
                    margin: 0 0 16px 0;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .premium-section-title.overdue { color: #EF4444; }
                .premium-section-title.today { color: #004797; }
                .premium-section-title.upcoming { color: #475569; }
                .premium-section-title.completed { color: #94A3B8; }
                
                .premium-task-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 40px;
                }

                .premium-task-card {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px 20px;
                    background-color: #FFFFFF;
                    border: 1px solid #E2E8F0;
                    border-radius: 12px;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
                    transition: all 0.2s ease;
                }
                .premium-task-card:hover {
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -2px rgba(0,0,0,0.03);
                    border-color: #CBD5E1;
                    transform: translateY(-1px);
                }
                .premium-task-card.completed {
                    opacity: 0.6;
                    background-color: #F8FAFC;
                    box-shadow: none;
                }
                .premium-task-card.completed:hover {
                    transform: none;
                }

                .premium-checkbox-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #94A3B8;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0;
                    transition: all 0.2s ease;
                }
                .premium-checkbox-btn:hover:not(:disabled) {
                    color: #004797;
                    transform: scale(1.1);
                }
                .premium-checkbox-btn.checked {
                    color: #004797;
                }
                .premium-checkbox-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .premium-icon-box {
                    padding: 10px;
                    background-color: #F8FAFC;
                    border: 1px solid #E2E8F0;
                    border-radius: 10px;
                    color: #64748B;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .premium-task-content {
                    flex: 1;
                    min-width: 0; /* allows text truncation if needed */
                }
                .premium-task-title {
                    margin: 0 0 4px 0;
                    font-size: 15px;
                    font-weight: 600;
                    color: #1E293B;
                    transition: color 0.2s ease;
                }
                .premium-task-card.completed .premium-task-title {
                    color: #64748B;
                    text-decoration: line-through;
                }
                .premium-task-desc {
                    margin: 0;
                    font-size: 13px;
                    color: #64748B;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .premium-task-meta {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 6px;
                    text-align: right;
                }
                .premium-task-deal {
                    font-size: 12px;
                    font-weight: 600;
                    color: #004797;
                    background: rgba(0, 71, 151, 0.1);
                    padding: 4px 10px;
                    border-radius: 6px;
                    text-decoration: none;
                    transition: all 0.2s ease;
                }
                .premium-task-deal:hover {
                    background: rgba(0, 71, 151, 0.15);
                    transform: scale(1.02);
                }
                
                .premium-task-date {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 12px;
                    color: #64748B;
                    font-weight: 500;
                }
                .premium-task-date.overdue {
                    color: #EF4444;
                }
                .premium-task-date.today {
                    color: #004797;
                }

                .premium-empty-state {
                    padding: 32px;
                    text-align: center;
                    color: #94A3B8;
                    font-size: 14px;
                    background: #F8FAFC;
                    border-radius: 12px;
                    border: 1px dashed #E2E8F0;
                }
                
                /* Toast Customization */
                .premium-toast {
                    border-radius: 12px !important;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
                    font-family: inherit !important;
                }

                /* New Toolbar & Actions CSS */
                .premium-toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 32px;
                    flex-wrap: wrap;
                }
                .premium-search-box {
                    position: relative;
                    flex: 1;
                    min-width: 250px;
                }
                .premium-search-box .search-icon {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #94A3B8;
                }
                .premium-search-box input {
                    width: 100%;
                    padding: 10px 16px 10px 40px;
                    border: 1px solid #E2E8F0;
                    border-radius: 10px;
                    font-size: 14px;
                    outline: none;
                    transition: all 0.2s;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
                }
                .premium-search-box input:focus {
                    border-color: #004797;
                    box-shadow: 0 0 0 3px rgba(0, 71, 151, 0.1);
                }
                .premium-filters {
                    display: flex;
                    gap: 8px;
                    overflow-x: auto;
                    padding-bottom: 4px;
                }
                .premium-filter-btn {
                    padding: 8px 16px;
                    background: #F8FAFC;
                    border: 1px solid #E2E8F0;
                    border-radius: 20px;
                    font-size: 13px;
                    font-weight: 500;
                    color: #64748B;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }
                .premium-filter-btn:hover {
                    background: #F1F5F9;
                    color: #1E293B;
                }
                .premium-filter-btn.active {
                    background: #1E293B;
                    color: #FFFFFF;
                    border-color: #1E293B;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .premium-task-actions {
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    margin-left: 8px;
                    display: flex;
                    align-items: center;
                }
                .premium-task-card:hover .premium-task-actions {
                    opacity: 1;
                }
                .premium-action-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                    color: #94A3B8;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .premium-action-btn:hover {
                    background: #F1F5F9;
                    color: #1E293B;
                }
                .premium-action-btn.delete:hover {
                    background: #FEF2F2;
                    color: #EF4444;
                }
                
                .premium-swal-popup {
                    border-radius: 16px !important;
                    padding: 32px 24px !important;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15) !important;
                    font-family: inherit !important;
                    border: 1px solid #E2E8F0 !important;
                }
                .premium-swal-title {
                    font-size: 20px !important;
                    font-weight: 700 !important;
                    color: #1E293B !important;
                    margin-bottom: 8px !important;
                }
                .premium-swal-text {
                    font-size: 15px !important;
                    color: #64748B !important;
                    margin-bottom: 8px !important;
                }
                .premium-swal-icon {
                    border: none !important;
                    background: #FEF2F2 !important;
                    margin-bottom: 24px !important;
                }
                .premium-swal-actions {
                    gap: 12px !important;
                    margin-top: 24px !important;
                }
                .premium-swal-confirm {
                    background: #EF4444 !important;
                    color: #FFFFFF !important;
                    padding: 12px 24px !important;
                    border-radius: 10px !important;
                    font-weight: 600 !important;
                    font-size: 14px !important;
                    border: none !important;
                    cursor: pointer !important;
                    transition: all 0.2s ease !important;
                    box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2) !important;
                }
                .premium-swal-confirm:hover {
                    background: #DC2626 !important;
                    transform: translateY(-1px) !important;
                    box-shadow: 0 6px 10px -1px rgba(239, 68, 68, 0.3) !important;
                }
                .premium-swal-cancel {
                    background: #FFFFFF !important;
                    color: #475569 !important;
                    padding: 12px 24px !important;
                    border-radius: 10px !important;
                    font-weight: 600 !important;
                    font-size: 14px !important;
                    border: 1px solid #E2E8F0 !important;
                    cursor: pointer !important;
                    transition: all 0.2s ease !important;
                }
                .premium-swal-cancel:hover {
                    background: #F8FAFC !important;
                    color: #1E293B !important;
                    border-color: #CBD5E1 !important;
                }
                .premium-create-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: #004797;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 6px -1px rgba(0, 71, 151, 0.2);
                }
                .premium-create-btn:hover {
                    background: #009be5;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 8px -1px rgba(0, 71, 151, 0.3);
                }
                .premium-action-btn.edit:hover {
                    background: #EFF6FF;
                    color: #004797;
                }
                /* Drawer Form Premium Styles */
                .premium-form-container {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    padding: 8px 4px;
                }
                .premium-form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .premium-label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #475569;
                    letter-spacing: 0.01em;
                }
                .premium-input {
                    padding: 12px 16px;
                    border: 1px solid #E2E8F0;
                    border-radius: 10px;
                    font-size: 14px;
                    color: #1E293B;
                    background: #FFFFFF;
                    outline: none;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
                    font-family: inherit;
                    width: 100%;
                    box-sizing: border-box;
                }
                .premium-input::placeholder {
                    color: #94A3B8;
                }
                .premium-input:focus {
                    border-color: #004797;
                    box-shadow: 0 0 0 3px rgba(0, 71, 151, 0.15);
                    background: #FFFFFF;
                }
                textarea.premium-input {
                    resize: vertical;
                    min-height: 80px;
                }
                select.premium-input {
                    cursor: pointer;
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 12px center;
                    padding-right: 40px;
                }
                .premium-drawer-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    margin-top: 32px;
                    padding-top: 24px;
                    border-top: 1px solid #F1F5F9;
                }
                .premium-btn-secondary {
                    padding: 10px 20px;
                    border-radius: 10px;
                    border: 1px solid #E2E8F0;
                    background: #FFFFFF;
                    font-weight: 600;
                    font-size: 14px;
                    color: #475569;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .premium-btn-secondary:hover {
                    background: #F8FAFC;
                    color: #1E293B;
                    border-color: #CBD5E1;
                }
                .premium-btn-primary {
                    padding: 10px 24px;
                    border-radius: 10px;
                    border: none;
                    background: #004797;
                    font-weight: 600;
                    font-size: 14px;
                    color: #FFFFFF;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 6px -1px rgba(0, 71, 151, 0.2), 0 2px 4px -1px rgba(0, 71, 151, 0.1);
                }
                .premium-btn-primary:hover {
                    background: #009be5;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 10px -1px rgba(0, 71, 151, 0.3), 0 2px 4px -1px rgba(0, 71, 151, 0.1);
                }
            `}</style>

            <div className="premium-tasks-wrapper">
                <div style={{ marginBottom: '32px' }}>
                    <h1 className="premium-page-title">
                        Gestor Global de Tareas
                    </h1>
                    <p className="premium-page-subtitle">
                        Administra todas las actividades de tus tratos desde un solo lugar.
                    </p>
                </div>

                <div className="premium-toolbar">
                    <div className="premium-search-box">
                        <Search size={16} className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Buscar tareas por título o descripción..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="premium-filters">
                        {['todas', 'llamada', 'email', 'reunion', 'tarea'].map(type => (
                            <button 
                                key={type}
                                className={`premium-filter-btn ${filterType === type ? 'active' : ''}`}
                                onClick={() => setFilterType(type)}
                            >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                        ))}
                    </div>
                    <button className="premium-create-btn" onClick={() => openDrawer()}>
                        <Plus size={18} /> Nueva Tarea
                    </button>
                </div>

                {/* Overdue */}
                {overdueTasks.length > 0 && (
                    <div className="premium-task-list">
                        <h3 className="premium-section-title overdue">
                            <AlertCircle size={16} /> Tareas Atrasadas ({overdueTasks.length})
                        </h3>
                        {overdueTasks.map(renderTask)}
                    </div>
                )}

                {/* Today */}
                <div className="premium-task-list">
                    <h3 className="premium-section-title today">
                        <Calendar size={16} /> Para Hoy ({todayTasks.length})
                    </h3>
                    {todayTasks.length > 0 ? (
                        todayTasks.map(renderTask)
                    ) : (
                        <div className="premium-empty-state">
                            No tienes tareas pendientes para hoy. ¡Estás al día!
                        </div>
                    )}
                </div>

                {/* Upcoming */}
                {upcomingTasks.length > 0 && (
                    <div className="premium-task-list">
                        <h3 className="premium-section-title upcoming">
                            <Clock size={16} /> Próximas ({upcomingTasks.length})
                        </h3>
                        {upcomingTasks.map(renderTask)}
                    </div>
                )}

                {/* Completed */}
                {completedTasks.length > 0 && (
                    <div className="premium-task-list" style={{ marginTop: '24px' }}>
                        <h3 className="premium-section-title completed">
                            <CheckCircle size={16} /> Completadas Recientemente
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {completedTasks.slice(0, 10).map(renderTask)}
                        </div>
                    </div>
                )}

            </div>

            <TwentyRecordDrawer
                isOpen={drawerOpen}
                onClose={closeDrawer}
                title={data.id ? 'Editar Tarea' : 'Nueva Tarea'}
                icon={<Calendar size={20} style={{ color: '#004797' }} />}
            >
                <form onSubmit={submitTask} className="premium-form-container">
                    <div className="premium-form-group">
                        <label className="premium-label">Contenido de la Tarea</label>
                        <textarea
                            className="premium-input"
                            value={data.contenido}
                            onChange={e => setData('contenido', e.target.value)}
                            rows={3}
                            required
                            maxLength={5000}
                        />
                        {errors.contenido && <span className="twenty-error" style={{color: '#ef4444', fontSize: '12px', marginTop: '2px'}}>{errors.contenido}</span>}
                    </div>

                    <div className="premium-form-group">
                        <RemoteSelect label="Empresa asociada" endpoint="/admin/crm/selectores/empresas"
                            value={data.empresa_id} onChange={value => setData('empresa_id', value)} />
                        {errors.empresa_id && <span className="twenty-error">{errors.empresa_id}</span>}
                    </div>
                    <div className="premium-form-group">
                        <RemoteSelect label="Oportunidad asociada" endpoint="/admin/crm/selectores/oportunidades"
                            value={data.deal_id} onChange={value => setData('deal_id', value)}
                            getLabel={row => row.titulo || row.nombre} required={!data.empresa_id} />
                        {errors.deal_id && <span className="twenty-error" style={{color: '#ef4444', fontSize: '12px', marginTop: '2px'}}>{errors.deal_id}</span>}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="premium-form-group">
                            <label className="premium-label">Tipo de Actividad</label>
                            <select
                                className="premium-input"
                                value={data.tipo}
                                onChange={e => setData('tipo', e.target.value)}
                            >
                                <option value="tarea">Tarea</option>
                                <option value="llamada">Llamada</option>
                                <option value="email">Email</option>
                                <option value="reunion">Reunión</option>
                            </select>
                            {errors.tipo && <span className="twenty-error" style={{color: '#ef4444', fontSize: '12px', marginTop: '2px'}}>{errors.tipo}</span>}
                        </div>

                        <div className="premium-form-group">
                            <label className="premium-label">Fecha y Hora</label>
                            <input
                                type="datetime-local"
                                className="premium-input"
                                value={data.fecha_vencimiento}
                                onChange={e => setData('fecha_vencimiento', e.target.value)}
                            />
                            {errors.fecha_vencimiento && <span className="twenty-error" style={{color: '#ef4444', fontSize: '12px', marginTop: '2px'}}>{errors.fecha_vencimiento}</span>}
                        </div>
                    </div>

                    <div className="premium-drawer-actions">
                        <button type="button" className="premium-btn-secondary" onClick={closeDrawer}>
                            Cancelar
                        </button>
                        <button type="submit" className="premium-btn-primary" disabled={processing}>
                            {processing ? 'Guardando…' : data.id ? 'Guardar Cambios' : 'Crear Tarea'}
                        </button>
                    </div>
                </form>
            </TwentyRecordDrawer>
        </TwentyCrmLayout>
    );
}
