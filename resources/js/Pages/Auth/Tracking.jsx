import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Header from '../../Components/Home/Header';
import Footer from '../../Components/Home/Footer';
import '../../../css/home/base.css';
import '../../../css/home/header.css';
import '../../../css/home/footer.css';

export default function Tracking({ pedido, trackingData }) {
    
    // Parse Tracking status
    // Shippo tracking status: 'UNKNOWN', 'PRE_TRANSIT', 'TRANSIT', 'DELIVERED', 'RETURNED', 'FAILURE'
    let statusText = 'Pendiente';
    let statusColor = '#94a3b8';
    let progress = 10;
    
    const trackingHistory = trackingData?.tracking_history || [];
    const currentStatus = trackingData?.tracking_status?.status || 'UNKNOWN';
    
    if (!trackingData && pedido.estado === 'Pendiente') {
        statusText = 'Aún no enviado';
        progress = 10;
    } else if (currentStatus === 'PRE_TRANSIT') {
        statusText = 'Etiqueta Creada / Preparando Envío';
        progress = 25;
        statusColor = '#f59e0b';
    } else if (currentStatus === 'TRANSIT') {
        statusText = 'En Camino';
        progress = 60;
        statusColor = '#3b82f6';
    } else if (currentStatus === 'DELIVERED') {
        statusText = 'Entregado';
        progress = 100;
        statusColor = '#10b981';
    } else if (currentStatus === 'RETURNED' || currentStatus === 'FAILURE') {
        statusText = 'Problema con el Envío';
        progress = 100;
        statusColor = '#ef4444';
    } else if (pedido.estado === 'Completado') {
        statusText = 'Completado';
        progress = 100;
        statusColor = '#10b981';
    } else if (pedido.estado === 'Cancelado') {
        statusText = 'Cancelado';
        progress = 100;
        statusColor = '#ef4444';
    } else if (pedido.estado === 'Enviado') {
        statusText = 'Enviado (Esperando actualización)';
        progress = 40;
        statusColor = '#3b82f6';
    }

    return (
        <div className="efe-home" style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexWrap: 'wrap', flexDirection: 'column' }}>
            <Head title={`Rastreo de Pedido ${pedido.codigo}`} />
            <Header cartCount={0} onOpenCart={() => {}} onOpenCategories={() => {}} logoUrl={null} minimal={true} />
            
            <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', flex: 1, width: '100%' }}>
                <div style={{ marginBottom: '20px' }}>
                    <Link href="/perfil?tab=compras" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontWeight: '500', fontSize: '14px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        Volver a mis órdenes
                    </Link>
                </div>

                <div style={{ background: 'white', borderRadius: '16px', padding: 'clamp(0.75rem, 3vw, 2.5rem)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }}>
                        <div>
                            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 5px 0' }}>Pedido {pedido.codigo}</h1>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                                Empresa de transporte: <span style={{ fontWeight: '600', color: '#0f172a', textTransform: 'uppercase' }}>{pedido.courier_name || 'No asignada'}</span>
                            </p>
                            <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                                Número de rastreo: <span style={{ fontWeight: '600', color: '#0f172a' }}>{pedido.tracking_number || 'Aún no generado'}</span>
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Estado actual</div>
                            <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: '9999px', background: `${statusColor}15`, color: statusColor, fontWeight: 'bold', fontSize: '14px' }}>
                                {statusText}
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ position: 'relative', margin: '50px 0 60px 0' }}>
                        <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', width: '100%', position: 'absolute', top: '10px' }}></div>
                        <div style={{ height: '6px', background: statusColor, borderRadius: '3px', width: `${progress}%`, position: 'absolute', top: '10px', transition: 'width 1s ease-in-out' }}></div>
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', position: 'relative' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: progress >= 10 ? statusColor : '#cbd5e1', color: 'white', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', border: '4px solid white', zIndex: 10 }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                                <span style={{ marginTop: '8px', fontSize: '12px', fontWeight: '600', color: progress >= 10 ? '#0f172a' : '#94a3b8' }}>Confirmado</span>
                            </div>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: progress >= 25 ? statusColor : '#cbd5e1', color: 'white', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', border: '4px solid white', zIndex: 10 }}>
                                    {progress >= 25 ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> : null}
                                </div>
                                <span style={{ marginTop: '8px', fontSize: '12px', fontWeight: '600', color: progress >= 25 ? '#0f172a' : '#94a3b8' }}>En preparación</span>
                            </div>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: progress >= 60 ? statusColor : '#cbd5e1', color: 'white', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', border: '4px solid white', zIndex: 10 }}>
                                    {progress >= 60 ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> : null}
                                </div>
                                <span style={{ marginTop: '8px', fontSize: '12px', fontWeight: '600', color: progress >= 60 ? '#0f172a' : '#94a3b8' }}>En camino</span>
                            </div>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: progress >= 100 ? statusColor : '#cbd5e1', color: 'white', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', border: '4px solid white', zIndex: 10 }}>
                                    {progress >= 100 ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> : null}
                                </div>
                                <span style={{ marginTop: '8px', fontSize: '12px', fontWeight: '600', color: progress >= 100 ? '#0f172a' : '#94a3b8' }}>Entregado</span>
                            </div>
                        </div>
                    </div>

                    {/* Historial Timeline */}
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', marginBottom: '20px' }}>Historial de seguimiento</h3>
                        
                        {trackingHistory.length > 0 ? (
                            <div style={{ position: 'relative', paddingLeft: '20px' }}>
                                <div style={{ position: 'absolute', left: '5px', top: '10px', bottom: '10px', width: '2px', background: '#e2e8f0' }}></div>
                                
                                {/* Reverso el historial para mostrar el mas reciente primero */}
                                {[...trackingHistory].reverse().map((event, index) => (
                                    <div key={index} style={{ position: 'relative', marginBottom: '25px' }}>
                                        <div style={{ position: 'absolute', left: '-20px', top: '5px', width: '12px', height: '12px', borderRadius: '50%', background: index === 0 ? statusColor : '#cbd5e1', border: '2px solid white' }}></div>
                                        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginBottom: '4px' }}>
                                            {new Date(event.status_date).toLocaleString('es-PE', { dateStyle: 'long', timeStyle: 'short' })}
                                        </div>
                                        <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: index === 0 ? '600' : '500' }}>
                                            {event.status_details || event.status}
                                        </div>
                                        {event.location && (
                                            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                                                {event.location.city}, {event.location.state} {event.location.country}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: 'clamp(0.75rem, 3vw, 1.875rem)', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '10px' }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Aún no hay actualizaciones de ubicación para este paquete.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
