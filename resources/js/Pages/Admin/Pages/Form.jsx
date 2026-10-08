import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout';
import { Save, Plus, Trash2 } from 'lucide-react';

export default function Form({ page, supportedPages = {} }) {
    const { configuraciones } = usePage().props;
    const { data, setData, post, put, processing, errors } = useForm({
        title: page?.title || '',
        slug: page?.slug || '',
        is_active: page ? page.is_active : true,
        sections: page?.sections || [{ heading: '', body: '' }]
    });

    const submit = (e) => {
        e.preventDefault();
        if (page) {
            put(`/admin/pages/${page.id}`);
        } else {
            post('/admin/pages');
        }
    };

    const addSection = () => {
        setData('sections', [...data.sections, { heading: '', body: '' }]);
    };

    const removeSection = (index) => {
        const newSections = [...data.sections];
        newSections.splice(index, 1);
        setData('sections', newSections);
    };

    const updateSection = (index, field, value) => {
        const newSections = [...data.sections];
        newSections[index][field] = value;
        setData('sections', newSections);
    };

    const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginBottom: '16px' };

    return (
        <AdminLayout logoUrl={configuraciones?.logo_url}>
            <Head title={page ? "Editar Página" : "Nueva Página"} />
            
            <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
                    {page ? "Editar Página" : "Nueva Página"}
                </h1>

                <form onSubmit={submit} style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div>
                        <label htmlFor="page-title" style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Título</label>
                        <input id="page-title" type="text" maxLength={255} value={data.title} onChange={e => setData('title', e.target.value)} style={inputStyle} required />
                        {errors.title && <div style={{ color: 'red', fontSize: '12px' }}>{errors.title}</div>}
                    </div>

                    <div>
                        <label htmlFor="page-slug" style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Página de la tienda</label>
                        <select id="page-slug" value={data.slug} onChange={e => setData('slug', e.target.value)} style={inputStyle} required>
                            <option value="">Selecciona una página</option>
                            {Object.entries(supportedPages).map(([slug, title]) => <option key={slug} value={slug}>{title} (/{slug})</option>)}
                        </select>
                        {errors.slug && <div style={{ color: 'red', fontSize: '12px' }}>{errors.slug}</div>}
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                            <input type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} />
                            Publicar este contenido
                        </label>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '24px 0' }} />

                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                        Secciones
                        <button type="button" onClick={addSection} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F1F5F9', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                            <Plus size={16} /> Añadir
                        </button>
                    </h2>

                    {data.sections.map((section, index) => (
                        <div key={index} style={{ background: '#F8FAFC', padding: '16px', borderRadius: '8px', marginBottom: '16px', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <strong>Sección {index + 1}</strong>
                                {data.sections.length > 1 && (
                                    <button type="button" aria-label={`Eliminar sección ${index + 1}`} onClick={() => removeSection(index)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                            <label htmlFor={`section-heading-${index}`}>Encabezado</label>
                            <input
                                id={`section-heading-${index}`}
                                maxLength={255}
                                type="text" 
                                placeholder="Encabezado" 
                                value={section.heading} 
                                onChange={e => updateSection(index, 'heading', e.target.value)} 
                                style={inputStyle} 
                                required 
                            />
                            {errors[`sections.${index}.heading`] && <p role="alert">{errors[`sections.${index}.heading`]}</p>}
                            <label htmlFor={`section-body-${index}`}>Contenido</label>
                            <textarea
                                id={`section-body-${index}`}
                                maxLength={50000}
                                placeholder="Contenido HTML o Texto" 
                                value={section.body} 
                                onChange={e => updateSection(index, 'body', e.target.value)} 
                                style={{ ...inputStyle, minHeight: '100px', marginBottom: '0' }} 
                                required 
                            />
                            {errors[`sections.${index}.body`] && <p role="alert">{errors[`sections.${index}.body`]}</p>}
                        </div>
                    ))}
                    {errors.sections && <p role="alert">{errors.sections}</p>}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button type="submit" disabled={processing} style={{ background: '#004797', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: processing ? 'not-allowed' : 'pointer' }}>
                            <Save size={18} /> {processing ? 'Guardando...' : 'Guardar Página'}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
