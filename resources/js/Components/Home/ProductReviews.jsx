import { Link, useForm, usePage } from '@inertiajs/react';

export default function ProductReviews({ productId }) {
    const { reviews, promedioEstrellas, totalReviews, canReview, ownReview, auth, flash } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({ calificacion: ownReview?.calificacion || 5, comentario: ownReview?.comentario || '' });

    return (
        <section aria-labelledby="product-reviews-title" style={{ maxWidth: 1100, margin: '48px auto', padding: '0 20px' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)', border: '1px solid #f1f5f9', padding: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
                    <h2 id="product-reviews-title" style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Opiniones de compradores</h2>
                    <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>
                        {totalReviews ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: '#f59e0b', fontSize: '18px' }}>★</span>
                                <strong style={{ color: '#334155' }}>{promedioEstrellas}/5</strong> · {totalReviews} {totalReviews === 1 ? 'opinión' : 'opiniones'}
                            </span>
                        ) : 'Este producto aún no tiene opiniones publicadas.'}
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {reviews?.data?.map(review => (
                        <article key={review.id} style={{ padding: '24px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', transition: 'all 0.2s ease' }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = '#cbd5e1'; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#004797', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                                        {review.nombre?.charAt(0).toUpperCase()}
                                    </div>
                                    <strong style={{ color: '#334155', fontSize: '15px' }}>{review.nombre}</strong>
                                </div>
                                <span aria-label={`${review.calificacion} de 5 estrellas`} style={{ color: '#f59e0b', letterSpacing: '2px' }}>
                                    {'★'.repeat(review.calificacion)}{'☆'.repeat(5 - review.calificacion)}
                                </span>
                            </div>
                            <p style={{ whiteSpace: 'pre-wrap', color: '#475569', fontSize: '15px', lineHeight: '1.6', margin: '0 0 12px 0' }}>{review.comentario}</p>
                            <small style={{ color: '#94a3b8', fontSize: '13px' }}>{review.fecha}</small>
                        </article>
                    ))}
                </div>

                {reviews?.links && reviews.links.length > 3 && (
                    <nav aria-label="Páginas de opiniones" style={{ marginTop: '32px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {reviews.links.filter(link => link.url).map((link, i) => (
                            <Link key={i} href={link.url} preserveScroll style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: link.active ? '#004797' : '#f1f5f9', color: link.active ? 'white' : '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: link.active ? '600' : '400', transition: 'all 0.2s ease' }} dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </nav>
                )}

                <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid #e2e8f0' }}>
                    {canReview ? (
                        <form onSubmit={event => { event.preventDefault(); post(`/producto/${productId}/resenas`, { preserveScroll: true }); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: 0 }}>{ownReview ? 'Actualizar tu opinión' : 'Comparte tu experiencia'}</h3>
                            {ownReview && !ownReview.aprobado && (
                                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', color: '#b45309', padding: '12px 16px', borderRadius: '8px', fontSize: '14px' }}>
                                    Tu opinión está pendiente de revisión.
                                </div>
                            )}
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '500', color: '#475569' }}>Calificación</label>
                                <select value={data.calificacion} onChange={e => setData('calificacion', Number(e.target.value))} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: 'white', color: '#334155', fontSize: '15px' }}>
                                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} de 5 estrellas</option>)}
                                </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '500', color: '#475569' }}>Tu opinión</label>
                                <textarea value={data.comentario} minLength={10} maxLength={2000} required onChange={e => setData('comentario', e.target.value)} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: 'white', color: '#334155', fontSize: '15px', minHeight: '120px', resize: 'vertical' }} placeholder="¿Qué te pareció el producto? ¿Lo recomendarías?" />
                            </div>

                            {(errors.comentario || errors.calificacion) && (
                                <div role="alert" style={{ color: '#ef4444', fontSize: '14px' }}>{errors.comentario || errors.calificacion}</div>
                            )}
                            
                            <button disabled={processing} style={{ alignSelf: 'flex-start', padding: '12px 24px', backgroundColor: processing ? '#94a3b8' : '#004797', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: processing ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease', boxShadow: processing ? 'none' : '0 4px 12px rgba(0, 71, 151, 0.2)' }}>
                                {processing ? 'Enviando...' : 'Enviar opinión'}
                            </button>
                        </form>
                    ) : (
                        <div style={{ padding: '24px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                            <p style={{ color: '#64748b', fontSize: '15px', margin: '0 0 16px 0' }}>
                                {auth?.user ? 'Podrás escribir una opinión después de completar una compra de este producto.' : 'Inicia sesión para escribir una opinión de tu compra.'}
                            </p>
                            {!auth?.user && (
                                <Link href="/login" style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#004797', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                                    Iniciar sesión
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {flash?.success && (
                    <div role="status" style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '8px', fontSize: '14px', fontWeight: '500' }}>
                        {flash.success}
                    </div>
                )}
            </div>
        </section>
    );
}
