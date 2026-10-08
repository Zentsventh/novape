import React, { useState, useEffect, useRef } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import TwentyCrmLayout from '../../../../Layouts/TwentyCrmLayout';
import TwentyTable from '../../../../Components/Admin/CRM/TwentyTable';
import { Plus, Search, Filter, AlertCircle, Clock, CheckCircle, Ticket, Trash2, X } from 'lucide-react';
import { useConfirm } from '../../../../Contexts/ConfirmContext';

export default function CasesIndex({ casos = { data: [], links: [] }, filters = {} }) {
    const confirm = useConfirm();
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.estado || '');
    const [typeFilter, setTypeFilter] = useState(filters.tipo || '');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        tipo: 'consulta',
        estado: 'abierto',
        prioridad: 'media',
    });

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            router.get('/admin/crm/cases', { 
                search, 
                estado: statusFilter, 
                tipo: typeFilter 
            }, { preserveState: true });
        }
    };

    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            router.get('/admin/crm/cases', {
                search,
                estado: statusFilter,
                tipo: typeFilter
            }, { preserveState: true, replace: true, preserveScroll: true });
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [search, statusFilter, typeFilter]);

    const handleFilterChange = (key, value) => {
        if (key === 'estado') setStatusFilter(value);
        if (key === 'tipo') setTypeFilter(value);
        
        router.get('/admin/crm/cases', {
            search,
            estado: key === 'estado' ? value : statusFilter,
            tipo: key === 'tipo' ? value : typeFilter,
        }, { preserveState: true });
    };

    const handleDelete = async (id) => {
        const confirmed = await confirm('¿Estás seguro de que deseas eliminar este caso? Esta acción no se puede deshacer.', {
            title: 'Eliminar Caso',
            confirmText: 'Sí, eliminar'
        });

        if (confirmed) {
            router.delete(`/admin/crm/cases/${id}`, { preserveScroll: true });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        router.post('/admin/crm/cases', formData, {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                setFormData({ titulo: '', descripcion: '', tipo: 'consulta', estado: 'abierto', prioridad: 'media' });
            }
        });
    };

    const getPriorityStyle = (prioridad) => {
        switch(prioridad) {
            case 'urgente': return { color: '#EF4444', background: '#FEF2F2', border: '1px solid #FEE2E2' };
            case 'alta': return { color: '#F97316', background: '#FFF7ED', border: '1px solid #FFEDD5' };
            case 'media': return { color: '#EAB308', background: '#FEFCE8', border: '1px solid #FEF08A' };
            case 'baja': return { color: '#10B981', background: '#F0FDF4', border: '1px solid #DCFCE7' };
            default: return { color: '#64748B', background: '#F8FAFC', border: '1px solid #E2E8F0' };
        }
    };

    const getStatusIcon = (estado) => {
        switch(estado) {
            case 'abierto': return <AlertCircle size={14} color="#EF4444" />;
            case 'en_progreso': return <Clock size={14} color="#004797" />;
            case 'resuelto': return <CheckCircle size={14} color="#10B981" />;
            case 'cerrado': return <CheckCircle size={14} color="#64748B" />;
            default: return null;
        }
    };

    const columns = [
        {
            key: 'id',
            header: 'ID',
            accessor: 'id',
            render: (row) => <span style={{ fontWeight: 600, color: '#1E293B' }}>#{row.id}</span>
        },
        {
            key: 'titulo',
            header: 'Título',
            accessor: 'titulo',
            primary: true,
            render: (row) => (
                <div>
                    <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '14px' }}>{row.titulo}</div>
                    {row.pedido_id && (
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                            Pedido: #{row.pedido_id}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'tipo',
            header: 'Tipo',
            accessor: 'tipo',
            render: (row) => (
                <span style={{ textTransform: 'capitalize', fontSize: '12px', background: '#F8FAFC', padding: '4px 10px', borderRadius: '6px', color: '#475569', border: '1px solid #E2E8F0', fontWeight: 500 }}>
                    {row.tipo}
                </span>
            )
        },
        {
            key: 'prioridad',
            header: 'Prioridad',
            accessor: 'prioridad',
            render: (row) => (
                <span style={{ ...getPriorityStyle(row.prioridad), padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
                    {row.prioridad.toUpperCase()}
                </span>
            )
        },
        {
            key: 'estado',
            header: 'Estado',
            accessor: 'estado',
            render: (row) => (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', textTransform: 'capitalize', fontWeight: 600, color: '#1E293B', background: '#FFFFFF', padding: '4px 10px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    {getStatusIcon(row.estado)}
                    {row.estado.replace('_', ' ')}
                </div>
            )
        },
        {
            key: 'vencimiento',
            header: 'Vencimiento',
            accessor: 'fecha_vencimiento',
            render: (row) => {
                if (!row.fecha_vencimiento) return <span style={{ color: '#94A3B8', fontSize: '13px' }}>-</span>;
                const isOverdue = new Date(row.fecha_vencimiento) < new Date() && row.estado !== 'resuelto' && row.estado !== 'cerrado';
                return (
                    <span style={{ fontSize: '13px', color: isOverdue ? '#EF4444' : '#475569', fontWeight: isOverdue ? 600 : 500 }}>
                        {new Date(row.fecha_vencimiento).toLocaleDateString()}
                    </span>
                );
            }
        },
        {
            key: 'cliente',
            header: 'Cliente',
            accessor: 'cliente',
            render: (row) => (
                row.cliente ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 28, height: 28, fontSize: '11px', background: '#F8FAFC', color: '#1E293B', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, border: '1px solid #E2E8F0' }}>
                            {row.cliente.nombres?.charAt(0) || 'C'}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>
                                {row.cliente.nombres} {row.cliente.apellidos}
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748B' }}>
                                {row.cliente.email || 'Sin correo'}
                            </span>
                        </div>
                    </div>
                ) : (
                    <span style={{ color: '#94A3B8', fontSize: '13px' }}>Sin asignar</span>
                )
            )
        },
        {
            key: 'acciones',
            header: '',
            accessor: 'acciones',
            render: (row) => (
                <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} 
                    style={{ background: 'transparent', border: 'none', padding: '6px', cursor: 'pointer', borderRadius: '6px', color: '#94A3B8', transition: 'all 0.2s' }}
                    title="Eliminar Caso"
                    onMouseOver={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#FEF2F2'; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'transparent'; }}
                >
                    <Trash2 size={16} />
                </button>
            )
        }
    ];

    const [selectedRows, setSelectedRows] = useState([]);

    return (
        <TwentyCrmLayout title="Casos" headerActions={
            <button 
                onClick={() => setIsCreateModalOpen(true)}
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    background: '#004797', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '10px', 
                    padding: '10px 20px', 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    cursor: 'pointer', 
                    boxShadow: '0 2px 4px rgba(0, 71, 151, 0.15)',
                    transition: 'all 0.2s ease'
                }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 71, 151, 0.2)'; e.currentTarget.style.background = '#003670'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 71, 151, 0.15)'; e.currentTarget.style.background = '#004797'; }}
            >
                <Plus size={18} strokeWidth={2.5} />
                Nuevo Caso
            </button>
        }>
            <Head title="Casos CRM" />

            <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Top Toolbar: Search & Filters */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '450px' }}>
                        <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Search size={18} style={{ color: '#64748B' }} />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Buscar caso por ID o título..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={handleSearch}
                            style={{ 
                                width: '100%', 
                                padding: '10px 16px 10px 44px',
                                borderRadius: '8px', 
                                fontFamily: 'Inter, system-ui, sans-serif', 
                                fontSize: '14px', 
                                fontWeight: 500,
                                color: '#1E293B',
                                border: '1px solid #E2E8F0',
                                backgroundColor: '#F8FAFC',
                                outline: 'none',
                                transition: 'all 0.2s ease',
                                boxSizing: 'border-box'
                            }}
                            onFocus={e => {
                                e.currentTarget.style.backgroundColor = '#FFFFFF';
                                e.currentTarget.style.borderColor = '#004797';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 71, 151, 0.15)';
                            }}
                            onBlur={e => {
                                e.currentTarget.style.backgroundColor = '#F8FAFC';
                                e.currentTarget.style.borderColor = '#E2E8F0';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        />
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--twenty-text-muted)', fontSize: '13px', fontWeight: 600 }}>
                            <Filter size={14} /> Filtros:
                        </div>
                        <select 
                            className="twenty-input" 
                            value={statusFilter} 
                            onChange={e => handleFilterChange('estado', e.target.value)}
                            style={{ width: '160px', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 500 }}
                        >
                            <option value="">Todos los Estados</option>
                            <option value="abierto">Abiertos</option>
                            <option value="en_progreso">En Progreso</option>
                            <option value="resuelto">Resueltos</option>
                            <option value="cerrado">Cerrados</option>
                        </select>

                        <select 
                            className="twenty-input" 
                            value={typeFilter} 
                            onChange={e => handleFilterChange('tipo', e.target.value)}
                            style={{ width: '160px', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 500 }}
                        >
                            <option value="">Todos los Tipos</option>
                            <option value="devolucion">Devoluciones</option>
                            <option value="demora">Demoras</option>
                            <option value="reclamo">Reclamos</option>
                            <option value="consulta">Consultas</option>
                        </select>
                    </div>
                </div>

                {/* Main Table Card */}
                <div className="twenty-card" style={{ padding: 0, overflow: 'hidden' }}>
                    {casos.data.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>
                            <Ticket size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1E293B', marginBottom: '8px' }}>No hay casos</h3>
                            <p style={{ fontSize: '14px', marginBottom: '24px' }}>Crea tu primer ticket de soporte para hacer seguimiento.</p>
                            <button 
                                onClick={() => setIsCreateModalOpen(true)}
                                style={{
                                    background: '#004797', color: 'white', border: 'none', borderRadius: '10px', 
                                    padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = '#003670'}
                                onMouseOut={e => e.currentTarget.style.background = '#004797'}
                            >
                                Crear Caso
                            </button>
                        </div>
                    ) : (
                        <TwentyTable 
                            columns={columns} 
                            data={casos.data} 
                            selectedRows={selectedRows}
                            onSelectionChange={setSelectedRows}
                            onRowClick={(row) => router.visit(`/admin/crm/cases/${row.id}`)}
                        />
                    )}
                </div>
            </div>

            {/* Paginación simple */}
            {casos.links && casos.links.length > 3 && (
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    {casos.links.map((link, idx) => (
                        <Link 
                            key={idx}
                            href={link.url || '#'}
                            className={`px-3 py-1 rounded text-sm ${link.active ? 'bg-blue-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-50'}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}

            {isCreateModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
                    <div style={{ backgroundColor: 'var(--twenty-bg-app)', borderRadius: '16px', width: '100%', maxWidth: '540px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid var(--twenty-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--twenty-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--twenty-bg-surface)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--twenty-text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Ticket size={20} style={{ color: 'var(--twenty-primary)' }} />
                                Crear Nuevo Caso
                            </h3>
                            <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--twenty-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--twenty-bg-hover)'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '8px' }}>Título del Problema</label>
                                <input 
                                    type="text" 
                                    required 
                                    style={{ 
                                        width: '100%', 
                                        padding: '12px 16px',
                                        borderRadius: '10px', 
                                        fontFamily: 'Inter, system-ui, sans-serif', 
                                        fontSize: '14px', 
                                        fontWeight: 500,
                                        color: '#1E293B',
                                        border: '1px solid #E2E8F0',
                                        backgroundColor: '#F8FAFC',
                                        outline: 'none',
                                        transition: 'all 0.2s ease',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={e => {
                                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                                        e.currentTarget.style.borderColor = '#004797';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 71, 151, 0.15)';
                                    }}
                                    onBlur={e => {
                                        e.currentTarget.style.backgroundColor = '#F8FAFC';
                                        e.currentTarget.style.borderColor = '#E2E8F0';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                    value={formData.titulo}
                                    onChange={e => setFormData({...formData, titulo: e.target.value})}
                                />
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '8px' }}>Tipo</label>
                                    <select 
                                        style={{ 
                                            width: '100%', 
                                            padding: '12px 16px',
                                            borderRadius: '10px', 
                                            fontFamily: 'Inter, system-ui, sans-serif', 
                                            fontSize: '14px', 
                                            fontWeight: 500,
                                            color: '#1E293B',
                                            border: '1px solid #E2E8F0',
                                            backgroundColor: '#F8FAFC',
                                            outline: 'none',
                                            transition: 'all 0.2s ease',
                                            boxSizing: 'border-box',
                                            cursor: 'pointer'
                                        }}
                                        onFocus={e => {
                                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                                            e.currentTarget.style.borderColor = '#004797';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 71, 151, 0.15)';
                                        }}
                                        onBlur={e => {
                                            e.currentTarget.style.backgroundColor = '#F8FAFC';
                                            e.currentTarget.style.borderColor = '#E2E8F0';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                        value={formData.tipo}
                                        onChange={e => setFormData({...formData, tipo: e.target.value})}
                                    >
                                        <option value="consulta">Consulta</option>
                                        <option value="reclamo">Reclamo</option>
                                        <option value="devolucion">Devolución</option>
                                        <option value="demora">Demora</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '8px' }}>Prioridad</label>
                                    <select 
                                        style={{ 
                                            width: '100%', 
                                            padding: '12px 16px',
                                            borderRadius: '10px', 
                                            fontFamily: 'Inter, system-ui, sans-serif', 
                                            fontSize: '14px', 
                                            fontWeight: 500,
                                            color: '#1E293B',
                                            border: '1px solid #E2E8F0',
                                            backgroundColor: '#F8FAFC',
                                            outline: 'none',
                                            transition: 'all 0.2s ease',
                                            boxSizing: 'border-box',
                                            cursor: 'pointer'
                                        }}
                                        onFocus={e => {
                                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                                            e.currentTarget.style.borderColor = '#004797';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 71, 151, 0.15)';
                                        }}
                                        onBlur={e => {
                                            e.currentTarget.style.backgroundColor = '#F8FAFC';
                                            e.currentTarget.style.borderColor = '#E2E8F0';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                        value={formData.prioridad}
                                        onChange={e => setFormData({...formData, prioridad: e.target.value})}
                                    >
                                        <option value="baja">Baja</option>
                                        <option value="media">Media</option>
                                        <option value="alta">Alta</option>
                                        <option value="urgente">Urgente</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '8px' }}>Descripción (Opcional)</label>
                                <textarea 
                                    style={{ 
                                        width: '100%', 
                                        minHeight: '100px', 
                                        resize: 'vertical',
                                        padding: '12px 16px',
                                        borderRadius: '10px', 
                                        fontFamily: 'Inter, system-ui, sans-serif', 
                                        fontSize: '14px', 
                                        fontWeight: 500,
                                        color: '#1E293B',
                                        border: '1px solid #E2E8F0',
                                        backgroundColor: '#F8FAFC',
                                        outline: 'none',
                                        transition: 'all 0.2s ease',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={e => {
                                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                                        e.currentTarget.style.borderColor = '#004797';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 71, 151, 0.15)';
                                    }}
                                    onBlur={e => {
                                        e.currentTarget.style.backgroundColor = '#F8FAFC';
                                        e.currentTarget.style.borderColor = '#E2E8F0';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                    value={formData.descripcion}
                                    onChange={e => setFormData({...formData, descripcion: e.target.value})}
                                    placeholder="Detalles adicionales del caso..."
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setIsCreateModalOpen(false)}
                                    style={{
                                        background: 'transparent',
                                        color: '#64748B',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '8px',
                                        padding: '10px 20px',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseOver={e => {
                                        e.currentTarget.style.background = '#F8FAFC';
                                        e.currentTarget.style.color = '#0F172A';
                                    }}
                                    onMouseOut={e => {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = '#64748B';
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    style={{
                                        background: '#004797',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        padding: '10px 24px',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 4px rgba(0, 71, 151, 0.15)',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseOver={e => {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 71, 151, 0.2)';
                                        e.currentTarget.style.background = '#003670';
                                    }}
                                    onMouseOut={e => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 71, 151, 0.15)';
                                        e.currentTarget.style.background = '#004797';
                                    }}
                                >
                                    Guardar Caso
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </TwentyCrmLayout>
    );
}
