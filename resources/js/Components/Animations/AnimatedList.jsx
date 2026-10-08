import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

export function AnimatedList({ children, className = '' }) {
    const reducedMotion = useReducedMotion();
    return (
        <motion.div
            variants={containerVariants}
            initial={false}
            animate="visible"
            className={className}
        >
            {React.Children.map(children, (child) => (
                <motion.div variants={reducedMotion ? undefined : itemVariants} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {child}
                </motion.div>
            ))}
        </motion.div>
    );
}

export default AnimatedList;
