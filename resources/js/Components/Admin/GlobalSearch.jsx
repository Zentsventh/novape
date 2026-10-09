import { useState, useEffect, useRef } from 'react';
import { Link } from '@inertiajs/react';

export default function GlobalSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!query.trim()) {
            setResults(null);
            setOpen(false);
            return;
        }

        const timeoutId = setTimeout(() => {
            setLoading(true);
            setOpen(true);
            fetch(`/admin/buscar?q=${encodeURIComponent(query)}`)
                .then(res => res.json())
                .then(data => {
                    setResults(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Error global search", err);
                    setLoading(false);
                });
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [query]);

    return (
        <div ref={searchRef} style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <svg style={{ position: 'absolute', left: '12px', color: 'var(--admin-text-muted)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input 
                    type="text" 
                    placeholder="Buscar producto, pedido, cliente..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => { if (query.trim()) setOpen(true); }}
                    style={{
                        width: '100%', padding: '8px 12px 8px 36px',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--admin-border)',
                        borderRadius: '20px', color: 'var(--admin-text-main)', fontSize: '14px', outline: 'none'
                    }}
                />
                {loading && (
                    <div style={{ position: 'absolute', right: '12px', width: '14px', height: '14px', border: '2px solid transparent', borderTopColor: '#8a2be2', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                )}
            </div>

            {open && results && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, width: '100%', marginTop: '8px',
                    background: 'var(--admin-sidebar-bg)', border: '1px solid var(--admin-border)',
                    borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 100,
                    maxHeight: '400px', overflowY: 'auto'
                }}>
                    <style>{`
                        @keyframes spin { 100% { transform: rotate(360deg); } }
                        .gs-item { padding: 10px 16px; display: block; text-decoration: none; border-bottom: 1px solid var(--admin-border); transition: background 0.15s; }
                        .gs-item:hover { background: var(--admin-sidebar-hover); }
                        .gs-item:last-child { border-bottom: none; }
                        .gs-section { padding: 8px 16px; font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--admin-text-muted); background: rgba(0,0,0,0.2); }
                    `}</style>
                    
                    {results.productos?.length > 0 && (
                        <div>
                            <div className="gs-section">Productos</div>
                            {results.productos.map(p => (
                                <Link key={p.id} href={`/admin/products/${p.id}/edit`} className="gs-item" onClick={() => setOpen(false)}>
                                    <div style={{ fontSize: '13px', color: 'var(--admin-text-main)', fontWeight: 500 }}>{p.nombre}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>Stock: {p.stock} | S/ {p.precio}</div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {results.pedidos?.length > 0 && (
                        <div>
                            <div className="gs-section">Pedidos</div>
                            {results.pedidos.map(p => (
                                <Link key={p.id} href={`/admin/pedidos/${p.id}`} className="gs-item" onClick={() => setOpen(false)}>
                                    <div style={{ fontSize: '13px', color: 'var(--admin-text-main)', fontWeight: 500 }}>Pedido #{p.id} - {p.usuario?.nombres}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>{p.estado} | S/ {p.total}</div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {results.usuarios?.length > 0 && (
                        <div>
                            <div className="gs-section">Usuarios</div>
                            {results.usuarios.map(u => (
                                <Link key={u.id} href={`/admin/clientes/${u.id}`} className="gs-item" onClick={() => setOpen(false)}>
                                    <div style={{ fontSize: '13px', color: 'var(--admin-text-main)', fontWeight: 500 }}>{u.nombres} {u.apellidos}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>{u.email}</div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {!results.productos?.length && !results.pedidos?.length && !results.usuarios?.length && (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: '13px' }}>
                            No se encontraron resultados para "{query}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
