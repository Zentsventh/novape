import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import TwentyCrmLayout from '../../../../Layouts/TwentyCrmLayout';
import { Settings, Plus, Zap, ArrowRight, Trash2 } from 'lucide-react';
import TwentyRecordDrawer from '../../../../Components/Admin/CRM/TwentyRecordDrawer';
import Swal from 'sweetalert2';

export default function Index({ automations = [] }) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    
    // Automation Form State
    const [form, setForm] = useState({
        nombre: '',
        trigger_type: 'deal_created',
        condiciones: [],
        acciones: [{ type: 'webhook', url: '' }],
        activo: true
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        router.post('/admin/crm/automations', form, {
            onSuccess: () => {
                setDrawerOpen(false);
                setForm({
                    nombre: '', trigger_type: 'deal_created', 
                    condiciones: [], acciones: [{ type: 'webhook', url: '' }], activo: true
                });
            }
        });
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: '¿Eliminar automatización?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(`/admin/crm/automations/${id}`);
            }
        });
    };

    return (
        <TwentyCrmLayout title="Automatizaciones">
            <Head title="Automatizaciones - CRM" />

            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Header */}
                <div className="twenty-header">
                    <div>
                        <h1 className="twenty-title">Automatizaciones</h1>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--twenty-text-muted)' }}>Configura flujos de trabajo visuales y webhooks para responder a eventos del CRM.</p>
                    </div>
                    <button className="twenty-btn twenty-btn-primary" onClick={() => setDrawerOpen(true)}>
                        <Plus size={16} />
                        <span>Nueva Automatización</span>
                    </button>
                </div>

                {/* List Content */}
                <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
                    {automations.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--twenty-text-muted)' }}>
                            <Zap size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                            <h3>No hay automatizaciones</h3>
                            <p>Crea tu primera automatización para optimizar tus flujos de trabajo.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                            {automations.map(auto => (
                                <div key={auto.id} className="twenty-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: auto.activo ? '#10b981' : '#d1d5db' }} />
                                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>{auto.nombre}</h3>
                                        </div>
                                        <button 
                                            onClick={() => handleDelete(auto.id)}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    
                                    <div style={{ padding: '12px', background: 'var(--twenty-background-tertiary)', borderRadius: '8px', fontSize: '13px' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--twenty-text-main)', marginBottom: '4px' }}>Cuándo</div>
                                        <div style={{ color: 'var(--twenty-text-muted)' }}>
                                            {auto.trigger_type === 'deal_created' && 'Se crea una oportunidad'}
                                            {auto.trigger_type === 'deal_moved' && 'Se mueve una oportunidad de etapa'}
                                            {auto.trigger_type === 'company_created' && 'Se crea una empresa'}
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                                        <ArrowRight size={16} color="var(--twenty-text-muted)" />
                                    </div>

                                    <div style={{ padding: '12px', border: '1px solid var(--twenty-border)', borderRadius: '8px', fontSize: '13px' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--twenty-text-main)', marginBottom: '4px' }}>Entonces (Acciones)</div>
                                        {auto.acciones.map((acc, i) => (
                                            <div key={i} style={{ color: 'var(--twenty-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Zap size={12} color="var(--twenty-primary)" />
                                                {acc.type === 'webhook' && <span>Llamar webhook: <span style={{ fontFamily: 'monospace' }}>{acc.url}</span></span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Drawer */}
            <TwentyRecordDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                title="Nueva Automatización"
            >
                <form className="twenty-form" onSubmit={handleSubmit}>
                    <div className="twenty-form-group">
                        <label>Nombre</label>
                        <input 
                            type="text" required className="twenty-input" placeholder="Ej: Enviar webhook al crear deal"
                            value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                        />
                    </div>

                    <div className="twenty-form-group">
                        <label>Evento (Trigger)</label>
                        <select 
                            className="twenty-input"
                            value={form.trigger_type} onChange={e => setForm({...form, trigger_type: e.target.value})}
                        >
                            <option value="deal_created">Oportunidad creada</option>
                            <option value="deal_moved">Oportunidad cambia de etapa</option>
                            <option value="company_created">Empresa creada</option>
                        </select>
                    </div>

                    {/* Simplicity: Only webhook action supported right now */}
                    <div className="twenty-form-group">
                        <label>Acción (Webhook URL)</label>
                        <input 
                            type="url" required className="twenty-input" placeholder="https://..."
                            value={form.acciones[0].url} 
                            onChange={e => {
                                const newAcc = [...form.acciones];
                                newAcc[0].url = e.target.value;
                                setForm({...form, acciones: newAcc});
                            }}
                        />
                    </div>
                    
                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button type="button" className="twenty-btn twenty-btn-secondary" onClick={() => setDrawerOpen(false)}>Cancelar</button>
                        <button type="submit" className="twenty-btn twenty-btn-primary">Guardar</button>
                    </div>
                </form>
            </TwentyRecordDrawer>
        </TwentyCrmLayout>
    );
}
