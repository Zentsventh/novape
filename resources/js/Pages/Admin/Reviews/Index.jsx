import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { Star, MessageSquare, CheckCircle, Trash2, EyeOff, Check, AlertCircle, Search, X } from 'lucide-react';

export default function Index({ reviews }) {
    const confirmDialog = useConfirm();
    const { flash } = usePage().props;
    
    const query = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const [searchTerm, setSearchTerm] = useState(query.get('search') || '');

    const toggleAprobacion = async (id, isAprobado) => {
        const action = isAprobado ? 'ocultar' : 'aprobar';
        if (await confirmDialog(`¿Estás seguro de ${action} esta reseña?`)) {
            router.post(`/admin/reviews/${id}/toggle`, {}, { preserveScroll: true });
        }
    };

    const handleDelete = async (id) => {
        if (await confirmDialog('¿Estás seguro de que deseas eliminar esta reseña permanentemente? Esta acción no se puede deshacer.')) {
            router.delete(`/admin/reviews/${id}`, { preserveScroll: true });
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/admin/reviews', { search: searchTerm }, { preserveState: true, preserveScroll: true });
    };

    const clearSearch = () => {
        setSearchTerm('');
        router.get('/admin/reviews', {}, { preserveState: true, preserveScroll: true });
    };

    const renderStars = (calificacion) => {
        let stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Star 
                    key={i} 
                    size={14} 
                    fill={i <= calificacion ? "#F59E0B" : "transparent"} 
                    color={i <= calificacion ? "#F59E0B" : "#CBD5E1"} 
                    strokeWidth={i <= calificacion ? 1 : 2}
                />
            );
        }
        return <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>{stars}</div>;
    };

    return (
        <AdminLayout>
            <div style={{ fontFamily: "inherit", padding: '24px 32px', maxWidth: '1440px', margin: '0 auto', paddingBottom: '64px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '8px', background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#1E293B', display: 'flex', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                            <MessageSquare size={18} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '18px', margin: 0, fontWeight: '600', color: '#1E293B', letterSpacing: '-0.01em' }}>
                                Moderación de Reseñas
                            </h1>
                            <p style={{ color: '#64748B', fontSize: '13px', margin: '2px 0 0 0', fontWeight: '400' }}>
                                Supervisa, aprueba u oculta los comentarios de los clientes sobre los productos.
                            </p>
                        </div>
                    </div>
                </div>

                {flash?.success && (
                    <div style={{ background: '#ECFDF5', color: '#065F46', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '500', fontSize: '13px', border: '1px solid #A7F3D0' }}>
                        <CheckCircle size={18} /> {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div style={{ background: '#FEF2F2', color: '#991B1B', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '500', fontSize: '13px', border: '1px solid #FECACA' }}>
                        <AlertCircle size={18} /> {flash.error}
                    </div>
                )}

                <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
                        <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', maxWidth: '400px' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                                    <Search size={16} />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Buscar por producto, cliente o comentario..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ width: '100%', padding: '8px 36px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', color: '#1E293B', outline: 'none', transition: 'all 0.2s', background: '#ffffff' }}
                                    onFocus={(e) => { e.target.style.borderColor = '#004797'; e.target.style.boxShadow = '0 0 0 1px #004797'; }}
                                    onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; e.target.style.boxShadow = 'none'; }}
                                />
                                {searchTerm && (
                                    <button type="button" onClick={clearSearch} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px', borderRadius: '4px' }} onMouseOver={(e) => e.currentTarget.style.color = '#475569'} onMouseOut={(e) => e.currentTarget.style.color = '#94A3B8'}>
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                    <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.02em', width: '25%' }}>Producto</th>
                                    <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.02em', width: '20%' }}>Cliente</th>
                                    <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.02em', width: '120px' }}>Calificación</th>
                                    <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.02em', width: '30%' }}>Comentario</th>
                                    <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.02em', width: '100px' }}>Estado</th>
                                    <th style={{ padding: '12px 20px', fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.02em', textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviews.data.map((review) => (
                                    <tr key={review.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s ease', backgroundColor: '#ffffff' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}>
                                        <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                                            <div style={{ fontWeight: '500', color: '#1E293B', fontSize: '13px', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={review.producto?.nombre}>
                                                {review.producto?.nombre}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                                                ID: #{review.producto?.id || 'N/A'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                                            <div style={{ fontWeight: '500', color: '#334155', fontSize: '13px' }}>{review.usuario?.nombres} {review.usuario?.apellidos}</div>
                                            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{review.usuario?.email}</div>
                                        </td>
                                        <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                                            {renderStars(review.calificacion)}
                                        </td>
                                        <td style={{ padding: '16px 20px', maxWidth: '300px', verticalAlign: 'top' }}>
                                            <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={review.comentario}>
                                                {review.comentario}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {new Date(review.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 20px', verticalAlign: 'top' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                background: review.aprobado ? '#ECFDF5' : '#F1F5F9',
                                                color: review.aprobado ? '#059669' : '#64748B',
                                            }}>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: review.aprobado ? '#10B981' : '#94A3B8' }}></span>
                                                {review.aprobado ? 'Pública' : 'Oculta'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 20px', textAlign: 'right', verticalAlign: 'top' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button 
                                                    onClick={() => toggleAprobacion(review.id, review.aprobado)}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '4px',
                                                        padding: '6px 10px',
                                                        borderRadius: '6px',
                                                        border: '1px solid #E2E8F0',
                                                        background: '#ffffff',
                                                        color: '#475569',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        fontWeight: '500',
                                                        transition: 'all 0.2s',
                                                    }}
                                                    onMouseOver={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                                                    onMouseOut={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                                                >
                                                    {review.aprobado ? <EyeOff size={14} /> : <Check size={14} />}
                                                    {review.aprobado ? 'Ocultar' : 'Aprobar'}
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(review.id)}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        padding: '6px',
                                                        borderRadius: '6px',
                                                        border: '1px solid transparent',
                                                        background: 'transparent',
                                                        color: '#94A3B8',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseOver={(e) => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; }}
                                                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
                                                    title="Eliminar permanentemente"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {reviews.data.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '48px 24px', color: '#64748B' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', color: '#94A3B8' }}>
                                                <MessageSquare size={20} />
                                            </div>
                                            <p style={{ fontSize: '14px', margin: '0 0 4px 0', fontWeight: '500', color: '#1E293B' }}>No hay reseñas</p>
                                            <p style={{ fontSize: '13px', margin: 0, color: '#64748B' }}>
                                                {searchTerm ? 'No se encontraron resultados para tu búsqueda.' : 'Aún no hay reseñas registradas.'}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {reviews.links && reviews.links.length > 3 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '24px' }}>
                        {reviews.links.map((link, i) => {
                            const isActive = link.active;
                            const isClickable = link.url;
                            
                            return (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    style={{
                                        padding: '6px 12px',
                                        border: isActive ? '1px solid #004797' : '1px solid #E2E8F0',
                                        borderRadius: '6px',
                                        background: isActive ? '#004797' : '#ffffff',
                                        color: isActive ? '#ffffff' : '#475569',
                                        textDecoration: 'none',
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        pointerEvents: isClickable ? 'auto' : 'none',
                                        opacity: isClickable ? 1 : 0.5,
                                        transition: 'all 0.2s',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: '28px'
                                    }}
                                    onMouseOver={e => { if(!isActive && isClickable) { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.color = '#004797'; e.currentTarget.style.borderColor = '#CBD5E1'; } }}
                                    onMouseOut={e => { if(!isActive && isClickable) { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#E2E8F0'; } }}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
