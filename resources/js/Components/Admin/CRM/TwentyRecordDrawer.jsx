import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function TwentyRecordDrawer({ isOpen, onClose, title, children }) {
    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            <div className="twenty-drawer-overlay" onClick={onClose} />
            <div className={`twenty-drawer ${isOpen ? 'open' : ''}`}>
                <div className="twenty-drawer-header">
                    <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--twenty-text-main)' }}>
                        {title}
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="twenty-btn-icon" 
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="twenty-drawer-content">
                    {children}
                </div>
            </div>
        </>
    );
}
