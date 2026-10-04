import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function GsapCanvas() {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const container = containerRef.current;

        const frameCount = 120;
        
        // Detectar versión móvil vs PC para cargar imágenes (opcional si existieran 2 carpetas)
        // Por ahora cargamos siempre las de paradox
        const currentFrame = index => `/images/paradox/frame_${(index + 1).toString().padStart(4, '0')}_resultado.webp`;

        const images = [];
        const seq = { frame: 0 };
        let lastRenderedFrame = -1;

        // Precarga de imágenes usando decodificación por hardware (Elimina el lag en el primer scroll)
        const preloadImages = async () => {
            const decodePromises = [];
            for (let i = 0; i < frameCount; i++) {
                const img = new Image();
                img.src = currentFrame(i);
                images.push(img);
                
                // Si el navegador soporta decode(), preprocesamos la imagen en GPU antes de dibujarla
                if (img.decode) {
                    decodePromises.push(img.decode().catch(() => {}));
                }
            }
            await Promise.all(decodePromises);

            // Restauramos el comportamiento natural: el canvas será transparente y se mezclará
            // usando mix-blend-mode: multiply, así el fondo gris de la imagen desaparece.
            // Eliminamos el auto-sampler que oscurecía la caja.

            resizeCanvas(); // Render inicial cuando todo está listo
        };

        preloadImages();

        // Ajustar el tamaño del canvas al contenedor (Rectángulo fijo)
        function resizeCanvas() {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            render(); 
        }

        window.addEventListener('resize', resizeCanvas, { passive: true });

        // La función render ultra-optimizada
        function render() {
            const currentFrameIndex = Math.round(seq.frame);
            
            // Optimization 1: No redibujar si estamos en el mismo frame (ahorra muchísima CPU)
            if (currentFrameIndex === lastRenderedFrame) return;
            if (!images[currentFrameIndex] || !images[currentFrameIndex].complete) return;

            const img = images[currentFrameIndex];
            lastRenderedFrame = currentFrameIndex;
            
            // Matemáticas para un escalado más elegante y pequeño
            // Usamos Math.min para que la imagen no se desproporcione intentando llenar todo el ancho.
            // Multiplicamos por 1.2 para darle un sutil aumento de tamaño centrado, luciendo más premium.
            const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 1.2;
            const x = (canvas.width / 2) - (img.width / 2) * scale;
            const y = (canvas.height / 2) - (img.height / 2) * scale;

            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, x, y, img.width * scale, img.height * scale);
        }

        // Timeline para sincronizar el Canvas y el Parallax Text
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: container,
                start: 'center center',
                end: '+=600', 
                scrub: 0.5, 
                pin: true, 
                anticipatePin: 1 
            }
        });

        // 1. Animación principal de los productos (ocupa de 0 a 10s relativos)
        tl.to(seq, {
            frame: frameCount - 1,
            snap: 'frame',
            ease: 'none',
            onUpdate: render,
            duration: 10
        }, 0);

        // 2. Efecto Parallax de Alta Gama (Luxury Typo)
        // El texto gigante se moverá lenta y majestuosamente de derecha a izquierda detrás de los productos
        tl.fromTo('.parallax-text', 
            { x: '10%' }, 
            { x: '-30%', ease: 'none', duration: 10 }, 
            0
        );

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            tl.kill();
            ScrollTrigger.getAll().forEach(t => {
                if (t.vars.trigger === container) t.kill();
            });
        };
    }, []);

    return (
        <div style={{ margin: '40px 0', width: '100%', position: 'relative' }}>
            <div 
                ref={containerRef} 
                className="scroll-sequence-container"
                style={{ 
                    width: '100%',
                    height: '450px', 
                    background: '#ffffff', // Blanco puro para maximizar el contraste del blend
                    position: 'relative', 
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {/* Tipografía Masiva de Fondo (Luxury SaaS Style) */}
                <h1 
                    className="parallax-text"
                    style={{
                        position: 'absolute',
                        whiteSpace: 'nowrap',
                        fontSize: '16vw', // Tamaño colosal dinámico
                        fontWeight: '900',
                        color: '#f1f5f9', // Gris ultra sutil (Slate 100)
                        letterSpacing: '-0.04em',
                        margin: 0,
                        zIndex: 1, // Estrictamente detrás de los productos
                        fontFamily: '"Inter", "SF Pro Display", sans-serif',
                        textTransform: 'uppercase',
                        userSelect: 'none'
                    }}
                >
                    ECOSISTEMA INTELIGENTE
                </h1>

                {/* Secuencia 3D */}
                <canvas 
                    ref={canvasRef} 
                    style={{ 
                        position: 'relative',
                        zIndex: 2, // Por encima de la tipografía
                        width: '100%', 
                        height: '100%', 
                        display: 'block', 
                        willChange: 'transform',
                        mixBlendMode: 'multiply' // Magia: Hace que el blanco de la imagen sea transparente y deje ver la letra, pero oscurezca los bordes de los electrodomésticos encima de ella
                    }}
                />
            </div>
        </div>
    );
}
