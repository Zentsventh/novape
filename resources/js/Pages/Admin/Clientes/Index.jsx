import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import TwentyCrmLayout from '../../../Layouts/TwentyCrmLayout';
import TwentyTable from '../../../Components/Admin/CRM/TwentyTable';
import TwentyRecordDrawer from '../../../Components/Admin/CRM/TwentyRecordDrawer';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { 
    Search, Plus, MoreHorizontal, Filter, 
    Phone, Mail, MapPin, ExternalLink, Calendar, 
    FileText, ShoppingBag, CreditCard, Bell, ChevronDown, CheckCircle, Trash2, ArrowRight, X, Upload, Download
} from 'lucide-react';

export default function Index() {
    const confirmDialog = useConfirm();
    const { clientes, filtros, flash, errors, customFieldsSchema, evidenceLedger } = usePage().props;
    const data = clientes?.data || [];
    
    const [search, setSearch] = useState(filtros?.buscar || '');
    const isFirstRender = useRef(true);
    const [selectedRows, setSelectedRows] = useState([]);
    
    // Record Drawer States
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isSavingField, setIsSavingField] = useState(false);
    const [resolvingEvidence, setResolvingEvidence] = useState(null);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timeoutId = setTimeout(() => {
            router.get('/admin/clientes', { buscar: search }, { preserveState: true, preserveScroll: true, replace: true });
        }, 400);
        return () => clearTimeout(timeoutId);
    }, [search]);

    const handleBulkDelete = async () => {
        if (!selectedRows.length) return;
        
        const isConfirmed = await confirmDialog(
            `¿Estás seguro que deseas eliminar ${selectedRows.length} cliente(s)? Esta acción moverá los registros a la papelera.`,
            {
                title: '¿Eliminar clientes?',
                confirmText: 'Eliminar'
            }
        );

        if (isConfirmed) {
            router.post('/admin/clientes/bulk-delete', { ids: selectedRows }, {
                preserveScroll: true,
                onSuccess: () => setSelectedRows([])
            });
        }
    };

    const handleRowClick = (customer) => {
        setSelectedCustomer(customer);
        setDrawerOpen(true);
    };

    const handleFieldChange = (fieldName, value) => {
        setIsSavingField(true);
        const updatedCustomer = {
            ...selectedCustomer,
            custom_fields: {
                ...(selectedCustomer.custom_fields || {}),
                [fieldName]: value
            }
        };
        setSelectedCustomer(updatedCustomer);
        
        // Simulating API Save
        setTimeout(() => setIsSavingField(false), 500);
    };

    const handleResolveEvidence = (id, action, fieldName, suggestedValue) => {
        setResolvingEvidence(id);
        router.post(`/admin/crm/settings/evidence/${id}/resolve`, {
            action,
            model_type: 'user',
            model_id: selectedCustomer.id,
            field_name: fieldName,
            suggested_value: suggestedValue
        }, {
            preserveScroll: true,
            onFinish: () => setResolvingEvidence(null)
        });
    };

    const columns = [
        {
            header: 'Nombre',
            accessor: 'nombres',
            primary: true,
            sortable: true,
            render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="table-row-hover">
                    <div className="avatar-container" style={{ 
                        width: '32px', height: '32px', borderRadius: '8px', 
                        backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        fontSize: '13px', fontWeight: 600, color: '#475569',
                        transition: 'all 0.2s ease'
                    }}>
                        {row.nombres?.charAt(0)}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, color: '#1E293B', transition: 'color 0.2s ease' }} className="customer-name">{row.nombres} {row.apellidos}</div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>{row.email}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Identificación',
            accessor: 'dni',
            render: (row) => (
                <div>
                    <div style={{ color: '#1E293B', fontWeight: 500 }}>{row.dni || '-'}</div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>{row.telefono || '-'}</div>
                </div>
            )
        },
        {
            header: 'Pedidos',
            accessor: 'pedidos_count',
            sortable: true,
            render: (row) => (
                <span style={{ fontWeight: 500, color: '#475569' }}>{row.pedidos_count}</span>
            )
        },
        {
            header: 'Segmento',
            accessor: 'segmento',
            render: (row) => row.segmento ? (
                <span style={{ 
                    border: `1px solid ${row.segmento.color}40`, 
                    color: row.segmento.color, 
                    padding: '4px 8px', 
                    borderRadius: '6px', 
                    fontSize: '11px', 
                    fontWeight: 600,
                    backgroundColor: `${row.segmento.color}10`,
                    boxShadow: `0 1px 2px ${row.segmento.color}10`
                }}>
                    {row.segmento.nombre}
                </span>
            ) : <span style={{ color: '#94A3B8' }}>-</span>
        },
        {
            header: 'Estado',
            accessor: 'estado',
            render: (row) => (
                <span style={{
                    color: row.estado === 'activo' ? '#00B4FF' : '#94A3B8',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    {row.estado === 'activo' && <div style={{width: 6, height: 6, borderRadius: '50%', backgroundColor: '#00B4FF', boxShadow: '0 0 4px rgba(0,180,255,0.5)'}}></div>}
                    {row.estado.charAt(0).toUpperCase() + row.estado.slice(1)}
                </span>
            )
        }
    ];

    const headerActions = (
        <div style={{ display: 'flex', gap: '12px' }}>
            <Link href="/admin/clientes/importar" className="premium-btn premium-btn-secondary">
                <Upload size={16} />
                Importar CSV
            </Link>
            <Link href="/admin/exportar/clientes" className="premium-btn premium-btn-secondary">
                <Download size={16} />
                Exportar
            </Link>
            <Link href="/admin/clientes/create" className="premium-btn premium-btn-primary">
                <Plus size={16} />
                Nueva Persona
            </Link>
        </div>
    );

    return (
        <TwentyCrmLayout title="Personas" headerActions={headerActions}>
            <Head title="Personas (Clientes) - CRM" />

            <style>{`
                .premium-container {
                    padding: 32px 40px;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    background-color: #FAFAFA;
                    font-family: inherit;
                    --twenty-border: #E2E8F0;
                    --twenty-border-strong: #E2E8F0;
                    --twenty-bg-surface: #FFFFFF;
                    --twenty-bg-app: #F8FAFC;
                    --twenty-text-main: #1E293B;
                    --twenty-text-secondary: #475569;
                    --twenty-text-muted: #94A3B8;
                    --twenty-primary-bg: rgba(0, 180, 255, 0.04);
                    --twenty-bg-hover: #F1F5F9;
                    --twenty-radius-lg: 12px;
                }
                .premium-search-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                    width: 320px;
                }
                .premium-search-icon {
                    position: absolute;
                    left: 14px;
                    color: #94A3B8;
                    pointer-events: none;
                    transition: color 0.2s ease;
                }
                .premium-input {
                    padding: 10px 16px 10px 40px;
                    border: 1px solid #E2E8F0;
                    border-radius: 10px;
                    font-size: 14px;
                    color: #1E293B;
                    background: #FFFFFF;
                    width: 100%;
                    outline: none;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
                }
                .premium-input:focus {
                    border-color: #00B4FF;
                    box-shadow: 0 0 0 3px rgba(0, 180, 255, 0.15), 0 1px 2px rgba(0, 0, 0, 0.02);
                }
                .premium-input:focus ~ .premium-search-icon {
                    color: #00B4FF;
                }
                .premium-input::placeholder {
                    color: #94A3B8;
                }
                .premium-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 18px;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                    text-decoration: none;
                    outline: none;
                    box-sizing: border-box;
                }
                .premium-btn:active {
                    transform: translateY(0) scale(0.98);
                }
                .premium-btn-secondary {
                    background: #FFFFFF;
                    color: #475569;
                    border: 1px solid #E2E8F0;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
                }
                .premium-btn-secondary:hover {
                    background: #F8FAFC;
                    border-color: #CBD5E1;
                    color: #1E293B;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }
                .premium-btn-primary {
                    background: #00B4FF;
                    color: #FFFFFF;
                    box-shadow: 0 2px 4px rgba(0, 180, 255, 0.2);
                }
                .premium-btn-primary:hover {
                    background: #00A2E8;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 10px rgba(0, 180, 255, 0.3);
                }
                .premium-table-wrapper {
                    flex: 1;
                    overflow: hidden;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -2px rgba(0, 0, 0, 0.03);
                    transition: all 0.3s ease;
                    border: 1px solid transparent;
                }
                .premium-table-wrapper:hover {
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
                }
                .customer-name:hover {
                    color: #00B4FF !important;
                }
                .table-row-hover:hover .avatar-container {
                    border-color: #00B4FF !important;
                    box-shadow: 0 0 0 2px rgba(0, 180, 255, 0.1);
                    color: #00B4FF !important;
                }
                .premium-drawer-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 24px;
                    padding-bottom: 24px;
                    border-bottom: 1px solid #E2E8F0;
                }
                .premium-drawer-avatar {
                    width: 56px;
                    height: 56px;
                    border-radius: 12px;
                    background-color: #F8FAFC;
                    border: 1px solid #E2E8F0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    font-weight: 600;
                    color: #00B4FF;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                }
                .premium-drawer-field {
                    background: #F8FAFC;
                    padding: 12px 16px;
                    border-radius: 10px;
                    border: 1px solid #E2E8F0;
                    transition: all 0.2s ease;
                }
                .premium-drawer-field:hover {
                    border-color: #CBD5E1;
                    background: #FFFFFF;
                }
                .premium-drawer-label {
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #64748B;
                    font-weight: 600;
                    margin-bottom: 4px;
                }
                .premium-drawer-value {
                    font-size: 14px;
                    color: #1E293B;
                    font-weight: 600;
                }
                .premium-pagination a {
                    padding: 6px 12px;
                    font-size: 13px;
                    border: 1px solid #E2E8F0;
                    background-color: #FFFFFF;
                    color: #475569;
                    border-radius: 8px;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                .premium-pagination a:hover {
                    background-color: #F8FAFC;
                    border-color: #CBD5E1;
                    color: #1E293B;
                }
                .premium-pagination a.active {
                    background-color: #00B4FF;
                    border-color: #00B4FF;
                    color: #FFFFFF;
                    box-shadow: 0 2px 4px rgba(0, 180, 255, 0.2);
                }
            `}</style>

            <div className="premium-container">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
                    {/* Search and Filters */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="premium-search-wrapper">
                            <Search size={16} className="premium-search-icon" />
                            <input 
                                type="text" 
                                className="premium-input"
                                placeholder="Filtrar personas..." 
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        {selectedRows.length > 0 && (
                            <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '12px', background: '#FFFFFF', padding: '8px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                <span style={{fontWeight: 600, color: '#1E293B'}}>{selectedRows.length} seleccionados</span>
                                <button onClick={handleBulkDelete} className="premium-btn premium-btn-secondary" style={{ padding: '6px 12px', fontSize: '13px', color: '#EF4444', borderColor: '#FEE2E2', background: '#FEF2F2', boxShadow: 'none' }}>
                                    <Trash2 size={14} /> Eliminar
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Twenty Table */}
                    <div className="premium-table-wrapper">
                        <TwentyTable 
                            columns={columns} 
                            data={data} 
                            selectedRows={selectedRows}
                            onSelectionChange={setSelectedRows}
                            onRowClick={handleRowClick}
                        />
                    </div>

                    {/* Pagination */}
                    {clientes?.links && clientes.data.length > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                            <div style={{ display: 'flex', gap: '6px' }} className="premium-pagination">
                                {clientes.links.map((link, k) => (
                                    <Link
                                        key={k}
                                        href={link.url || '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={link.active ? 'active' : ''}
                                        style={{
                                            pointerEvents: link.url ? 'auto' : 'none',
                                            opacity: link.url ? 1 : 0.5,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Record Drawer */}
            <TwentyRecordDrawer 
                isOpen={drawerOpen} 
                onClose={() => setDrawerOpen(false)}
                title="Detalles de la Persona"
            >
                {selectedCustomer && (
                    <div style={{ padding: '8px 0' }}>
                        <div className="premium-drawer-header">
                            <div className="premium-drawer-avatar">
                                {selectedCustomer.nombres?.charAt(0)}
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '20px', color: '#1E293B', fontWeight: 700 }}>{selectedCustomer.nombres} {selectedCustomer.apellidos}</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748B' }}>{selectedCustomer.email}</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                            <div className="premium-drawer-field">
                                <div className="premium-drawer-label">Teléfono</div>
                                <div className="premium-drawer-value">{selectedCustomer.telefono || 'No registrado'}</div>
                            </div>
                            <div className="premium-drawer-field">
                                <div className="premium-drawer-label">Documento</div>
                                <div className="premium-drawer-value">{selectedCustomer.dni || 'No registrado'}</div>
                            </div>
                            <div className="premium-drawer-field" style={{ gridColumn: 'span 2' }}>
                                <div className="premium-drawer-label">Total Pedidos</div>
                                <div className="premium-drawer-value" style={{ color: '#00B4FF', fontSize: '16px', fontWeight: 700 }}>{selectedCustomer.pedidos_count}</div>
                            </div>
                        </div>

                        {customFieldsSchema && customFieldsSchema.length > 0 && (
                            <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                <h4 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>Campos Personalizados</h4>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {customFieldsSchema.map(field => (
                                        <div key={field.name}>
                                            <label style={{ display: 'block', fontSize: '12px', color: '#475569', fontWeight: 600, marginBottom: '8px' }}>
                                                {field.label}
                                            </label>
                                            {field.type === 'select' ? (
                                                <select
                                                    value={selectedCustomer.custom_fields?.[field.name] || ''}
                                                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                                    className="premium-input" style={{ width: '100%', padding: '10px 14px' }}
                                                >
                                                    <option value="">Seleccionar...</option>
                                                    {field.options && JSON.parse(field.options).map((opt, i) => (
                                                        <option key={i} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            ) : field.type === 'boolean' ? (
                                                 <select
                                                    value={selectedCustomer.custom_fields?.[field.name] || ''}
                                                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                                    className="premium-input" style={{ width: '100%', padding: '10px 14px' }}
                                                >
                                                    <option value="">-</option>
                                                    <option value="1">Sí</option>
                                                    <option value="0">No</option>
                                                </select>
                                            ) : (
                                                <input
                                                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                                    value={selectedCustomer.custom_fields?.[field.name] || ''}
                                                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                                    className="premium-input" style={{ width: '100%', padding: '10px 14px' }}
                                                    placeholder={`Ingresar ${field.label.toLowerCase()}`}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {isSavingField && <div style={{ marginTop: '12px', fontSize: '12px', color: '#00B4FF', fontWeight: 500 }}>Guardando cambios...</div>}
                            </div>
                        )}
                        
                        {/* EVIDENCE LEDGER COMPAI UI */}
                        {evidenceLedger && evidenceLedger.filter(e => e.model_id === selectedCustomer.id).length > 0 && (
                            <div style={{ marginTop: '24px', backgroundColor: '#F0F9FF', padding: '20px', borderRadius: '12px', border: '1px solid #BAE6FD', boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <div style={{ backgroundColor: '#0EA5E9', color: 'white', padding: '6px', borderRadius: '8px', display: 'flex', boxShadow: '0 2px 4px rgba(14, 165, 233, 0.2)' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                    </div>
                                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0369A1' }}>Sugerencias de la IA</h4>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {evidenceLedger.filter(e => e.model_id === selectedCustomer.id).map(evidence => {
                                        const schemaField = customFieldsSchema?.find(f => f.name === evidence.field_name);
                                        const label = schemaField ? schemaField.label : evidence.field_name;
                                        
                                        return (
                                            <div key={evidence.id} style={{ backgroundColor: 'white', border: '1px solid #E0F2FE', borderRadius: '8px', padding: '16px', fontSize: '13px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                    <span style={{ color: '#475569' }}>Posible valor para <strong>{label}</strong>:</span>
                                                    <span style={{ color: '#0EA5E9', fontSize: '12px', fontWeight: 700 }}>{evidence.confidence_score}% confianza</span>
                                                </div>
                                                <div style={{ fontWeight: 600, color: '#1E293B', marginBottom: '16px', fontSize: '14px' }}>
                                                    {evidence.suggested_value}
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button 
                                                        className="premium-btn" 
                                                        style={{ padding: '6px 12px', fontSize: '12px', color: '#EF4444', backgroundColor: '#FEE2E2', border: 'none', boxShadow: 'none' }}
                                                        onClick={() => handleResolveEvidence(evidence.id, 'reject', evidence.field_name, evidence.suggested_value)}
                                                        disabled={resolvingEvidence === evidence.id}
                                                    >
                                                        Ignorar
                                                    </button>
                                                    <button 
                                                        className="premium-btn" 
                                                        style={{ padding: '6px 12px', fontSize: '12px', color: 'white', backgroundColor: '#0EA5E9', border: 'none' }}
                                                        onClick={() => handleResolveEvidence(evidence.id, 'accept', evidence.field_name, evidence.suggested_value)}
                                                        disabled={resolvingEvidence === evidence.id}
                                                    >
                                                        {resolvingEvidence === evidence.id ? 'Guardando...' : 'Aceptar Dato'}
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                        
                    </div>
                )}
            </TwentyRecordDrawer>
        </TwentyCrmLayout>
    );
}
