import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export default function SlideUp({ children, delay = 0, duration = 0.5, y = 20, className = '' }) {
    const reduce = useReducedMotion();
    return (
        <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y }}
            transition={{ duration: reduce ? 0 : Math.min(duration, 0.15), delay: 0, ease: [0.25, 0.1, 0.25, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
