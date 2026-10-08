import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export default function FadeIn({ children, delay = 0, duration = 0.5, className = '' }) {
    const reduce = useReducedMotion();
    return (
        <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : Math.min(duration, 0.15), delay: 0, ease: 'easeOut' }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
