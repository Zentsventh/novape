import React, { useState, useEffect } from 'react';
import Drawer from '@/Components/Admin/Drawer';
import { X, Calendar, DollarSign, User, Activity, FileText, Phone, MessageSquare, ShoppingCart } from 'lucide-react';
import Swal from 'sweetalert2';
import DealQuoteTab from './DealQuoteTab';

export default function DealDrawer({ isOpen, onClose, dealId }) {
    const [deal, setDeal] = useState(null);
    const [loading, setLoading] = useState(false);

    // Form states
    const [nota, setNota] = useState('');
    const [actType, setActType] = useState('nota'); // nota, tarea, llamada
    
    // Tabs state
    const [activeTab, setActiveTab] = useState('actividades');

    useEffect(() => {
        if (isOpen && dealId) {
            fetchDeal();
        }
    }, [isOpen, dealId]);

    const fetchDeal = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/admin/crm/deals/${dealId}`);
            const data = await response.json();
            setDeal(data);
        } catch (error) {
            console.error('Error fetching deal:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
    };

    const handleAddActivity = async (e) => {
        e.preventDefault();
        
        if (!nota.trim()) return;

        try {
            const response = await fetch(`/admin/crm/deals/${dealId}/activities`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                },
                body: JSON.stringify({
                    tipo: actType,
                    contenido: nota
                })
            });

            if (response.ok) {
                const result = await response.json();
                // Update activities in state
                setDeal(prev => ({
                    ...prev,
                    activities: [result.activity, ...prev.activities]
                }));
                setNota('');
                Swal.fire({
                    toast: true, position: 'top-end', icon: 'success', title: 'Actividad registrada', showConfirmButton: false, timer: 1500
                });
            } else {
                Swal.fire('Error', 'No se pudo guardar la actividad', 'error');
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (!isOpen) return null;

    return (
        <Drawer isOpen={isOpen} onClose={onClose} width="450px">
            {loading || !deal ? (
                <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', color: '#6b7280' }}>
                    Cargando información del Deal...
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* Header */}
                    <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div>
                                <span style={{ 
                                    backgroundColor: deal.stage.color || '#3b82f6', 
                                    color: 'white', 
                                    padding: '2px 8px', 
                                    borderRadius: '12px', 
                                    fontSize: '12px', 
                                    fontWeight: 600,
                                    marginBottom: '8px',
                                    display: 'inline-block'
                                }}>
                                    {deal.stage.nombre}
                                </span>
                                <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700, color: '#111827' }}>
                                    {deal.titulo}
                                </h2>
                            </div>
                            {deal.omnichannel_conversation_id && (
                                <a 
                                    href={`/admin/omnichannel?conversation=${deal.omnichannel_conversation_id}`}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        backgroundColor: '#25D366', color: '#fff',
                                        padding: '8px 12px', borderRadius: '8px',
                                        fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                                        boxShadow: '0 2px 4px rgba(37,211,102,0.3)'
                                    }}
                                >
                                    <MessageSquare size={16} />
                                    Abrir WhatsApp
                                </a>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563' }}>
                                <DollarSign size={16} color="#10b981" />
                                <span style={{ fontWeight: 600 }}>{formatMoney(deal.valor)}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563' }}>
                                <Calendar size={16} color="#6b7280" />
                                <span>{new Date(deal.fecha_cierre_esperada).toLocaleDateString()}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563', gridColumn: '1 / -1', flexWrap: 'wrap' }}>
                                <User size={16} color="#6b7280" />
                                <span>{deal.cliente ? `${deal.cliente.nombres} ${deal.cliente.apellidos}` : 'Sin Cliente'}</span>
                                {deal.cliente && deal.cliente.segmento && (
                                    <span style={{
                                        padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                                        backgroundColor: deal.cliente.segmento === 'VIP' || deal.cliente.segmento === 'Campeón' ? '#fef08a' :
                                                         deal.cliente.segmento === 'En Riesgo' ? '#fecaca' :
                                                         deal.cliente.segmento === 'Nuevo' ? '#dbeafe' : '#f3f4f6',
                                        color: deal.cliente.segmento === 'VIP' || deal.cliente.segmento === 'Campeón' ? '#854d0e' :
                                               deal.cliente.segmento === 'En Riesgo' ? '#991b1b' :
                                               deal.cliente.segmento === 'Nuevo' ? '#1e40af' : '#4b5563',
                                    }}>
                                        {deal.cliente.segmento}
                                    </span>
                                )}
                                {deal.cliente && deal.cliente.ltv > 0 && (
                                    <span style={{ fontSize: '12px', color: '#6b7280', borderLeft: '1px solid #d1d5db', paddingLeft: '8px' }}>
                                        LTV: {formatMoney(deal.cliente.ltv)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabs navigation */}
                    <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', backgroundColor: '#fff', padding: '0 24px' }}>
                        <button 
                            onClick={() => setActiveTab('actividades')}
                            style={{
                                padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
                                borderBottom: activeTab === 'actividades' ? '2px solid #3b82f6' : '2px solid transparent',
                                color: activeTab === 'actividades' ? '#3b82f6' : '#6b7280',
                                fontWeight: 600, fontSize: '14px', display: 'flex', gap: '8px', alignItems: 'center'
                            }}
                        >
                            <Activity size={16} /> Actividades
                        </button>
                        <button 
                            onClick={() => setActiveTab('cotizacion')}
                            style={{
                                padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
                                borderBottom: activeTab === 'cotizacion' ? '2px solid #3b82f6' : '2px solid transparent',
                                color: activeTab === 'cotizacion' ? '#3b82f6' : '#6b7280',
                                fontWeight: 600, fontSize: '14px', display: 'flex', gap: '8px', alignItems: 'center'
                            }}
                        >
                            <ShoppingCart size={16} /> Cotizador
                        </button>
                    </div>

                    <div style={{ padding: '24px', flex: 1, overflowY: 'auto', backgroundColor: '#f9fafb' }}>
                        {activeTab === 'actividades' ? (
                            <>
                                <div style={{ marginBottom: '24px', backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <Activity size={16} /> Registrar Actividad
                                    </h3>
                            
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                {['nota', 'llamada', 'tarea'].map(t => (
                                    <button 
                                        key={t}
                                        onClick={() => setActType(t)}
                                        style={{
                                            padding: '4px 12px',
                                            borderRadius: '16px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            border: actType === t ? 'none' : '1px solid #d1d5db',
                                            backgroundColor: actType === t ? '#3b82f6' : '#fff',
                                            color: actType === t ? '#fff' : '#4b5563',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={handleAddActivity}>
                                <textarea
                                    value={nota}
                                    onChange={(e) => setNota(e.target.value)}
                                    placeholder={actType === 'nota' ? 'Escribe una nota...' : actType === 'llamada' ? 'Resumen de la llamada...' : 'Descripción de la tarea...'}
                                    style={{
                                        width: '100%',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        padding: '8px',
                                        fontSize: '13px',
                                        minHeight: '80px',
                                        resize: 'vertical',
                                        marginBottom: '8px'
                                    }}
                                />
                                <button type="submit" style={{
                                    backgroundColor: '#111827',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    width: '100%'
                                }}>
                                    Guardar
                                </button>
                            </form>
                        </div>

                        {/* Timeline */}
                        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Historial</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {deal.activities && deal.activities.length > 0 ? (
                                deal.activities.map(act => (
                                    <div key={act.id} style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ 
                                            width: '32px', height: '32px', borderRadius: '50%', 
                                            backgroundColor: act.tipo === 'llamada' ? '#dcfce7' : act.tipo === 'tarea' ? '#fef3c7' : '#e0e7ff',
                                            display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0
                                        }}>
                                            {act.tipo === 'llamada' ? <Phone size={14} color="#16a34a" /> : 
                                             act.tipo === 'tarea' ? <Calendar size={14} color="#d97706" /> : 
                                             <FileText size={14} color="#4f46e5" />}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '13px', color: '#111827', fontWeight: 500, backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                                {act.contenido}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', marginLeft: '4px' }}>
                                                {new Date(act.created_at).toLocaleString()} {act.autor ? `• por ${act.autor.nombres}` : ''}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', marginTop: '24px' }}>
                                    No hay actividades registradas en este negocio.
                                </div>
                            )}
                        </div>

                    </>
                ) : (
                    <DealQuoteTab deal={deal} setDeal={setDeal} />
                )}
                    </div>
                </div>
            )}
        </Drawer>
    );
}
