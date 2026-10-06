import React, { useState, useEffect, useRef } from 'react';
import { Plus, MoreHorizontal, DollarSign, Edit2, Trash2 } from 'lucide-react';
import { AnimatedList } from '../../Animations/AnimatedList';

export default function TwentyKanban({ stages = [], deals, onDragEnd, onDealClick, onDealEdit, onDealDelete, onDealCreate }) {
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [draggingId, setDraggingId] = useState(null);
    const [overStage, setOverStage] = useState(null);
    const draggedDeal = useRef(null);

    const moveDeal = (dealId, sourceStage, targetStage, sourceIndex = 0) => {
        if (String(sourceStage) === String(targetStage)) return;
        onDragEnd?.({
            draggableId: String(dealId),
            source: { droppableId: String(sourceStage), index: sourceIndex },
            destination: { droppableId: String(targetStage), index: 0 },
        });
    };

    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Group deals by stage
    const groupedDeals = stages.reduce((acc, stage) => {
        if (deals) {
            acc[stage.id] = deals.filter(deal => deal.stage_id === stage.id);
        } else {
            acc[stage.id] = stage.deals || [];
        }
        return acc;
    }, {});

    const formatMoney = (value) => {
        return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
    };

    return (
        <>
            <style>{`
                .premium-kanban-container {
                    display: flex;
                    gap: 24px;
                    overflow-x: auto;
                    padding: 8px 32px 32px 32px;
                    height: 100%;
                    align-items: flex-start;
                    background-color: transparent;
                }
                .premium-column {
                    min-width: 320px;
                    max-width: 320px;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                .premium-column-header {
                    padding: 0 4px 16px 4px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                .premium-column-title {
                    font-size: 13px;
                    font-weight: 600;
                    color: #475569;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .premium-column-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
                .premium-column-count {
                    font-size: 13px;
                    color: #94A3B8;
                    font-weight: 500;
                }
                .premium-btn-icon {
                    background: transparent;
                    border: none;
                    color: #94A3B8;
                    cursor: pointer;
                    padding: 6px;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .premium-btn-icon:hover {
                    background: #F1F5F9;
                    color: #1E293B;
                }
                .premium-droppable-area {
                    flex: 1;
                    min-height: 150px;
                    border-radius: 12px;
                    transition: all 0.2s ease;
                    padding: 4px;
                }
                .premium-droppable-area.is-dragging-over {
                    background-color: rgba(241, 245, 249, 0.5);
                    border: 1px dashed #CBD5E1;
                }
                .premium-kanban-card {
                    user-select: none;
                    padding: 20px;
                    margin: 0 0 16px 0;
                    background-color: #FFFFFF;
                    border: 1px solid #E2E8F0;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.02);
                    transition: all 0.2s ease;
                    cursor: grab;
                    position: relative;
                }
                .premium-kanban-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 20px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
                    border-color: #004797;
                }
                .premium-kanban-card.is-dragging {
                    box-shadow: 0 20px 25px -5px rgba(0, 71, 151, 0.15), 0 8px 10px -6px rgba(0, 71, 151, 0.1);
                    border-color: #004797;
                    transform: scale(1.02) rotate(2deg);
                    z-index: 999;
                }
                .premium-card-title {
                    margin: 0 0 8px 0;
                    font-size: 15px;
                    font-weight: 600;
                    color: #1E293B;
                    line-height: 1.4;
                    letter-spacing: -0.01em;
                }
                .premium-card-client {
                    font-size: 13px;
                    color: #64748B;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .premium-card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 16px;
                    border-top: 1px solid #F1F5F9;
                }
                .premium-card-value {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    color: #0F172A;
                    font-size: 14px;
                    font-weight: 700;
                }
                .premium-card-avatar {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    background-color: #F0F9FF;
                    color: #004797;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    font-weight: 700;
                    border: 1px solid #BAE6FD;
                }
                .premium-kanban-list {
                    display: flex;
                    gap: 24px;
                    height: 100%;
                }
                .premium-kanban-list > div {
                    flex-shrink: 0;
                }
                
                /* Dropdown Menu Styles */
                .premium-card-menu-container {
                    position: relative;
                }
                .premium-dropdown {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    margin-top: 4px;
                    background: #FFFFFF;
                    border: 1px solid #E2E8F0;
                    border-radius: 8px;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
                    min-width: 140px;
                    z-index: 50;
                    overflow: hidden;
                    animation: dropdownFadeIn 0.15s ease-out;
                }
                @keyframes dropdownFadeIn {
                    from { opacity: 0; transform: translateY(-5px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .premium-dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    width: 100%;
                    padding: 10px 14px;
                    border: none;
                    background: transparent;
                    font-size: 13px;
                    font-weight: 500;
                    color: #475569;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: left;
                }
                .premium-dropdown-item:hover {
                    background: #F1F5F9;
                    color: #1E293B;
                }
                .premium-dropdown-item.delete {
                    color: #EF4444;
                }
                .premium-dropdown-item.delete:hover {
                    background: #FEF2F2;
                    color: #DC2626;
                }
            `}</style>

            <div className="premium-kanban-container">
                    <AnimatedList className="premium-kanban-list">
                        {stages.map((stage) => (
                        <div key={stage.id} className="premium-column">
                            {/* Column Header */}
                            <div className="premium-column-header">
                                <div className="premium-column-title">
                                    <div className="premium-column-indicator" style={{ backgroundColor: stage.color || '#004797' }}></div>
                                    {stage.nombre}
                                    <span className="premium-column-count">
                                        {stage.deals_count ?? groupedDeals[stage.id]?.length ?? 0}
                                    </span>
                                </div>
                                {onDealCreate && <button type="button" className="premium-btn-icon" onClick={() => onDealCreate(stage.id)} title={`Crear oportunidad en ${stage.nombre}`} aria-label={`Crear oportunidad en ${stage.nombre}`}>
                                    <Plus size={16} />
                                </button>}
                            </div>

                            {/* Droppable Area */}
                            <div
                                className={`premium-droppable-area ${overStage === stage.id ? 'is-dragging-over' : ''}`}
                                onDragOver={(event) => { event.preventDefault(); setOverStage(stage.id); }}
                                onDragLeave={() => setOverStage(null)}
                                onDrop={(event) => {
                                    event.preventDefault();
                                    if (draggedDeal.current) {
                                        moveDeal(draggedDeal.current.id, draggedDeal.current.stageId, stage.id, draggedDeal.current.index);
                                    }
                                    draggedDeal.current = null;
                                    setDraggingId(null);
                                    setOverStage(null);
                                }}
                            >
                                        {groupedDeals[stage.id]?.map((deal, index) => (
                                            <div
                                                key={deal.id}
                                                draggable
                                                onDragStart={(event) => {
                                                    draggedDeal.current = { id: deal.id, stageId: stage.id, index };
                                                    event.dataTransfer.effectAllowed = 'move';
                                                    event.dataTransfer.setData('text/plain', String(deal.id));
                                                    setDraggingId(deal.id);
                                                }}
                                                onDragEnd={() => { draggedDeal.current = null; setDraggingId(null); setOverStage(null); }}
                                                onClick={() => onDealClick && onDealClick(deal)}
                                                className={`premium-kanban-card ${draggingId === deal.id ? 'is-dragging' : ''}`}
                                            >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <h4 className="premium-card-title">
                                                                {deal.titulo}
                                                            </h4>
                                                            <div className="premium-card-menu-container">
                                                                <button 
                                                                    className="premium-btn-icon" 
                                                                    style={{ padding: 2, marginTop: -2, marginRight: -6 }} 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveDropdown(activeDropdown === deal.id ? null : deal.id);
                                                                    }}
                                                                >
                                                                    <MoreHorizontal size={16} />
                                                                </button>
                                                                
                                                                {activeDropdown === deal.id && (
                                                                    <div className="premium-dropdown">
                                                                        <button 
                                                                            className="premium-dropdown-item"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setActiveDropdown(null);
                                                                                if (onDealEdit) onDealEdit(deal);
                                                                            }}
                                                                        >
                                                                            <Edit2 size={14} /> Editar
                                                                        </button>
                                                                        <select
                                                                            className="premium-dropdown-item"
                                                                            aria-label={`Mover ${deal.titulo} a otra etapa`}
                                                                            value={stage.id}
                                                                            onClick={(event) => event.stopPropagation()}
                                                                            onChange={(event) => {
                                                                                event.stopPropagation();
                                                                                moveDeal(deal.id, stage.id, event.target.value, index);
                                                                                setActiveDropdown(null);
                                                                            }}
                                                                        >
                                                                            {stages.map((option) => (
                                                                                <option key={option.id} value={option.id}>{option.nombre}</option>
                                                                            ))}
                                                                        </select>
                                                                        <button 
                                                                            className="premium-dropdown-item delete"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setActiveDropdown(null);
                                                                                if (onDealDelete) onDealDelete(deal.id);
                                                                            }}
                                                                        >
                                                                            <Trash2 size={14} /> Archivar
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="premium-card-client">
                                                            {deal.cliente?.nombres} {deal.cliente?.apellidos}
                                                        </div>

                                                        <div className="premium-card-footer">
                                                            <div className="premium-card-value">
                                                                <DollarSign size={14} color="#94A3B8" />
                                                                {formatMoney(deal.valor)}
                                                            </div>
                                                            <div className="premium-card-avatar" title={deal.cliente?.nombres}>
                                                                {deal.cliente?.nombres?.charAt(0) || 'C'}
                                                            </div>
                                                        </div>
                                            </div>
                                        ))}
                            </div>
                        </div>
                        ))}
                    </AnimatedList>
            </div>
        </>
    );
}
