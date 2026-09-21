import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Plus, MoreHorizontal, DollarSign } from 'lucide-react';

export default function TwentyKanban({ stages = [], deals, onDragEnd, onDealClick }) {
    
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
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', height: '100%', alignItems: 'flex-start' }}>
            <DragDropContext onDragEnd={onDragEnd}>
                {stages.map((stage) => (
                    <div key={stage.id} style={{ 
                        minWidth: '280px', 
                        maxWidth: '280px',
                        display: 'flex', 
                        flexDirection: 'column', 
                        height: '100%' 
                    }}>
                        {/* Column Header */}
                        <div style={{ 
                            padding: '12px 16px', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            borderBottom: `2px solid ${stage.color || 'var(--twenty-border)'}`,
                            marginBottom: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--twenty-text-main)' }}>
                                    {stage.nombre}
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--twenty-text-muted)', background: 'var(--twenty-bg-active)', padding: '2px 6px', borderRadius: '10px' }}>
                                    {groupedDeals[stage.id]?.length || 0}
                                </span>
                            </div>
                            <button className="twenty-btn-icon">
                                <Plus size={14} />
                            </button>
                        </div>

                        {/* Droppable Area */}
                        <Droppable droppableId={stage.id.toString()}>
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    style={{
                                        flex: 1,
                                        minHeight: '150px',
                                        backgroundColor: snapshot.isDraggingOver ? 'var(--twenty-bg-hover)' : 'transparent',
                                        borderRadius: 'var(--twenty-radius-md)',
                                        transition: 'background-color 0.2s',
                                        padding: '4px'
                                    }}
                                >
                                    {groupedDeals[stage.id]?.map((deal, index) => (
                                        <Draggable key={deal.id.toString()} draggableId={deal.id.toString()} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    onClick={() => onDealClick && onDealClick(deal)}
                                                    style={{
                                                        userSelect: 'none',
                                                        padding: '16px',
                                                        margin: '0 0 12px 0',
                                                        backgroundColor: 'var(--twenty-bg-surface)',
                                                        border: '1px solid var(--twenty-border)',
                                                        borderRadius: 'var(--twenty-radius-md)',
                                                        boxShadow: snapshot.isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                                        ...provided.draggableProps.style
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--twenty-text-main)' }}>
                                                            {deal.titulo}
                                                        </h4>
                                                        <button className="twenty-btn-icon" style={{ padding: 2, marginTop: -4, marginRight: -4 }} onClick={e => e.stopPropagation()}>
                                                            <MoreHorizontal size={14} />
                                                        </button>
                                                    </div>
                                                    
                                                    <div style={{ fontSize: '12px', color: 'var(--twenty-text-muted)', marginBottom: '12px' }}>
                                                        {deal.cliente?.nombres} {deal.cliente?.apellidos}
                                                    </div>

                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--twenty-text-main)', fontSize: '13px', fontWeight: 500 }}>
                                                            <DollarSign size={14} color="var(--twenty-text-muted)" />
                                                            {formatMoney(deal.valor)}
                                                        </div>
                                                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--twenty-bg-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 600 }}>
                                                            {deal.cliente?.nombres?.charAt(0)}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </DragDropContext>
        </div>
    );
}
