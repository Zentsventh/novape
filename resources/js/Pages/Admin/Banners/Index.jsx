import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { useConfirm } from '@/Contexts/ConfirmContext';
import { Image as ImageIcon, Plus, Edit2, Trash2, Calendar, EyeOff, Eye, Link as LinkIcon, UploadCloud, X, Clock, AlertCircle, CheckCircle2, ImageOff } from 'lucide-react';

export default function BannersIndex({ banners, logoUrl }) {
    const confirmDialog = useConfirm();

    const [showModal, setShowModal] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const { data, setData, post, processing, reset, clearErrors, errors } = useForm({
        titulo: '', 
        subtitulo: '', 
        imagen: null, 
        enlace_url: '', 
        posicion: 'hero', 
        fecha_inicio: '', 
        fecha_fin: ''
    });

    const openCreateModal = () => {
        setEditingBanner(null);
        setImagePreview(null);
        reset();
        clearErrors();
        setShowModal(true);
    };

    const openEditModal = (banner) => {
        setEditingBanner(banner);
        setData({
            titulo: banner.titulo || '',
            subtitulo: banner.subtitulo || '',
            imagen: null, // Reset file input when editing, only send if they want to replace it
            enlace_url: banner.enlace_url || '',
            posicion: banner.posicion || 'hero',
            fecha_inicio: banner.fecha_inicio || '',
            fecha_fin: banner.fecha_fin || ''
        });
        setImagePreview(banner.imagen_url ? (banner.imagen_url.startsWith('/') ? banner.imagen_url : '/' + banner.imagen_url) : null);
        clearErrors();
        setShowModal(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setData('imagen', file);
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        
        if (editingBanner) {
            post(`/admin/banners/${editingBanner.id}`, {
                onSuccess: () => { 
                    setShowModal(false); 
                    reset(); 
                    setEditingBanner(null);
                    setImagePreview(null);
                }
            });
        } else {
            post('/admin/banners', { 
                onSuccess: () => { 
                    setShowModal(false); 
                    reset(); 
                    setImagePreview(null);
                } 
            });
        }
    };

    const handleDelete = async (id) => {
        if (await confirmDialog('¿Estás seguro de que deseas eliminar este banner permanentemente?')) {
            router.delete(`/admin/banners/${id}`);
        }
    };

    const toggleActivo = (id, currentStatus) => {
        router.post(`/admin/banners/${id}`, { activo: !currentStatus }, { preserveScroll: true });
    };

    const handleImageError = (e) => {
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'flex';
    };

    const inputStyle = {
        width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0',
        background: '#F8FAFC', color: '#1E293B', fontSize: '15px', outline: 'none', transition: 'all 0.2s',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
    };
    
    const inputFocusStyle = {
        borderColor: '#004797', boxShadow: '0 0 0 4px rgba(0, 71, 151, 0.1)', backgroundColor: '#ffffff'
    };

    return (
        <AdminLayout logoUrl={logoUrl}>
            <Head title="Gestión de Banners" />

            <div style={{ fontFamily: "'Inter', sans-serif", padding: '24px 32px', maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', margin: '0 0 8px 0', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#E0F2FE', padding: '10px', borderRadius: '12px', color: '#004797', display: 'flex' }}>
                                <ImageIcon size={24} />
                            </div>
                            Banners Publicitarios
                        </h1>
                        <p style={{ margin: 0, color: '#64748B', fontSize: '15px' }}>
                            Gestiona las campañas visuales, hero banners y promociones de la tienda.
                        </p>
                    </div>
                    <button 
                        onClick={openCreateModal} 
                        style={{ 
                            background: '#004797', color: 'white', padding: '12px 24px', borderRadius: '12px', border: 'none', 
                            cursor: 'pointer', fontWeight: 700, fontSize: '14px', boxShadow: '0 4px 14px rgba(0, 71, 151, 0.3)',
                            transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 71, 151, 0.4)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 71, 151, 0.3)'; }}
                    >
                        <Plus size={18} /> Nuevo Banner
                    </button>
                </div>

                {/* Banners List */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                    {banners.map(b => {
                        const now = new Date();
                        const inicio = b.fecha_inicio ? new Date(b.fecha_inicio.replace(' ', 'T')) : null;
                        const fin = b.fecha_fin ? new Date(b.fecha_fin.replace(' ', 'T')) : null;
                        
                        let estadoLabel = 'Público';
                        let estadoColor = '#059669';
                        let estadoBg = '#D1FAE5';
                        let estadoIcon = <CheckCircle2 size={14} />;

                        if (!b.activo) {
                            estadoLabel = 'Oculto';
                            estadoColor = '#DC2626';
                            estadoBg = '#FEE2E2';
                            estadoIcon = <EyeOff size={14} />;
                        } else if (inicio && inicio > now) {
                            estadoLabel = 'Programado';
                            estadoColor = '#D97706';
                            estadoBg = '#FEF3C7';
                            estadoIcon = <Clock size={14} />;
                        } else if (fin && fin < now) {
                            estadoLabel = 'Expirado';
                            estadoColor = '#475569';
                            estadoBg = '#F1F5F9';
                            estadoIcon = <AlertCircle size={14} />;
                        }

                        return (
                        <div key={b.id} style={{ 
                            background: '#ffffff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)',
                            display: 'grid', gridTemplateColumns: '180px 1fr 180px 180px', gap: '32px', alignItems: 'center',
                            border: '1px solid #E2E8F0', transition: 'all 0.2s', position: 'relative', overflow: 'hidden'
                        }}
                        onMouseOver={e => { e.currentTarget.style.boxShadow = '0 10px 30px -5px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseOut={e => { e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0,0,0,0.03)'; e.currentTarget.style.transform = 'none'; }}
                        >
                            {/* Status Indicator Bar */}
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: estadoColor }}></div>

                            {/* Preview Image */}
                            <div style={{ width: '180px', height: '100px', background: '#F8FAFC', borderRadius: '12px', overflow: 'hidden', position: 'relative', border: '1px solid #E2E8F0' }}>
                                {b.imagen_url ? (
                                    <>
                                        <img src={b.imagen_url.startsWith('/') ? b.imagen_url : '/' + b.imagen_url} alt={b.titulo} onError={handleImageError} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <div style={{ display: 'none', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '12px', fontWeight: 600, background: '#F8FAFC', flexDirection: 'column', gap: '8px' }}>
                                            <ImageOff size={24} />
                                            Sin Imagen
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1', fontSize: '12px', fontWeight: 600, gap: '8px' }}>
                                        <ImageIcon size={24} />
                                        N/A
                                    </div>
                                )}
                            </div>

                            {/* Title & Info */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.5px' }}>{b.titulo}</h3>
                                    <span style={{ 
                                        background: b.posicion === 'hero' ? '#E0F2FE' : '#F1F5F9', 
                                        color: b.posicion === 'hero' ? '#0284C7' : '#475569', 
                                        padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px'
                                    }}>
                                        {b.posicion.toUpperCase()}
                                    </span>
                                </div>
                                <p style={{ fontSize: '14px', color: '#64748B', margin: '0 0 12px 0', lineHeight: '1.4' }}>{b.subtitulo || 'Sin descripción adicional'}</p>
                                {b.enlace_url && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#004797', fontSize: '13px', fontWeight: 500 }}>
                                        <LinkIcon size={14} /> {b.enlace_url}
                                    </div>
                                )}
                            </div>

                            {/* Status & Dates */}
                            <div>
                                <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Visibilidad</div>
                                <button 
                                    onClick={() => toggleActivo(b.id, b.activo)}
                                    title="Haz clic para alternar visibilidad"
                                    style={{ 
                                        background: estadoBg, color: estadoColor, padding: '6px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, 
                                        border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '12px', transition: 'all 0.2s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    {estadoIcon} {estadoLabel}
                                </button>
                                <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                                    <Calendar size={14} color="#94A3B8" />
                                    {b.fecha_inicio ? `${b.fecha_inicio.split(' ')[0]} al ${b.fecha_fin ? b.fecha_fin.split(' ')[0] : 'Siempre'}` : 'Permanente'}
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button onClick={() => openEditModal(b)} style={{ 
                                    width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#ffffff', color: '#1E293B', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', fontSize: '14px' 
                                }} onMouseOver={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#004797'; e.currentTarget.style.borderColor = '#004797'; }} onMouseOut={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#1E293B'; e.currentTarget.style.borderColor = '#E2E8F0'; }}>
                                    <Edit2 size={16} /> Editar Banner
                                </button>
                                <button onClick={() => handleDelete(b.id)} style={{ 
                                    width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: '#FEE2E2', color: '#DC2626', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', fontSize: '14px' 
                                }} onMouseOver={e => { e.currentTarget.style.background = '#FECACA'; }} onMouseOut={e => { e.currentTarget.style.background = '#FEE2E2'; }}>
                                    <Trash2 size={16} /> Eliminar
                                </button>
                            </div>
                        </div>
                    )})}
                    {banners.length === 0 && (
                        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '60px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                            <div style={{ width: '64px', height: '64px', background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', margin: '0 auto 16px auto' }}>
                                <ImageIcon size={32} />
                            </div>
                            <h3 style={{ margin: '0 0 8px 0', color: '#1E293B', fontSize: '18px', fontWeight: 700 }}>No hay banners publicitarios</h3>
                            <p style={{ margin: '0 0 24px 0', color: '#64748B', fontSize: '15px' }}>Crea tu primer banner para empezar a promocionar ofertas o productos en tu tienda.</p>
                            <button onClick={openCreateModal} style={{ background: '#004797', color: 'white', padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                Crear Primer Banner
                            </button>
                        </div>
                    )}
                </div>

                {/* Modal de Creación / Edición */}
                {showModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '24px' }}>
                        <div style={{ background: 'white', padding: '32px', borderRadius: '24px', width: '600px', maxWidth: '100%', maxHeight: '100%', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div>
                                    <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.5px' }}>
                                        {editingBanner ? 'Editar Banner' : 'Nuevo Banner Promocional'}
                                    </h2>
                                    <p style={{ margin: 0, color: '#64748B', fontSize: '14px' }}>Configura los detalles de tu campaña visual.</p>
                                </div>
                                <button type="button" onClick={() => setShowModal(false)} style={{ background: '#F1F5F9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.color = '#1E293B'; }} onMouseOut={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#64748B'; }}>
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '13px', color: '#475569', letterSpacing: '0.5px' }}>TÍTULO PRINCIPAL</label>
                                    <input type="text" value={data.titulo} onChange={e => setData('titulo', e.target.value)} style={inputStyle} onFocus={e => Object.assign(e.target.style, inputFocusStyle)} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }} required placeholder="Ej: Gran Venta de Verano" />
                                    {errors.titulo && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.titulo}</div>}
                                </div>
                                
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '13px', color: '#475569', letterSpacing: '0.5px' }}>SUBTÍTULO / DESCRIPCIÓN (Opcional)</label>
                                    <input type="text" value={data.subtitulo} onChange={e => setData('subtitulo', e.target.value)} style={inputStyle} onFocus={e => Object.assign(e.target.style, inputFocusStyle)} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }} placeholder="Ej: Hasta 50% de descuento en seleccionados" />
                                    {errors.subtitulo && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.subtitulo}</div>}
                                </div>
                                
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '13px', color: '#475569', letterSpacing: '0.5px' }}>ENLACE DESTINO (Opcional)</label>
                                    <input type="text" value={data.enlace_url} onChange={e => setData('enlace_url', e.target.value)} style={inputStyle} onFocus={e => Object.assign(e.target.style, inputFocusStyle)} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }} placeholder="Ej: /catalogo/verano" />
                                </div>

                                <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '16px', border: '1px dashed #CBD5E1', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 700, fontSize: '13px', color: '#1E293B', letterSpacing: '0.5px' }}>
                                                IMAGEN DEL BANNER {editingBanner && '(Opcional para mantener actual)'}
                                            </label>
                                            <div style={{ fontSize: '13px', color: '#64748B' }}>Recomendado: 1200x400px. Máx 2MB (JPG, PNG, WEBP).</div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        {imagePreview ? (
                                            <div style={{ width: '120px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0', flexShrink: 0 }}>
                                                <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        ) : (
                                            <div style={{ width: '120px', height: '80px', borderRadius: '8px', background: '#F1F5F9', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', flexShrink: 0 }}>
                                                <ImageIcon size={24} />
                                            </div>
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <input 
                                                type="file" id="banner_image" accept="image/png, image/jpeg, image/webp" 
                                                onChange={handleImageChange} required={!editingBanner} style={{ display: 'none' }}
                                            />
                                            <label htmlFor="banner_image" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#ffffff', border: '1px solid #CBD5E1', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, color: '#475569', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.borderColor = '#004797'} onMouseOut={e => e.currentTarget.style.borderColor = '#CBD5E1'}>
                                                <UploadCloud size={16} /> Seleccionar Archivo
                                            </label>
                                        </div>
                                    </div>
                                    {errors.imagen && <div style={{ color: '#EF4444', fontSize: '12px' }}>{errors.imagen}</div>}
                                </div>
                                
                                <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                                    <label style={{ display: 'block', marginBottom: '16px', fontWeight: 800, fontSize: '13px', color: '#1E293B', letterSpacing: '0.5px' }}>PROGRAMACIÓN DE CAMPAÑA</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '13px', color: '#64748B' }}>Fecha de Inicio</label>
                                            <input type="datetime-local" value={data.fecha_inicio} onChange={e => setData('fecha_inicio', e.target.value)} style={inputStyle} onFocus={e => Object.assign(e.target.style, inputFocusStyle)} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }} />
                                            {errors.fecha_inicio && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.fecha_inicio}</div>}
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '13px', color: '#64748B' }}>Fecha de Fin (Opcional)</label>
                                            <input type="datetime-local" value={data.fecha_fin} onChange={e => setData('fecha_fin', e.target.value)} style={inputStyle} onFocus={e => Object.assign(e.target.style, inputFocusStyle)} onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.backgroundColor = '#F8FAFC'; }} />
                                            {errors.fecha_fin && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.fecha_fin}</div>}
                                        </div>
                                    </div>
                                </div>
    
                                <div style={{ display: 'flex', gap: '16px', marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #E2E8F0', flexShrink: 0 }}>
                                    <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', fontWeight: 600, color: '#64748B', transition: 'all 0.2s', fontSize: '15px' }} onMouseOver={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; }} onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#64748B'; }}>
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={processing} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: '#004797', color: 'white', fontWeight: 700, cursor: processing ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(0, 71, 151, 0.3)', transition: 'all 0.2s', fontSize: '15px', opacity: processing ? 0.7 : 1 }} onMouseOver={e => { if(!processing) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 71, 151, 0.4)'; } }} onMouseOut={e => { if(!processing) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 71, 151, 0.3)'; } }}>
                                        {processing ? 'Guardando...' : (editingBanner ? 'Guardar Cambios' : 'Publicar Banner')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
