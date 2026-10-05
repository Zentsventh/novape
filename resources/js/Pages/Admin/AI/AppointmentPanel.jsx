import React from 'react';
import { CalendarDays } from 'lucide-react';
import { Empty } from './api';

export default function AppointmentPanel() {
    return (
        <div className="ai-card">
            <div className="ai-section-heading">
                <div>
                    <h2>Agenda y vendedores</h2>
                    <p>Configuración de la agenda comercial y asignación de vendedores (Próximamente).</p>
                </div>
                <CalendarDays size={22} />
            </div>
            <Empty>
                <p>Esta sección está en construcción. Aquí podrás gestionar los horarios y vendedores para las citas comerciales.</p>
            </Empty>
        </div>
    );
}
