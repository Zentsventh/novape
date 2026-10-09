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
                    display: grid;
                    gap: 16px;
                    width: 100%;
                    box-sizing: border-box;
                    padding: 8px 32px 32px 32px;
                    align-items: stretch;
                    background-color: transparent;
                }
                .premium-kanban-list {
                    display: contents !important;
                }
                .premium-kanban-list > div {
                    display: contents !important;
                }
                .premium-column {
                    display: flex;
                    flex-direction: column;
                    background: #F8FAFC;
                    border: 1px solid #E2E8F0;
                    border-radius: 12px;
                    padding: 12px;
                    min-width: 0;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
                    transition: all 0.2s ease;
                }
                .premium-column-header {
                    padding: 4px 6px 12px 6px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #E2E8F0;
                    margin-bottom: 12px;
                }
                .premium-column-title {
                    font-size: 12px;
                    font-weight: 700;
                    color: #1E293B;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .premium-column-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background-color: #004797;
                    flex-shrink: 0;
                    box-shadow: 0 0 6px rgba(0, 71, 151, 0.35);
                }
                .premium-column-count {
                    font-size: 11px;
                    color: #004797;
                    background: #E6F0F9;
                    font-weight: 700;
                    padding: 2px 7px;
                    border-radius: 10px;
                    margin-left: 2px;
                }
                .premium-btn-icon {
                    background: transparent;
                    border: none;
                    color: #64748B;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .premium-btn-icon:hover {
                    background: #E6F0F9;
                    color: #004797;
                }
                .premium-droppable-area {
                    flex: 1;
                    min-height: 220px;
                    border-radius: 10px;
                    transition: all 0.2s ease;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .premium-droppable-area.is-dragging-over {
                    background-color: #E6F0F9;
                    border: 1px dashed #004797;
                }
                .premium-kanban-card {
                    user-select: none;
                    padding: 14px;
                    margin: 0;
                    background-color: #FFFFFF;
                    border: 1px solid #E2E8F0;
                    border-radius: 10px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
                    transition: all 0.2s ease;
                    cursor: grab;
                    position: relative;
                }
                .premium-kanban-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px -2px rgba(0, 71, 151, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
                    border-color: #004797;
                }
                .premium-kanban-card.is-dragging {
                    box-shadow: 0 14px 20px -3px rgba(0, 71, 151, 0.2);
                    border-color: #004797;
                    transform: scale(1.02) rotate(1deg);
                    z-index: 999;
                }
                .premium-card-title {
                    margin: 0 0 6px 0;
                    font-size: 13.5px;
                    font-weight: 600;
                    color: #1E293B;
                    line-height: 1.35;
                    letter-spacing: -0.01em;
                    word-break: break-word;
                }
                .premium-card-client {
                    font-size: 12px;
                    color: #64748B;
                    margin-bottom: 12px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .premium-card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 10px;
                    border-top: 1px solid #F1F5F9;
                }
                .premium-card-value {
                    display: flex;
                    align-items: center;
                    gap: 3px;
                    color: #1E293B;
                    font-size: 13px;
                    font-weight: 700;
                }
                .premium-card-avatar {
                    width: 24px;
                    height: 24px;
                    border-radius: 6px;
                    background-color: #E6F0F9;
                    color: #004797;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    font-weight: 700;
                    border: 1px solid #D0E2F5;
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
                    box-shadow: 0 10px 20px -3px rgba(0, 71, 151, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
                    min-width: 130px;
                    z-index: 50;
                    overflow: hidden;
                    animation: dropdownFadeIn 0.15s ease-out;
                }
                @keyframes dropdownFadeIn {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .premium-dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    width: 100%;
                    padding: 8px 12px;
                    border: none;
                    background: transparent;
                    font-size: 12.5px;
                    font-weight: 500;
                    color: #475569;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: left;
                }
                .premium-dropdown-item:hover {
                    background: #E6F0F9;
                    color: #004797;
                }
                .premium-dropdown-item.delete {
                    color: #64748B;
                }
                .premium-dropdown-item.delete:hover {
                    background: #F1F5F9;
                    color: #1E293B;
                }
            `}</style>

            <div 
                className="premium-kanban-container"
                style={{
                    gridTemplateColumns: `repeat(${stages.length || 1}, minmax(0, 1fr))`
                }}
            >
                {stages.map((stage) => (
                    <div key={stage.id} className="premium-column">
                        {/* Column Header */}
                        <div className="premium-column-header">
                            <div className="premium-column-title" title={stage.nombre}>
                                <div className="premium-column-indicator"></div>
                                {stage.nombre}
                                <span className="premium-column-count">
                                    {stage.deals_count ?? groupedDeals[stage.id]?.length ?? 0}
                                </span>
                            </div>
                            {onDealCreate && (
                                <button 
                                    type="button" 
                                    className="premium-btn-icon" 
                                    onClick={() => onDealCreate(stage.id)} 
                                    title={`Crear oportunidad en ${stage.nombre}`} 
                                    aria-label={`Crear oportunidad en ${stage.nombre}`}
                                >
                                    <Plus size={15} />
                                </button>
                            )}
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                        <h4 className="premium-card-title">
                                            {deal.titulo}
                                        </h4>
                                        <div className="premium-card-menu-container">
                                            <button 
                                                className="premium-btn-icon" 
                                                style={{ padding: 2, marginTop: -2, marginRight: -4 }} 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveDropdown(activeDropdown === deal.id ? null : deal.id);
                                                }}
                                            >
                                                <MoreHorizontal size={15} />
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
                                                        <Edit2 size={13} /> Editar
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
                                                        <Trash2 size={13} /> Archivar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="premium-card-client" title={deal.empresa?.nombre || (deal.cliente ? `${deal.cliente.nombres} ${deal.cliente.apellidos}` : '')}>
                                        {deal.empresa?.nombre || (deal.cliente ? `${deal.cliente.nombres} ${deal.cliente.apellidos}` : 'Contacto corporativo')}
                                    </div>

                                    <div className="premium-card-footer">
                                        <div className="premium-card-value">
                                            <DollarSign size={13} color="#004797" />
                                            {formatMoney(deal.valor)}
                                        </div>
                                        <div className="premium-card-avatar" title={deal.empresa?.nombre || deal.cliente?.nombres || 'Cliente'}>
                                            {(deal.empresa?.nombre || deal.cliente?.nombres || 'C').charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
