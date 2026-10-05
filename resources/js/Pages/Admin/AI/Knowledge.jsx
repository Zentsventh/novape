import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { BookOpen, FileText, Plus, Save, Search, Upload } from 'lucide-react';
import AdminLayout from '../../../Layouts/AdminLayout';
import '../../../../css/admin/knowledge.css';

const endpoint = '/admin/api/chatbot-knowledge';
const blank = () => ({ title: '', content: '', enabled: false });
const message = error => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || 'No se pudo completar la solicitud.';

export default function Knowledge() {
    const [page, setPage] = useState(1), [revision, setRevision] = useState(0), [list, setList] = useState(null);
    const [source, setSource] = useState(blank), [file, setFile] = useState(null), [fileKey, setFileKey] = useState(0);
    const [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('');
    const [question, setQuestion] = useState(''), [results, setResults] = useState(null);
    const [deleting, setDeleting] = useState(null);
    useEffect(() => {
        const controller = new AbortController();
        axios.get(endpoint, { params: { page }, signal: controller.signal }).then(({ data }) => setList(data)).catch(error => { if (!controller.signal.aborted) setError(message(error)); });
        return () => controller.abort();
    }, [page, revision]);
    const reset = () => { setSource(blank()); setFile(null); setFileKey(v => v + 1); setDeleting(null); };
    const change = (key, value) => { setSource(current => ({ ...current, [key]: value })); setSuccess(''); };
    const save = async event => {
        event.preventDefault(); setBusy(true); setError(''); setSuccess('');
        try {
            if (source.id) await axios.put(`${endpoint}/${source.id}`, source);
            else {
                const data = new FormData();
                data.append('title', source.title); data.append('enabled', source.enabled ? '1' : '0');
                if (file) data.append('file', file); else data.append('content', source.content);
                const response = await axios.post(endpoint, data);
                const loaded = await axios.get(`${endpoint}/${response.data.id}`);
                setSource(loaded.data); setFile(null); setFileKey(v => v + 1);
            }
            setSuccess(source.enabled ? 'Fuente guardada y activa para las próximas consultas.' : 'Borrador guardado. Revisa el contenido y actívalo para que el chatbot lo utilice.');
            setRevision(v => v + 1); setResults(null);
        } catch (error) { setError(message(error)); } finally { setBusy(false); }
    };
    const edit = async id => {
        setBusy(true); setError(''); setSuccess('');
        try { const { data } = await axios.get(`${endpoint}/${id}`); setSource({ ...data, enabled: Boolean(data.enabled) }); setFile(null); setFileKey(v => v + 1); }
        catch (error) { setError(message(error)); } finally { setBusy(false); }
    };
    const remove = async id => {
        setBusy(true); setError('');
        try { await axios.delete(`${endpoint}/${id}`); if (source.id === id) reset(); setDeleting(null); setRevision(v => v + 1); setResults(null); setSuccess('Fuente eliminada. El chatbot dejará de consultarla.'); }
        catch (error) { setError(message(error)); } finally { setBusy(false); }
    };
    const preview = async event => {
        event.preventDefault(); setBusy(true); setError('');
        try { const { data } = await axios.post(`${endpoint}/preview`, { question }); setResults(data.sources); }
        catch (error) { setError(message(error)); } finally { setBusy(false); }
    };
    return <AdminLayout><Head title="Conocimiento del chatbot" /><main className="knowledge-page">
        <header className="knowledge-heading"><div><span><BookOpen size={18} /> CHATBOT CON IA</span><h1>Conocimiento de Novape</h1><p>Comparte políticas, guías y respuestas para que el chatbot asesore con información de tu negocio.</p></div><button disabled={busy} onClick={reset}><Plus size={17} />Nueva fuente</button></header>
        {error && <div className="knowledge-notice is-error" role="alert">{error}</div>}{success && <div className="knowledge-notice" role="status">{success}</div>}
        <div className="knowledge-grid"><section className="knowledge-card"><h2><FileText size={20} />{source.id ? 'Revisar y editar fuente' : 'Añadir conocimiento'}</h2>
            <p>Guarda primero un borrador. Revisa el texto extraído del documento y activa la fuente cuando esté lista para clientes.</p>
            <form onSubmit={save}><label>Título de la fuente<input required maxLength={160} value={source.title} onChange={event => change('title', event.target.value)} placeholder="Política de garantías y devoluciones" /></label>
                {!source.id && <label className="knowledge-upload"><span><Upload size={18} />Subir documento</span><input key={fileKey} type="file" accept=".pdf,.docx,.txt,.md" onChange={event => { setFile(event.target.files?.[0] || null); setSuccess(''); }} /><small>PDF con texto, Word (.docx), TXT o Markdown. Máximo 5 MB; 200.000 caracteres. Los PDF escaneados requieren OCR.</small></label>}
                {!file && <label>Contenido<textarea required minLength={20} maxLength={200000} rows={12} value={source.content} onChange={event => change('content', event.target.value)} placeholder="Describe los procesos, condiciones y respuestas que debe conocer el chatbot…" /><small>{source.content.length.toLocaleString('es-PE')} / 200.000 caracteres</small></label>}
                <label className="knowledge-check"><input type="checkbox" checked={source.enabled} onChange={event => change('enabled', event.target.checked)} />Activa: el chatbot puede usar este contenido en respuestas a clientes</label>
                <button className="is-primary" disabled={busy}><Save size={17} />{busy ? 'Procesando…' : 'Guardar fuente'}</button>
            </form>
        </section><section className="knowledge-card"><h2>Biblioteca de fuentes</h2><p>Solo las fuentes activas se consultan en el chat de tienda y WhatsApp.</p>
            {!list ? <p role="status">Cargando fuentes…</p> : !list.data.length ? <div className="knowledge-empty"><BookOpen size={30} /><p>Añade tu primera guía, política o documento.</p></div> : list.data.map(item => <article className="knowledge-source" key={item.id}><div><strong>{item.title}</strong><small>{item.type.toUpperCase()} · {item.enabled ? 'Activa' : 'Borrador'} · {new Date(item.updated_at).toLocaleDateString('es-PE')}</small></div><div className="knowledge-actions"><button disabled={busy} onClick={() => edit(item.id)}>Revisar / editar</button>{deleting === item.id ? <><button disabled={busy} onClick={() => remove(item.id)}>Confirmar eliminación</button><button onClick={() => setDeleting(null)}>Cancelar</button></> : <button disabled={busy} onClick={() => setDeleting(item.id)}>Eliminar</button>}</div></article>)}
            {list && list.last_page > 1 && <div className="knowledge-actions"><button disabled={page === 1 || busy} onClick={() => setPage(v => v - 1)}>Anterior</button><span>{page} / {list.last_page}</span><button disabled={page === list.last_page || busy} onClick={() => setPage(v => v + 1)}>Siguiente</button></div>}
        </section></div>
        <section className="knowledge-card"><h2><Search size={20} />Comprobar qué información encontrará</h2><p>Escribe una consulta para ver los fragmentos activos que recibirá la IA. Esta prueba no envía mensajes ni llama al proveedor.</p><form onSubmit={preview}><label>Consulta de un cliente<input required maxLength={4000} value={question} onChange={event => { setQuestion(event.target.value); setResults(null); }} placeholder="¿Qué cubre la garantía de una refrigeradora?" /></label><button disabled={busy}>Buscar en el conocimiento</button></form>
            {results && <div aria-live="polite">{results.length ? results.map((item, index) => <article className="knowledge-result" key={index}><strong>{item.title}</strong><p>{item.content}</p></article>) : <p>No hay fragmentos relevantes. Añade o activa una fuente que explique este tema.</p>}</div>}
        </section><p className="knowledge-footnote">El contenido sirve como referencia en cada consulta. Publica información apta para clientes. Los precios, existencias y pedidos se verifican con los datos actuales de la tienda.</p>
    </main></AdminLayout>;
}
