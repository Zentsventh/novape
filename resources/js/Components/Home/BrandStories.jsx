import '../../../css/home/brand-stories.css';
import React, { useRef, useState } from 'react';
import { router } from '@inertiajs/react';

function BrandStoryItem({ marca, isSelected, onClick }) {
    const [imgFailed, setImgFailed] = useState(false);
    const domain = `${marca.nombre.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    const initial = marca.nombre.trim().charAt(0).toUpperCase() || 'M';

    return (
        <div
            className={`efe-story-item ${isSelected ? 'is-selected' : ''}`}
            onClick={onClick}
            title={marca.nombre}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
        >
            <div className="efe-story-ring">
                {!imgFailed ? (
                    <img
                        src={`https://logo.clearbit.com/${domain}`}
                        alt={marca.nombre}
                        className="efe-story-logo"
                        loading="lazy"
                        onError={() => setImgFailed(true)}
                    />
                ) : (
                    <div className="efe-story-fallback-img">
                        {initial}
                    </div>
                )}
            </div>
            <span className="efe-story-name">{marca.nombre}</span>
        </div>
    );
}

export default function BrandStories({ marcas = [], currentMarca = '' }) {
    const scrollRef = useRef(null);

    if (!marcas || marcas.length === 0) return null;

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = 320;
            current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    const handleMarcaClick = (nombreMarca) => {
        const newMarca = currentMarca.toLowerCase() === nombreMarca.toLowerCase() ? '' : nombreMarca;
        const currentUrl = new URL(window.location.href);
        if (newMarca) {
            currentUrl.searchParams.set('marca', newMarca);
        } else {
            currentUrl.searchParams.delete('marca');
        }
        router.visit(currentUrl.pathname + currentUrl.search, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <section className="efe-brand-stories-section" aria-label="Marcas destacadas">
            <div className="efe-brand-stories-header">
                <h3 className="efe-brand-stories-title">Marcas de la categoría</h3>
            </div>
            <div className="efe-brand-stories-carousel-container">
                <button
                    type="button"
                    className="efe-carousel-btn efe-carousel-left"
                    onClick={() => scroll('left')}
                    aria-label="Ver marcas anteriores"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>

                <div className="efe-brand-stories-wrapper" ref={scrollRef}>
                    {marcas.map((marca, idx) => {
                        const isSelected = currentMarca.toLowerCase() === marca.nombre.toLowerCase();
                        return (
                            <BrandStoryItem
                                key={marca.id || marca.nombre || idx}
                                marca={marca}
                                isSelected={isSelected}
                                onClick={() => handleMarcaClick(marca.nombre)}
                            />
                        );
                    })}
                </div>

                <button
                    type="button"
                    className="efe-carousel-btn efe-carousel-right"
                    onClick={() => scroll('right')}
                    aria-label="Ver marcas siguientes"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            </div>
        </section>
    );
}
