import { useEffect, useId, useRef, useState } from 'react';

const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8, font: 'inherit', background: '#fff', color: '#1E293B' };
const defaultLabel = row => row.nombre || `${row.nombres || ''} ${row.apellidos || ''}`.trim();

export default function RemoteSelect({ endpoint, value, onChange, label = '', labelClassName, placeholder = 'Seleccionar (opcional)', params = {}, getLabel = defaultLabel, required = false, disabled = false }) {
    const id = useId();
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [options, setOptions] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasMore, setHasMore] = useState(false);
    const [retry, setRetry] = useState(0);
    const requestVersion = useRef(0);
    const serializedParams = JSON.stringify(params);

    useEffect(() => {
        const controller = new AbortController();
        const version = ++requestVersion.current;
        setLoading(true);
        setError('');
        const timer = setTimeout(async () => {
            try {
                const search = new URLSearchParams({ ...JSON.parse(serializedParams), q: query, page });
                const response = await fetch(`${endpoint}?${search}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
                if (!response.ok) throw new Error('No se pudieron cargar las opciones.');
                const result = await response.json();
                if (version !== requestVersion.current) return;
                setOptions(previous => page === 1 ? result.data : [...previous, ...result.data.filter(row => !previous.some(old => old.id === row.id))]);
                setHasMore(result.has_more);
            } catch (e) {
                if (e.name !== 'AbortError' && version === requestVersion.current) setError('No se pudieron cargar las opciones. Intenta nuevamente.');
            } finally {
                if (version === requestVersion.current) setLoading(false);
            }
        }, 300);
        return () => { clearTimeout(timer); controller.abort(); requestVersion.current++; };
    }, [endpoint, serializedParams, query, page, retry]);

    // Hydrate IDs from existing records even when they are outside the current search page.
    useEffect(() => {
        if (!value) { setSelected(null); return; }
        const controller = new AbortController();
        const search = new URLSearchParams({ id: value, ...(params.almacen_id ? { almacen_id: params.almacen_id } : {}) });
        fetch(`${endpoint}?${search}`, { signal: controller.signal, headers: { Accept: 'application/json' } })
            .then(response => { if (!response.ok) throw new Error(); return response.json(); })
            .then(result => setSelected(result.data[0] || { id: value, nombre: 'Registro no disponible' }))
            .catch(e => { if (e.name !== 'AbortError') setError('No se pudo cargar la selección actual.'); });
        return () => controller.abort();
    }, [endpoint, value, params.almacen_id]);

    useEffect(() => { setPage(1); setOptions([]); }, [serializedParams]);
    const choices = selected && !options.some(row => String(row.id) === String(value)) ? [selected, ...options] : options;
    return <div>
        {label ? <label htmlFor={id} className={labelClassName} style={labelClassName ? undefined : { display: 'block', marginBottom: 6, fontWeight: 600 }}>{label}</label> : null}
        <input aria-label={`Buscar ${typeof label === 'string' && label ? label.toLowerCase() : 'opciones'}`} type="search" maxLength={100} value={query} disabled={disabled}
            placeholder="Buscar por nombre o código…" style={{ ...inputStyle, marginBottom: 6 }}
            onChange={e => { setQuery(e.target.value); setPage(1); setOptions([]); }} />
        <select id={id} value={value || ''} required={required} disabled={disabled} aria-busy={loading} style={inputStyle}
            onChange={e => {
                const row = choices.find(option => String(option.id) === e.target.value) || null;
                setSelected(row); onChange(e.target.value, row);
            }}>
            <option value="">{placeholder}</option>
            {choices.map(row => <option key={row.id} value={row.id}>{getLabel(row)}</option>)}
        </select>
        <div aria-live="polite" style={{ fontSize: 12, marginTop: 4, color: error ? '#B91C1C' : '#64748B' }}>
            {loading ? 'Buscando…' : error || (!options.length ? 'Sin resultados para esta búsqueda.' : '')}
        </div>
        {error && <button type="button" onClick={() => setRetry(retry + 1)}>Reintentar</button>}
        {hasMore && !error && <button type="button" disabled={loading} onClick={() => setPage(page + 1)} style={{ marginTop: 6 }}>Cargar más resultados</button>}
    </div>;
}
