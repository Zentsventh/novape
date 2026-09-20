import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import CrmLayout from '../../../Layouts/CrmLayout';
import { MoreHorizontal, Plus, Clock, DollarSign, Calendar, Users, Filter, Search, Zap } from 'lucide-react';
import Swal from 'sweetalert2';
import DealDrawer from '../../../Components/Admin/CRM/DealDrawer';

export default function Pipeline({ stages, deals, filters }) {
    if (!stages || stages.length === 0) {
        return (
            <CrmLayout title="CRM Enterprise 360°">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#6b7280' }}>
                    No hay etapas (stages) configuradas en el CRM.
                </div>
            </CrmLayout>
        );
    }

    const [groupedStages, setGroupedStages] = useState([]);
    const [selectedDealId, setSelectedDealId] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Filters state
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState(filters?.estado || 'open');
    const isFirstRender = useRef(true);

    useEffect(() => {
        // Group deals by stage
        const mapped = stages.map(stage => {
            return {
                ...stage,
                deals: deals.filter(d => d.stage_id === stage.id)
            };
        });
        setGroupedStages(mapped);
    }, [stages, deals]);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timeoutId = setTimeout(() => {
            router.get('/admin/crm/pipeline', { search: searchTerm, estado: statusFilter }, { preserveState: true, preserveScroll: true, replace: true });
        }, 400);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, statusFilter]);

    const handleFilter = () => {
        router.get('/admin/crm/pipeline', { search: searchTerm, estado: statusFilter }, { preserveState: true });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleFilter();
        }
    };

    const onDragStart = (e, dealId, sourceStageId) => {
        e.dataTransfer.setData('dealId', dealId);
        e.dataTransfer.setData('sourceStageId', sourceStageId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.style.backgroundColor = '#f3f4f6'; // Highlight effect
    };

    const onDragLeave = (e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
    };

    const onDrop = (e, targetStageId) => {
        e.preventDefault();
        e.currentTarget.style.backgroundColor = 'transparent';

        const dealId = parseInt(e.dataTransfer.getData('dealId'));
        const sourceStageId = parseInt(e.dataTransfer.getData('sourceStageId'));

        if (sourceStageId === targetStageId) return;

        // Optimistic UI Update
        const updatedStages = groupedStages.map(stage => {
            if (stage.id === sourceStageId) {
                return { ...stage, deals: stage.deals.filter(d => d.id !== dealId) };
            }
            return stage;
        });

        let movedDeal = null;
        groupedStages.forEach(stage => {
            if (stage.id === sourceStageId) {
                movedDeal = stage.deals.find(d => d.id === dealId);
            }
        });

        if (!movedDeal) return;

        movedDeal.stage_id = targetStageId;
        
        const finalStages = updatedStages.map(stage => {
            if (stage.id === targetStageId) {
                return { ...stage, deals: [...stage.deals, movedDeal] };
            }
            return stage;
        });

        setGroupedStages(finalStages);

        // API Call
        router.put(`/admin/crm/deals/${dealId}/move`, {
            stage_id: targetStageId,
            estado: 'open' 
        }, {
            preserveScroll: true,
            preserveState: true,
            onError: () => {
                // Revert
                setGroupedStages(groupedStages);
                Swal.fire('Error', 'No se pudo mover el deal.', 'error');
            }
        });
    };

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
    };

    return (
        <CrmLayout title="CRM Enterprise 360°">
            <Head title="CRM Pipeline" />
            
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                {/* Header / Filter Bar */}
                <div style={{ padding: '16px 24px', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
                        <div style={{ position: 'relative', width: '320px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input 
                                type="text"
                                placeholder="Buscar deal o cliente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleKeyDown}
                                style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: '#f9fafb', outline: 'none', transition: 'border-color 0.2s' }}
                                onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            />
                        </div>
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: '#f9fafb', outline: 'none', cursor: 'pointer' }}
                        >
                            <option value="open">Abiertos (En Proceso)</option>
                            <option value="won">Ganados</option>
                            <option value="lost">Perdidos</option>
                            <option value="all">Todos</option>
                        </select>
                        <button 
                            onClick={handleFilter}
                            style={{ padding: '10px 20px', backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#374151', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                        >
                            <Filter size={16} /> Filtrar
                        </button>
                    </div>
                    <div>
                        <button style={{ backgroundColor: '#6366f1', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.3)' }}>
                            <Plus size={16} /> Nuevo Deal
                        </button>
                    </div>
                </div>

                {/* Kanban Board */}
                <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', padding: '16px 24px', flex: 1, backgroundColor: '#f3f4f6', alignItems: 'flex-start' }}>
                    {groupedStages.map((stage) => (
                        <div 
                            key={stage.id}
                            style={{ 
                                flex: 1,
                                minWidth: '240px',
                                display: 'flex', 
                                flexDirection: 'column',
                                backgroundColor: '#f8fafc',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                maxHeight: '100%', // Para que la columna scrollee
                                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={(e) => onDrop(e, stage.id)}
                        >
                            {/* Column Header */}
                            <div style={{ 
                                padding: '16px 20px', 
                                borderBottom: '3px solid',
                                borderBottomColor: stage.color || '#cbd5e1',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                backgroundColor: '#fff',
                                borderTopLeftRadius: '12px',
                                borderTopRightRadius: '12px'
                            }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                        {stage.nombre}
                                    </h3>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>
                                            {stage.deals.length}
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                                            {formatMoney(stage.deals.reduce((sum, d) => sum + parseFloat(d.valor), 0))}
                                        </span>
                                    </div>
                                </div>
                                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', borderRadius: '4px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>

                            {/* Cards Area */}
                            <div style={{ 
                                padding: '16px', 
                                flex: 1, 
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px'
                            }}>
                                {stage.deals.map((deal) => (
                                    <div
                                        key={deal.id}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, deal.id, stage.id)}
                                        onClick={() => {
                                            setSelectedDealId(deal.id);
                                            setDrawerOpen(true);
                                        }}
                                        style={{
                                            backgroundColor: '#fff',
                                            borderRadius: '10px',
                                            padding: '16px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
                                            border: '1px solid #f1f5f9',
                                            borderLeft: `4px solid ${stage.color || '#cbd5e1'}`,
                                            cursor: 'grab',
                                            userSelect: 'none',
                                            transition: 'transform 0.2s, box-shadow 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)';
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>
                                                ID: {deal.id}
                                            </span>
                                            {deal.ai_score && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }} title="Puntuación de Cierre (Einstein AI)">
                                                    <Zap size={10} fill="#8b5cf6" />
                                                    {deal.ai_score}
                                                </div>
                                            )}
                                        </div>
                                        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#0f172a', lineHeight: '1.5' }}>
                                            {deal.titulo}
                                        </h4>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#475569' }}>
                                            {deal.cliente && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ backgroundColor: '#e2e8f0', borderRadius: '50%', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Users size={12} color="#64748b" />
                                                    </div>
                                                    <span style={{ fontWeight: 500 }}>{deal.cliente.nombres}</span>
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <DollarSign size={14} color="#10b981" />
                                                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatMoney(deal.valor)}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
                                                    <Clock size={12} />
                                                    {new Date(deal.fecha_cierre_esperada).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Botón añadir rápido */}
                                <button style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px',
                                    background: 'transparent',
                                    border: '1px dashed #cbd5e1',
                                    borderRadius: '8px',
                                    color: '#64748b',
                                    cursor: 'pointer',
                                    marginTop: '8px',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s',
                                    fontWeight: 500
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#334155'; e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                    <Plus size={16} />
                                    <span>Añadir Deal</span>
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    {/* Botón nueva etapa */}
                    <div style={{ 
                        flex: 0.5,
                        minWidth: '200px', 
                        display: 'flex', 
                        height: '100%'
                    }}>
                        <button style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '16px',
                            background: 'rgba(255,255,255,0.4)',
                            border: '1px dashed #cbd5e1',
                            borderRadius: '12px',
                            color: '#64748b',
                            cursor: 'pointer',
                            justifyContent: 'center',
                            fontWeight: 500,
                            height: '60px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.8)'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                        >
                            <Plus size={18} />
                            <span>Añadir Etapa</span>
                        </button>
                    </div>

                </div>
            </div>

            <DealDrawer 
                isOpen={drawerOpen} 
                onClose={() => {
                    setDrawerOpen(false);
                    setSelectedDealId(null);
                }} 
                dealId={selectedDealId} 
            />

        </CrmLayout>
    );
}
