import '../../../css/home/product-carousel.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import ProductCard from './ProductCard';

/* The track's own width controls cards; no device-specific pixel calculations. */
export default function ProductCarousel({ products }) {
    const trackRef = useRef(null);
    const [edges, setEdges] = useState({ start: true, end: true });
    const measure = useCallback(() => {
        const track = trackRef.current;
        if (!track) return;
        setEdges({ start: track.scrollLeft <= 1, end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 1 });
    }, []);

    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;
        const observer = new ResizeObserver(measure);
        observer.observe(track);
        measure();
        return () => observer.disconnect();
    }, [measure, products.length]);

    const move = (direction) => {
        const track = trackRef.current;
        if (!track) return;
        track.scrollBy({ left: direction * track.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    };

    return (
        <div className="efe-section-carousel">
            <div className="efe-carousel-track" ref={trackRef} onScroll={measure} tabIndex={0} role="region" aria-label="Carrusel de productos">
                {products.map((product) => (
                    <div className="store-carousel-item" key={product.id}><ProductCard product={product} /></div>
                ))}
            </div>
            {(!edges.start || !edges.end) && (
                <div className="store-carousel-controls">
                    <button type="button" onClick={() => move(-1)} disabled={edges.start} aria-label="Productos anteriores">←</button>
                    <button type="button" onClick={() => move(1)} disabled={edges.end} aria-label="Productos siguientes">→</button>
                </div>
            )}
        </div>
    );
}
