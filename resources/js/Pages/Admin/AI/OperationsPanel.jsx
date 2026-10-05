import React from 'react';
import { PlugZap } from 'lucide-react';
import { Empty } from './api';

export default function OperationsPanel({ config, refresh }) {
    return (
        <div className="ai-card">
            <div className="ai-section-heading">
                <div>
                    <h2>Ejecuciones y conexiones</h2>
                    <p>Historial de operaciones de la inteligencia artificial y conexiones externas (Próximamente).</p>
                </div>
                <PlugZap size={22} />
            </div>
            <Empty>
                <p>Esta sección está en construcción. Aquí verás el historial detallado de decisiones de la IA y estados de conexión.</p>
            </Empty>
        </div>
    );
}
