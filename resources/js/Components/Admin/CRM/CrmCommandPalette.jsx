import React, { useState, useEffect, useRef } from 'react';
import { Search, Target, Building, User, FileText, ArrowRight, CheckSquare, Plus, Mail, Activity, CornerDownLeft } from 'lucide-react';
import { router } from '@inertiajs/react';

export default function CrmCommandPalette({ isOpen, onClose }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);

    // Quick Actions shown when query is empty
    const quickActions = [
        { id: 'qa_1', type: 'Acción', title: 'Crear nueva Empresa', icon: 'plus', url: '/admin/crm/companies?create=true', shortcut: 'E' },
        { id: 'qa_2', type: 'Acción', title: 'Crear nueva Oportunidad', icon: 'plus', url: '/admin/crm/pipeline?create=true', shortcut: 'O' },
        { id: 'qa_3', type: 'Vista', title: 'Ir al Dashboard', icon: 'activity', url: '/admin/crm/dashboard', shortcut: 'D' },
        { id: 'qa_4', type: 'Acción', title: 'Nueva Tarea', icon: 'check-square', url: '/admin/crm/tasks?create=true', shortcut: 'T' }
    ];

    const displayItems = query.length < 2 ? quickActions : results;

    // Debounce search
    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setResults([]);
            return;
        }

        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 100);
        }

        if (query.length < 2) {
            setResults([]);
            setSelectedIndex(0);
            return;
        }

        const timeoutId = setTimeout(() => {
            setLoading(true);
            fetch(`/admin/crm/search?q=${encodeURIComponent(query)}`)
                .then(res => res.json())
                .then(data => {
                    setResults(data);
                    setSelectedIndex(0);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Search error:", err);
                    setLoading(false);
                });
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query, isOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev < displayItems.length - 1 ? prev + 1 : prev));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (displayItems.length > 0 && displayItems[selectedIndex]) {
                    handleSelect(displayItems[selectedIndex]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, displayItems, selectedIndex]);

    const handleSelect = (item) => {
        onClose();
        router.visit(item.url);
    };

    const getIcon = (iconStr) => {
        switch(iconStr) {
            case 'target': return <Target size={16} />;
            case 'building': return <Building size={16} />;
            case 'user': return <User size={16} />;
            case 'check-square': return <CheckSquare size={16} />;
            case 'plus': return <Plus size={16} />;
            case 'activity': return <Activity size={16} />;
            case 'mail': return <Mail size={16} />;
            default: return <FileText size={16} />;
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '12vh',
            animation: 'fadeIn 0.2s ease-out'
        }} onClick={onClose}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideDown { from { opacity: 0; transform: translateY(-10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
                .palette-item.active { background: var(--twenty-background-tertiary); }
                .palette-item .shortcut { opacity: 0; transition: opacity 0.2s; }
                .palette-item.active .shortcut { opacity: 1; }
            `}</style>
            
            <div 
                style={{
                    width: '100%',
                    maxWidth: '640px',
                    background: 'var(--twenty-background)',
                    borderRadius: '12px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Search Input Area */}
                <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--twenty-border)', background: 'var(--twenty-background-secondary)' }}>
                    <Search size={20} color="var(--twenty-primary)" style={{ marginRight: '14px' }} />
                    <input 
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar o escribir un comando..."
                        style={{
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            fontSize: '17px',
                            color: 'var(--twenty-text-main)',
                            padding: 0,
                            fontWeight: 500
                        }}
                    />
                    {loading ? (
                        <div style={{ width: '18px', height: '18px', border: '2px solid var(--twenty-border)', borderTopColor: 'var(--twenty-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    ) : (
                        <div style={{ fontSize: '11px', color: 'var(--twenty-text-muted)', border: '1px solid var(--twenty-border)', padding: '2px 6px', borderRadius: '4px', background: 'var(--twenty-background)' }}>
                            ESC
                        </div>
                    )}
                </div>

                {/* Results List */}
                {displayItems.length > 0 && (
                    <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '12px 8px' }}>
                        {query.length < 2 && (
                            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--twenty-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 12px 8px' }}>
                                Acciones Rápidas
                            </div>
                        )}
                        
                        {displayItems.map((item, idx) => (
                            <div 
                                key={item.id}
                                className={`palette-item ${idx === selectedIndex ? 'active' : ''}`}
                                onClick={() => handleSelect(item)}
                                onMouseEnter={() => setSelectedIndex(idx)}
                                style={{
                                    display: 'flex', alignItems: 'center',
                                    padding: '12px',
                                    cursor: 'pointer',
                                    borderRadius: '8px',
                                    transition: 'all 0.1s'
                                }}
                            >
                                <div style={{ 
                                    width: '32px', height: '32px', 
                                    borderRadius: '8px', 
                                    background: idx === selectedIndex ? 'var(--twenty-background)' : 'var(--twenty-background-secondary)', 
                                    border: '1px solid var(--twenty-border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: idx === selectedIndex ? 'var(--twenty-primary)' : 'var(--twenty-text-muted)',
                                    marginRight: '16px',
                                    transition: 'all 0.2s'
                                }}>
                                    {getIcon(item.icon)}
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ fontSize: '14px', fontWeight: idx === selectedIndex ? 600 : 500, color: 'var(--twenty-text-main)' }}>
                                        {item.title}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--twenty-text-muted)', marginTop: '2px' }}>
                                        {item.type} {item.subtitle ? `• ${item.subtitle}` : ''}
                                    </div>
                                </div>
                                
                                <div className="shortcut" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {item.shortcut && (
                                        <div style={{ fontSize: '11px', color: 'var(--twenty-text-muted)', background: 'var(--twenty-background)', border: '1px solid var(--twenty-border)', padding: '2px 6px', borderRadius: '4px' }}>
                                            {item.shortcut}
                                        </div>
                                    )}
                                    <CornerDownLeft size={16} color="var(--twenty-text-muted)" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {query.length >= 2 && results.length === 0 && !loading && (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--twenty-text-muted)' }}>
                        <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                        <p style={{ margin: 0, fontSize: '14px' }}>No se encontraron resultados para "{query}"</p>
                        <p style={{ margin: '4px 0 0', fontSize: '12px' }}>Prueba con otro término de búsqueda.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
