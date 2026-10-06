import React, { useEffect, useState } from 'react';
import axios from 'axios';

const endpoint = '/admin/api/chatbot-knowledge';
const errorMessage = error => Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || 'No se pudo completar la solicitud.';

export default function ChatbotConsole() {
    const [status, setStatus] = useState(null), [settings, setSettings] = useState(null);
    const [busy, setBusy] = useState(false), [notice, setNotice] = useState('');
    const [messages, setMessages] = useState([]), [question, setQuestion] = useState(''), [evidence, setEvidence] = useState(null);
    useEffect(() => {
        const controller = new AbortController();
        axios.get(`${endpoint}/settings`, { signal: controller.signal }).then(({ data }) => { setStatus(data); setSettings(data.settings); })
            .catch(error => { if (!controller.signal.aborted) setNotice(errorMessage(error)); });
        return () => controller.abort();
    }, []);
    const change = (key, value) => setSettings(current => ({ ...current, [key]: value }));
    const save = async event => {
        event.preventDefault(); setBusy(true); setNotice('');
        try { await axios.put(`${endpoint}/settings`, settings); setNotice('Configuración guardada. Se aplicará en las próximas consultas.'); }
        catch (error) { setNotice(errorMessage(error)); } finally { setBusy(false); }
    };
    const ask = async event => {
        event.preventDefault(); if (!question.trim()) return;
        setBusy(true); setNotice('');
        const history = [...messages, { role: 'user', text: question.trim() }].slice(-19);
        try {
            const { data } = await axios.post(`${endpoint}/test`, { messages: history });
            setMessages([...history, { role: 'bot', text: data.reply }]); setQuestion(''); setEvidence(data);
        } catch (error) { setNotice(errorMessage(error)); } finally { setBusy(false); }
    };
    return <>
        {notice && <div className="knowledge-notice" role="status">{notice}</div>}
        <div className="knowledge-grid">
            <section className="knowledge-card"><h2>Configurar el asistente</h2>
                {status && <p>Conexión: {status.configured ? 'Clave configurada' : 'Falta GEMINI_API_KEY'} · {status.active_sources} fuentes activas</p>}
                {settings ? <form onSubmit={save}>
                    <label>Modelo de Gemini<input required maxLength={100} value={settings.model} onChange={e => change('model', e.target.value)} /></label>
                    <label>Instrucciones del negocio<textarea rows={5} maxLength={8000} value={settings.instructions} onChange={e => change('instructions', e.target.value)} placeholder="Tono de atención, público y pautas para asesorar…" /></label>
                    <label>Creatividad (0 a 1)<input type="number" min="0" max="1" step="0.1" required value={settings.temperature} onChange={e => change('temperature', Number(e.target.value))} /></label>
                    <label>Extensión máxima de respuesta<input type="number" min="256" max="4096" required value={settings.max_output_tokens} onChange={e => change('max_output_tokens', Number(e.target.value))} /></label>
                    <label>Mensaje cuando la IA no esté disponible<textarea required maxLength={500} rows={2} value={settings.fallback} onChange={e => change('fallback', e.target.value)} /></label>
                    <label className="knowledge-check"><input type="checkbox" checked={settings.semantic_search} onChange={e => change('semantic_search', e.target.checked)} />Buscar por significado además de palabras</label>
                    <small>Al activar esta opción, indexa las fuentes existentes con el botón de la biblioteca. Las nuevas fuentes se indexan automáticamente. La indexación y las consultas utilizan la API de Gemini.</small>
                    <p>La indexación se procesa en segundo plano. El servidor debe tener activo el trabajador de la cola chatbot.</p>
                    <button disabled={busy} className="is-primary">Guardar configuración</button>
                </form> : <p>Cargando configuración…</p>}
            </section>
            <section className="knowledge-card"><h2>Probar una conversación con IA</h2><p>Prueba el conocimiento y los productos antes de atender clientes. Puedes hacer preguntas de seguimiento. Esta prueba usa la API y no crea contactos ni tickets.</p>
                <div className="knowledge-test-chat" aria-live="polite">{messages.map((item, i) => <article className={`knowledge-result ${item.role}`} key={i}><strong>{item.role === 'user' ? 'Tú' : 'Novabot'}</strong><p>{item.text}</p></article>)}</div>
                <form onSubmit={ask}><label>Pregunta<textarea required rows={2} maxLength={4000} value={question} onChange={e => setQuestion(e.target.value)} /></label><div className="knowledge-actions"><button disabled={busy || !status?.configured}>{busy ? 'Consultando…' : 'Consultar IA'}</button><button type="button" disabled={busy} onClick={() => { setMessages([]); setEvidence(null); }}>Nueva conversación</button></div></form>
                {evidence && <p>Respuesta en {(evidence.duration_ms / 1000).toFixed(1)} s. Coincidencias textuales: {[...new Set(evidence.sources.map(s => s.title))].join(', ') || 'Sin coincidencias'}. La IA también puede consultar el índice semántico y los productos.</p>}
            </section>
        </div>
    </>;
}
