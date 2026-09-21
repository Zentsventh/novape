import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import TwentyCrmLayout from '../../../../Layouts/TwentyCrmLayout';
import { Plus, Search, Filter, AlertCircle, Clock, CheckCircle, Ticket, X } from 'lucide-react';
import { useConfirm } from '../../../../Contexts/ConfirmContext';

export default function CasesIndex({ casos = { data: [], links: [] }, filters = {} }) {
    const { confirm } = useConfirm();
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

    const handleFilterChange = (key, value) => {
        if (key === 'estado') setStatusFilter(value);
        if (key === 'tipo') setTypeFilter(value);
        
        router.get('/admin/crm/cases', {
            search,
            estado: key === 'estado' ? value : statusFilter,
            tipo: key === 'tipo' ? value : typeFilter,
        }, { preserveState: true });
    };

    const handleDelete = (id) => {
        confirm({
            title: 'Eliminar Caso',
            message: '¿Estás seguro de que deseas eliminar este caso? Esta acción no se puede deshacer.',
            confirmText: 'Sí, eliminar',
            cancelText: 'Cancelar',
            type: 'danger',
            onConfirm: () => {
                router.delete(`/admin/crm/cases/${id}`, { preserveScroll: true });
            }
        });
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

    const getPriorityColor = (prioridad) => {
        switch(prioridad) {
            case 'urgente': return 'bg-red-100 text-red-700';
            case 'alta': return 'bg-orange-100 text-orange-700';
            case 'media': return 'bg-yellow-100 text-yellow-700';
            case 'baja': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusIcon = (estado) => {
        switch(estado) {
            case 'abierto': return <AlertCircle size={14} className="text-red-500" />;
            case 'en_progreso': return <Clock size={14} className="text-blue-500" />;
            case 'resuelto': return <CheckCircle size={14} className="text-green-500" />;
            case 'cerrado': return <CheckCircle size={14} className="text-gray-500" />;
            default: return null;
        }
    };

    return (
        <TwentyCrmLayout title="Casos y Soporte" headerActions={
            <button 
                className="twenty-btn-primary" 
                onClick={() => setIsCreateModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
                <Plus size={16} />
                Nuevo Caso
            </button>
        }>
            <Head title="Casos CRM" />

            <div className="twenty-card" style={{ marginBottom: '24px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--twenty-text-muted)' }} />
                    <input 
                        type="text" 
                        placeholder="Buscar casos por título o ID..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={handleSearch}
                        className="twenty-input"
                        style={{ paddingLeft: '36px', width: '100%' }}
                    />
                </div>
                
                <select 
                    className="twenty-input" 
                    value={statusFilter} 
                    onChange={e => handleFilterChange('estado', e.target.value)}
                    style={{ width: '180px' }}
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
                    style={{ width: '180px' }}
                >
                    <option value="">Todos los Tipos</option>
                    <option value="devolucion">Devoluciones</option>
                    <option value="demora">Demoras</option>
                    <option value="reclamo">Reclamos</option>
                    <option value="consulta">Consultas</option>
                </select>
            </div>

            <div className="twenty-card" style={{ padding: 0, overflow: 'hidden' }}>
                {casos.data.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--twenty-text-muted)' }}>
                        <Ticket size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--twenty-text-main)', marginBottom: '8px' }}>No hay casos</h3>
                        <p style={{ fontSize: '14px', marginBottom: '24px' }}>Crea tu primer ticket de soporte para hacer seguimiento.</p>
                        <button className="twenty-btn-primary" onClick={() => setIsCreateModalOpen(true)}>Crear Caso</button>
                    </div>
                ) : (
                    <table className="twenty-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Título</th>
                                <th>Tipo</th>
                                <th>Prioridad</th>
                                <th>Estado</th>
                                <th>Cliente</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {casos.data.map(caso => (
                                <tr key={caso.id}>
                                    <td style={{ fontWeight: 600 }}>#{caso.id}</td>
                                    <td>
                                        <div style={{ fontWeight: 500, color: 'var(--twenty-text-main)' }}>{caso.titulo}</div>
                                        {caso.pedido_id && (
                                            <div style={{ fontSize: '12px', color: 'var(--twenty-text-muted)', marginTop: '4px' }}>
                                                Pedido: #{caso.pedido_id}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span style={{ textTransform: 'capitalize', fontSize: '13px' }}>
                                            {caso.tipo}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(caso.prioridad)}`}>
                                            {caso.prioridad.toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', textTransform: 'capitalize' }}>
                                            {getStatusIcon(caso.estado)}
                                            {caso.estado.replace('_', ' ')}
                                        </div>
                                    </td>
                                    <td>
                                        {caso.cliente ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--twenty-bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>
                                                    {caso.cliente.nombres?.charAt(0) || 'C'}
                                                </div>
                                                <span style={{ fontSize: '13px' }}>{caso.cliente.nombres} {caso.cliente.apellidos}</span>
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--twenty-text-muted)' }}>Sin asignar</span>
                                        )}
                                    </td>
                                    <td>
                                        <button className="twenty-btn-icon" onClick={() => handleDelete(caso.id)}>
                                            <X size={14} className="text-red-500" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
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

            {/* Modal de Creación */}
            {isCreateModalOpen && (
                <div className="twenty-modal-overlay">
                    <div className="twenty-modal">
                        <div className="twenty-modal-header">
                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--twenty-text-main)' }}>Crear Nuevo Caso</h3>
                            <button className="twenty-btn-icon" onClick={() => setIsCreateModalOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Título del Problema</label>
                                <input 
                                    type="text" 
                                    required 
                                    className="twenty-input" 
                                    style={{ width: '100%' }}
                                    value={formData.titulo}
                                    onChange={e => setFormData({...formData, titulo: e.target.value})}
                                    placeholder="Ej. Producto dañado en el envío"
                                />
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Tipo</label>
                                    <select 
                                        className="twenty-input" 
                                        style={{ width: '100%' }}
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
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Prioridad</label>
                                    <select 
                                        className="twenty-input" 
                                        style={{ width: '100%' }}
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
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Descripción (Opcional)</label>
                                <textarea 
                                    className="twenty-input" 
                                    style={{ width: '100%', minHeight: '100px', resize: 'vertical' }}
                                    value={formData.descripcion}
                                    onChange={e => setFormData({...formData, descripcion: e.target.value})}
                                    placeholder="Detalles adicionales del caso..."
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                                <button type="button" className="twenty-btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancelar</button>
                                <button type="submit" className="twenty-btn-primary">Guardar Caso</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </TwentyCrmLayout>
    );
}
