import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

export default function AddToListModal({ isOpen, onClose, producto }) {
    const [listas, setListas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [selectedListIds, setSelectedListIds] = useState([]);
    const [saving, setSaving] = useState(false);
    
    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            fetch('/wishlist/lists')
                .then(res => res.json())
                .then(data => {
                    setListas(data);
                    const initialSelected = [];
                    data.forEach(lista => {
                        if (lista.items.some(item => item.producto_id === producto.id)) {
                            initialSelected.push(lista.id);
                        }
                    });
                    setSelectedListIds(initialSelected);
                    setLoading(false);
                });
        }
    }, [isOpen, producto]);

    if (!isOpen) return null;

    const handleCreateList = (e) => {
        e.preventDefault();
        if (!newListName.trim()) return;
        
        setCreating(true);
        router.post('/perfil/listas', { nombre: newListName, es_publica: false }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: (page) => {
                setCreating(false);
                setNewListName('');
                fetch('/wishlist/lists').then(res => res.json()).then(data => {
                    setListas(data);
                    const newList = data.find(l => l.nombre === newListName);
                    if (newList) {
                        setSelectedListIds(prev => [...prev, newList.id]);
                    }
                });
            }
        });
    };

    const handleToggleCheckbox = (listaId) => {
        setSelectedListIds(prev => 
            prev.includes(listaId) 
                ? prev.filter(id => id !== listaId) 
                : [...prev, listaId]
        );
    };

    const handleSave = () => {
        setSaving(true);
        router.post('/wishlist/sync', { 
            producto_id: producto.id, 
            lista_ids: selectedListIds 
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setSaving(false);
                onClose();
            },
            onError: () => {
                setSaving(false);
            }
        });
    };

    return (
        <>
            <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}></div>
            <div className="store-modal-panel store-list-modal" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'calc(100% - 1.5rem)', maxWidth: '26.25rem', background: 'white', zIndex: 10000, borderRadius: '8px', padding: 'clamp(0.75rem, 3vw, 1.5625rem)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a', fontWeight: 'bold' }}>Agregar a una lista</h3>
                        <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#475569' }}>Selecciona la lista a la cual deseas agregar este producto.</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: '#94a3b8', padding: '0', lineHeight: '1' }}>?</button>
                </div>
                
                <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '15px 0' }} />

                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#334155', marginBottom: '15px' }}>Mis listas</div>

                {loading ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Cargando tus listas...</div>
                ) : (
                    <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '15px' }}>
                        {listas.map(lista => {
                            const isChecked = selectedListIds.includes(lista.id);
                            return (
                                <label
                                    key={lista.id}
                                    style={{
                                        display: 'flex', alignItems: 'center', width: '100%', padding: '12px 15px', 
                                        border: '1px solid #cbd5e1', borderRadius: '6px', marginBottom: '10px',
                                        cursor: 'pointer', textAlign: 'left',
                                        transition: 'all 0.2s',
                                        userSelect: 'none'
                                    }}
                                >
                                    <div style={{ 
                                        width: '20px', height: '20px', borderRadius: '4px', 
                                        border: isChecked ? 'none' : '1px solid #94a3b8', 
                                        background: isChecked ? '#004797' : 'white', 
                                        marginRight: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                                    }}>
                                        {isChecked && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={isChecked} 
                                        onChange={() => handleToggleCheckbox(lista.id)}
                                        style={{ display: 'none' }}
                                    />
                                    <div style={{ flex: 1, fontWeight: '400', fontSize: '15px', color: '#334155' }}>{lista.nombre}</div>
                                </label>
                            );
                        })}
                        {listas.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '15px', color: '#64748b', fontSize: '14px' }}>
                                A�n no tienes listas. Crea una abajo.
                            </div>
                        )}
                    </div>
                )}
                
                <form onSubmit={handleCreateList} style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', color: '#004797', fontSize: '18px', fontWeight: 'bold' }}>+</div>
                    <input 
                        type="text" 
                        placeholder="Crear una nueva lista" 
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        style={{ flex: 1, padding: '0', border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', color: '#004797', borderBottom: '1px solid transparent' }}
                        disabled={creating}
                    />
                    {newListName.trim().length > 0 && (
                        <button type="submit" disabled={creating} style={{ padding: '6px 12px', background: '#004797', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>
                            {creating ? '...' : 'Crear'}
                        </button>
                    )}
                </form>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button 
                        onClick={handleSave} 
                        disabled={saving}
                        style={{ 
                            background: '#2c3e50', color: 'white', border: 'none', borderRadius: '24px', 
                            padding: '12px 60px', fontSize: '16px', fontWeight: '600', cursor: 'pointer',
                            opacity: saving ? 0.7 : 1
                        }}
                    >
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </>
    );
}
