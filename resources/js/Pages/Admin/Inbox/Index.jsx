import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import TwentyCrmLayout from '../../../Layouts/TwentyCrmLayout';
import { 
    MessageSquare, Send, Paperclip, Check, CheckCheck, 
    ChevronLeft, Search, Bot, User, Clock, CheckCircle2,
    Smile, Plus, MoreVertical, Image as ImageIcon,
    Inbox, Zap, StickyNote, RefreshCw, ArrowRightLeft,
    FileText, Video, X, AlertCircle, Loader2,
    MessageCircle, Hash
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
                    <div className="inbox-sidebar__title">Mensajes</div>
                    <button className="inbox-sidebar__refresh-btn" onClick={fetchConversations} title="Actualizar">
                        <RefreshCw size={16} />
                    </button>
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
                                    <div className="inbox-conv__name">{conv.contactName}</div>
                                    <div className="inbox-conv__preview">
                                        {conv.isBotActive && <Bot size={12} className="inline mr-1 opacity-70" />}
                                        {conv.lastMessagePreview || 'Sin mensajes'}
                                    </div>
                                </div>
                                <div className="inbox-conv__meta">
                                    <div className="inbox-conv__time">{conv.lastMessageTime || conv.lastMessageDate}</div>
                                    {conv.unreadCount > 0 && (
                                        <div className="inbox-conv__badge">{conv.unreadCount}</div>
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
                                            {!activeConv.isBotActive && (
                                                <button onClick={handleTransferToBot}>
                                                    <Bot size={14} /> Transferir a IA
                                                </button>
                                            )}
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
        </div>
        </TwentyCrmLayout>
    );
}
