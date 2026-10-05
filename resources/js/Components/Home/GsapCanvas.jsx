import { useEffect, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../../../css/home/parallax-showcase.css';

gsap.registerPlugin(ScrollTrigger);
const frameUrl = (index) => `/images/paradox/frame_${String(index + 1).padStart(4, '0')}_resultado.webp`;

export default function GsapCanvas() {
    const stageRef = useRef(null);
    const canvasRef = useRef(null);
    const textRef = useRef(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        const stage = stageRef.current;
        const context = canvas.getContext('2d', { alpha: true });
        if (!context) return;
        let alive = true;
        let animationFrame = 0;
        let busy = 0;
        let queue = [];
        let requestedFrame = -1;
        let visible = false;
        const frames = new Map();
        const pending = new Set();
        const failed = new Set();
        const controllers = new Set();
        const sequence = { frame: 0 };
        let width = 0;
        let height = 0;

        const drawImage = (image, alpha = 1) => {
            const scale = Math.min(width / image.width, height / image.height) * .96;
            context.globalAlpha = alpha;
            context.drawImage(image, (width - image.width * scale) / 2, (height - image.height * scale) / 2, image.width * scale, image.height * scale);
        };
        const draw = () => {
            animationFrame = 0;
            if (!alive || !frames.size) return;
            const target = sequence.frame;
            const lower = Math.floor(target);
            const upper = Math.min(119, lower + 1);
            const nearest = [...frames.keys()].reduce((best, index) => Math.abs(index - target) < Math.abs(best - target) ? index : best);
            context.clearRect(0, 0, width, height);
            drawImage(frames.get(lower) ?? frames.get(nearest));
            if (frames.has(lower) && frames.has(upper) && upper !== lower) drawImage(frames.get(upper), target - lower);
            context.globalAlpha = 1;
        };
        const scheduleDraw = () => {
            if (!animationFrame && alive) animationFrame = requestAnimationFrame(draw);
        };
        const pump = () => {
            while (alive && busy < 4 && queue.length) {
                const index = queue.shift();
                if (frames.has(index) || pending.has(index) || failed.has(index)) continue;
                pending.add(index);
                busy++;
                const controller = new AbortController();
                controllers.add(controller);
                (async () => {
                    let image;
                    if ('createImageBitmap' in window) {
                        const response = await fetch(frameUrl(index), { signal: controller.signal });
                        if (!response.ok) throw new Error('Frame unavailable');
                        image = await createImageBitmap(await response.blob(), { resizeWidth: window.innerWidth < 768 ? 640 : 960, resizeQuality: 'high' });
                    } else {
                        image = new Image();
                        image.src = frameUrl(index);
                        await image.decode();
                    }
                    if (!alive) { image.close?.(); return; }
                    frames.set(index, image);
                    // Bound decoded memory instead of decoding all 120 frames together.
                    if (frames.size > 32) {
                        const farthest = [...frames.keys()].sort((a, b) => Math.abs(b - sequence.frame) - Math.abs(a - sequence.frame))[0];
                        frames.get(farthest).close?.();
                        frames.delete(farthest);
                    }
                    setReady(true);
                    scheduleDraw();
                })().catch(() => { if (alive) failed.add(index); }).finally(() => {
                    controllers.delete(controller);
                    pending.delete(index);
                    busy--;
                    if (alive) pump();
                });
            }
        };
        const requestFrames = () => {
            const center = Math.round(sequence.frame);
            if (!visible || center === requestedFrame) return;
            requestedFrame = center;
            queue = [center];
            for (let offset = 1; offset <= 12; offset++) queue.push(center + offset, center - offset);
            queue = queue.filter((index) => index >= 0 && index < 120);
            pump();
        };
        const resize = () => {
            width = stage.clientWidth;
            height = stage.clientHeight;
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.round(width * ratio);
            canvas.height = Math.round(height * ratio);
            context.setTransform(ratio, 0, 0, ratio, 0, 0);
            scheduleDraw();
        };
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(stage);
        resize();
        const observer = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            if (visible && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                requestedFrame = -1;
                requestFrames();
            }
        }, { rootMargin: '500px 0px' });
        observer.observe(stage);
        const media = gsap.matchMedia();
        media.add({ desktop: '(min-width: 1024px)', mobile: '(max-width: 1023px)', reduce: '(prefers-reduced-motion: reduce)' }, ({ conditions }) => {
            if (conditions.reduce) { setReady(false); return; }
            const timeline = gsap.timeline({ scrollTrigger: {
                trigger: stage,
                start: conditions.desktop ? 'center center' : 'top 75%',
                end: conditions.desktop ? () => `+=${Math.max(1000, stage.clientHeight * 2.5)}` : 'bottom 20%',
                pin: conditions.desktop,
                scrub: .8,
                anticipatePin: 1,
                invalidateOnRefresh: true,
            } });
            timeline.to(sequence, { frame: 119, ease: 'none', duration: 1, onUpdate: () => { requestFrames(); scheduleDraw(); } }, 0);
            timeline.fromTo(textRef.current, { xPercent: 6 }, { xPercent: -12, duration: 1, ease: 'none' }, 0);
        });
        return () => {
            alive = false;
            media.revert();
            observer.disconnect();
            resizeObserver.disconnect();
            cancelAnimationFrame(animationFrame);
            controllers.forEach((controller) => controller.abort());
            frames.forEach((image) => image.close?.());
            frames.clear();
        };
    }, []);

    return (
        <section className="parallax-showcase" aria-label="Tecnología para tu hogar">
            <div className="parallax-showcase-heading"><div><span>INNOVACIÓN EN CADA DETALLE</span><h2>Un hogar más inteligente.</h2></div><Link href="/catalogo?categoria=Refrigeraci%C3%B3n">Explorar electrohogar <span aria-hidden="true">↗</span></Link></div>
            <div ref={stageRef} className="parallax-stage">
                <span ref={textRef} className="parallax-wordmark" aria-hidden="true">HOGAR CONECTADO</span>
                <img className="parallax-poster" src={frameUrl(0)} alt="Tecnología de refrigeración para el hogar" style={{ opacity: ready ? 0 : 1 }} loading="lazy" />
                <canvas ref={canvasRef} className="parallax-canvas" aria-hidden="true" style={{ opacity: ready ? 1 : 0 }} />
                <span className="parallax-caption">Diseño que se ve. Tecnología que se siente.</span>
            </div>
        </section>
    );
}
