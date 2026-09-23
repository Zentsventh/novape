import React from 'react';
import { motion } from 'framer-motion';

export default function FadeIn({ children, delay = 0, duration = 0.5, className = '' }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration, delay, ease: 'easeOut' }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
