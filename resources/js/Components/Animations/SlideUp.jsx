import React from 'react';
import { motion } from 'framer-motion';

export default function SlideUp({ children, delay = 0, duration = 0.5, y = 20, className = '' }) {
    return (
        <motion.div
            initial={{ opacity: 0, y }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y }}
            transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
