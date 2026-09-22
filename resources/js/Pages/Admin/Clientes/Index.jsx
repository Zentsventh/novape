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
    const { clientes, filtros, flash, errors, customFieldsSchema } = usePage().props;
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--twenty-bg-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600 }}>
                        {row.nombres?.charAt(0)}
                    </div>
                    <div>
                        <div style={{ fontWeight: 500 }}>{row.nombres} {row.apellidos}</div>
                        <div style={{ fontSize: '11px', color: 'var(--twenty-text-muted)' }}>{row.email}</div>
                    </div>
                </div>
            )
        },
        {
            header: 'Identificación',
            accessor: 'dni',
            render: (row) => (
                <div>
                    <div>{row.dni || '-'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--twenty-text-muted)' }}>{row.telefono || '-'}</div>
                </div>
            )
        },
        {
            header: 'Pedidos',
            accessor: 'pedidos_count',
            sortable: true
        },
        {
            header: 'Segmento',
            accessor: 'segmento',
            render: (row) => row.segmento ? (
                <span style={{ 
                    border: `1px solid ${row.segmento.color}40`, 
                    color: row.segmento.color, 
                    padding: '2px 6px', 
                    borderRadius: '4px', 
                    fontSize: '11px', 
                    fontWeight: 500,
                    backgroundColor: `${row.segmento.color}10`
                }}>
                    {row.segmento.nombre}
                </span>
            ) : '-'
        },
        {
            header: 'Estado',
            accessor: 'estado',
            render: (row) => (
                <span style={{
                    color: row.estado === 'activo' ? 'var(--twenty-primary)' : 'var(--twenty-text-muted)',
                    fontSize: '12px'
                }}>
                    {row.estado}
                </span>
            )
        }
    ];

    const headerActions = (
        <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/admin/clientes/importar" className="twenty-btn twenty-btn-secondary" style={{ textDecoration: 'none' }}>
                <Upload size={16} />
                Importar CSV
            </Link>
            <Link href="/admin/exportar/clientes" className="twenty-btn twenty-btn-secondary" style={{ textDecoration: 'none' }}>
                <Download size={16} />
                Exportar
            </Link>
            <Link href="/admin/clientes/create" className="twenty-btn twenty-btn-primary" style={{ textDecoration: 'none' }}>
                <Plus size={16} />
                Nueva Persona
            </Link>
        </div>
    );

    return (
        <TwentyCrmLayout title="Personas" headerActions={headerActions}>
            <Head title="Personas (Clientes) - CRM" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1440px', margin: '0 auto' }}>
                {/* Search and Filters */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                         <input 
                            type="text" 
                            placeholder="Filtrar personas..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ 
                                padding: '6px 12px', 
                                borderRadius: '4px', 
                                border: '1px solid var(--twenty-border)', 
                                fontSize: '13px', 
                                outline: 'none',
                                width: '300px'
                            }} 
                        />
                    </div>
                    {selectedRows.length > 0 && (
                        <div style={{ fontSize: '13px', color: 'var(--twenty-text-muted)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span>{selectedRows.length} seleccionados</span>
                            <button className="twenty-btn twenty-btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                                Eliminar
                            </button>
                        </div>
                    )}
                </div>

                {/* Twenty Table */}
                <TwentyTable 
                    columns={columns} 
                    data={data} 
                    selectedRows={selectedRows}
                    onSelectionChange={setSelectedRows}
                    onRowClick={handleRowClick}
                />

                {/* Pagination (Simplified for Twenty look) */}
                {clientes?.links && clientes.data.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {clientes.links.map((link, k) => (
                                <Link
                                    key={k}
                                    href={link.url || '#'}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    style={{
                                        padding: '4px 10px',
                                        fontSize: '12px',
                                        border: '1px solid',
                                        borderColor: link.active ? 'var(--twenty-primary)' : 'var(--twenty-border)',
                                        backgroundColor: link.active ? 'var(--twenty-primary)' : 'transparent',
                                        color: link.active ? 'white' : 'var(--twenty-text-secondary)',
                                        borderRadius: '4px',
                                        pointerEvents: link.url ? 'auto' : 'none',
                                        opacity: link.url ? 1 : 0.5,
                                        textDecoration: 'none'
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Record Drawer */}
            <TwentyRecordDrawer 
                isOpen={drawerOpen} 
                onClose={() => setDrawerOpen(false)}
                title="Detalles de la Persona"
            >
                {selectedCustomer && (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--twenty-bg-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 600 }}>
                                {selectedCustomer.nombres?.charAt(0)}
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--twenty-text-main)' }}>{selectedCustomer.nombres} {selectedCustomer.apellidos}</h3>
                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--twenty-text-muted)' }}>{selectedCustomer.email}</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--twenty-text-muted)', fontWeight: 600 }}>Teléfono</label>
                                <div style={{ fontSize: '14px', marginTop: '4px' }}>{selectedCustomer.telefono || 'No registrado'}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--twenty-text-muted)', fontWeight: 600 }}>Documento</label>
                                <div style={{ fontSize: '14px', marginTop: '4px' }}>{selectedCustomer.dni || 'No registrado'}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--twenty-text-muted)', fontWeight: 600 }}>Total Pedidos</label>
                                <div style={{ fontSize: '14px', marginTop: '4px' }}>{selectedCustomer.pedidos_count}</div>
                            </div>
                        </div>

                        {customFieldsSchema && customFieldsSchema.length > 0 && (
                            <>
                                <hr style={{ border: 'none', borderTop: '1px solid var(--twenty-border)', margin: '16px 0' }} />
                                <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: 'var(--twenty-text-main)' }}>Campos Personalizados</h4>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                                    {customFieldsSchema.map(field => (
                                        <div key={field.name}>
                                            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--twenty-text-muted)', fontWeight: 600, marginBottom: '6px' }}>
                                                {field.label}
                                            </label>
                                            {field.type === 'select' ? (
                                                <select
                                                    value={selectedCustomer.custom_fields?.[field.name] || ''}
                                                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--twenty-border)', fontSize: '13px', outline: 'none', backgroundColor: 'var(--twenty-bg-hover)' }}
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
                                                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--twenty-border)', fontSize: '13px', outline: 'none', backgroundColor: 'var(--twenty-bg-hover)' }}
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
                                                    style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--twenty-border)', fontSize: '13px', outline: 'none', backgroundColor: 'var(--twenty-bg-hover)' }}
                                                    placeholder={`Ingresar ${field.label.toLowerCase()}`}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {isSavingField && <span style={{ fontSize: '11px', color: 'var(--twenty-primary)' }}>Guardando...</span>}
                            </>
                        )}
                        
                        {/* EVIDENCE LEDGER COMPAI UI */}
                        {evidenceLedger && evidenceLedger.filter(e => e.model_id === selectedCustomer.id).length > 0 && (
                            <div style={{ marginTop: '24px', backgroundColor: '#f0f9ff', padding: '16px', borderRadius: 'var(--twenty-radius-md)', border: '1px solid #bae6fd' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <div style={{ backgroundColor: '#0ea5e9', color: 'white', padding: '4px', borderRadius: '4px', display: 'flex' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                    </div>
                                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0369a1' }}>Sugerencias de la IA</h4>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {evidenceLedger.filter(e => e.model_id === selectedCustomer.id).map(evidence => {
                                        const schemaField = customFieldsSchema?.find(f => f.name === evidence.field_name);
                                        const label = schemaField ? schemaField.label : evidence.field_name;
                                        
                                        return (
                                            <div key={evidence.id} style={{ backgroundColor: 'white', border: '1px solid #e0f2fe', borderRadius: '4px', padding: '12px', fontSize: '13px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <span style={{ color: 'var(--twenty-text-muted)' }}>Posible valor para <strong>{label}</strong>:</span>
                                                    <span style={{ color: '#0ea5e9', fontSize: '11px', fontWeight: 600 }}>{evidence.confidence_score}% confianza</span>
                                                </div>
                                                <div style={{ fontWeight: 500, color: 'var(--twenty-text-main)', marginBottom: '12px' }}>
                                                    {evidence.suggested_value}
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button 
                                                        className="twenty-btn" 
                                                        style={{ padding: '4px 8px', fontSize: '11px', color: '#ef4444', backgroundColor: '#fee2e2', border: 'none' }}
                                                        onClick={() => handleResolveEvidence(evidence.id, 'reject', evidence.field_name, evidence.suggested_value)}
                                                        disabled={resolvingEvidence === evidence.id}
                                                    >
                                                        Ignorar
                                                    </button>
                                                    <button 
                                                        className="twenty-btn" 
                                                        style={{ padding: '4px 8px', fontSize: '11px', color: 'white', backgroundColor: '#0ea5e9', border: 'none' }}
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
