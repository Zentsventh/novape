import { Link } from '@inertiajs/react';
import { ArrowUpRight, Bot, CheckCheck, ChevronRight, CircleHelp, Clock3, Inbox, Layers3, LifeBuoy, MessageSquare, PanelRightClose, PanelRightOpen, Search, ShieldCheck, Sparkles, UserRound, Users, Zap } from 'lucide-react';

export const inboxViews = [
    { id: 'all', label: 'Todas las abiertas', icon: Inbox, stat: 'open' },
    { id: 'mine', label: 'Asignadas a mí', icon: UserRound, stat: 'mine' },
    { id: 'unassigned', label: 'Sin asignar', icon: Users, stat: 'unassigned', supervisor: true },
    { id: 'waiting', label: 'En espera', icon: Clock3, stat: 'waiting' },
    { id: 'unread', label: 'Por leer', icon: MessageSquare, stat: 'unread' },
    { id: 'priority', label: 'Alta prioridad', icon: Zap, stat: 'priority' },
    { id: 'bot', label: 'Con asistente IA', icon: Bot, stat: 'bot' },
    { id: 'closed', label: 'Resueltas y cerradas', icon: CheckCheck, stat: 'closed' },
];

export function InboxRail({ selected, onSelect, summary, channels, supervisor, onSupervisor, user }) {
    const canManageCrm = supervisor || user?.permisos?.includes('crm.gestionar');
    return <aside className="omni-rail" aria-label="Bandejas de atención">
        <div className="omni-brand"><span><Layers3 size={20}/></span><div>novape<span>Customer workspace</span></div></div>
        <div className="omni-rail-label">ESPACIO DE ATENCIÓN</div>
        <nav>{inboxViews.filter(view => !view.supervisor || supervisor).map(({ id, label, icon: Icon, stat }) =>
            <button key={id} type="button" className={`omni-view ${selected === id ? 'is-active' : ''}`} onClick={() => onSelect(id)} aria-current={selected === id ? 'page' : undefined}><Icon size={16}/><span>{label}</span><small>{summary?.[stat] ?? '—'}</small></button>)}</nav>
        <div className="omni-rail-label">CANALES · CONVERSACIONES ABIERTAS</div>
        <div className="omni-channel-overview">{[['whatsapp','WhatsApp'],['messenger','Messenger'],['instagram','Instagram'],['web','Chat de la tienda']].map(([id,label])=><div key={id}><i className={`omni-channel-dot ${id}`}/><span>{label}</span><small>{channels ? channels[id] ?? 0 : '—'}</small></div>)}</div>
        <div className="omni-rail-label">GESTIÓN</div>
        {supervisor && <button type="button" className="omni-view" onClick={onSupervisor}><ShieldCheck size={16}/><span>Supervisión del equipo</span><ChevronRight size={14}/></button>}
        {canManageCrm && <Link className="omni-view" href="/admin/crm/pipeline"><Layers3 size={16}/><span>Oportunidades</span><ArrowUpRight size={14}/></Link>}
        {canManageCrm && <Link className="omni-view" href="/admin/crm/tasks"><CheckCheck size={16}/><span>Tareas y seguimiento</span><ArrowUpRight size={14}/></Link>}
        <div className="omni-rail-footer"><div className="omni-mini-avatar">{user?.nombres?.slice(0,1) || 'A'}</div><div><strong>{user?.nombres || 'Mi espacio'}</strong><span>Atención al cliente</span></div></div>
    </aside>;
}

export function InboxTopbar({ summary, showProfile, onProfile, showHelp, onHelp, realtime }) {
    return <header className="omni-topbar"><div><div className="omni-eyebrow">RELACIONES QUE CRECEN</div><h1>Centro de conversaciones<span className="omni-workspace-badge">Omnicanal</span></h1><p>Cada conversación, una oportunidad de conectar.</p></div>
        <div className="omni-topbar-actions"><span className={`omni-sync ${realtime ? 'is-live' : ''}`}><i/>{realtime ? 'En tiempo real' : 'Actualización periódica'}</span><button type="button" className="omni-icon-button" onClick={onHelp} aria-label="Ayuda y atajos" aria-expanded={showHelp}><CircleHelp size={18}/></button><button type="button" className="omni-icon-button" onClick={onProfile} aria-label={showProfile ? 'Ocultar perfil del cliente' : 'Mostrar perfil del cliente'} aria-pressed={showProfile}>{showProfile ? <PanelRightClose size={18}/> : <PanelRightOpen size={18}/>}</button></div>
        <div className="omni-metrics">{[['open','Conversaciones abiertas',Inbox,'blue'],['waiting','Clientes en espera',Clock3,'amber'],['unread','Conversaciones por leer',MessageSquare,'purple'],['priority','Alta prioridad',Zap,'rose']].map(([key,label,Icon,color])=><div className={`omni-metric ${color}`} key={key}><span className="omni-metric-icon"><Icon size={17}/></span><div><strong>{summary?.[key] ?? '—'}</strong><span>{label}</span></div></div>)}</div>
        {showHelp && <div className="omni-help" role="region" aria-label="Ayuda de la bandeja"><strong>Trabaja con más fluidez</strong><p><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd> Buscar conversaciones</p><p><kbd>Enter</kbd> Enviar · <kbd>Shift</kbd> + <kbd>Enter</kbd> Nueva línea</p><p><kbd>/</kbd> Respuestas rápidas · <kbd>Esc</kbd> Cerrar menús</p><span>Las notas internas solo las ve tu equipo. Los borradores se conservan en esta sesión del navegador.</span></div>}
    </header>;
}

export function InboxWelcome({ summary, onView }) {
    return <div className="omni-welcome"><div className="omni-welcome-art"><div className="omni-orbit one"/><div className="omni-orbit two"/><span className="omni-art-main"><MessageSquare size={36} strokeWidth={1.5}/></span><span className="omni-art-icon a"><CheckCheck size={19}/></span><span className="omni-art-icon b"><Sparkles size={18}/></span><span className="omni-art-icon c"><Users size={18}/></span></div><span className="omni-eyebrow">TU EQUIPO. TUS CLIENTES. UN SOLO LUGAR.</span><h2>Una atención que se siente cercana.</h2><p>Elige una conversación para responder con contexto, acompañar una compra o resolver lo que tu cliente necesita.</p><div className="omni-welcome-shortcuts"><button onClick={()=>onView('waiting')}><Clock3 size={19}/><strong>Prioriza la espera</strong><span>{summary?.waiting ?? '—'} conversaciones esperando</span><ArrowUpRight size={15}/></button><button onClick={()=>onView('mine')}><UserRound size={19}/><strong>Tu bandeja personal</strong><span>{summary?.mine ?? '—'} conversaciones asignadas</span><ArrowUpRight size={15}/></button></div><div className="omni-welcome-foot"><LifeBuoy size={15}/> Respuestas, notas y seguimiento sin perder el contexto.</div></div>;
}
