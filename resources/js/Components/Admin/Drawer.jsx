import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Drawer({ isOpen, onClose, title, children, width = '400px' }) {
    // Evitar scroll en el body cuando el drawer está abierto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Cerrar al presionar ESC
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            display: 'flex',
            justifyContent: 'flex-end',
            visibility: isOpen ? 'visible' : 'hidden',
        }}>
            {/* Overlay background */}
            <div 
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    opacity: isOpen ? 1 : 0,
                    transition: 'opacity 0.3s ease-in-out',
                }}
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div 
                style={{
                    position: 'relative',
                    width: width,
                    maxWidth: '100%',
                    backgroundColor: 'var(--admin-bg-panel, #ffffff)',
                    boxShadow: '-4px 0 15px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    height: '100dvh',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--admin-border, #e2e8f0)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--admin-bg-panel, #ffffff)',
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--admin-text-main, #1e293b)' }}>
                        {title}
                    </h2>
                    <button 
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#64748b',
                            borderRadius: '4px'
                        }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    backgroundColor: 'var(--admin-bg-main, #f8fafc)',
                }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
