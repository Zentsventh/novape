import React, { useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';

export default function TwentyRecordDrawer({ isOpen, onClose, title, children }) {
    const drawer = useRef(null);
    const titleId = useId();
    const closeRef = useRef(onClose);
    closeRef.current = onClose;
    // Prevent body scroll when open
    useEffect(() => {
        if (!isOpen) return;
        const previousFocus = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        drawer.current?.focus();
        const handleKey = e => {
            if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); }
            if (e.key !== 'Tab') return;
            const nodes = [...(drawer.current?.querySelectorAll('button, a[href], input, select, textarea, [tabindex="0"]') || [])].filter(n => !n.disabled && n.getClientRects().length);
            if (!nodes.length) { e.preventDefault(); return; }
            const first = nodes[0], last = nodes[nodes.length - 1];
            if (e.shiftKey && (document.activeElement === first || document.activeElement === drawer.current)) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && (document.activeElement === last || document.activeElement === drawer.current)) { e.preventDefault(); first.focus(); }
        };
        document.addEventListener('keydown', handleKey);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKey);
            previousFocus?.focus();
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            <div className="twenty-drawer-overlay" onClick={onClose} />
            <div ref={drawer} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`twenty-drawer ${isOpen ? 'open' : ''}`}>
                <div className="twenty-drawer-header">
                    <h2 id={titleId} style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--twenty-text-main)' }}>
                        {title}
                    </h2>
                    <button 
                        onClick={onClose} 
                        aria-label="Cerrar panel"
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
