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

            <style>{`
                .auto-card {
                    background: #ffffff;
                    border: 1px solid #E2E8F0;
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
                    transition: all 0.2s ease;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .auto-card:hover {
                    box-shadow: 0 10px 25px -5px rgba(0, 71, 151, 0.15);
                    transform: translateY(-3px);
                    border-color: rgba(0, 71, 151, 0.3);
                }
                .btn-primary-custom {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    background: #004797;
                    color: #ffffff;
                    border: none;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 4px rgba(0, 71, 151, 0.2);
                }
                .btn-primary-custom:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 71, 151, 0.3);
                    background: #009BE0;
                }
                .btn-icon-danger {
                    background: transparent;
                    border: none;
                    color: #94A3B8;
                    cursor: pointer;
                    padding: 6px;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                }
                .btn-icon-danger:hover {
                    color: #EF4444;
                    background: #FEE2E2;
                }
                .flow-step {
                    padding: 16px;
                    background: #F8FAFC;
                    border: 1px solid #E2E8F0;
                    border-radius: 10px;
                    font-size: 13px;
                    transition: all 0.2s ease;
                }
                .auto-card:hover .flow-step {
                    border-color: rgba(0, 71, 151, 0.3);
                    background: #F0F9FF;
                }
                .flow-step-title {
                    font-weight: 600;
                    color: #1E293B;
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 80px 32px;
                    text-align: center;
                    background: #ffffff;
                    border: 1px dashed #CBD5E1;
                    border-radius: 16px;
                    color: #64748B;
                }
                /* Drawer Form Styles */
                .drawer-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    padding: 24px 32px;
                }
                .drawer-form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .drawer-label {
                    font-size: 13px;
                    font-weight: 600;
                    color: #64748B;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .drawer-input {
                    width: 100%;
                    padding: 12px 16px;
                    border: 1px solid #E2E8F0;
                    border-radius: 10px;
                    font-size: 14px;
                    color: #1E293B;
                    background: #F8FAFC;
                    transition: all 0.2s ease;
                    outline: none;
                    appearance: none;
                }
                .drawer-input:focus {
                    background: #ffffff;
                    border-color: #004797;
                    box-shadow: 0 0 0 4px rgba(0, 71, 151, 0.1);
                }
                .drawer-input::placeholder {
                    color: #94A3B8;
                }
                .drawer-select {
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 16px center;
                    padding-right: 40px;
                }
                .btn-secondary-custom {
                    padding: 10px 20px;
                    background: #ffffff;
                    color: #475569;
                    border: 1px solid #E2E8F0;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
                }
                .btn-secondary-custom:hover {
                    background: #F1F5F9;
                    color: #1E293B;
                    border-color: #94A3B8;
                }
                .drawer-footer {
                    margin-top: 16px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    padding-top: 24px;
                    border-top: 1px solid #E2E8F0;
                }
            `}</style>

            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F8FAFC' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '32px', borderBottom: '1px solid #E2E8F0', background: '#ffffff' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div style={{ background: '#F0F9FF', padding: '8px', borderRadius: '10px', color: '#004797' }}>
                                <Zap size={24} />
                            </div>
                            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#1E293B', letterSpacing: '-0.02em' }}>Automatizaciones</h1>
                        </div>
                    </div>
                    <button className="btn-primary-custom" onClick={() => setDrawerOpen(true)}>
                        <Plus size={18} />
                        <span>Nueva Automatización</span>
                    </button>
                </div>

                {/* List Content */}
                <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                    {automations.length === 0 ? (
                        <div className="empty-state">
                            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(0, 71, 151, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                <Zap size={32} color="#004797" />
                            </div>
                            <h3 style={{ margin: '0 0 8px 0', color: '#1E293B', fontSize: '18px', fontWeight: 600 }}>No hay automatizaciones</h3>
                            <p style={{ margin: '0 0 24px 0', fontSize: '15px' }}>Crea tu primera automatización para optimizar tus flujos de trabajo.</p>
                            <button className="btn-primary-custom" onClick={() => setDrawerOpen(true)}>
                                <Plus size={16} /> Crear Automatización
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
                            {automations.map(auto => (
                                <div key={auto.id} className="auto-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: auto.activo ? '#10b981' : '#94A3B8', boxShadow: auto.activo ? '0 0 10px rgba(16, 185, 129, 0.4)' : 'none' }} />
                                            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#1E293B' }}>{auto.nombre}</h3>
                                        </div>
                                        <button 
                                            onClick={() => handleDelete(auto.id)}
                                            className="btn-icon-danger"
                                            title="Eliminar automatización"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    
                                    <div className="flow-step">
                                        <div className="flow-step-title">
                                            <div style={{ background: '#E2E8F0', color: '#475569', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Trigger</div>
                                            Cuándo
                                        </div>
                                        <div style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', fontWeight: 500 }}>
                                            <Zap size={16} color="#94A3B8" />
                                            {auto.trigger_type === 'deal_created' && 'Se crea una nueva oportunidad'}
                                            {auto.trigger_type === 'deal_moved' && 'Una oportunidad cambia de etapa'}
                                            {auto.trigger_type === 'company_created' && 'Se registra una nueva empresa'}
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', justifySelf: 'center', margin: '-8px 0', alignSelf: 'center', position: 'relative', zIndex: 1 }}>
                                        <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '50%', padding: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                            <ArrowRight size={14} color="#94A3B8" style={{ transform: 'rotate(90deg)' }} />
                                        </div>
                                    </div>

                                    <div className="flow-step">
                                        <div className="flow-step-title">
                                            <div style={{ background: 'rgba(0, 71, 151, 0.1)', color: '#004797', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Action</div>
                                            Entonces
                                        </div>
                                        {auto.acciones.map((acc, i) => (
                                            <div key={i} style={{ color: '#475569', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', fontWeight: 500 }}>
                                                {acc.type === 'webhook' && (
                                                    <>
                                                        <div style={{ background: '#1E293B', color: '#fff', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>POST</div>
                                                        <span style={{ fontFamily: 'monospace', background: '#ffffff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '12px', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', flex: 1 }}>{acc.url}</span>
                                                    </>
                                                )}
                                                {acc.type === 'send_email' && <span>Enviar Correo: {acc.message}</span>}
                                                {acc.type === 'send_coupon' && <span>Enviar Cupón: {acc.message}</span>}
                                                {acc.type === 'create_task' && <span>Crear Tarea en CRM</span>}
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
                <form className="drawer-form" onSubmit={handleSubmit}>
                    <div className="drawer-form-group">
                        <label className="drawer-label">Nombre de la automatización</label>
                        <input 
                            type="text" required className="drawer-input" placeholder="Ej: Enviar webhook al crear oportunidad"
                            value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                        />
                    </div>

                    <div className="drawer-form-group">
                        <label className="drawer-label">Evento (Trigger)</label>
                        <select 
                            className="drawer-input drawer-select"
                            value={form.trigger_type} onChange={e => setForm({...form, trigger_type: e.target.value})}
                        >
                            <option value="deal_created">Oportunidad creada</option>
                            <option value="deal_moved">Oportunidad cambia de etapa</option>
                            <option value="company_created">Empresa creada</option>
                        </select>
                    </div>

                    {/* Actions Select */}
                    <div className="drawer-form-group">
                        <label className="drawer-label">Tipo de Acción</label>
                        <select 
                            className="drawer-input drawer-select"
                            value={form.acciones[0]?.type || 'webhook'} 
                            onChange={e => {
                                const type = e.target.value;
                                const newAcc = [...form.acciones];
                                newAcc[0] = { type, url: '', email: '', message: '' };
                                setForm({...form, acciones: newAcc});
                            }}
                        >
                            <option value="webhook">Llamar Webhook</option>
                            <option value="send_email">Enviar Correo Electrónico</option>
                            <option value="send_coupon">Enviar Cupón de Descuento</option>
                            <option value="create_task">Asignar Tarea en CRM</option>
                        </select>
                    </div>

                    {form.acciones[0]?.type === 'webhook' && (
                        <div className="drawer-form-group">
                            <label className="drawer-label">URL del Webhook</label>
                            <input 
                                type="url" required className="drawer-input" placeholder="https://api.ejemplo.com/webhook"
                                value={form.acciones[0].url || ''} 
                                onChange={e => {
                                    const newAcc = [...form.acciones];
                                    newAcc[0].url = e.target.value;
                                    setForm({...form, acciones: newAcc});
                                }}
                            />
                        </div>
                    )}

                    {(form.acciones[0]?.type === 'send_email' || form.acciones[0]?.type === 'send_coupon') && (
                        <div className="drawer-form-group">
                            <label className="drawer-label">Mensaje / Asunto</label>
                            <input 
                                type="text" required className="drawer-input" placeholder="Ej: ¡Gracias por tu compra!"
                                value={form.acciones[0].message || ''} 
                                onChange={e => {
                                    const newAcc = [...form.acciones];
                                    newAcc[0].message = e.target.value;
                                    setForm({...form, acciones: newAcc});
                                }}
                            />
                        </div>
                    )}
                    
                    <div className="drawer-footer">
                        <button type="button" className="btn-secondary-custom" onClick={() => setDrawerOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn-primary-custom">Crear Automatización</button>
                    </div>
                </form>
            </TwentyRecordDrawer>
        </TwentyCrmLayout>
    );
}
