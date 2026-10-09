import { csrfFetch } from '../../../utils/csrfFetch';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
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
import '../../../../css/admin/omni-workspace.css';
import { InboxRail, InboxTopbar, InboxWelcome, inboxViews } from '../../../Components/Admin/InboxWorkspaceChrome';
import useDialog from '../../../Components/Admin/useDialog';

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
            const res = await csrfFetch('/admin/api/omnichannel/canned-responses');
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
        const colors = { online: '#10b981', busy: '#f59e0b', away: '#eab308', offline: '#ef4444' };
        return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: colors[status] || '#9ca3af', marginRight: 8, boxShadow: `0 0 0 2px rgba(255,255,255,0.8)` }} />;
    };

    return (
        <div style={{ padding: '20px 24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: '#4B5563' }}>
                Seleccionar Asesor
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto', marginBottom: '16px', paddingRight: '4px' }}>
                {agents.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px', background: '#F9FAFB', borderRadius: '8px', border: '1px dashed #E5E7EB' }}>No hay asesores disponibles</div>
                ) : agents.map(agent => (
                    <button
                        key={agent.id}
                        onClick={() => setSelectedAgent(agent.id)}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 14px', borderRadius: '8px', border: selectedAgent === agent.id ? '1px solid #004797' : '1px solid #E5E7EB', cursor: 'pointer',
                            background: selectedAgent === agent.id ? '#F0F7FF' : '#ffffff',
                            color: '#111827', fontSize: '14px', textAlign: 'left',
                            transition: 'all 0.2s', boxShadow: selectedAgent === agent.id ? '0 2px 8px rgba(0,71,151,0.05)' : 'none'
                        }}
                    >
                        <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>{getStatusDot(agent.status)} {agent.name}</span>
                        <span style={{ fontSize: '12px', color: selectedAgent === agent.id ? '#004797' : '#6B7280', fontWeight: 600, background: selectedAgent === agent.id ? '#ffffff' : '#F3F4F6', padding: '2px 8px', borderRadius: '12px' }}>{agent.activeChats}/{agent.maxChats} chats</span>
                    </button>
                ))}
            </div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#4B5563' }}>
                Motivo (opcional)
            </label>
            <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Explica brevemente el motivo de la transferencia..."
                style={{
                    width: '100%', background: '#ffffff', border: '1px solid #D1D5DB',
                    borderRadius: '8px', padding: '12px 14px', color: '#111827', fontSize: '14px', resize: 'none', outline: 'none',
                    transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#004797'}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', background: '#ffffff', color: '#374151', cursor: 'pointer', fontSize: '14px', fontWeight: 600, transition: 'background 0.2s' }} onMouseOver={e=>e.target.style.background='#F9FAFB'} onMouseOut={e=>e.target.style.background='#ffffff'}>Cancelar</button>
                <button
                    onClick={() => selectedAgent && onTransfer(selectedAgent, reason)}
                    disabled={!selectedAgent}
                    style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: selectedAgent ? '#004797' : '#E5E7EB', color: selectedAgent ? '#ffffff' : '#9CA3AF', cursor: selectedAgent ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: 600, transition: 'all 0.2s', boxShadow: selectedAgent ? '0 2px 4px rgba(0,71,151,0.1)' : 'none' }}
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
        <div style={{ padding: '20px 24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: '#4B5563' }}>
                Motivo del cierre
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {reasons.map(r => (
                    <button
                        key={r}
                        onClick={() => setReason(r)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '12px 14px', borderRadius: '8px', border: reason === r ? '1px solid #004797' : '1px solid #E5E7EB', cursor: 'pointer',
                            background: reason === r ? '#F0F7FF' : '#ffffff',
                            color: '#111827', fontSize: '14px', textAlign: 'left', fontWeight: reason === r ? 600 : 400,
                            transition: 'all 0.2s', boxShadow: reason === r ? '0 2px 4px rgba(0,71,151,0.05)' : 'none'
                        }}
                    >
                        <span style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${reason === r ? '#004797' : '#D1D5DB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
                            {reason === r && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#004797' }} />}
                        </span>
                        {r}
                    </button>
                ))}
            </div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#4B5563' }}>
                O escribe un motivo personalizado
            </label>
            <input
                type="text"
                value={reasons.includes(reason) ? '' : reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motivo personalizado..."
                style={{
                    width: '100%', background: '#ffffff', border: '1px solid #D1D5DB',
                    borderRadius: '8px', padding: '12px 14px', color: '#111827', fontSize: '14px', outline: 'none',
                    transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#004797'}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', background: '#ffffff', color: '#374151', cursor: 'pointer', fontSize: '14px', fontWeight: 600, transition: 'background 0.2s' }} onMouseOver={e=>e.target.style.background='#F9FAFB'} onMouseOut={e=>e.target.style.background='#ffffff'}>Cancelar</button>
                <button
                    onClick={() => reason && onClose(reason)}
                    disabled={!reason}
                    style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: reason ? '#DC2626' : '#E5E7EB', color: reason ? '#ffffff' : '#9CA3AF', cursor: reason ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: 600, transition: 'all 0.2s', boxShadow: reason ? '0 2px 4px rgba(220,38,38,0.2)' : 'none' }}
                >Cerrar Conversación</button>
            </div>
        </div>
    );
}

// ─── Supervisor Panel Component ──────────────────────────────
function SupervisorPanel({ data, onRefresh }) {
    if (!data) return <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280' }}><Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} /> Cargando datos...</div>;

    const getStatusDot = (status) => {
        const colors = { online: '#10b981', busy: '#f59e0b', away: '#eab308', offline: '#ef4444' };
        return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: colors[status] || '#9CA3AF' }} />;
    };

    return (
        <div style={{ padding: '24px' }}>
            {/* Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                    { label: 'Chats Activos', value: data.metrics.activeConversations, color: '#004797', bg: '#F0F7FF', border: '#D6E8FF' },
                    { label: 'En Bot', value: data.metrics.botConversations, color: '#7C3AED', bg: '#F5F3FF', border: '#EDE9FE' },
                    { label: 'En Cola', value: data.metrics.queueCount, color: '#D97706', bg: '#FFFBEB', border: '#FEF3C7' },
                    { label: 'Cerrados Hoy', value: data.metrics.closedToday, color: '#059669', bg: '#ECFDF5', border: '#D1FAE5' },
                ].map((m, i) => (
                    <div key={i} style={{ background: m.bg, border: `1px solid ${m.border}`, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: 800, color: m.color, lineHeight: 1.2 }}>{m.value}</div>
                        <div style={{ fontSize: '11px', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>{m.label}</div>
                    </div>
                ))}
            </div>

            {/* Agents Table */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={18} color="#4B5563" /> Estado de Asesores
                </div>
                <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB', background: '#ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Asesor</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Estado</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Ocupación</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Resueltos Hoy</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.agents.map((agent, i) => (
                                <tr key={agent.id} style={{ borderBottom: i !== data.agents.length -1 ? '1px solid #F3F4F6' : 'none' }}>
                                    <td style={{ padding: '12px 16px', color: '#111827', fontWeight: 500 }}>{agent.name}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F9FAFB', padding: '4px 10px', borderRadius: '12px', border: '1px solid #F3F4F6' }}>
                                            {getStatusDot(agent.status)}
                                            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#4B5563', fontWeight: 600 }}>{agent.status}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: agent.activeChats >= agent.maxChats ? '#DC2626' : '#111827' }}>
                                        {agent.activeChats} / {agent.maxChats}
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center', color: '#059669', fontWeight: 600 }}>{agent.resolvedToday}</td>
                                </tr>
                            ))}
                            {data.agents.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: '#6B7280' }}>No hay asesores configurados o conectados.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Queue */}
            {data.queue.count > 0 && (
                <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#D97706', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={18} /> Cola de Espera Crítica ({data.queue.count})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {data.queue.items.map(item => (
                            <div key={item.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '12px 16px', borderRadius: '8px', background: '#FFFBEB', border: '1px solid #FDE68A'
                            }}>
                                <div>
                                    <span style={{ color: '#92400E', fontSize: '13px', fontWeight: 600 }}>{item.contactName}</span>
                                    <span style={{ color: '#D97706', fontSize: '11px', marginLeft: '10px', fontWeight: 600, background: '#FEF3C7', padding: '2px 8px', borderRadius: '12px' }}>{item.channel}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: item.waitingMinutes > 5 ? '#DC2626' : '#D97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Timer size={14} /> {item.waitingTime}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
                <button onClick={onRefresh} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', border: '1px solid #D1D5DB', background: '#ffffff', color: '#374151', cursor: 'pointer', fontSize: '13px', fontWeight: 600, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'background 0.2s' }} onMouseOver={e=>e.target.style.background='#F9FAFB'} onMouseOut={e=>e.target.style.background='#ffffff'}>
                    <RefreshCw size={16} /> Actualizar Panel
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
        { value: 'online', label: 'Disponible', color: '#10b981' },
        { value: 'busy', label: 'Ocupado', color: '#f59e0b' },
        { value: 'away', label: 'Ausente', color: '#eab308' },
        { value: 'offline', label: 'Desconectado', color: '#7b8498' }
    ];

    const currentStatus = statuses.find(s => s.value === status) || statuses[3];

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Mi disponibilidad" aria-expanded={isOpen}
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
    const { auth } = usePage().props;
    const inboxChannel = auth?.user?.roles?.some(r => r.nombre === "admin") ? "novape-inbox.supervisors" : `novape-inbox.agent.${auth?.user?.id}`;
    const [conversations, setConversations] = useState([]);
    const [activeConv, setActiveConv] = useState(null);
    const isSupervisor = auth?.user?.roles?.some(role=>role.nombre==='admin');
    const [messages, setMessages] = useState([]);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyLastPage, setHistoryLastPage] = useState(1);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const historyRequestRef = useRef(0);
    const messagesViewportRef = useRef(null);
    const [messageInput, setMessageInput] = useState('');
    useEffect(() => {
        const handler = event => {
            if (Number(event.detail.conversationId) === Number(activeConv?.id)) setMessageInput(event.detail.text);
        };
        window.addEventListener('panel-assistant:draft', handler);
        return () => window.removeEventListener('panel-assistant:draft', handler);
    }, [activeConv?.id]);
    const [contactProfile, setContactProfile] = useState(null);
    const [filter, setFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('open');
    const [searchQuery, setSearchQuery] = useState('');
    const [view, setView] = useState('all');
    const [sort, setSort] = useState('latest');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, last_page: 1 });
    const [summary, setSummary] = useState(null);
    const [channelCounts, setChannelCounts] = useState(null);
    const [showProfile, setShowProfile] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1280);
    const [showHelp, setShowHelp] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [realtime, setRealtime] = useState(false);
    const searchInputRef = useRef(null);
    const listRequestRef = useRef(null);
    const listSequence = useRef(0);
    const queryRef = useRef(null);
    queryRef.current = { filter, statusFilter, searchQuery, view, sort, page };
    const selectView = id => { setView(id === 'closed' ? 'all' : id); setStatusFilter(id === 'closed' ? 'closed' : 'open'); setPage(1); };
    const selectChannel = channel => { setFilter(channel); setPage(1); };
    const selectedView = statusFilter === 'closed' ? 'closed' : view;
    const selectedViewLabel = inboxViews.find(item => item.id === selectedView)?.label;
    const draftKey = (id, mode) => `novape.inbox.draft.${auth?.user?.id}.${id}.${mode}`;
    const readDraft = (id, mode) => { try { return sessionStorage.getItem(draftKey(id,mode)) || ''; } catch { return ''; } };
    const saveDraft = (id, mode, text) => { if (!id) return; try { text ? sessionStorage.setItem(draftKey(id,mode),text) : sessionStorage.removeItem(draftKey(id,mode)); } catch {} };
    const changeReplyMode = mode => { saveDraft(activeConv?.id, replyMode, messageInput); setReplyMode(mode); setMessageInput(readDraft(activeConv?.id,mode)); };

    const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [showCannedDropdown, setShowCannedDropdown] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const [toast, setToast] = useState(null);
    const [replyMode, setReplyMode] = useState('reply'); // 'reply' or 'note'
    const replyModeRef = useRef(replyMode);
    replyModeRef.current = replyMode;

    // Enterprise state
    const [isUpdatingPriority, setIsUpdatingPriority] = useState(false);
    const [agentStatus, setAgentStatus] = useState('offline');
    const [agentActiveChats, setAgentActiveChats] = useState(0);
    const [agentMaxChats, setAgentMaxChats] = useState(5);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [availableAgents, setAvailableAgents] = useState([]);
    const [supervisorData, setSupervisorData] = useState(null);
    const [showSupervisorPanel, setShowSupervisorPanel] = useState(false);
    const transferDialogRef = useRef(null);
    const closeDialogRef = useRef(null);
    const supervisorDialogRef = useRef(null);
    const dismissTransfer = useCallback(() => setShowTransferModal(false), []);
    const dismissClose = useCallback(() => setShowCloseModal(false), []);
    const dismissSupervisor = useCallback(() => setShowSupervisorPanel(false), []);
    useDialog(showTransferModal, transferDialogRef, dismissTransfer);
    useDialog(showCloseModal, closeDialogRef, dismissClose);
    useDialog(showSupervisorPanel, supervisorDialogRef, dismissSupervisor);

    const messagesEndRef = useRef(null);
    const searchTimeoutRef = useRef(null);
    const searchMountedRef = useRef(false);
    const actionsMenuRef = useRef(null);
    const pollingRef = useRef(null);
    const activeConvRef = useRef(null);

    // ─── Mantener ref sincronizada con activeConv ──────────────
    useEffect(() => {
        activeConvRef.current = activeConv;
    }, [activeConv]);

    useEffect(() => { saveDraft(activeConv?.id, replyMode, messageInput); }, [activeConv?.id, replyMode, messageInput]);
    useEffect(() => {
        const keyboard = event => {
            if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'f') {
                event.preventDefault(); searchInputRef.current?.focus();
            }
            if (event.key === 'Escape') {
                setShowHelp(false); setShowEmoji(false); setShowActionsMenu(false); setShowCannedDropdown(false);
                setShowTransferModal(false); setShowCloseModal(false); setShowSupervisorPanel(false);
            }
        };
        window.addEventListener('keydown', keyboard);
        return () => { window.removeEventListener('keydown', keyboard); listRequestRef.current?.abort(); };
    }, []);

    // ─── Efecto inicial ───────────────────────────────────────
    useEffect(() => {
        fetchAgentStatus();

        const connection = window.Echo?.connector?.pusher?.connection;
        const connectionChanged = () => setRealtime(connection?.state === 'connected');
        connectionChanged();
        connection?.bind('state_change', connectionChanged);

        // Escuchar eventos de broadcasting
        if (window.Echo) {
            window.Echo.private(inboxChannel)
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
            if (document.hidden) return;
            fetchConversationsSilent();
            fetchAgentStatus();
            // Si hay una conversación activa, refrescar sus mensajes
            if (activeConvRef.current) {
                fetchMessagesSilent(activeConvRef.current.id);
            }
        }, 30000);

        return () => {
            connection?.unbind('state_change', connectionChanged);
            if (window.Echo) {
                window.Echo.leave(inboxChannel);
            }
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, []);

    // ─── Refetch al cambiar filtro o estado ────────────────────
    useEffect(() => {
        fetchConversations();
    }, [filter, statusFilter, view, sort, page]);

    // ─── Búsqueda con debounce ────────────────────────────────
    useEffect(() => {
        if (!searchMountedRef.current) { searchMountedRef.current = true; return; }
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            if (queryRef.current.page !== 1) setPage(1); else fetchConversations();
        }, 300);
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
    const loadConversations = async (silent = false) => {
        const sequence = ++listSequence.current;
        listRequestRef.current?.abort();
        const controller = new AbortController(); listRequestRef.current = controller;
        if (!silent) setIsLoadingConversations(true);
        try {
            const query = queryRef.current;
            const params = new URLSearchParams({ status: query.statusFilter, view: query.view, sort: query.sort, page: query.page });
            if (query.filter !== 'all') params.set('channel',query.filter);
            if (query.searchQuery) params.set('search',query.searchQuery);
            const response = await csrfFetch(`/admin/api/omnichannel/conversations?${params}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
            if (!response.ok) throw new Error('No se pudieron cargar las conversaciones.');
            const data = await response.json();
            if (sequence !== listSequence.current) return;
            setConversations(data.data || []); setSummary(data.summary || null); setChannelCounts(data.channels || {});
            const refreshedActive = (data.data || []).find(conversation=>conversation.id===activeConvRef.current?.id);
            if (refreshedActive) setActiveConv(current=>current?.id === refreshedActive.id ? {...current,...refreshedActive} : current);
            setPagination({ total: data.total, last_page: data.last_page, from: data.from, to: data.to });
            if (query.page > data.last_page) setPage(Math.max(1, data.last_page));
        } catch (error) {
            if (error.name !== 'AbortError' && !silent) showToast(error.message, 'error');
        } finally { if (sequence === listSequence.current) setIsLoadingConversations(false); }
    };
    const fetchConversations = () => loadConversations();
    const fetchConversationsSilent = () => loadConversations(true);

    const fetchMessages = async (convId) => {
        try {
            const res = await csrfFetch(`/admin/api/omnichannel/conversations/${convId}/messages`);
            if (!res.ok) throw new Error('Error al cargar mensajes');
            const data = await res.json();
            if (activeConvRef.current?.id !== convId) return;
            setMessages(data.data || []);
            setHistoryLastPage(data.last_page || 1);
            scrollToBottom();
        } catch (error) {
            console.error('Error fetching messages:', error);
            showToast('Error al cargar mensajes', 'error');
        } finally {
            if (activeConvRef.current?.id === convId) setIsLoadingChat(false);
        }
    };

    // ─── Fetch mensajes silencioso (polling) ──────────────────
    const fetchMessagesSilent = async (convId) => {
        try {
            const res = await csrfFetch(`/admin/api/omnichannel/conversations/${convId}/messages`);
            if (!res.ok) return;
            const data = await res.json();
            if (activeConvRef.current?.id !== convId) return;
            const newMsgs = data.data || [];
            setHistoryLastPage(data.last_page || 1);
            setMessages(prev => {
                if (prev.some(message => String(message.id).startsWith('temp-') && message.status === 'queued')) return prev;
                const ids = new Set(newMsgs.map(message => message.id));
                const merged = [...prev.filter(message => !ids.has(message.id) && !String(message.id).startsWith('temp-')), ...newMsgs];
                if (JSON.stringify(merged) !== JSON.stringify(prev)) {
                    const viewport = messagesViewportRef.current;
                    if (viewport && viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 120) setTimeout(() => scrollToBottom(), 100);
                    return merged;
                }
                return prev;
            });
        } catch (error) {
            console.warn('Polling messages failed:', error);
        }
    };

    const fetchOlderMessages = async () => {
        if (!activeConv || loadingHistory || historyPage >= historyLastPage) return;
        const id = activeConv.id; const sequence = ++historyRequestRef.current;
        const viewport = messagesViewportRef.current; const previousHeight = viewport?.scrollHeight || 0;
        setLoadingHistory(true);
        try {
            const response = await csrfFetch(`/admin/api/omnichannel/conversations/${id}/messages?page=${historyPage + 1}`, {headers:{Accept:'application/json'}});
            if (!response.ok) throw new Error('No se pudo cargar el historial');
            const data = await response.json();
            if (activeConvRef.current?.id !== id || sequence !== historyRequestRef.current) return;
            setMessages(current => { const ids = new Set(current.map(message=>message.id)); return [...(data.data || []).filter(message=>!ids.has(message.id)), ...current]; });
            setHistoryPage(data.current_page); setHistoryLastPage(data.last_page);
            requestAnimationFrame(() => { if (messagesViewportRef.current && activeConvRef.current?.id === id) messagesViewportRef.current.scrollTop += messagesViewportRef.current.scrollHeight - previousHeight; });
        } catch (error) { if (activeConvRef.current?.id === id) showToast(error.message,'error'); }
        finally { if (sequence === historyRequestRef.current) setLoadingHistory(false); }
    };

    // ─── Fetch perfil contacto ────────────────────────────────
    const fetchContactProfile = async (convId) => {
        try {
            const res = await csrfFetch(`/admin/api/omnichannel/conversations/${convId}/contact-profile`);
            if (!res.ok) throw new Error('Error al cargar perfil');
            const data = await res.json();
            if (activeConvRef.current?.id === convId) setContactProfile(data);
        } catch (error) {
            console.error('Error fetching contact profile:', error);
        }
    };

    // ─── Seleccionar conversación ─────────────────────────────
    const handleSelectConversation = (conv) => {
        if (activeConv?.id === conv.id) return;

        saveDraft(activeConv?.id, replyMode, messageInput);
        activeConvRef.current = conv;
        setMessageInput(readDraft(conv.id, replyMode));
        setMessages([]);
        historyRequestRef.current++; setHistoryPage(1); setHistoryLastPage(1); setLoadingHistory(false);
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
        if (conv.unreadCount > 0) setSummary(current => current ? {...current,unread:Math.max(0,current.unread - 1)} : current);
    };

    // ─── Eventos de broadcasting ──────────────────────────────
    const handleNewMessage = useCallback((msg) => {
        if (activeConvRef.current?.id === msg.conversation_id) fetchMessagesSilent(msg.conversation_id);
    }, []);

    const handleMessageStatusUpdate = useCallback((statusData) => {
        setMessages(prev => prev.map(m =>
            m.id === statusData.id ? { ...m, status: statusData.status } : m
        ));
    }, []);

    const updateConversationInList = useCallback((updatedConv) => {
        fetchConversationsSilent();

        setActiveConv(current => {
            if (current && current.id === updatedConv.id) {
                return { ...current, ...updatedConv };
            }
            return current;
        });
    }, []);

    // ─── Enviar mensaje o nota ───────────────────────────────
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !activeConv || isSending) return;

        const content = messageInput;
        const currentMode = replyMode;
        const conversationId = activeConv.id;
        saveDraft(conversationId,currentMode,'');
        setMessageInput('');
        setIsSending(true);

        const tempMsg = {
            id: 'temp-' + Date.now(),
            direction: currentMode === 'note' ? 'internal' : 'outbound',
            messageType: 'text',
            content: content,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            date_formatted: 'Hoy',
            status: 'queued',
            isInternalNote: currentMode === 'note',
            isAiGenerated: false,
        };
        setMessages(prev => [...prev, tempMsg]);
        scrollToBottom();

        try {
            const endpoint = currentMode === 'note'
                ? `/admin/api/omnichannel/conversations/${activeConv.id}/notes`
                : `/admin/api/omnichannel/conversations/${activeConv.id}/messages`;

            const res = await csrfFetch(endpoint, {
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
                if (activeConvRef.current?.id === conversationId) setMessages(prev => prev.map(m => m.id === tempMsg.id ? (data.message || tempMsg) : m));
                fetchConversationsSilent();
                if (data.message?.status === 'failed') {
                    saveDraft(conversationId,currentMode,content);
                    if (activeConvRef.current?.id === conversationId && replyModeRef.current === currentMode) setMessageInput(content);
                    showToast('El canal no pudo entregar el mensaje. Tu respuesta se conserva para reintentar.', 'error');
                }
                if (currentMode === 'note') showToast('Nota interna añadida', 'success');
            } else {
                throw new Error('No se pudo enviar');
            }
        } catch (error) {
            console.error('Error sending:', error);
            showToast(`Error al enviar: ${error.message}`, 'error');
            saveDraft(conversationId,currentMode,content);
            if (activeConvRef.current?.id === conversationId && replyModeRef.current === currentMode) { setMessageInput(current => current || content); }
            setMessages(prev => prev.map(m =>
                m.id === tempMsg.id ? { ...m, status: 'failed' } : m
            ));
        } finally {
            setIsSending(false);
        }
    };

    // ─── Acciones de conversación ─────────────────────────────
    const handlePriority = async priority => {
        if (!activeConv || isUpdatingPriority) return;
        const id = activeConv.id;
        setIsUpdatingPriority(true);
        try {
            const response = await csrfFetch(`/admin/api/omnichannel/conversations/${id}/priority`, {
                method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json','X-CSRF-TOKEN':document.querySelector('meta[name="csrf-token"]')?.content || ''}, body:JSON.stringify({priority}),
            });
            if (!response.ok) throw new Error('No se pudo actualizar la prioridad');
            if (activeConvRef.current?.id === id) setActiveConv(current=>({...current,priority}));
            fetchConversationsSilent(); showToast('Prioridad actualizada', 'success');
        } catch (error) { showToast(error.message, 'error'); }
        finally { setIsUpdatingPriority(false); }
    };

    const handleAssignSelf = async () => {
        if (!activeConv || !isSupervisor) return;
        const id = activeConv.id;
        try {
            const response = await csrfFetch(`/admin/api/omnichannel/conversations/${id}/assign`, {method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json','X-CSRF-TOKEN':document.querySelector('meta[name="csrf-token"]')?.content || ''},body:JSON.stringify({user_id:auth.user.id})});
            if (!response.ok) throw new Error('No se pudo asignar la conversación');
            setActiveConv(current=>current?.id===id ? {...current,assignedUserId:auth.user.id,agentName:auth.user.nombres,status:'human_active',isBotActive:false} : current);
            fetchConversationsSilent(); fetchAgentStatus(); fetchMessagesSilent(id); fetchContactProfile(id);
            setShowActionsMenu(false); showToast('Conversación asignada a ti', 'success');
        } catch(error) { showToast(error.message, 'error'); }
    };

    const handleResolve = async () => {
        if (!activeConv) return;
        try {
            const res = await csrfFetch(`/admin/api/omnichannel/conversations/${activeConv.id}/resolve`, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '' }
            });
            if (!res.ok) throw new Error('No se pudo resolver');
            if (res.ok) {
                setActiveConv(current=>current?.id === activeConv.id ? {...current,status:'resolved',isBotActive:false} : current);
                fetchConversationsSilent(); fetchAgentStatus();
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
            const res = await csrfFetch(`/admin/api/omnichannel/conversations/${activeConv.id}/reopen`, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '' }
            });
            if (!res.ok) throw new Error('No se pudo reabrir');
            if (res.ok) {
                setActiveConv(current=>current?.id === activeConv.id ? {...current,status:current.assignedUserId ? 'human_active' : 'bot_active',isBotActive:!current.assignedUserId} : current);
                fetchConversationsSilent(); fetchAgentStatus();
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
            const res = await csrfFetch(`/admin/api/omnichannel/conversations/${activeConv.id}/transfer-to-bot`, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '' }
            });
            if (!res.ok) throw new Error('No se pudo transferir');
            if (res.ok) {
                setActiveConv(current=>current?.id === activeConv.id ? {...current,status:'bot_active',isBotActive:true,assignedUserId:null,agentName:null} : current);
                fetchConversationsSilent(); fetchAgentStatus();
                showToast('Transferido al asistente IA', 'success');
                setShowActionsMenu(false);
            }
        } catch (error) {
            showToast('Error al transferir al bot', 'error');
        }
    };

    const handleAddNote = () => {
        changeReplyMode('note');
        setShowActionsMenu(false);
    };

    // ─── Enterprise handlers ─────────────────────────────────
    const fetchAgentStatus = async () => {
        try {
            const res = await csrfFetch('/admin/api/omnichannel/agent-status');
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
            const res = await csrfFetch('/admin/api/omnichannel/agent-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) throw new Error('No se pudo actualizar la disponibilidad');
            if (res.ok) {
                setAgentStatus(newStatus);
                showToast(`Estado cambiado a ${newStatus.toUpperCase()}`, 'success');
            }
        } catch (e) { showToast('Error al cambiar estado', 'error'); }
    };

    const handleTransfer = async (toUserId, reason) => {
        if (!activeConv) return;
        try {
            const res = await csrfFetch(`/admin/api/omnichannel/conversations/${activeConv.id}/transfer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
                },
                body: JSON.stringify({ to_user_id: toUserId, reason })
            });
            if (!res.ok) throw new Error('No se pudo transferir la conversación');
            if (res.ok) {
                if (!isSupervisor && Number(toUserId) !== Number(auth?.user?.id)) {
                    saveDraft(activeConv.id,replyMode,messageInput); activeConvRef.current=null; setActiveConv(null); setMessages([]); setMessageInput(''); setContactProfile(null); setIsMobileChatOpen(false);
                } else {
                    setActiveConv(current=>current?.id===activeConv.id ? {...current,assignedUserId:Number(toUserId),status:'human_active',isBotActive:false,agentName:availableAgents.find(agent=>Number(agent.id)===Number(toUserId))?.name || null} : current);
                    fetchMessagesSilent(activeConv.id); fetchContactProfile(activeConv.id);
                }
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
            const res = await csrfFetch(`/admin/api/omnichannel/conversations/${activeConv.id}/close`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
                },
                body: JSON.stringify({ reason })
            });
            if (!res.ok) throw new Error('No se pudo cerrar la conversación');
            if (res.ok) {
                setActiveConv(current=>current?.id===activeConv.id ? {...current,status:'closed',isBotActive:false} : current);
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
            const res = await csrfFetch('/admin/api/omnichannel/available-agents');
            if (res.ok) {
                const data = await res.json();
                setAvailableAgents(data);
            }
        } catch (e) { console.warn('Error fetching agents:', e); }
    };

    const fetchSupervisorDashboard = async () => {
        try {
            const res = await csrfFetch('/admin/api/omnichannel/supervisor/dashboard');
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

    const conversationTimestamp = conversation => {
        if (!conversation.lastMessageAt) return conversation.lastMessageTime || conversation.lastMessageDate;
        const date = new Date(conversation.lastMessageAt);
        if (Number.isNaN(date.getTime())) return conversation.lastMessageDate || '—';
        return date.toDateString() === new Date().toDateString() ? date.toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'}) : date.toLocaleDateString('es-PE',{day:'2-digit',month:'2-digit'});
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
        <TwentyCrmLayout title="Centro de conversaciones">
            <div className={`inbox-root omni-workspace ${isMobileChatOpen ? 'chat-open' : ''} ${showProfile ? 'with-profile' : 'without-profile'}`}>
                <Head title="Centro de conversaciones" />
                <InboxTopbar summary={summary} showProfile={showProfile} onProfile={() => setShowProfile(!showProfile)} showHelp={showHelp} onHelp={() => setShowHelp(!showHelp)} realtime={realtime}/>
                <InboxRail selected={selectedView} onSelect={selectView} summary={summary} channels={channelCounts} supervisor={auth?.user?.roles?.some(role => role.nombre === 'admin')} onSupervisor={openSupervisorPanel} user={auth?.user}/>


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
                <div className="omni-mobile-views"><label htmlFor="inbox-view">Bandeja de atención</label><select id="inbox-view" value={selectedView} onChange={event=>selectView(event.target.value)}>{inboxViews.filter(item=>!item.supervisor || auth?.user?.roles?.some(role=>role.nombre==='admin')).map(item=><option key={item.id} value={item.id}>{item.label} · {summary?.[item.stat] ?? '—'}</option>)}</select></div>
                <div className="inbox-sidebar__header">
                    <div className="inbox-sidebar__title">
                        {selectedViewLabel}
                        <span className="omni-list-total">{pagination.total}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {/* Agent Status Selector */}
                        <AgentStatusDropdown status={agentStatus} onChange={handleChangeAgentStatus} />
                        {auth?.user?.roles?.some(r => r.nombre === 'admin') && <button className="inbox-sidebar__refresh-btn" onClick={openSupervisorPanel} title="Supervisor Dashboard">
                            <Activity size={16} />
                        </button>}
                        <button className="inbox-sidebar__refresh-btn" onClick={fetchConversations} title="Actualizar">
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>

                <div className="inbox-sidebar__tabs">
                    <button
                        className={`inbox-tab-btn ${statusFilter === 'open' ? 'active' : ''}`}
                        onClick={() => selectView('all')}
                    >
                        Abiertos
                    </button>
                    <button
                        className={`inbox-tab-btn ${statusFilter === 'closed' ? 'active' : ''}`}
                        onClick={() => selectView('closed')}
                    >
                        Cerrados
                    </button>
                </div>

                <div className="inbox-sidebar__search">
                    <Search size={16} className="inbox-sidebar__search-icon" />
                    <input
                        ref={searchInputRef}
                        aria-label="Buscar conversaciones"
                        maxLength={150}
                        type="text"
                        placeholder="Buscar cliente o número..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="inbox-sidebar__filters">
                    <button className={`inbox-filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => selectChannel('all')}>
                        Todos
                    </button>
                    <button className={`inbox-filter-btn ${filter === 'whatsapp' ? 'active' : ''}`} onClick={() => selectChannel('whatsapp')}>
                        <WhatsAppIcon /> WhatsApp
                    </button>
                    <button className={`inbox-filter-btn ${filter === 'messenger' ? 'active' : ''}`} onClick={() => selectChannel('messenger')}>
                        <MessengerIcon /> Messenger
                    </button>
                    <button className={`inbox-filter-btn ${filter === 'instagram' ? 'active' : ''}`} onClick={() => selectChannel('instagram')}>
                        <InstagramIcon /> Instagram
                    </button>
                    <button className={`inbox-filter-btn ${filter === 'web' ? 'active' : ''}`} onClick={() => selectChannel('web')}>
                        <Bot size={14} /> Web
                    </button>
                </div>

                <div className="omni-list-controls"><span>{pagination.total} conversaciones</span><select aria-label="Ordenar conversaciones" value={sort} onChange={event=>{setSort(event.target.value);setPage(1);}}><option value="latest">Recientes primero</option><option value="oldest">Antiguas primero</option><option value="priority">Prioridad primero</option></select></div>
                <div className="omni-capacity"><span>Mi carga de atención</span><strong>{agentActiveChats} / {agentMaxChats}</strong><progress max={Math.max(1,agentMaxChats)} value={agentActiveChats} aria-label="Conversaciones activas y capacidad"/></div>
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
                                role="button" tabIndex={0} aria-label={`Abrir conversación de ${conv.contactName}`} aria-pressed={activeConv?.id === conv.id}
                                onKeyDown={event=>{if(event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleSelectConversation(conv); }}}
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
                                    <div className="inbox-conv__time" title={conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleString('es-PE') : undefined}>{conversationTimestamp(conv)}</div>
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
                <div className="omni-pagination"><span>{pagination.from || 0}–{pagination.to || 0} de {pagination.total}</span><div><button type="button" aria-label="Página anterior" disabled={page<=1||isLoadingConversations} onClick={()=>setPage(page-1)}><ChevronLeft size={16}/></button><span>{page}/{pagination.last_page || 1}</span><button type="button" aria-label="Página siguiente" disabled={page>=pagination.last_page||isLoadingConversations} onClick={()=>setPage(page+1)}><ChevronLeft size={16} style={{transform:'rotate(180deg)'}}/></button></div></div>
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
                                        <span className="omni-assigned-agent">{activeConv.agentName ? `· ${activeConv.agentName}` : '· Sin asignar'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="inbox-chat__header-actions">
                                <select className="omni-priority-select" aria-label="Prioridad de la conversación" value={activeConv.priority || 'normal'} disabled={isUpdatingPriority} onChange={event=>handlePriority(event.target.value)}><option value="low">Baja</option><option value="normal">Normal</option><option value="high">Alta</option><option value="urgent">Urgente</option></select>
                                <button className="inbox-chat__header-btn" title="Asistente privado del panel" onClick={() => window.dispatchEvent(new CustomEvent('panel-assistant:open', { detail: { id: activeConv.id, contactName: activeConv.contactName } }))}><Bot size={16}/> Asistente</button>
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
                                            {isSupervisor && activeConv.assignedUserId !== auth?.user?.id && !['closed','resolved'].includes(activeConv.status) && <button onClick={handleAssignSelf}><User size={14}/> Asignarme conversación</button>}
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

                        <div className="inbox-chat__messages inbox-scrollable" ref={messagesViewportRef}>
                            {!isLoadingChat && historyPage < historyLastPage && <button className="omni-history-button" type="button" disabled={loadingHistory} onClick={fetchOlderMessages}>{loadingHistory ? 'Cargando historial…' : 'Cargar mensajes anteriores'}</button>}
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

                        {/* Composer SaaS Premium */}
                        <div className={`inbox-chat__input-wrapper ${replyMode === 'note' ? 'note-mode' : ''}`}>
                            {showCannedDropdown && replyMode !== 'note' && (
                                <CannedResponsesDropdown
                                    onSelect={(content) => setMessageInput(prev => prev + content)}
                                    onClose={() => setShowCannedDropdown(false)}
                                />
                            )}
                            <div className={`inbox-composer ${replyMode === 'note' ? 'is-note' : ''}`}>
                                <div className="inbox-composer__tabs">
                                    <button
                                        className={`inbox-composer__tab ${replyMode === 'reply' ? 'active' : ''}`}
                                        type="button"
                                        onClick={() => changeReplyMode('reply')}
                                    >
                                        <MessageSquare size={14} /> Responder
                                    </button>
                                    <button
                                        className={`inbox-composer__tab note ${replyMode === 'note' ? 'active' : ''}`}
                                        type="button"
                                        onClick={() => changeReplyMode('note')}
                                    >
                                        <StickyNote size={14} /> Nota Interna
                                    </button>
                                </div>
                                <div className="omni-composer-context">{replyMode === 'note' ? <><Shield size={13}/> Solo visible para el equipo</> : <><MessageCircle size={13}/> Responder a {activeConv.contactName} por {activeConv.channel === 'web' ? 'chat de la tienda' : activeConv.channel}</>}</div>
                                {showEmoji && <div className="omni-emoji" aria-label="Elegir emoji">{['👋','😊','👍','🙌','❤','📦','✅','✨'].map(emoji=><button type="button" key={emoji} aria-label={`Insertar ${emoji}`} onClick={()=>{setMessageInput(current=>current+emoji);setShowEmoji(false);}}>{emoji}</button>)}</div>}
                                <form onSubmit={handleSendMessage} className="inbox-composer__form">
                                    <textarea
                                        value={messageInput}
                                        maxLength={4096}
                                        onChange={(e) => { setMessageInput(e.target.value); saveDraft(activeConv.id,replyMode,e.target.value); }}
                                        placeholder={
                                            replyMode === 'reply' && ['resolved', 'closed'].includes(activeConv.status)
                                                ? 'La conversación ha finalizado'
                                                : replyMode === 'note'
                                                    ? 'Deja una nota privada para el equipo (invisible para el cliente)...'
                                                    : 'Escribe tu respuesta... Usa "/" para respuestas rápidas'
                                        }
                                        rows="2"
                                        disabled={isSending || (replyMode === 'reply' && ['resolved', 'closed'].includes(activeConv.status))}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                                                e.preventDefault();
                                                handleSendMessage(e);
                                            }
                                            if (e.key === '/' && replyMode === 'reply') {
                                                setShowCannedDropdown(true);
                                            }
                                        }}
                                    />
                                    <div className="inbox-composer__toolbar">
                                        <div className="inbox-composer__tools">
                                            {replyMode === 'reply' && (
                                                <button type="button" onClick={() => setShowCannedDropdown(!showCannedDropdown)} title="Respuestas rápidas (/)">
                                                    <Zap size={16} />
                                                </button>
                                            )}
                                            <button type="button" disabled title="Los adjuntos desde este panel aún no están habilitados">
                                                <Paperclip size={16} />
                                            </button>
                                            <button type="button" onClick={()=>setShowEmoji(!showEmoji)} aria-expanded={showEmoji} title="Insertar Emoji">
                                                <Smile size={16} />
                                            </button>
                                        </div>
                                        <button
                                            type="submit"
                                            className="inbox-composer__send"
                                            disabled={!messageInput.trim() || isSending || (replyMode === 'reply' && ['resolved', 'closed'].includes(activeConv.status))}
                                            style={replyMode === 'note' ? { background: '#D97706', color: 'white' } : {}}
                                        >
                                            {isSending ? <Loader2 size={16} className="animate-spin" /> : (replyMode === 'note' ? <StickyNote size={16} /> : <Send size={16} />)}
                                            <span>{replyMode === 'note' ? 'Guardar Nota' : 'Enviar'}</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </>
                ) : (
                    <InboxWelcome summary={summary} onView={selectView}/>
                )}
            </div>

            {/* ─── COLUMNA 3: PERFIL DEL CLIENTE ─── */}
            <div className="inbox-detail inbox-scrollable"><div className="omni-context-heading"><User size={15}/><strong>Contexto del cliente</strong><button type="button" className="omni-icon-button" onClick={()=>setShowProfile(false)} aria-label="Cerrar perfil"><X size={16}/></button></div>
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
                    <div className="inbox-detail__empty" style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        height: '100%', padding: '40px 24px', textAlign: 'center', color: '#94A3B8',
                        background: '#FFFFFF'
                    }}>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '50%',
                            background: '#F1F5F9', border: '1px dashed #CBD5E1',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: '16px'
                        }}>
                            <User size={28} color="#94A3B8" />
                        </div>
                        <span style={{ fontSize: '13px', lineHeight: 1.5, maxWidth: '200px' }}>
                            El perfil del cliente aparecerá aquí
                        </span>
                    </div>
                )}
            </div>

            {/* ─── MODAL: TRANSFERIR CONVERSACIÓN ─── */}
            {showTransferModal && (
                <div className="inbox-modal-overlay" onClick={() => setShowTransferModal(false)}>
                    <div className="inbox-modal" ref={transferDialogRef} role="dialog" aria-modal="true" aria-label="Transferir conversación" tabIndex={-1} onClick={(e) => e.stopPropagation()}>
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
                    <div className="inbox-modal" ref={closeDialogRef} role="dialog" aria-modal="true" aria-label="Cerrar conversación" tabIndex={-1} onClick={(e) => e.stopPropagation()}>
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
                    <div className="inbox-modal inbox-modal--wide" ref={supervisorDialogRef} role="dialog" aria-modal="true" aria-label="Panel de supervisión" tabIndex={-1} onClick={(e) => e.stopPropagation()}>
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
