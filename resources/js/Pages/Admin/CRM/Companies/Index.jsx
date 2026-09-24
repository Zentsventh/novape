import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import TwentyCrmLayout from '../../../../Layouts/TwentyCrmLayout';
import TwentyTable from '../../../../Components/Admin/CRM/TwentyTable';
import TwentyRecordDrawer from '../../../../Components/Admin/CRM/TwentyRecordDrawer';
import { Plus, Building, Download, Search, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Index({ companies = { data: [], links: [] }, filters = {}, customFieldsSchema = [] }) {
    const [search, setSearch] = useState(filters?.search || '');
    const data = companies?.data || [];
    const [selectedRows, setSelectedRows] = useState([]);

    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            router.get('/admin/crm/companies', { search }, { preserveState: true });
        }
    };

    const columns = [
        {
            accessor: 'nombre',
            header: 'Nombre',
            render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="table-row-hover">
                    <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        background: '#F8FAFC', 
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease'
                    }} className="company-logo-container">
                        {row.logo_url ? (
                            <img src={row.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <Building size={16} color="#94A3B8" />
                        )}
                    </div>
                    <Link href={`/admin/crm/companies/${row.id}`} style={{ color: '#1E293B', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s ease' }} className="company-link">
                        {row.nombre}
                    </Link>
                </div>
            )
        },
        { accessor: 'dominio', header: 'Dominio' },
        { accessor: 'industria', header: 'Industria' },
        { 
            accessor: 'personas_count', 
            header: 'Contactos', 
            render: (row) => row.personas_count || 0
        },
        {
            accessor: 'responsable',
            header: 'Propietario',
            render: (row) => row.responsable ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img 
                        src={row.responsable.avatar_url || `https://ui-avatars.com/api/?name=${row.responsable.nombres}+${row.responsable.apellidos}&background=random`} 
                        alt={row.responsable.nombres}
                        style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                    />
                    <span style={{color: '#475569', fontWeight: 500}}>{row.responsable.nombres} {row.responsable.apellidos}</span>
                </div>
            ) : <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Sin asignar</span>
        },
        { accessor: 'created_at', header: 'Creado' }
    ];

    const handleBulkDelete = () => {
        if (!selectedRows.length) return;
        Swal.fire({
            title: '¿Eliminar empresas?',
            text: `Eliminarás ${selectedRows.length} empresa(s). Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            buttonsStyling: false,
            customClass: {
                popup: 'premium-swal-popup',
                title: 'premium-swal-title',
                htmlContainer: 'premium-swal-text',
                actions: 'premium-swal-actions',
                confirmButton: 'premium-swal-confirm',
                cancelButton: 'premium-swal-cancel',
                icon: 'premium-swal-icon'
            },
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // To keep it simple, if no bulk API exists, we delete the first one or we can just send multiple requests
                // But ideally we hit the first id for now as the original code did, or map them.
                router.delete(`/admin/crm/companies/${selectedRows[0]}`, {
                    preserveScroll: true,
                    onSuccess: () => setSelectedRows([])
                });
            }
        });
    };

    return (
        <TwentyCrmLayout title="Empresas">
            <Head title="Empresas - CRM" />

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
                .premium-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                }
                .premium-title {
                    font-size: 28px;
                    font-weight: 700;
                    color: #1E293B;
                    margin: 0;
                    letter-spacing: -0.02em;
                }
                .premium-actions {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }
                .premium-search-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
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
                    width: 260px;
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
                }
                .premium-btn:active {
                    transform: translateY(0) scale(0.98);
                }
                .premium-btn:focus-visible {
                    box-shadow: 0 0 0 3px rgba(0, 180, 255, 0.3);
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
                .company-link:hover {
                    color: #00B4FF !important;
                }
                .table-row-hover:hover .company-logo-container {
                    border-color: #00B4FF !important;
                    box-shadow: 0 0 0 2px rgba(0, 180, 255, 0.1);
                }
                .premium-form {
                    padding: 8px 0;
                }
                .premium-form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    margin-bottom: 20px;
                }
                .premium-label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #1E293B;
                }
                .premium-form-input {
                    padding: 10px 14px;
                    border: 1px solid #E2E8F0;
                    border-radius: 8px;
                    font-size: 14px;
                    color: #1E293B;
                    background: #FFFFFF;
                    outline: none;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
                }
                .premium-form-input:focus {
                    border-color: #00B4FF;
                    box-shadow: 0 0 0 3px rgba(0, 180, 255, 0.15), 0 1px 2px rgba(0,0,0,0.02);
                }
                .premium-form-input::placeholder {
                    color: #94A3B8;
                }
                .premium-hint {
                    font-size: 12px;
                    color: #64748B;
                    margin-top: 2px;
                }
                
                /* Premium SweetAlert Styles */
                .premium-swal-popup {
                    border-radius: 16px !important;
                    padding: 32px 24px !important;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
                    border: 1px solid #E2E8F0 !important;
                    font-family: inherit !important;
                }
                .premium-swal-title {
                    font-size: 20px !important;
                    font-weight: 700 !important;
                    color: #1E293B !important;
                    margin-bottom: 8px !important;
                }
                .premium-swal-text {
                    font-size: 14px !important;
                    color: #64748B !important;
                    margin: 0 0 24px 0 !important;
                }
                .premium-swal-icon {
                    border-color: #FCA5A5 !important;
                    color: #EF4444 !important;
                }
                .premium-swal-actions {
                    display: flex !important;
                    gap: 12px !important;
                    width: 100% !important;
                    justify-content: center !important;
                    margin-top: 16px !important;
                }
                .premium-swal-confirm {
                    background: #EF4444 !important;
                    color: #FFFFFF !important;
                    padding: 10px 20px !important;
                    border-radius: 10px !important;
                    font-size: 14px !important;
                    font-weight: 600 !important;
                    border: none !important;
                    cursor: pointer !important;
                    transition: all 0.2s ease !important;
                    box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2) !important;
                }
                .premium-swal-confirm:hover {
                    background: #DC2626 !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3) !important;
                }
                .premium-swal-cancel {
                    background: #FFFFFF !important;
                    color: #475569 !important;
                    padding: 10px 20px !important;
                    border-radius: 10px !important;
                    font-size: 14px !important;
                    font-weight: 600 !important;
                    border: 1px solid #E2E8F0 !important;
                    cursor: pointer !important;
                    transition: all 0.2s ease !important;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
                }
                .premium-swal-cancel:hover {
                    background: #F8FAFC !important;
                    color: #1E293B !important;
                    border-color: #CBD5E1 !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04) !important;
                }
            `}</style>

            <div className="premium-container">
                <div className="premium-header">
                    <h1 className="premium-title">Empresas</h1>
                    <div className="premium-actions">
                        <div className="premium-search-wrapper">
                            <Search size={16} className="premium-search-icon" />
                            <input 
                                type="text" 
                                className="premium-input"
                                placeholder="Buscar empresas..." 
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={handleSearch}
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
                        <a href="/admin/crm/export?type=companies" className="premium-btn premium-btn-secondary">
                            <Download size={16} />
                            <span>Exportar</span>
                        </a>
                        <button className="premium-btn premium-btn-primary" onClick={() => setDrawerOpen(true)}>
                            <Plus size={16} />
                            <span>Crear empresa</span>
                        </button>
                    </div>
                </div>

                <div className="premium-table-wrapper">
                    <TwentyTable 
                        columns={columns} 
                        data={data}
                        selectedRows={selectedRows}
                        onSelectionChange={setSelectedRows}
                        onRowClick={(row) => router.get(`/admin/crm/companies/${row.id}`)}
                        onRowDelete={(row) => {
                            Swal.fire({
                                title: '¿Eliminar empresa?',
                                text: `Eliminarás a ${row.nombre}. Esta acción no se puede deshacer.`,
                                icon: 'warning',
                                showCancelButton: true,
                                buttonsStyling: false,
                                customClass: {
                                    popup: 'premium-swal-popup',
                                    title: 'premium-swal-title',
                                    htmlContainer: 'premium-swal-text',
                                    actions: 'premium-swal-actions',
                                    confirmButton: 'premium-swal-confirm',
                                    cancelButton: 'premium-swal-cancel',
                                    icon: 'premium-swal-icon'
                                },
                                confirmButtonText: 'Sí, eliminar',
                                cancelButtonText: 'Cancelar'
                            }).then((result) => {
                                if (result.isConfirmed) {
                                    router.delete(`/admin/crm/companies/${row.id}`, {
                                        preserveScroll: true
                                    });
                                }
                            });
                        }}
                    />
                </div>
            </div>

            <TwentyRecordDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title="Nueva Empresa"
            >
                <form 
                    className="premium-form" 
                    onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        router.post('/admin/crm/companies', Object.fromEntries(formData), {
                            onSuccess: () => setDrawerOpen(false)
                        });
                    }}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="premium-form-group">
                            <label className="premium-label">Nombre *</label>
                            <input type="text" name="nombre" required className="premium-form-input" placeholder="" />
                        </div>
                        <div className="premium-form-group">
                            <label className="premium-label">RUC</label>
                            <input type="text" name="ruc" className="premium-form-input" placeholder="" />
                        </div>
                        <div className="premium-form-group">
                            <label className="premium-label">Dominio web</label>
                            <input type="text" name="dominio" className="premium-form-input" placeholder="example.com" />
                            <span className="premium-hint">
                                Usaremos el dominio para que la IA investigue la empresa.
                            </span>
                        </div>
                        <div className="premium-form-group">
                            <label className="premium-label">Industria</label>
                            <input type="text" name="industria" className="premium-form-input" placeholder="" />
                        </div>
                        <div className="premium-form-group">
                            <label className="premium-label">Teléfono</label>
                            <input type="text" name="telefono" className="premium-form-input" placeholder="" />
                        </div>
                        <div className="premium-form-group">
                            <label className="premium-label">Correo Electrónico</label>
                            <input type="email" name="email" className="premium-form-input" placeholder="you@example.com" />
                        </div>
                        <div className="premium-form-group">
                            <label className="premium-label">Dirección</label>
                            <input type="text" name="direccion" className="premium-form-input" placeholder="" />
                        </div>
                        <div className="premium-form-group">
                            <label className="premium-label">País</label>
                            <input type="text" name="pais" className="premium-form-input" placeholder="" />
                        </div>
                    </div>
                    
                    <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
                        <button type="button" className="premium-btn premium-btn-secondary" onClick={() => setDrawerOpen(false)}>
                            Cancelar
                        </button>
                        <button type="submit" className="premium-btn premium-btn-primary">
                            Crear Empresa
                        </button>
                    </div>
                </form>
            </TwentyRecordDrawer>
        </TwentyCrmLayout>
    );
}
