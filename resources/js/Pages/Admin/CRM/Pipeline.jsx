import React, { useState, useEffect } from 'react';
import { Head, router, Link, useForm } from '@inertiajs/react';
import TwentyCrmLayout from '../../../Layouts/TwentyCrmLayout';
import TwentyKanban from '../../../Components/Admin/CRM/TwentyKanban';
import TwentyRecordDrawer from '../../../Components/Admin/CRM/TwentyRecordDrawer';
import { Plus, ListFilter, Download, Search, X } from 'lucide-react';
import Swal from 'sweetalert2';
import RemoteSelect from '../../../Components/Admin/RemoteSelect';

export default function Pipeline({ pipeline, dealPages, query = '' }) {
    const [search, setSearch] = useState(query);
    useEffect(() => {
        if (search === query) return;
        const timer = setTimeout(() => router.get('/admin/crm/pipeline', {q: search}, {preserveState: true, preserveScroll: true, replace: true}), 400);
        return () => clearTimeout(timer);
    }, [search, query]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        id: null,
        titulo: '',
        valor: '',
        stage_id: pipeline[0]?.id || '',
        empresa_id: '',
        usuario_id: '',
        fecha_cierre_esperada: ''
    });

    const openDrawer = (deal = null) => {
        clearErrors();
        if (deal) {
            setData({
                id: deal.id,
                titulo: deal.titulo || '',
                valor: deal.valor || '',
                stage_id: deal.stage_id || '',
                empresa_id: deal.empresa_id || '',
                usuario_id: deal.usuario_id || '',
                fecha_cierre_esperada: deal.fecha_cierre_esperada ? deal.fecha_cierre_esperada.substring(0, 10) : ''
            });
        } else {
            reset();
            setData('stage_id', pipeline[0]?.id || '');
        }
        setDrawerOpen(true);
    };
    useEffect(() => { if (new URLSearchParams(window.location.search).get('create') === 'true') openDrawer(); }, []);

    const submitDeal = (e) => {
        e.preventDefault();
        if (processing) return;
        if (data.id) {
            put(`/admin/crm/deals/${data.id}`, {
                preserveScroll: true,
                onSuccess: () => setDrawerOpen(false),
            });
        } else {
            post('/admin/crm/deals', {
                preserveScroll: true,
                onSuccess: () => {
                    setDrawerOpen(false);
                    reset();
                },
            });
        }
    };

    const deleteDeal = (id) => {
        Swal.fire({
            title: '¿Archivar oportunidad?',
            text: 'Se retirará del pipeline y se conservará su historial.',
            icon: 'warning',
            iconColor: '#EF4444',
            showCancelButton: true,
            confirmButtonText: 'Sí, archivar',
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
                router.delete(`/admin/crm/deals/${id}`, {
                    preserveScroll: true
                });
            }
        });
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

            <style>{`
                .premium-pipeline-search {
                    position: relative;
                    display: flex;
                    align-items: center;
                    width: 320px;
                }
                .premium-pipeline-search-icon {
                    position: absolute;
                    left: 14px;
                    color: #94A3B8;
                    pointer-events: none;
                }
                .premium-pipeline-search-input {
                    width: 100%;
                    padding: 10px 36px;
                    border-radius: 10px;
                    border: 1px solid #E2E8F0;
                    background-color: #FFFFFF;
                    color: #1E293B;
                    font-size: 14px;
                    outline: none;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
                }
                .premium-pipeline-search-input:focus {
                    border-color: #004797;
                    box-shadow: 0 0 0 3px rgba(0, 71, 151, 0.15);
                }
                .premium-pipeline-search-clear {
                    position: absolute;
                    right: 10px;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    color: #94A3B8;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 4px;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                }
                .premium-pipeline-search-clear:hover {
                    background-color: #F1F5F9;
                    color: #1E293B;
                }
                .premium-btn-secondary {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 16px;
                    border-radius: 10px;
                    border: 1px solid #E2E8F0;
                    background: #FFFFFF;
                    font-weight: 600;
                    font-size: 14px;
                    color: #475569;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-decoration: none;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
                }
                .premium-btn-secondary:hover {
                    background: #F8FAFC;
                    color: #1E293B;
                    border-color: #CBD5E1;
                }
                .premium-btn-primary {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    border-radius: 10px;
                    border: none;
                    background: #004797;
                    font-weight: 600;
                    font-size: 14px;
                    color: #FFFFFF;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 6px -1px rgba(0, 71, 151, 0.2), 0 2px 4px -1px rgba(0, 71, 151, 0.1);
                    text-decoration: none;
                }
                .premium-btn-primary:hover {
                    background: #003670;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 10px -1px rgba(0, 71, 151, 0.3), 0 2px 4px -1px rgba(0, 71, 151, 0.1);
                }
                .premium-pipeline-header {
                    padding: 32px 32px 16px 32px;
                    background: transparent;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .premium-page-title {
                    font-size: 24px;
                    font-weight: 700;
                    color: #1E293B;
                    letter-spacing: -0.02em;
                    margin: 0;
                }
                
                /* SweetAlert Premium Classes */
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
                .premium-input:focus {
                    border-color: #004797;
                    box-shadow: 0 0 0 3px rgba(0, 71, 151, 0.15);
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
            `}</style>

            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#F8FAFC' }}>
                
                {/* Header Section */}
                <div className="premium-pipeline-header">
                    <h1 className="premium-page-title">Oportunidades</h1>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div className="premium-pipeline-search">
                            <Search size={16} className="premium-pipeline-search-icon" />
                            <input 
                                type="text" 
                                className="premium-pipeline-search-input"
                                placeholder="Buscar prospectos o clientes..." 
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            {search && (
                                <button className="premium-pipeline-search-clear" onClick={() => setSearch('')}>
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <button className="premium-btn-secondary" onClick={() => setShowFilters(!showFilters)}>
                            <ListFilter size={16} />
                            <span>Filtros</span>
                        </button>
                        <a href="/admin/crm/export?type=deals" className="premium-btn-secondary">
                            <Download size={16} />
                            <span>Exportar</span>
                        </a>
                        <button className="premium-btn-primary" onClick={() => openDrawer()}>
                            <Plus size={16} />
                            <span>Nueva Oportunidad</span>
                        </button>
                    </div>
                </div>

                {/* Kanban Board */}
                {dealPages && (
                    <div style={{ padding: '0 32px 12px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 500 }}>
                            Mostrando <strong style={{ color: '#1E293B' }}>{dealPages.from || 0}–{dealPages.to || 0}</strong> de <strong style={{ color: '#1E293B' }}>{dealPages.total}</strong> oportunidades
                        </span>
                        {dealPages.links && dealPages.links.length > 3 && (
                            <nav aria-label="Paginación" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                {dealPages.links.map((link, i) => {
                                    const labelClean = link.label
                                        .replace('pagination.previous', '‹ Anterior')
                                        .replace('&laquo; Previous', '‹ Anterior')
                                        .replace('pagination.next', 'Siguiente ›')
                                        .replace('Next &raquo;', 'Siguiente ›');
                                    if (!link.url) {
                                        return (
                                            <span 
                                                key={i} 
                                                style={{
                                                    padding: '5px 10px',
                                                    fontSize: '12px',
                                                    borderRadius: '8px',
                                                    color: '#94A3B8',
                                                    background: '#F1F5F9',
                                                    pointerEvents: 'none'
                                                }}
                                                dangerouslySetInnerHTML={{ __html: labelClean }}
                                            />
                                        );
                                    }
                                    return (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            preserveState
                                            style={{
                                                padding: '5px 10px',
                                                fontSize: '12px',
                                                fontWeight: link.active ? 600 : 500,
                                                borderRadius: '8px',
                                                color: link.active ? '#FFFFFF' : '#475569',
                                                backgroundColor: link.active ? '#004797' : '#FFFFFF',
                                                border: link.active ? '1px solid #004797' : '1px solid #E2E8F0',
                                                textDecoration: 'none',
                                                transition: 'all 0.2s ease',
                                                boxShadow: link.active ? '0 2px 4px rgba(0, 71, 151, 0.2)' : 'none'
                                            }}
                                            dangerouslySetInnerHTML={{ __html: labelClean }}
                                        />
                                    );
                                })}
                            </nav>
                        )}
                    </div>
                )}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <TwentyKanban 
                        stages={pipeline}
                        onDragEnd={handleDragEnd} 
                        onDealClick={handleDealClick}
                        onDealEdit={openDrawer}
                        onDealCreate={stageId => { openDrawer(); setData('stage_id', stageId); }}
                        onDealDelete={deleteDeal}
                    />
                </div>
            </div>

            {/* Create / Edit Deal Drawer */}
            <TwentyRecordDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title={data.id ? "Editar Oportunidad" : "Nueva Oportunidad"}
            >
                <form onSubmit={submitDeal} className="premium-form-container">
                    <div className="premium-form-group">
                        <label className="premium-label">Título de la oportunidad *</label>
                        <input 
                            type="text" 
                            className="premium-input"
                            value={data.titulo}
                            onChange={e => setData('titulo', e.target.value)}
                            required
                        />
                        {errors.titulo && <span style={{color: '#ef4444', fontSize: '12px'}}>{errors.titulo}</span>}
                    </div>

                    <div className="premium-form-group">
                        <label className="premium-label">Valor estimado (S/)</label>
                        <input 
                            type="number" 
                            step="0.01" 
                            className="premium-input" 
                            placeholder="0.00"
                            value={data.valor}
                            onChange={e => setData('valor', e.target.value)}
                        />
                        {errors.valor && <span style={{color: '#ef4444', fontSize: '12px'}}>{errors.valor}</span>}
                    </div>

                    <div className="premium-form-group">
                        <label className="premium-label">Etapa *</label>
                        <select 
                            className="premium-input"
                            value={data.stage_id}
                            onChange={e => setData('stage_id', e.target.value)}
                            required
                        >
                            {pipeline.map(stage => (
                                <option key={stage.id} value={stage.id}>{stage.nombre}</option>
                            ))}
                        </select>
                        {errors.stage_id && <span style={{color: '#ef4444', fontSize: '12px'}}>{errors.stage_id}</span>}
                    </div>

                    <div className="premium-form-group">
                        <RemoteSelect label="Empresa asociada" endpoint="/admin/crm/selectores/empresas"
                            value={data.empresa_id} onChange={value => setData('empresa_id', value)} />
                        {errors.empresa_id && <span role="alert">{errors.empresa_id}</span>}
                    </div>
                    <div className="premium-form-group">
                        <RemoteSelect label="Contacto asociado" endpoint="/admin/crm/selectores/contactos"
                            value={data.usuario_id} onChange={value => setData('usuario_id', value)} />
                        {errors.usuario_id && <span role="alert">{errors.usuario_id}</span>}
                    </div>

                    <div className="premium-form-group">
                        <label className="premium-label">Fecha de cierre esperada</label>
                        <input 
                            type="date" 
                            className="premium-input"
                            value={data.fecha_cierre_esperada}
                            onChange={e => setData('fecha_cierre_esperada', e.target.value)}
                        />
                    </div>
                    
                    <div className="premium-drawer-actions">
                        <button type="button" className="premium-btn-secondary" onClick={() => setDrawerOpen(false)}>
                            Cancelar
                        </button>
                        <button type="submit" className="premium-btn-primary" disabled={processing}>
                            {data.id ? 'Guardar Cambios' : 'Crear Oportunidad'}
                        </button>
                    </div>
                </form>
            </TwentyRecordDrawer>
        </TwentyCrmLayout>
    );
}
