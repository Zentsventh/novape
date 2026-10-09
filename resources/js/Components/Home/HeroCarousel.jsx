import { useEffect, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useDeviceContext } from '@/Contexts/DeviceContext';

export default function HeroCarousel({ banners = [] }) {
    const [current, setCurrent] = useState(0);
    const [hover, setHover] = useState(false);
    const [focus, setFocus] = useState(false);
    const [paused, setPaused] = useState(false);
    const [visible, setVisible] = useState(true);
    const pointer = useRef(null);
    const { prefersReducedMotion } = useDeviceContext();
    const count = banners.length;
    const go = (direction) => setCurrent((index) => (index + direction + count) % count);

    useEffect(() => {
        const visibility = () => setVisible(!document.hidden);
        document.addEventListener('visibilitychange', visibility);
        return () => document.removeEventListener('visibilitychange', visibility);
    }, []);
    useEffect(() => {
        if (count < 2 || paused || hover || focus || !visible || prefersReducedMotion) return;
        const interval = setInterval(() => setCurrent((index) => (index + 1) % count), 6000);
        return () => clearInterval(interval);
    }, [count, paused, hover, focus, visible, prefersReducedMotion]);
    useEffect(() => setCurrent(0), [count]);
    if (!count) return null;

    return (
        <section className="efe-hero-carousel" aria-label="Promociones de la tienda" aria-roledescription="carrusel"
            onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
            onFocusCapture={() => setFocus(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocus(false); }}
            onPointerDown={(event) => { pointer.current = { x: event.clientX, y: event.clientY }; }}
            onPointerUp={(event) => {
                if (!pointer.current) return;
                const dx = event.clientX - pointer.current.x;
                const dy = event.clientY - pointer.current.y;
                pointer.current = null;
                if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && count > 1) go(dx < 0 ? 1 : -1);
            }}>
            <div className="efe-hero-track" style={{ transform: `translateX(-${current * 100}%)` }}>
                {banners.map((banner, index) => {
                    const url = banner.enlace_url || banner.link_url;
                    const isExternal = url && (url.startsWith('http://') || url.startsWith('https://'));
                    const hasLink = url && url !== '#';

                    const image = <picture>
                        {banner.imagen_mobile_url && <source media="(max-width: 767px)" srcSet={banner.imagen_mobile_url} />}
                        <img src={banner.imagen_url || banner.image} alt={banner.titulo || 'Promoción de la tienda'} width="2367" height="728" loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'auto'} draggable="false" />
                    </picture>;
                    
                    return <div key={banner.id || index} className="efe-hero-slide" inert={index !== current ? "" : undefined} aria-hidden={index !== current}>
                        {!hasLink ? image : (
                            isExternal ? <a href={url} target="_blank" rel="noopener noreferrer">{image}</a> : <Link href={url}>{image}</Link>
                        )}
                    </div>;
                })}
            </div>
            {count > 1 && <>
                <button className="efe-hero-arrow efe-hero-arrow--prev" onClick={() => go(-1)} aria-label="Promoción anterior"><ChevronLeft size={22} /></button>
                <button className="efe-hero-arrow efe-hero-arrow--next" onClick={() => go(1)} aria-label="Promoción siguiente"><ChevronRight size={22} /></button>
                <div className="efe-hero-dots">{banners.map((_, index) => <button key={index} className={`efe-hero-dot ${index === current ? 'is-active' : ''}`} onClick={() => setCurrent(index)} aria-label={`Ver promoción ${index + 1}`} aria-current={index === current ? 'true' : undefined} />)}</div>
                <button className="hero-autoplay-toggle" onClick={() => setPaused((value) => !value)} aria-label={paused ? 'Reanudar promociones' : 'Pausar promociones'}>{paused ? <Play size={16} /> : <Pause size={16} />}</button>
            </>}
        </section>
    );
}
