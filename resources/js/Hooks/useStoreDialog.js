import { useEffect, useRef } from 'react';

const dialogs = [];
let originalOverflow = '';
const selector = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]';

export default function useStoreDialog(open, onClose) {
    const panel = useRef(null);
    const close = useRef(onClose);
    close.current = onClose;
    useEffect(() => {
        if (!open) return;
        const element = panel.current;
        if (!element) return;
        const previous = document.activeElement;
        if (!dialogs.length) originalOverflow = document.body.style.overflow;
        dialogs.push(element);
        document.body.style.overflow = 'hidden';
        const focusable = () => [...element.querySelectorAll(selector)].filter(node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden' && !node.closest('[inert]'));
        const frame = requestAnimationFrame(() => (focusable()[0] || element).focus());
        const keydown = event => {
            if (dialogs.at(-1) !== element) return;
            if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close.current?.(); }
            if (event.key === 'Tab') {
                const nodes = focusable();
                const first = nodes[0] || element, last = nodes.at(-1) || element;
                if (!nodes.length || (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last) || !element.contains(document.activeElement)) {
                    event.preventDefault(); (event.shiftKey ? last : first).focus();
                }
            }
        };
        document.addEventListener('keydown', keydown, true);
        return () => {
            cancelAnimationFrame(frame);
            document.removeEventListener('keydown', keydown, true);
            dialogs.splice(dialogs.indexOf(element), 1);
            document.body.style.overflow = dialogs.length ? 'hidden' : originalOverflow;
            if (previous?.isConnected) previous.focus();
        };
    }, [open]);
    return panel;
}
