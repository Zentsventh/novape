import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import TwentyCrmLayout from '../../../Layouts/TwentyCrmLayout';
import { 
    MessageSquare, Send, Paperclip, Check, CheckCheck, 
    ChevronLeft, Search, Bot, User, Clock, CheckCircle2,
    Smile, Plus, MoreVertical, Image as ImageIcon,
    Inbox, Zap, StickyNote, RefreshCw, ArrowRightLeft,
    FileText, Video, X, AlertCircle, Loader2,
    MessageCircle, Hash, Ticket, Shield, Users,
    PhoneForwarded, XCircle, Activity, Timer, Tag
} from 'lucide-react';
import '../../../../css/admin/admin.css';
import '../../../../css/admin/inbox.css';

// ─── SVG Icons para los canales ───────────────────────────────
const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
);

const MessengerIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0Zm1.191 14.963-3.056-3.26-5.963 3.26 6.559-6.962 3.13 3.259 5.889-3.259-6.559 6.962Z"/>
    </svg>
);

const InstagramIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
);

// ─── Toast Component ──────────────────────────────────────────
function Toast({ message, type = 'error', onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const icons = {
        error: <AlertCircle size={16} />,
        success: <CheckCircle2 size={16} />,
        info: <MessageCircle size={16} />,
    };

    return (
        <div className={`inbox-toast inbox-toast--${type}`}>
            <span className="inbox-toast__icon">{icons[type]}</span>
            <span className="inbox-toast__text">{message}</span>
            <button className="inbox-toast__close" onClick={onClose}><X size={14} /></button>
        </div>
    );
}

// ─── Canned Responses Dropdown ────────────────────────────────
function CannedResponsesDropdown({ onSelect, onClose }) {
    const [responses, setResponses] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchCannedResponses();
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    const fetchCannedResponses = async () => {
        try {
            const res = await fetch('/admin/api/omnichannel/canned-responses');
            if (res.ok) {
                const data = await res.json();
                setResponses(data);
            }
        } catch (e) {
            console.error('Error fetching canned responses:', e);
        } finally {
            setLoading(false);
        }
    };

    const filtered = responses.filter(r =>
        r.title?.toLowerCase().includes(search.toLowerCase()) ||
        r.shortcut?.toLowerCase().includes(search.toLowerCase()) ||
        r.content?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="inbox-canned-dropdown" ref={dropdownRef}>
            <div className="inbox-canned-dropdown__header">
                <Zap size={14} />
                <span>Respuestas Rápidas</span>
                <button onClick={onClose}><X size={14} /></button>
            </div>
            <div className="inbox-canned-dropdown__search">
                <input
                    type="text"
                    placeholder="Buscar por título o atajo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                />
            </div>
            <div className="inbox-canned-dropdown__list">
                {loading ? (
                    <div className="inbox-canned-dropdown__loading">
                        <Loader2 size={18} className="animate-spin" /> Cargando...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="inbox-canned-dropdown__empty">
                        No se encontraron respuestas
                    </div>
                ) : (
                    filtered.map((r) => (
                        <button
                            key={r.id}
                            className="inbox-canned-dropdown__item"
                            onClick={() => { onSelect(r.content); onClose(); }}
                        >
                            <div className="inbox-canned-dropdown__item-header">
                                <span className="inbox-canned-dropdown__shortcut">/{r.shortcut}</span>
                                {r.category && <span className="inbox-canned-dropdown__category">{r.category}</span>}
                            </div>
                            <div className="inbox-canned-dropdown__item-title">{r.title}</div>
                            <div className="inbox-canned-dropdown__item-preview">
                                {r.content?.substring(0, 80)}{r.content?.length > 80 ? '...' : ''}
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}

// ─── Skeleton de perfil ───────────────────────────────────────
const ProfileSkeleton = () => (
    <div className="p-6">
        <div className="flex justify-center mb-4">
            <div className="skeleton skeleton-circle" style={{width: 80, height: 80}}></div>
        </div>
        <div className="skeleton skeleton-text" style={{height: 20, width: '60%', margin: '0 auto 10px'}}></div>
        <div className="skeleton skeleton-text" style={{height: 14, width: '40%', margin: '0 auto 24px'}}></div>
        <div className="skeleton skeleton-text" style={{height: 12, width: '30%', margin: '0 0 16px'}}></div>
        <div className="skeleton skeleton-text" style={{height: 14}}></div>
        <div className="skeleton skeleton-text" style={{height: 14}}></div>
        <div className="skeleton skeleton-text" style={{height: 14, width: '80%'}}></div>
    </div>
);

// ─── Skeleton de conversaciones ───────────────────────────────
const ConversationsSkeleton = () => (
    <div className="p-4">
        {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 mb-2">
                <div className="skeleton skeleton-circle" style={{width: 44, height: 44}}></div>
                <div style={{flex: 1}}>
                    <div className="skeleton skeleton-text" style={{height: 14, width: '70%', marginBottom: 6}}></div>
                    <div className="skeleton skeleton-text" style={{height: 12, width: '90%'}}></div>
                </div>
                <div className="skeleton skeleton-text" style={{height: 12, width: 40}}></div>
            </div>
        ))}
    </div>
);

// ─── Media Preview ────────────────────────────────────────────
function MediaPreview({ mediaUrl, mediaMimeType }) {
    if (!mediaUrl) return null;

    if (mediaMimeType?.includes('image')) {
        return (
            <div className="inbox-message__media">
                <img src={mediaUrl} alt="Adjunto" loading="lazy" />
            </div>
        );
    }

    if (mediaMimeType?.includes('video')) {
        return (
            <div className="inbox-message__media">
                <video controls preload="metadata" className="inbox-message__video">
                    <source src={mediaUrl} type={mediaMimeType} />
                    Tu navegador no soporta video.
                </video>
            </div>
        );
    }

    if (mediaMimeType?.includes('audio')) {
        return (
            <div className="inbox-message__media">
                <audio controls preload="metadata" className="inbox-message__audio">
                    <source src={mediaUrl} type={mediaMimeType} />
                </audio>
            </div>
        );
    }

    if (mediaMimeType?.includes('pdf')) {
        return (
            <div className="inbox-message__media">
                <a href={mediaUrl} target="_blank" rel="noreferrer" className="inbox-message__file-link">
                    <FileText size={20} /> Ver PDF
                </a>
            </div>
        );
    }

    return (
        <div className="inbox-message__media">
            <a href={mediaUrl} target="_blank" rel="noreferrer" className="inbox-message__file-link">
                <Paperclip size={16} /> Descargar Archivo
            </a>
        </div>
    );
}

// ─── Error Boundary ───────────────────────────────────────────
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', background: '#fee2e2', color: '#991b1b', height: '100vh', width: '100vw' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Algo salió mal en el panel Omnicanal</h1>
                    <pre style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

// ─── Transfer Form Component ─────────────────────────────────
function TransferForm({ agents, onTransfer, onCancel }) {
    const [selectedAgent, setSelectedAgent] = useState('');
    const [reason, setReason] = useState('');
    
    const getStatusDot = (status) => {
        const colors = { online: '#22c55e', busy: '#f59e0b', away: '#eab308', offline: '#ef4444' };
        return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: colors[status] || '#6b7280', marginRight: 6 }} />;
    };

    return (
        <div style={{ padding: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#b0b3c6' }}>
                Seleccionar Asesor
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto', marginBottom: '12px' }}>
                {agents.length === 0 ? (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#8b8fa3', fontSize: '13px' }}>No hay asesores disponibles</div>
                ) : agents.map(agent => (
                    <button
                        key={agent.id}
                        onClick={() => setSelectedAgent(agent.id)}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            background: selectedAgent === agent.id ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                            color: '#e0e0e0', fontSize: '13px', textAlign: 'left'
                        }}
                    >
                        <span>{getStatusDot(agent.status)} {agent.name}</span>
                        <span style={{ fontSize: '11px', color: '#8b8fa3' }}>{agent.activeChats}/{agent.maxChats}</span>
                    </button>
                ))}
            </div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#b0b3c6' }}>
                Motivo (opcional)
            </label>
            <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: El cliente necesita soporte técnico..."
                rows={2}
                style={{
                    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', padding: '10px', color: '#e0e0e0', fontSize: '13px', resize: 'none', outline: 'none'
                }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px', justifyContent: 'flex-end' }}>
                <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#b0b3c6', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
                <button
                    onClick={() => selectedAgent && onTransfer(selectedAgent, reason)}
                    disabled={!selectedAgent}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: selectedAgent ? '#3b82f6' : '#374151', color: 'white', cursor: selectedAgent ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: 600 }}
                >Transferir</button>
            </div>
        </div>
    );
}

// ─── Close Reason Form Component ─────────────────────────────
function CloseReasonForm({ onClose, onCancel }) {
    const [reason, setReason] = useState('');
    const reasons = [
        'Consulta resuelta',
        'Compra realizada',
        'Cliente no interesado',
        'Derivado a otra área',
        'Inactividad del cliente',
    ];

    return (
        <div style={{ padding: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#b0b3c6' }}>
                Motivo del cierre
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                {reasons.map(r => (
                    <button
                        key={r}
                        onClick={() => setReason(r)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            background: reason === r ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                            color: '#e0e0e0', fontSize: '13px', textAlign: 'left'
                        }}
                    >
                        <span style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${reason === r ? '#3b82f6' : '#555'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {reason === r && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} />}
                        </span>
                        {r}
                    </button>
                ))}
            </div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#b0b3c6' }}>
                O escribe un motivo personalizado
            </label>
            <input
                type="text"
                value={reasons.includes(reason) ? '' : reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motivo personalizado..."
                style={{
                    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', padding: '10px', color: '#e0e0e0', fontSize: '13px', outline: 'none'
                }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '14px', justifyContent: 'flex-end' }}>
                <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#b0b3c6', cursor: 'pointer', fontSize: '13px' }}>Cancelar</button>
                <button
                    onClick={() => reason && onClose(reason)}
                    disabled={!reason}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: reason ? '#ef4444' : '#374151', color: 'white', cursor: reason ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: 600 }}
                >Cerrar Conversación</button>
            </div>
        </div>
    );
}

// ─── Supervisor Panel Component ──────────────────────────────
function SupervisorPanel({ data, onRefresh }) {
    if (!data) return <div style={{ padding: '24px', textAlign: 'center', color: '#8b8fa3' }}><Loader2 size={24} className="animate-spin" /> Cargando...</div>;

    const getStatusDot = (status) => {
        const colors = { online: '#22c55e', busy: '#f59e0b', away: '#eab308', offline: '#ef4444' };
        return <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: colors[status] || '#6b7280' }} />;
    };

    return (
        <div style={{ padding: '16px' }}>
            {/* Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                    { label: 'Chats Activos', value: data.metrics.activeConversations, color: '#3b82f6' },
                    { label: 'En Bot', value: data.metrics.botConversations, color: '#a855f7' },
                    { label: 'En Cola', value: data.metrics.queueCount, color: '#f59e0b' },
                    { label: 'Cerrados Hoy', value: data.metrics.closedToday, color: '#22c55e' },
                ].map((m, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: m.color }}>{m.value}</div>
                        <div style={{ fontSize: '11px', color: '#8b8fa3', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{m.label}</div>
                    </div>
                ))}
            </div>

            {/* Agents Table */}
            <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#e0e0e0', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={16} /> Asesores
                </div>
                <div style={{ borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                                <th style={{ padding: '10px 14px', textAlign: 'left', color: '#8b8fa3', fontWeight: 600 }}>Asesor</th>
                                <th style={{ padding: '10px 14px', textAlign: 'center', color: '#8b8fa3', fontWeight: 600 }}>Estado</th>
                                <th style={{ padding: '10px 14px', textAlign: 'center', color: '#8b8fa3', fontWeight: 600 }}>Chats</th>
                                <th style={{ padding: '10px 14px', textAlign: 'center', color: '#8b8fa3', fontWeight: 600 }}>Resueltos Hoy</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.agents.map(agent => (
                                <tr key={agent.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '10px 14px', color: '#e0e0e0' }}>{agent.name}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                        {getStatusDot(agent.status)}
                                        <span style={{ marginLeft: '4px', fontSize: '11px', textTransform: 'uppercase', color: '#b0b3c6' }}>{agent.status}</span>
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: agent.activeChats >= agent.maxChats ? '#ef4444' : '#e0e0e0' }}>
                                        {agent.activeChats}/{agent.maxChats}
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#22c55e' }}>{agent.resolvedToday}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Queue */}
            {data.queue.count > 0 && (
                <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={16} /> Cola de Espera ({data.queue.count})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {data.queue.items.map(item => (
                            <div key={item.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '10px 14px', borderRadius: '8px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)'
                            }}>
                                <div>
                                    <span style={{ color: '#e0e0e0', fontSize: '13px', fontWeight: 600 }}>{item.contactName}</span>
                                    <span style={{ color: '#8b8fa3', fontSize: '11px', marginLeft: '8px' }}>{item.channel}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: item.waitingMinutes > 5 ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>
                                    {item.waitingTime}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                <button onClick={onRefresh} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#b0b3c6', cursor: 'pointer', fontSize: '13px' }}>
                    <RefreshCw size={14} /> Actualizar
                </button>
            </div>
        </div>
    );
}

// ─── Agent Status Custom Dropdown ────────────────────────────
function AgentStatusDropdown({ status, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const statuses = [
        { value: 'online', label: 'Online', color: '#10b981' },
        { value: 'busy', label: 'Ocupado', color: '#f59e0b' },
        { value: 'away', label: 'Ausente', color: '#eab308' },
        { value: 'offline', label: 'Offline', color: '#ef4444' }
    ];

    const currentStatus = statuses.find(s => s.value === status) || statuses[3];

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: '#ffffff',
                    border: '1px solid #E2E8F0',
                    borderRadius: '20px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease',
                    fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px',
                    color: '#1E293B'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                    e.currentTarget.style.borderColor = 'rgba(0, 71, 151, 0.3)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                    e.currentTarget.style.borderColor = '#E2E8F0';
                }}
            >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: currentStatus.color, boxShadow: `0 0 8px ${currentStatus.color}` }} />
                <span style={{ color: currentStatus.color }}>{currentStatus.label}</span>
            </button>
            {isOpen && (
                <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                    background: '#ffffff', borderRadius: '12px', border: '1px solid #E2E8F0',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden', minWidth: '140px',
                    zIndex: 100, animation: 'fadeInDown 0.15s ease', padding: '6px'
                }}>
                    {statuses.map(s => (
                        <button
                            key={s.value}
                            onClick={() => { onChange(s.value); setIsOpen(false); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                width: '100%', padding: '10px 14px', border: 'none', background: 'transparent',
                                cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#1E293B',
                                textAlign: 'left', transition: 'all 0.15s ease', borderRadius: '8px'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = '#F8FAFC';
                                e.currentTarget.style.color = s.color;
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#1E293B';
                            }}
                        >
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
                            {s.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function InboxIndexWrapper() {
    return (
        <ErrorBoundary>
            <InboxIndex />
        </ErrorBoundary>
    );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════
function InboxIndex() {
    const [conversations, setConversations] = useState([]);
    const [activeConv, setActiveConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [contactProfile, setContactProfile] = useState(null);
    const [filter, setFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('open');
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [showCannedDropdown, setShowCannedDropdown] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const [toast, setToast] = useState(null);

    // Enterprise state
    const [agentStatus, setAgentStatus] = useState('offline');
    const [agentActiveChats, setAgentActiveChats] = useState(0);
    const [agentMaxChats, setAgentMaxChats] = useState(5);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [availableAgents, setAvailableAgents] = useState([]);
    const [supervisorData, setSupervisorData] = useState(null);
    const [showSupervisorPanel, setShowSupervisorPanel] = useState(false);

    const messagesEndRef = useRef(null);
    const searchTimeoutRef = useRef(null);
    const actionsMenuRef = useRef(null);
    const pollingRef = useRef(null);
    const activeConvRef = useRef(null);

    // ─── Mantener ref sincronizada con activeConv ──────────────
    useEffect(() => {
        activeConvRef.current = activeConv;
    }, [activeConv]);

    // ─── Efecto inicial ───────────────────────────────────────
    useEffect(() => {
        fetchConversations();
        fetchAgentStatus();

        // Escuchar eventos de broadcasting
        if (window.Echo) {
            window.Echo.private('novape-inbox')
                .listen('.conversation.updated', (e) => {
                    updateConversationInList(e.conversationData);
                })
                .listen('.message.received', (e) => {
                    handleNewMessage(e.messageData);
                })
                .listen('.message.status.updated', (e) => {
                    handleMessageStatusUpdate(e.statusData);
                });
        }

        // ─── Polling fallback (cada 8s) ───────────────────────
        pollingRef.current = setInterval(() => {
            fetchConversationsSilent();
            // Si hay una conversación activa, refrescar sus mensajes
            if (activeConvRef.current) {
                fetchMessagesSilent(activeConvRef.current.id);
            }
        }, 8000);

        return () => {
            if (window.Echo) {
                window.Echo.leave('novape-inbox');
            }
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, []);

    // ─── Refetch al cambiar filtro o estado ────────────────────
    useEffect(() => {
        setActiveConv(null);
        setMessages([]);
        setContactProfile(null);
        setIsMobileChatOpen(false);
        fetchConversations();
    }, [filter, statusFilter]);

    // ─── Búsqueda con debounce ────────────────────────────────
    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            fetchConversations();
        }, 400);
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [searchQuery]);

    // ─── Cerrar menú de acciones con click fuera ──────────────
    useEffect(() => {
        const handler = (e) => {
            if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target)) {
                setShowActionsMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ─── Fetch conversaciones ─────────────────────────────────
    const fetchConversations = async () => {
        setIsLoadingConversations(true);
        try {
            const params = new URLSearchParams();
            if (filter !== 'all') params.append('channel', filter);
            if (searchQuery) params.append('search', searchQuery);
            params.append('status', statusFilter);
            const res = await fetch(`/admin/api/omnichannel/conversations?${params}`);
            if (!res.ok) throw new Error('Error al cargar conversaciones');
            const data = await res.json();
            setConversations(data.data || []);
        } catch (error) {
            console.error('Error fetching conversations:', error);
            showToast('Error al cargar conversaciones', 'error');
        } finally {
            setIsLoadingConversations(false);
        }
    };

    // ─── Fetch conversaciones silencioso (polling) ────────────
    const fetchConversationsSilent = async () => {
        try {
            const params = new URLSearchParams();
            if (filter !== 'all') params.append('channel', filter);
            if (searchQuery) params.append('search', searchQuery);
            params.append('status', statusFilter);
            const res = await fetch(`/admin/api/omnichannel/conversations?${params}`);
            if (!res.ok) return;
            const data = await res.json();
            setConversations(data.data || []);
        } catch (error) {
            // Silencioso: no mostrar toast en polling
            console.warn('Polling conversations failed:', error);
        }
    };

    // ─── Fetch mensajes ───────────────────────────────────────
    const fetchMessages = async (convId) => {
        try {
            const res = await fetch(`/admin/api/omnichannel/conversations/${convId}/messages`);
            if (!res.ok) throw new Error('Error al cargar mensajes');
            const data = await res.json();
            setMessages(data.data || []);
            scrollToBottom();
        } catch (error) {
            console.error('Error fetching messages:', error);
            showToast('Error al cargar mensajes', 'error');
        } finally {
            setIsLoadingChat(false);
        }
    };

    // ─── Fetch mensajes silencioso (polling) ──────────────────
    const fetchMessagesSilent = async (convId) => {
        try {
            const res = await fetch(`/admin/api/omnichannel/conversations/${convId}/messages`);
            if (!res.ok) return;
            const data = await res.json();
            const newMsgs = data.data || [];
            setMessages(prev => {
                if (newMsgs.length !== prev.length) {
                    // Hay mensajes nuevos, actualizar y hacer scroll
                    setTimeout(() => scrollToBottom(), 100);
                    return newMsgs;
                }
                return prev;
            });
        } catch (error) {
            console.warn('Polling messages failed:', error);
        }
    };

    // ─── Fetch perfil contacto ────────────────────────────────
    const fetchContactProfile = async (convId) => {
        try {
            const res = await fetch(`/admin/api/omnichannel/conversations/${convId}/contact-profile`);
            if (!res.ok) throw new Error('Error al cargar perfil');
            const data = await res.json();
            setContactProfile(data);
        } catch (error) {
            console.error('Error fetching contact profile:', error);
        }
    };

    // ─── Seleccionar conversación ─────────────────────────────
    const handleSelectConversation = (conv) => {
        if (activeConv?.id === conv.id) return;

        setActiveConv(conv);
        setIsMobileChatOpen(true);
        setIsLoadingChat(true);
        setContactProfile(null);
        setShowActionsMenu(false);

        fetchMessages(conv.id);
        fetchContactProfile(conv.id);

        setConversations(prev => prev.map(c =>
            c.id === conv.id ? { ...c, unreadCount: 0 } : c
        ));
    };

    // ─── Eventos de broadcasting ──────────────────────────────
    const handleNewMessage = useCallback((msg) => {
        // Actualizar mensajes si la conversación está activa
        setActiveConv(current => {
            if (current && msg.conversation_id === current.id) {
                setMessages(prev => {
                    // Evitar duplicados
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
                scrollToBottom();
            }
            return current;
        });
    }, []);

    const handleMessageStatusUpdate = useCallback((statusData) => {
        setMessages(prev => prev.map(m =>
            m.id === statusData.id ? { ...m, status: statusData.status } : m
        ));
    }, []);

    const updateConversationInList = useCallback((updatedConv) => {
        setConversations(prev => {
            const exists = prev.find(c => c.id === updatedConv.id);
            if (exists) {
                return prev.map(c => c.id === updatedConv.id ? { ...updatedConv, unreadCount: updatedConv.unreadCount } : c)
                    .sort((a, b) => (b.lastMessageTime || '').localeCompare(a.lastMessageTime || ''));
            }
            return [updatedConv, ...prev];
        });

        setActiveConv(current => {
            if (current && current.id === updatedConv.id) {
                return { ...current, ...updatedConv };
            }
            return current;
        });
    }, []);

    // ─── Enviar mensaje ───────────────────────────────────────
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !activeConv || isSending) return;

        const content = messageInput;
        setMessageInput('');
        setIsSending(true);

        const tempMsg = {
            id: 'temp-' + Date.now(),
            direction: 'outbound',
            messageType: 'text',
            content: content,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            date_formatted: 'Hoy',
            status: 'queued',
            isInternalNote: false,
            isAiGenerated: false,
        };
        setMessages(prev => [...prev, tempMsg]);
        scrollToBottom();

        try {
            const res = await fetch(`/admin/api/omnichannel/conversations/${activeConv.id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
                },
                body: JSON.stringify({ content })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `Error ${res.status}`);
            }

            const data = await res.json();

            if (data.success) {
                setMessages(prev => prev.map(m => m.id === tempMsg.id ? data.message : m));
            } else {
                throw new Error('No se pudo enviar el mensaje');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            showToast(`Error al enviar: ${error.message}`, 'error');
            // Marcar el mensaje temporal como fallido
            setMessages(prev => prev.map(m =>
                m.id === tempMsg.id ? { ...m, status: 'failed' } : m
            ));
        } finally {
            setIsSending(false);
        }
    };

    // ─── Acciones de conversación ─────────────────────────────
    const handleResolve = async () => {
        if (!activeConv) return;
        try {
            const res = await fetch(`/admin/api/omnichannel/conversations/${activeConv.id}/resolve`, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '' }
            });
            if (res.ok) {
                showToast('Conversación marcada como resuelta', 'success');
                setShowActionsMenu(false);
            }
        } catch (error) {
            showToast('Error al resolver conversación', 'error');
        }
    };

    const handleReopen = async () => {
        if (!activeConv) return;
        try {
            const res = await fetch(`/admin/api/omnichannel/conversations/${activeConv.id}/reopen`, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '' }
            });
            if (res.ok) {
                showToast('Conversación reabierta', 'success');
                setShowActionsMenu(false);
            }
        } catch (error) {
            showToast('Error al reabrir conversación', 'error');
        }
    };

    const handleTransferToBot = async () => {
        if (!activeConv) return;
        try {
            const res = await fetch(`/admin/api/omnichannel/conversations/${activeConv.id}/transfer-to-bot`, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '' }
            });
            if (res.ok) {
                showToast('Transferido al asistente IA', 'success');
                setShowActionsMenu(false);
            }
        } catch (error) {
            showToast('Error al transferir al bot', 'error');
        }
    };

    const handleAddNote = async () => {
        const note = prompt('Escribe una nota interna:');
        if (!note?.trim()) return;
        try {
            const res = await fetch(`/admin/api/omnichannel/conversations/${activeConv.id}/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
                },
                body: JSON.stringify({ content: note })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setMessages(prev => [...prev, data.message]);
                    scrollToBottom();
                    showToast('Nota interna añadida', 'success');
                }
            }
        } catch (error) {
            showToast('Error al añadir nota', 'error');
        }
        setShowActionsMenu(false);
    };

    // ─── Enterprise handlers ─────────────────────────────────
    const fetchAgentStatus = async () => {
        try {
            const res = await fetch('/admin/api/omnichannel/agent-status');
            if (res.ok) {
                const data = await res.json();
                setAgentStatus(data.status);
                setAgentActiveChats(data.activeChats);
                setAgentMaxChats(data.maxChats);
            }
        } catch (e) { console.warn('Error fetching agent status:', e); }
    };

    const handleChangeAgentStatus = async (newStatus) => {
        try {
            const res = await fetch('/admin/api/omnichannel/agent-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                setAgentStatus(newStatus);
                showToast(`Estado cambiado a ${newStatus.toUpperCase()}`, 'success');
            }
        } catch (e) { showToast('Error al cambiar estado', 'error'); }
    };

    const handleTransfer = async (toUserId, reason) => {
        if (!activeConv) return;
        try {
            const res = await fetch(`/admin/api/omnichannel/conversations/${activeConv.id}/transfer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
                },
                body: JSON.stringify({ to_user_id: toUserId, reason })
            });
            if (res.ok) {
                showToast('Conversación transferida exitosamente', 'success');
                setShowTransferModal(false);
                setShowActionsMenu(false);
                fetchConversations();
                fetchAgentStatus();
            }
        } catch (e) { showToast('Error al transferir conversación', 'error'); }
    };

    const handleCloseWithReason = async (reason) => {
        if (!activeConv) return;
        try {
            const res = await fetch(`/admin/api/omnichannel/conversations/${activeConv.id}/close`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
                },
                body: JSON.stringify({ reason })
            });
            if (res.ok) {
                showToast('Conversación cerrada', 'success');
                setShowCloseModal(false);
                setShowActionsMenu(false);
                fetchConversations();
                fetchAgentStatus();
            }
        } catch (e) { showToast('Error al cerrar conversación', 'error'); }
    };

    const fetchAvailableAgents = async () => {
        try {
            const res = await fetch('/admin/api/omnichannel/available-agents');
            if (res.ok) {
                const data = await res.json();
                setAvailableAgents(data);
            }
        } catch (e) { console.warn('Error fetching agents:', e); }
    };

    const fetchSupervisorDashboard = async () => {
        try {
            const res = await fetch('/admin/api/omnichannel/supervisor/dashboard');
            if (res.ok) {
                const data = await res.json();
                setSupervisorData(data);
            }
        } catch (e) { console.warn('Error fetching supervisor data:', e); }
    };

    const openTransferModal = () => {
        fetchAvailableAgents();
        setShowTransferModal(true);
        setShowActionsMenu(false);
    };

    const openCloseModal = () => {
        setShowCloseModal(true);
        setShowActionsMenu(false);
    };

    const openSupervisorPanel = () => {
        fetchSupervisorDashboard();
        setShowSupervisorPanel(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'online': return '#22c55e';
            case 'busy': return '#f59e0b';
            case 'away': return '#eab308';
            case 'offline': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getPriorityBadge = (priority) => {
        const map = {
            urgent: { label: 'URGENTE', color: '#ef4444' },
            high: { label: 'ALTA', color: '#f97316' },
            normal: { label: 'NORMAL', color: '#6b7280' },
            low: { label: 'BAJA', color: '#22c55e' },
        };
        return map[priority] || map.normal;
    };

    // ─── Helpers ──────────────────────────────────────────────
    const showToast = (message, type = 'error') => {
        setToast({ message, type });
    };

    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 50);
        });
    };

    const renderChannelIcon = (channel) => {
        switch (channel) {
            case 'whatsapp': return <div className="channel-icon-wa"><WhatsAppIcon /></div>;
            case 'messenger': return <div className="channel-icon-msn"><MessengerIcon /></div>;
            case 'instagram': return <div className="channel-icon-ig"><InstagramIcon /></div>;
            case 'web': return <div className="channel-icon-web"><Bot size={14} /></div>;
            default: return <MessageSquare size={14} />;
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'read': return <CheckCheck size={12} className="inbox-status-read" />;
            case 'delivered': return <CheckCheck size={12} className="inbox-status-delivered" />;
            case 'sent': return <Check size={12} className="inbox-status-sent" />;
            case 'failed': return <AlertCircle size={10} className="inbox-status-failed" />;
            default: return <Clock size={10} className="inbox-status-queued" />;
        }
    };

    // Agrupar mensajes por fecha
    const groupedMessages = messages.reduce((groups, message) => {
        const date = message.date_formatted || 'Desconocido';
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(message);
        return groups;
    }, {});

    // ═══════════════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════════════
    return (
        <TwentyCrmLayout title="Omnicanal CRM">
            <div className={`inbox-root ${isMobileChatOpen ? 'chat-open' : ''}`} style={{ height: '100%', width: '100%', position: 'relative' }}>
                <Head title="Omnicanal CRM" />

                {/* Toast de notificaciones */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* ─── COLUMNA 1: LISTA DE CHATS ─── */}
            <div className="inbox-sidebar">
                <div className="inbox-sidebar__header">
                    <div className="inbox-sidebar__title">
                        Mensajes
                        <span style={{ fontSize: '11px', opacity: 0.7, marginLeft: '6px' }}>{agentActiveChats}/{agentMaxChats}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {/* Agent Status Selector */}
                        <AgentStatusDropdown status={agentStatus} onChange={handleChangeAgentStatus} />
                        <button className="inbox-sidebar__refresh-btn" onClick={openSupervisorPanel} title="Supervisor Dashboard">
                            <Activity size={16} />
                        </button>
                        <button className="inbox-sidebar__refresh-btn" onClick={fetchConversations} title="Actualizar">
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>

                <div className="inbox-sidebar__tabs">
                    <button 
                        className={`inbox-tab-btn ${statusFilter === 'open' ? 'active' : ''}`} 
                        onClick={() => setStatusFilter('open')}
                    >
                        Abiertos
                    </button>
                    <button 
                        className={`inbox-tab-btn ${statusFilter === 'closed' ? 'active' : ''}`} 
                        onClick={() => setStatusFilter('closed')}
                    >
                        Cerrados
                    </button>
                </div>

                <div className="inbox-sidebar__search">
                    <Search size={16} className="inbox-sidebar__search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar cliente o número..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="inbox-sidebar__filters">
                    <button className={`inbox-filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                        Todos
                    </button>
                    <button className={`inbox-filter-btn ${filter === 'whatsapp' ? 'active' : ''}`} onClick={() => setFilter('whatsapp')}>
                        <WhatsAppIcon /> WA
                    </button>
                    <button className={`inbox-filter-btn ${filter === 'messenger' ? 'active' : ''}`} onClick={() => setFilter('messenger')}>
                        <MessengerIcon /> MSN
                    </button>
                    <button className={`inbox-filter-btn ${filter === 'instagram' ? 'active' : ''}`} onClick={() => setFilter('instagram')}>
                        <InstagramIcon /> IG
                    </button>
                    <button className={`inbox-filter-btn ${filter === 'web' ? 'active' : ''}`} onClick={() => setFilter('web')}>
                        <Bot size={14} /> Web
                    </button>
                </div>

                <div className="inbox-sidebar__list inbox-scrollable">
                    {isLoadingConversations ? (
                        <ConversationsSkeleton />
                    ) : conversations.length === 0 ? (
                        <div className="inbox-empty-list">
                            <MessageSquare size={32} />
                            <span>No hay conversaciones{filter !== 'all' ? ` en ${filter}` : ''}</span>
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <div
                                key={conv.id}
                                className={`inbox-conversation-item ${activeConv?.id === conv.id ? 'active' : ''} ${['resolved', 'closed'].includes(conv.status) ? 'resolved' : ''}`}
                                onClick={() => handleSelectConversation(conv)}
                            >
                                <div className="inbox-conv__avatar">
                                    {conv.initials}
                                    <div className="inbox-conv__channel-icon">
                                        {renderChannelIcon(conv.channel)}
                                    </div>
                                </div>
                                <div className="inbox-conv__info">
                                    <div className="inbox-conv__name">
                                        {conv.contactName}
                                        {conv.priority && conv.priority !== 'normal' && (
                                            <span style={{
                                                display: 'inline-block',
                                                fontSize: '9px',
                                                fontWeight: 700,
                                                padding: '1px 5px',
                                                borderRadius: '4px',
                                                marginLeft: '6px',
                                                background: getPriorityBadge(conv.priority).color + '22',
                                                color: getPriorityBadge(conv.priority).color,
                                                verticalAlign: 'middle'
                                            }}>
                                                {getPriorityBadge(conv.priority).label}
                                            </span>
                                        )}
                                    </div>
                                    <div className="inbox-conv__preview">
                                        {conv.isBotActive && <Bot size={12} className="inline mr-1 opacity-70" />}
                                        {conv.status === 'waiting' && <Timer size={12} className="inline mr-1" style={{ color: '#f59e0b' }} />}
                                        {conv.lastMessagePreview || 'Sin mensajes'}
                                    </div>
                                    {conv.agentName && (
                                        <div style={{ fontSize: '10px', color: '#8b8fa3', marginTop: '2px' }}>
                                            <User size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                                            {conv.agentName}
                                        </div>
                                    )}
                                </div>
                                <div className="inbox-conv__meta">
                                    <div className="inbox-conv__time">{conv.lastMessageTime || conv.lastMessageDate}</div>
                                    {conv.unreadCount > 0 && (
                                        <div className="inbox-conv__badge">{conv.unreadCount}</div>
                                    )}
                                    {conv.status === 'waiting' && (
                                        <div className="inbox-conv__badge" style={{ background: '#f59e0b' }}>⏳</div>
                                    )}
                                    {['resolved', 'closed'].includes(conv.status) && (
                                        <div className="inbox-conv__resolved-badge"><CheckCircle2 size={10} /></div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ─── COLUMNA 2: CHAT ACTIVO ─── */}
            <div className="inbox-chat">
                {activeConv ? (
                    <>
                        <div className="inbox-chat__header">
                            <div className="inbox-chat__header-info">
                                <button className="inbox-chat__mobile-back" onClick={() => setIsMobileChatOpen(false)}>
                                    <ChevronLeft size={24} />
                                </button>
                                <div>
                                    <div className="inbox-chat__header-name">{activeConv.contactName}</div>
                                    <div className="inbox-chat__header-channel">
                                        {activeConv.isBotActive ? (
                                            <span className="inbox-bot-badge bot-active"><Bot size={12}/> Asistente IA</span>
                                        ) : ['resolved', 'closed'].includes(activeConv.status) ? (
                                            <span className="inbox-bot-badge resolved-badge"><CheckCircle2 size={12}/> {activeConv.status === 'closed' ? 'Cerrado' : 'Resuelto'}</span>
                                        ) : (
                                            <span className="inbox-bot-badge human-active"><User size={12}/> Agente</span>
                                        )}
                                        {activeConv.phone && <span>• {activeConv.phone}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="inbox-chat__header-actions">
                                {!['resolved', 'closed'].includes(activeConv.status) ? (
                                    <button className="inbox-chat__header-btn resolve" onClick={handleResolve} title="Marcar como Resuelto">
                                        <CheckCircle2 size={16} /> Resolver
                                    </button>
                                ) : (
                                    <button className="inbox-chat__header-btn reopen" onClick={handleReopen} title="Reabrir">
                                        <RefreshCw size={16} /> Reabrir
                                    </button>
                                )}
                                <div className="inbox-actions-wrapper" ref={actionsMenuRef}>
                                    <button
                                        className="inbox-chat__header-btn"
                                        onClick={() => setShowActionsMenu(!showActionsMenu)}
                                        title="Más opciones"
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                    {showActionsMenu && (
                                        <div className="inbox-actions-menu">
                                            <button onClick={handleAddNote}>
                                                <StickyNote size={14} /> Añadir Nota Interna
                                            </button>
                                            <button onClick={openTransferModal}>
                                                <PhoneForwarded size={14} /> Transferir a Asesor
                                            </button>
                                            {!activeConv.isBotActive && (
                                                <button onClick={handleTransferToBot}>
                                                    <Bot size={14} /> Transferir a IA
                                                </button>
                                            )}
                                            <button onClick={openCloseModal} style={{ color: '#ef4444' }}>
                                                <XCircle size={14} /> Cerrar Conversación
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="inbox-chat__messages inbox-scrollable">
                            {isLoadingChat ? (
                                <div className="inbox-chat__loading">
                                    <Loader2 size={28} className="animate-spin" />
                                    <span>Cargando mensajes...</span>
                                </div>
                            ) : (
                                Object.keys(groupedMessages).map((date) => (
                                    <div key={date}>
                                        <div className="inbox-date-divider">
                                            <span>{date}</span>
                                        </div>
                                        <div className="inbox-messages-group">
                                            {groupedMessages[date].map((msg, idx) => (
                                                <div key={msg.id || idx} className={`inbox-message ${msg.direction} ${msg.isInternalNote ? 'internal-note' : ''} ${msg.status === 'failed' ? 'failed' : ''}`}>
                                                    <MediaPreview mediaUrl={msg.mediaUrl} mediaMimeType={msg.mediaMimeType} />
                                                    <div className="inbox-message__content">{msg.content}</div>
                                                    <div className="inbox-message__footer">
                                                        <div>
                                                            {msg.isAiGenerated && <span className="inbox-message__ai-badge">🤖 IA</span>}
                                                        </div>
                                                        <div className="inbox-message__time">
                                                            {msg.time}
                                                            {msg.direction === 'outbound' && !msg.isInternalNote && getStatusIcon(msg.status)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input de mensaje */}
                        <div className="inbox-chat__input-wrapper">
                            {showCannedDropdown && (
                                <CannedResponsesDropdown
                                    onSelect={(content) => setMessageInput(prev => prev + content)}
                                    onClose={() => setShowCannedDropdown(false)}
                                />
                            )}
                            <form onSubmit={handleSendMessage} className="inbox-chat__input">
                                <button
                                    type="button"
                                    className="inbox-chat__input-btn"
                                    onClick={() => setShowCannedDropdown(!showCannedDropdown)}
                                    title="Respuestas rápidas"
                                >
                                    <Zap size={20} />
                                </button>
                                <button type="button" className="inbox-chat__input-btn" title="Adjuntar archivo">
                                    <Paperclip size={20} />
                                </button>
                                <textarea
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder={['resolved', 'closed'].includes(activeConv.status) ? 'La conversación ha finalizado' : 'Escribe un mensaje...'}
                                    rows="1"
                                    disabled={['resolved', 'closed'].includes(activeConv.status)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                    }}
                                />
                                <button
                                    type="submit"
                                    className="inbox-chat__send-btn"
                                    disabled={!messageInput.trim() || isSending || ['resolved', 'closed'].includes(activeConv.status)}
                                >
                                    {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                    <span className="inbox-chat__send-text">Enviar</span>
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="inbox-empty-state">
                        <Inbox />
                        <p>Bandeja Omnicanal</p>
                        <span>Selecciona una conversación del panel izquierdo para ver el historial y responder.</span>
                    </div>
                )}
            </div>

            {/* ─── COLUMNA 3: PERFIL DEL CLIENTE ─── */}
            <div className="inbox-detail inbox-scrollable">
                {contactProfile ? (
                    <>
                        <div className="inbox-detail__header">
                            <div className="inbox-detail__avatar">
                                {activeConv?.initials}
                            </div>
                            <div className="inbox-detail__name">{contactProfile.contact.name}</div>
                            {contactProfile.contact.phone && (
                                <div className="inbox-detail__phone">{contactProfile.contact.phone}</div>
                            )}
                            {contactProfile.contact.email && (
                                <div className="inbox-detail__email">{contactProfile.contact.email}</div>
                            )}
                        </div>

                        <div className="inbox-detail__section">
                            <div className="inbox-detail__section-title">Detalles del Contacto</div>
                            <div className="inbox-detail__info-row">
                                <span className="inbox-detail__info-label">Primera Vez</span>
                                <span className="inbox-detail__info-value">{contactProfile.contact.firstInteraction || 'N/A'}</span>
                            </div>
                            <div className="inbox-detail__info-row">
                                <span className="inbox-detail__info-label">Última Interacción</span>
                                <span className="inbox-detail__info-value">{contactProfile.contact.lastInteraction || 'N/A'}</span>
                            </div>
                            {contactProfile.stats && (
                                <>
                                    <div className="inbox-detail__info-row">
                                        <span className="inbox-detail__info-label">Total Conversaciones</span>
                                        <span className="inbox-detail__info-value">{contactProfile.stats.totalConversations}</span>
                                    </div>
                                    <div className="inbox-detail__info-row">
                                        <span className="inbox-detail__info-label">Total Mensajes</span>
                                        <span className="inbox-detail__info-value">{contactProfile.stats.totalMessages}</span>
                                    </div>
                                </>
                            )}
                            {contactProfile.contact.metadata?.dni && (
                                <div className="inbox-detail__info-row">
                                    <span className="inbox-detail__info-label">DNI</span>
                                    <span className="inbox-detail__info-value">{contactProfile.contact.metadata.dni}</span>
                                </div>
                            )}
                            {contactProfile.conversation?.subject && (
                                <div className="inbox-detail__info-row">
                                    <span className="inbox-detail__info-label">Motivo</span>
                                    <span className="inbox-detail__info-value font-semibold text-blue-600">{contactProfile.conversation.subject}</span>
                                </div>
                            )}
                            {contactProfile.activeCase && (
                                <div className="inbox-detail__info-row" style={{ marginTop: '12px' }}>
                                    <a 
                                        href={`/admin/crm/cases/${contactProfile.activeCase.id}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            background: 'var(--twenty-primary)',
                                            color: 'white',
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            textDecoration: 'none',
                                            width: '100%',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <Ticket size={16} />
                                        Ver Caso Asociado (#{contactProfile.activeCase.id})
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="inbox-detail__section">
                            <div className="inbox-detail__section-title">Último Pedido (Novape)</div>
                            {contactProfile.lastOrder ? (
                                <div className="inbox-detail__order-card">
                                    <div className="flex justify-between items-start">
                                        <div className="inbox-detail__order-code">#{contactProfile.lastOrder.codigo}</div>
                                        <div className="inbox-detail__order-status">{contactProfile.lastOrder.estado}</div>
                                    </div>
                                    <div className="inbox-detail__order-total">S/ {contactProfile.lastOrder.total}</div>
                                </div>
                            ) : (
                                <div className="inbox-detail__no-order">
                                    El cliente no tiene compras recientes.
                                </div>
                            )}
                        </div>

                        {contactProfile.contact.notes && (
                            <div className="inbox-detail__section">
                                <div className="inbox-detail__section-title">Notas</div>
                                <div className="inbox-detail__notes">{contactProfile.contact.notes}</div>
                            </div>
                        )}
                    </>
                ) : activeConv ? (
                    <ProfileSkeleton />
                ) : (
                    <div className="inbox-detail__empty">
                        <User size={48} />
                        <span>El perfil del cliente aparecerá aquí</span>
                    </div>
                )}
            </div>

            {/* ─── MODAL: TRANSFERIR CONVERSACIÓN ─── */}
            {showTransferModal && (
                <div className="inbox-modal-overlay" onClick={() => setShowTransferModal(false)}>
                    <div className="inbox-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="inbox-modal__header">
                            <PhoneForwarded size={18} />
                            <span>Transferir Conversación</span>
                            <button onClick={() => setShowTransferModal(false)}><X size={18} /></button>
                        </div>
                        <TransferForm agents={availableAgents} onTransfer={handleTransfer} onCancel={() => setShowTransferModal(false)} />
                    </div>
                </div>
            )}

            {/* ─── MODAL: CERRAR CON MOTIVO ─── */}
            {showCloseModal && (
                <div className="inbox-modal-overlay" onClick={() => setShowCloseModal(false)}>
                    <div className="inbox-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="inbox-modal__header">
                            <XCircle size={18} />
                            <span>Cerrar Conversación</span>
                            <button onClick={() => setShowCloseModal(false)}><X size={18} /></button>
                        </div>
                        <CloseReasonForm onClose={handleCloseWithReason} onCancel={() => setShowCloseModal(false)} />
                    </div>
                </div>
            )}

            {/* ─── MODAL: SUPERVISOR DASHBOARD ─── */}
            {showSupervisorPanel && (
                <div className="inbox-modal-overlay" onClick={() => setShowSupervisorPanel(false)}>
                    <div className="inbox-modal inbox-modal--wide" onClick={(e) => e.stopPropagation()}>
                        <div className="inbox-modal__header">
                            <Activity size={18} />
                            <span>Panel del Supervisor</span>
                            <button onClick={() => setShowSupervisorPanel(false)}><X size={18} /></button>
                        </div>
                        <SupervisorPanel data={supervisorData} onRefresh={fetchSupervisorDashboard} />
                    </div>
                </div>
            )}
        </div>
        </TwentyCrmLayout>
    );
}
