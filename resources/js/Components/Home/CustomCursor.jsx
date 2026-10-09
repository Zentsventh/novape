import { useEffect, useState, useRef } from 'react';
import { useDeviceContext } from '@/Contexts/DeviceContext';
import '../../../css/home/custom-cursor.css';

export default function CustomCursor() {
    const cursorRef = useRef(null);
    const { isTouch } = useDeviceContext();
    const [isHovering, setIsHovering] = useState(false);
    const [hidden, setHidden] = useState(isTouch);

    useEffect(() => {
        // Solo en pantallas no táctiles
        if (isTouch) {
            setHidden(true);
            return;
        }

        const onMouseMove = (e) => {
            if (cursorRef.current) {
                // Posicionar el cursor principal con un ligero delay/smooth (manejado por CSS transition)
                cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
            }
        };

        const onMouseOver = (e) => {
            if (e.target.closest('a, button, input, textarea, select, [role="button"]')) {
                setIsHovering(true);
            }
        };

        const onMouseOut = (e) => {
            if (e.target.closest('a, button, input, textarea, select, [role="button"]')) {
                setIsHovering(false);
            }
        };

        const onMouseLeave = () => setHidden(true);
        const onMouseEnter = () => setHidden(false);

        window.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseover', onMouseOver);
        document.addEventListener('mouseout', onMouseOut);
        document.addEventListener('mouseleave', onMouseLeave);
        document.addEventListener('mouseenter', onMouseEnter);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseover', onMouseOver);
            document.removeEventListener('mouseout', onMouseOut);
            document.removeEventListener('mouseleave', onMouseLeave);
            document.removeEventListener('mouseenter', onMouseEnter);
        };
    }, []);

    if (hidden) return null;

    return (
        <div 
            ref={cursorRef} 
            className={`efe-custom-cursor ${isHovering ? 'is-hovering' : ''}`}
        />
    );
}
