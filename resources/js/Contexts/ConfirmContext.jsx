import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        message: '',
        title: 'Confirmación',
        confirmText: 'Confirmar'
    });
    
    // Almacenamos la promesa resolve para poder llamarla al confirmar o cancelar
    const resolver = useRef(null);

    const confirm = useCallback((message, options = {}) => {
        setConfirmState({
            isOpen: true,
            message,
            title: options.title || 'Confirmar acción',
            confirmText: options.confirmText || 'Confirmar'
        });
        
        return new Promise((resolve) => {
            resolver.current = resolve;
        });
    }, []);

    const handleConfirm = () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        if (resolver.current) resolver.current(true);
    };

    const handleCancel = () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        if (resolver.current) resolver.current(false);
    };

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            
            {confirmState.isOpen && (
                <>
                    <div onClick={handleCancel} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}></div>
                    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', maxWidth: '420px', background: 'white', zIndex: 100000, borderRadius: '8px', padding: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: 'bold' }}>{confirmState.title}</h3>
                            <button onClick={handleCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#94a3b8', padding: '0', lineHeight: '1' }}>?</button>
                        </div>
                        
                        <p style={{ margin: '0 0 25px 0', fontSize: '15px', color: '#475569', lineHeight: '1.5' }}>
                            {confirmState.message}
                        </p>
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                            <button 
                                onClick={handleCancel}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleConfirm}
                                style={{ background: confirmState.confirmText === 'Eliminar' ? '#e11d48' : '#2c3e50', border: 'none', borderRadius: '24px', padding: '10px 25px', fontSize: '14px', fontWeight: '600', color: 'white', cursor: 'pointer' }}
                            >
                                {confirmState.confirmText}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </ConfirmContext.Provider>
    );
}

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        console.error('useConfirm debe usarse dentro de un ConfirmProvider');
        // Devuelve una función dummy para evitar que crashee si se invoca
        return () => new Promise(res => res(false));
    }
    return context;
};
