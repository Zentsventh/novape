import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import TwentyCrmLayout from '../../../../Layouts/TwentyCrmLayout';
import TwentyTable from '../../../../Components/Admin/CRM/TwentyTable';
import TwentyRecordDrawer from '../../../../Components/Admin/CRM/TwentyRecordDrawer';
import { Plus, Building, Download } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Index({ companies = { data: [], links: [] }, filters = {}, customFieldsSchema = [] }) {
    const [search, setSearch] = useState(filters?.search || '');
    const data = companies?.data || [];

    // States for creating a company
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            router.get('/admin/crm/companies', { search }, { preserveState: true });
        }
    };

    const columns = [
        {
            key: 'nombre',
            label: 'Nombre',
            render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                        width: '24px', 
                        height: '24px', 
                        background: 'var(--twenty-background-tertiary)', 
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}>
                        {row.logo_url ? (
                            <img src={row.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <Building size={14} color="var(--twenty-text-muted)" />
                        )}
                    </div>
                    <Link href={`/admin/crm/companies/${row.id}`} style={{ color: 'var(--twenty-text-main)', textDecoration: 'none', fontWeight: 500 }}>
                        {row.nombre}
                    </Link>
                </div>
            )
        },
        { key: 'dominio', label: 'Dominio', type: 'text' },
        { key: 'industria', label: 'Industria', type: 'text' },
        { 
            key: 'personas_count', 
            label: 'Contactos', 
            type: 'number',
            render: (row) => row.personas_count || 0
        },
        {
            key: 'responsable',
            label: 'Propietario',
            render: (row) => row.responsable ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img 
                        src={row.responsable.avatar_url || `https://ui-avatars.com/api/?name=${row.responsable.nombres}+${row.responsable.apellidos}&background=random`} 
                        alt={row.responsable.nombres}
                        style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                    />
                    <span>{row.responsable.nombres} {row.responsable.apellidos}</span>
                </div>
            ) : <span style={{ color: 'var(--twenty-text-placeholder)' }}>Sin asignar</span>
        },
        { key: 'created_at', label: 'Creado', type: 'date' }
    ];

    const handleDelete = (ids) => {
        if (ids.length === 0) return;
        Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esto.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Here we would typically batch delete, but for now delete first one
                router.delete(`/admin/crm/companies/${ids[0]}`, {
                    preserveScroll: true
                });
            }
        });
    };

    return (
        <TwentyCrmLayout title="Empresas">
            <Head title="Empresas - CRM" />

            <div style={{ padding: '0 24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className="twenty-header">
                    <h1 className="twenty-title">Empresas</h1>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div className="twenty-search-box">
                            <input 
                                type="text" 
                                placeholder="Buscar empresas..." 
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={handleSearch}
                            />
                        </div>
                        <a href="/admin/crm/export?type=companies" className="twenty-btn twenty-btn-secondary" style={{ textDecoration: 'none' }}>
                            <Download size={16} />
                            <span>Exportar</span>
                        </a>
                        <button className="twenty-btn twenty-btn-primary" onClick={() => setDrawerOpen(true)}>
                            <Plus size={16} />
                            <span>Crear empresa</span>
                        </button>
                    </div>
                </div>

                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <TwentyTable 
                        columns={columns} 
                        data={data}
                        onDelete={handleDelete}
                    />
                </div>
            </div>

            <TwentyRecordDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title="Nueva Empresa"
            >
                <form 
                    className="twenty-form" 
                    onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        router.post('/admin/crm/companies', Object.fromEntries(formData), {
                            onSuccess: () => setDrawerOpen(false)
                        });
                    }}
                >
                    <div className="twenty-form-group">
                        <label>Nombre *</label>
                        <input type="text" name="nombre" required className="twenty-input" placeholder="Ej: Acme Corp" />
                    </div>
                    <div className="twenty-form-group">
                        <label>Dominio web</label>
                        <input type="text" name="dominio" className="twenty-input" placeholder="Ej: acme.com" />
                        <span style={{ fontSize: '12px', color: 'var(--twenty-text-muted)', marginTop: '4px', display: 'block' }}>
                            Usaremos el dominio para que la IA investigue la empresa.
                        </span>
                    </div>
                    <div className="twenty-form-group">
                        <label>Industria</label>
                        <input type="text" name="industria" className="twenty-input" placeholder="Ej: Tecnología" />
                    </div>
                    
                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button type="button" className="twenty-btn twenty-btn-secondary" onClick={() => setDrawerOpen(false)}>
                            Cancelar
                        </button>
                        <button type="submit" className="twenty-btn twenty-btn-primary">
                            Crear
                        </button>
                    </div>
                </form>
            </TwentyRecordDrawer>
        </TwentyCrmLayout>
    );
}
