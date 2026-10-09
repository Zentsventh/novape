import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

export const base = '/admin/api/ai';
export const api = async (path, options = {}) => (await axios({ url: `${base}${path}`, ...options })).data;
export const rows = value => Array.isArray(value) ? value : value?.data || [];
export const errorText = error => Object.values(error?.response?.data?.errors || {}).flat().join(' ') || error?.response?.data?.message || 'No se pudo completar la solicitud. Inténtalo de nuevo.';
export const formatDate = value => value ? new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Lima' }).format(new Date(value)) : '—';
export const currency = value => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(Number(value || 0));

export function useResource(path) {
    const [data, setData] = useState(null), [error, setError] = useState(''), [loading, setLoading] = useState(true), [revision, setRevision] = useState(0);
    const refresh = useCallback(() => setRevision(value => value + 1), []);
    useEffect(() => {
        const controller = new AbortController();
        setLoading(true); setError('');
        api(path, { signal: controller.signal }).then(setData).catch(error => { if (!controller.signal.aborted) setError(errorText(error)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [path, revision]);
    return { data, error, loading, refresh };
}

export const scopes = { store: 'Chat de tienda', panel: 'Asistente del panel', whatsapp: 'WhatsApp', all: 'Todos los canales' };
export const triggers = { incoming_message: 'Mensaje recibido', qualified_lead: 'Oportunidad calificada', appointment_booked: 'Cita reservada', panel_query: 'Consulta del equipo' };
export const actionNames = { send_reply: 'Responder al cliente', handoff: 'Derivar a un vendedor', qualify_lead: 'Calificar oportunidad', offer_appointment: 'Ofrecer cita comercial', create_task: 'Crear tarea de seguimiento', tag: 'Etiquetar conversación' };

export function Notice({ error, success }) {
    if (!error && !success) return null;
    return <div className={`ai-notice ${error ? 'is-error' : 'is-success'}`} role={error ? 'alert' : 'status'}>{error || success}</div>;
}

export function Field({ label, help, children, wide = false }) {
    return <label className={`ai-field ${wide ? 'is-wide' : ''}`}><span>{label}</span>{children}{help && <small>{help}</small>}</label>;
}

export function Empty({ children }) { return <div className="ai-empty">{children}</div>; }
