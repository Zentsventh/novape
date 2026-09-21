import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import TwentyCrmLayout from '../../../Layouts/TwentyCrmLayout';
import TwentyKanban from '../../../Components/Admin/CRM/TwentyKanban';
import TwentyRecordDrawer from '../../../Components/Admin/CRM/TwentyRecordDrawer';
import { Plus, ListFilter, Download } from 'lucide-react';

export default function Pipeline({ pipeline, companies, personas }) {
    const [search, setSearch] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Flat list of all deals for filtering (if needed client side)
    // The TwentyKanban component expects stages array, where each stage has deals array.
    // Our CrmPipelineService returns the pipeline data formatted precisely like this.

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            // we could filter client side or server side
        }
    };

    const handleDragEnd = (result) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        router.put(`/admin/crm/deals/${draggableId}/move`, {
            stage_id: destination.droppableId
        }, {
            preserveScroll: true
        });
    };

    const handleDealClick = (deal) => {
        router.visit(`/admin/crm/deals/${deal.id}`);
    };

    return (
        <TwentyCrmLayout title="Pipeline">
            <Head title="Pipeline - CRM" />

            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                
                {/* Header Section */}
                <div className="twenty-header">
                    <h1 className="twenty-title">Oportunidades</h1>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div className="twenty-search-box">
                            <input 
                                type="text" 
                                placeholder="Buscar en pipeline..." 
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={handleSearch}
                            />
                        </div>
                        <button className="twenty-btn twenty-btn-secondary">
                            <ListFilter size={16} />
                            <span>Filtros</span>
                        </button>
                        <a href="/admin/crm/export?type=deals" className="twenty-btn twenty-btn-secondary" style={{ textDecoration: 'none' }}>
                            <Download size={16} />
                            <span>Exportar</span>
                        </a>
                        <button className="twenty-btn twenty-btn-primary" onClick={() => setDrawerOpen(true)}>
                            <Plus size={16} />
                            <span>Nueva Oportunidad</span>
                        </button>
                    </div>
                </div>

                {/* Kanban Board */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <TwentyKanban 
                        stages={pipeline} 
                        onDragEnd={handleDragEnd} 
                        onDealClick={handleDealClick} 
                    />
                </div>
            </div>

            {/* Create Deal Drawer */}
            <TwentyRecordDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title="Nueva Oportunidad"
            >
                <form 
                    className="twenty-form" 
                    onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        router.post('/admin/crm/deals', Object.fromEntries(formData), {
                            onSuccess: () => setDrawerOpen(false)
                        });
                    }}
                >
                    <div className="twenty-form-group">
                        <label>Título de la oportunidad *</label>
                        <input type="text" name="titulo" required className="twenty-input" placeholder="Ej: Venta de software a Acme" />
                    </div>

                    <div className="twenty-form-group">
                        <label>Valor estimado (S/)</label>
                        <input type="number" step="0.01" name="valor" className="twenty-input" placeholder="0.00" />
                    </div>

                    <div className="twenty-form-group">
                        <label>Etapa inicial *</label>
                        <select name="stage_id" required className="twenty-input">
                            {pipeline.map(stage => (
                                <option key={stage.id} value={stage.id}>{stage.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="twenty-form-group">
                        <label>Empresa asociada</label>
                        <select name="empresa_id" className="twenty-input">
                            <option value="">Seleccionar empresa (opcional)</option>
                            {companies?.map(company => (
                                <option key={company.id} value={company.id}>{company.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="twenty-form-group">
                        <label>Contacto asociado (Persona)</label>
                        <select name="usuario_id" className="twenty-input">
                            <option value="">Seleccionar contacto (opcional)</option>
                            {personas?.map(persona => (
                                <option key={persona.id} value={persona.id}>{persona.nombres} {persona.apellidos}</option>
                            ))}
                        </select>
                    </div>

                    <div className="twenty-form-group">
                        <label>Fecha de cierre esperada</label>
                        <input type="date" name="fecha_cierre_esperada" className="twenty-input" />
                    </div>
                    
                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button type="button" className="twenty-btn twenty-btn-secondary" onClick={() => setDrawerOpen(false)}>
                            Cancelar
                        </button>
                        <button type="submit" className="twenty-btn twenty-btn-primary">
                            Crear Oportunidad
                        </button>
                    </div>
                </form>
            </TwentyRecordDrawer>
        </TwentyCrmLayout>
    );
}
