import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { useConfirm } from '@/Contexts/ConfirmContext';


export default function Show({ cliente, totalCompras, totalPedidos }) {
    const confirmDialog = useConfirm();

    const { flash, errors } = usePage().props;
    const [notaText, setNotaText] = useState('');

    const handleDelete = async (id) => {
        if (await confirmDialog('¿Estás seguro de eliminar este usuario? (Mover a la papelera)')) {
            router.delete(`/admin/clientes/${id}`, { preserveScroll: true });
        }
    };

    const toggleBloqueo = async (id) => {
        router.post(`/admin/clientes/${id}/bloquear`, {}, { preserveScroll: true });
    };

    const resetPassword = async (id) => {
        if (await confirmDialog('¿Estás seguro de restablecer la contraseña a Novape2026!?')) {
            router.post(`/admin/clientes/${id}/reset-password`, {}, { preserveScroll: true });
        }
    };

    const handleAddNota = async (e) => {
        e.preventDefault();
        if (!notaText.trim()) return;
        router.post(`/admin/clientes/${cliente.id}/notas`, { nota: notaText }, {
            preserveScroll: true,
            onSuccess: () => setNotaText('')
        });
    };

    const handleDeleteNota = async (notaId) => {
        if (await confirmDialog('¿Eliminar esta nota?')) {
            router.delete(`/admin/clientes/${cliente.id}/notas/${notaId}`, {
                preserveScroll: true
            });
        }
    };

    return (
        <AdminLayout logoUrl={null}>
            <Head title={`Usuario: ${cliente.nombres}`} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>Detalle del Usuario</h1>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <Link href={`/admin/clientes/${cliente.id}/edit`} style={{ background: 'rgba(29,78,216,0.1)', color: '#1d4ed8', textDecoration: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Editar
                    </Link>
                    <button onClick={() => toggleBloqueo(cliente.id)} style={{ background: cliente.estado === 'bloqueado' ? 'rgba(37,99,235,0.1)' : 'rgba(96,165,250,0.1)', color: cliente.estado === 'bloqueado' ? '#2563eb' : '#60a5fa', border: 'none', cursor: 'pointer', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        {cliente.estado === 'bloqueado' ? 'Desbloquear' : 'Bloquear'}
                    </button>
                    <button onClick={() => resetPassword(cliente.id)} style={{ background: 'rgba(107,114,128,0.1)', color: 'var(--admin-text-main)', border: 'none', cursor: 'pointer', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h4l2-2 4 4 4-4 4 4 2-2"/></svg>
                        Reset PW
                    </button>
                    <button onClick={() => handleDelete(cliente.id)} style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'none', cursor: 'pointer', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        Eliminar
                    </button>
                    <Link href="/admin/clientes" style={{ color: 'var(--admin-text-muted)', textDecoration: 'none', padding: '10px 16px', border: '1px solid var(--admin-border)', borderRadius: '8px', fontWeight: 'bold', marginLeft: '10px' }}>
                        Volver
                    </Link>
                </div>
            </div>

            {flash?.success && (
                <div style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: '500', border: '1px solid rgba(37,99,235,0.2)' }}>
                    {flash.success}
                </div>
            )}
            
            {(flash?.error || errors?.error) && (
                <div style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: '500', border: '1px solid rgba(59,130,246,0.2)' }}>
                    {flash?.error || errors?.error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', alignItems: 'start' }}>
                {/* Lado izquierdo: Información del Usuario y Notas */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ background: 'var(--admin-bg-panel)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #1d4ed8, #1e3a8a)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', margin: '0 auto 10px auto', boxShadow: '0 4px 10px rgba(138,43,226,0.3)' }}>
                                {cliente.nombres.charAt(0)}{cliente.apellidos.charAt(0)}
                            </div>
                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--admin-text-main)', textDecoration: cliente.estado === 'bloqueado' ? 'line-through' : 'none' }}>{cliente.nombres} {cliente.apellidos}</h2>
                            <span style={{ 
                                background: cliente.estado === 'activo' ? 'rgba(37,99,235,0.1)' : 'rgba(59,130,246,0.1)', 
                                color: cliente.estado === 'activo' ? '#2563eb' : '#3b82f6', 
                                padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', textTransform: 'capitalize',
                                display: 'inline-block', marginTop: '5px'
                            }}>
                                {cliente.estado === 'bloqueado' ? 'Bloqueado' : 'Activo'}
                            </span>
                        </div>

                        <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '15px' }}>
                            <p style={{ color: 'var(--admin-text-muted)', marginBottom: '10px' }}><strong>Código de Cliente:</strong> <br/><span style={{ color: 'var(--admin-text-main)', fontFamily: 'monospace', fontSize: '14px', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>CLI-{cliente.id.toString().padStart(5, '0')}</span></p>
                            <p style={{ color: 'var(--admin-text-muted)', marginBottom: '10px' }}><strong>Email:</strong> <br/><span style={{ color: 'var(--admin-text-main)' }}>{cliente.email}</span></p>
                            <p style={{ color: 'var(--admin-text-muted)', marginBottom: '10px' }}><strong>DNI:</strong> <br/><span style={{ color: 'var(--admin-text-main)' }}>{cliente.dni || '-'}</span></p>
                            <p style={{ color: 'var(--admin-text-muted)', marginBottom: '10px' }}><strong>Teléfono:</strong> <br/><span style={{ color: 'var(--admin-text-main)' }}>{cliente.telefono || '-'}</span></p>
                            <p style={{ color: 'var(--admin-text-muted)', marginBottom: '10px' }}><strong>Fecha de Registro:</strong> <br/><span style={{ color: 'var(--admin-text-main)' }}>{new Date(cliente.created_at).toLocaleDateString()}</span></p>
                        </div>

                        <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '15px', marginTop: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'center' }}>
                            <div style={{ background: 'rgba(138,43,226,0.05)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(29,78,216,0.1)' }}>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1d4ed8' }}>{totalPedidos}</div>
                                <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Pedidos</div>
                            </div>
                            <div style={{ background: 'rgba(34,197,94,0.05)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(37,99,235,0.1)' }}>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2563eb' }}>S/ {totalCompras}</div>
                                <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Gastado</div>
                            </div>
                        </div>

                        {/* Dirección y Datos Extra CRM */}
                        <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '15px', marginTop: '15px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--admin-text-main)', marginBottom: '10px' }}>Dirección Principal</h3>
                            <p style={{ color: 'var(--admin-text-muted)', fontSize: '13px' }}>
                                {cliente.direccion ? (
                                    <>
                                        {cliente.direccion} <br/>
                                        {cliente.distrito && `${cliente.distrito}, `}{cliente.provincia && `${cliente.provincia}, `}{cliente.departamento} <br/>
                                        {cliente.referencia && <em style={{ fontSize: '12px', color: '#888' }}>Ref: {cliente.referencia}</em>}
                                    </>
                                ) : 'No ha registrado ninguna dirección aún.'}
                            </p>
                        </div>
                    </div>

                    {/* Sección de Notas CRM */}
                    <div style={{ background: 'var(--admin-bg-panel)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--admin-text-main)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                            Notas CRM
                        </h2>
                        
                        <form onSubmit={handleAddNota} style={{ marginBottom: '20px' }}>
                            <textarea 
                                value={notaText}
                                onChange={(e) => setNotaText(e.target.value)}
                                placeholder="Añadir una nota sobre este cliente (llamadas, recordatorios, etc)..."
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-main)', minHeight: '80px', marginBottom: '10px', resize: 'vertical' }}
                                required
                            />
                            <button type="submit" disabled={!notaText.trim()} style={{ background: '#1d4ed8', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: notaText.trim() ? 'pointer' : 'not-allowed', opacity: notaText.trim() ? 1 : 0.6, width: '100%' }}>
                                Guardar Nota
                            </button>
                        </form>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                            {cliente.notas && cliente.notas.length > 0 ? cliente.notas.map(nota => (
                                <div key={nota.id} style={{ background: 'rgba(138,43,226,0.03)', border: '1px solid rgba(29,78,216,0.1)', padding: '12px', borderRadius: '8px', position: 'relative' }}>
                                    <button onClick={() => handleDeleteNota(nota.id)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', opacity: 0.5 }} title="Eliminar nota">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                    <p style={{ color: 'var(--admin-text-main)', fontSize: '13px', marginBottom: '8px', paddingRight: '20px', whiteSpace: 'pre-wrap' }}>{nota.nota}</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                                        <span>Por: {nota.autor ? `${nota.autor.nombres} ${nota.autor.apellidos}` : 'Desconocido'}</span>
                                        <span>{new Date(nota.created_at).toLocaleString()}</span>
                                    </div>
                                </div>
                            )) : (
                                <p style={{ fontSize: '13px', color: 'var(--admin-text-muted)', textAlign: 'center', fontStyle: 'italic', padding: '20px 0' }}>No hay notas registradas para este cliente.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Lado derecho: Timeline (Salesforce 360) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* CRM Deals (Oportunidades) */}
                    <div style={{ background: 'var(--admin-bg-panel)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--admin-text-main)', borderBottom: '1px solid var(--admin-border)', paddingBottom: '10px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            Oportunidades (CRM)
                        </h2>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ color: 'var(--admin-text-muted)', borderBottom: '1px solid var(--admin-border)' }}>
                                        <th style={{ padding: '10px' }}>Título</th>
                                        <th style={{ padding: '10px' }}>Valor</th>
                                        <th style={{ padding: '10px' }}>Etapa</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cliente.crm_deals && cliente.crm_deals.length > 0 ? cliente.crm_deals.map(deal => (
                                        <tr key={deal.id} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                                            <td style={{ padding: '10px', color: 'var(--admin-text-main)', fontWeight: 'bold', fontSize: '13px' }}>{deal.title}</td>
                                            <td style={{ padding: '10px', color: 'var(--admin-text-main)', fontWeight: 'bold', fontSize: '13px' }}>S/ {deal.value}</td>
                                            <td style={{ padding: '10px' }}>
                                                <span style={{ background: deal.stage?.color ? `${deal.stage.color}20` : '#f3f4f6', color: deal.stage?.color || '#374151', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                                                    {deal.stage?.name || 'Sin etapa'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'right' }}>
                                                <Link href="/admin/crm/pipeline" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold', fontSize: '12px' }}>Ver Kanban</Link>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '13px' }}>No hay tratos en el CRM.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Historial de Pedidos */}
                    <div style={{ background: 'var(--admin-bg-panel)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--admin-text-main)', borderBottom: '1px solid var(--admin-border)', paddingBottom: '10px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                            Últimos Pedidos (Commerce)
                        </h2>
                        
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ color: 'var(--admin-text-muted)', borderBottom: '1px solid var(--admin-border)' }}>
                                        <th style={{ padding: '10px' }}>Código</th>
                                        <th style={{ padding: '10px' }}>Total</th>
                                        <th style={{ padding: '10px' }}>Estado</th>
                                        <th style={{ padding: '10px', textAlign: 'right' }}>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cliente.pedidos && cliente.pedidos.length > 0 ? cliente.pedidos.map(pedido => (
                                        <tr key={pedido.id} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                                            <td style={{ padding: '10px', color: 'var(--admin-text-main)', fontWeight: 'bold', fontSize: '13px' }}>{pedido.codigo}</td>
                                            <td style={{ padding: '10px', color: 'var(--admin-text-main)', fontWeight: 'bold', fontSize: '13px' }}>S/ {pedido.total}</td>
                                            <td style={{ padding: '10px' }}>
                                                <span style={{ background: 'rgba(107,114,128,0.1)', color: 'var(--admin-text-main)', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                                                    {pedido.estado}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'right' }}>
                                                <Link href={`/admin/pedidos/${pedido.id}`} style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold', fontSize: '12px' }}>Ver</Link>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '13px' }}>Este usuario no tiene pedidos.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Chats Omnicanal */}
                    <div style={{ background: 'var(--admin-bg-panel)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--admin-text-main)', borderBottom: '1px solid var(--admin-border)', paddingBottom: '10px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            Historial de Chats (Service Cloud)
                        </h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {cliente.omnichannel_contacts && cliente.omnichannel_contacts.length > 0 ? (
                                cliente.omnichannel_contacts.map(contact => (
                                    contact.conversations && contact.conversations.length > 0 ? (
                                        contact.conversations.map(conv => (
                                            <div key={conv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--admin-border)', borderRadius: '8px', background: '#f9fafb' }}>
                                                <div>
                                                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--admin-text-main)' }}>{conv.subject || 'Conversación sin asunto'}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginTop: '4px' }}>{new Date(conv.last_message_at).toLocaleString()} • {conv.channel || 'Desconocido'}</div>
                                                </div>
                                                <div>
                                                    <Link href="/admin/omnichannel" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 'bold', fontSize: '12px', background: '#ecfdf5', padding: '6px 12px', borderRadius: '6px' }}>Abrir Inbox</Link>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p key={contact.id} style={{ fontSize: '13px', color: 'var(--admin-text-muted)' }}>Contacto registrado, pero sin conversaciones.</p>
                                    )
                                ))
                            ) : (
                                <p style={{ fontSize: '13px', color: 'var(--admin-text-muted)', textAlign: 'center', padding: '20px 0' }}>No hay chats de WhatsApp/Instagram para este cliente.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
