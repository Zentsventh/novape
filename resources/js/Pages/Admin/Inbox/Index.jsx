import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
    MessageSquare, Send, Paperclip, Check, CheckCheck, 
    ChevronLeft, Search, Bot, User, Clock, CheckCircle2,
    Smile, Plus, MoreVertical, Image as ImageIcon,
    Inbox
} from 'lucide-react';
import '../../../../css/admin/admin.css';
import '../../../../css/admin/inbox.css';

// SVG Icons para los canales
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

// Componente Skeleton
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

function InboxIndex() {
    const [conversations, setConversations] = useState([]);
    const [activeConv, setActiveConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [contactProfile, setContactProfile] = useState(null);
    const [filter, setFilter] = useState('all'); 
    const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchConversations();
        
        if (window.Echo) {
            window.Echo.private('novape-inbox')
                .listen('.conversation.updated', (e) => {
                    updateConversationInList(e.conversationData);
                })
                .listen('.message.received', (e) => {
                    handleNewMessage(e.messageData);
                });
        }
        
        return () => {
            if (window.Echo) {
                window.Echo.leave('novape-inbox');
            }
        };
    }, []);

    const fetchConversations = async () => {
        try {
            const res = await fetch(`/api/omnichannel/conversations?channel=${filter}`);
            const data = await res.json();
            setConversations(data.data);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    const fetchMessages = async (convId) => {
        try {
            const res = await fetch(`/api/omnichannel/conversations/${convId}/messages`);
            const data = await res.json();
            setMessages(data.data);
            scrollToBottom();
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setIsLoadingChat(false);
        }
    };

    const fetchContactProfile = async (convId) => {
        try {
            const res = await fetch(`/api/omnichannel/conversations/${convId}/contact-profile`);
            const data = await res.json();
            setContactProfile(data);
        } catch (error) {
            console.error('Error fetching contact profile:', error);
        }
    };

    const handleSelectConversation = (conv) => {
        if (activeConv?.id === conv.id) return;
        
        setActiveConv(conv);
        setIsMobileChatOpen(true);
        setIsLoadingChat(true);
        setContactProfile(null); // Reset para mostrar skeleton
        
        fetchMessages(conv.id);
        fetchContactProfile(conv.id);
        
        setConversations(prev => prev.map(c => 
            c.id === conv.id ? { ...c, unreadCount: 0 } : c
        ));
    };

    const handleNewMessage = (msg) => {
        if (activeConv && msg.conversation_id === activeConv.id) {
            setMessages(prev => [...prev, msg]);
            scrollToBottom();
        }
    };

    const updateConversationInList = (updatedConv) => {
        setConversations(prev => {
            const exists = prev.find(c => c.id === updatedConv.id);
            if (exists) {
                return prev.map(c => c.id === updatedConv.id ? updatedConv : c);
            }
            return [updatedConv, ...prev];
        });
        
        if (activeConv && activeConv.id === updatedConv.id) {
            setActiveConv(updatedConv);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !activeConv) return;

        const content = messageInput;
        setMessageInput('');

        const tempMsg = {
            id: 'temp-' + Date.now(),
            direction: 'outbound',
            messageType: 'text',
            content: content,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            date_formatted: 'Hoy',
            status: 'queued',
            isInternalNote: false
        };
        setMessages(prev => [...prev, tempMsg]);
        scrollToBottom();

        try {
            const res = await fetch(`/api/omnichannel/conversations/${activeConv.id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                },
                body: JSON.stringify({ content })
            });
            const data = await res.json();
            
            if (data.success) {
                setMessages(prev => prev.map(m => m.id === tempMsg.id ? data.message : m));
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleResolve = async () => {
        if (!activeConv) return;
        try {
            await fetch(`/api/omnichannel/conversations/${activeConv.id}/resolve`, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content }
            });
        } catch (error) {
            console.error('Error resolving conversation:', error);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const renderChannelIcon = (channel) => {
        switch (channel) {
            case 'whatsapp': return <div className="text-green-500"><WhatsAppIcon /></div>;
            case 'messenger': return <div className="text-blue-500"><MessengerIcon /></div>;
            case 'instagram': return <div className="text-pink-500"><InstagramIcon /></div>;
            default: return <MessageSquare size={10} />;
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

    return (
        <div className={`inbox-root ${isMobileChatOpen ? 'chat-open' : ''}`}>
            <Head title="Bandeja Omnicanal" />

            {/* --- COLUMNA 1: LISTA DE CHATS --- */}
            <div className="inbox-sidebar">
                <div className="inbox-sidebar__header">
                    <button onClick={() => router.visit('/admin')} className="inbox-sidebar__back-btn">
                        <ChevronLeft size={16} /> Volver
                    </button>
                    <div className="inbox-sidebar__title">Mensajes</div>
                    <div style={{width: '60px'}}></div>
                </div>

                <div className="inbox-sidebar__search">
                    <input type="text" placeholder="Buscar cliente o número..." />
                </div>

                <div className="inbox-sidebar__filters">
                    <button className={`inbox-filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                        Todos
                    </button>
                    <button className={`inbox-filter-btn ${filter === 'whatsapp' ? 'active' : ''}`} onClick={() => setFilter('whatsapp')}>
                        <WhatsAppIcon /> WA
                    </button>
                    <button className={`inbox-filter-btn ${filter === 'instagram' ? 'active' : ''}`} onClick={() => setFilter('instagram')}>
                        <InstagramIcon /> IG
                    </button>
                </div>

                <div className="inbox-sidebar__list inbox-scrollable">
                    {conversations.map(conv => (
                        <div 
                            key={conv.id} 
                            className={`inbox-conversation-item ${activeConv?.id === conv.id ? 'active' : ''}`}
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
                            </div>
                        </div>
                    ))}
                    {conversations.length === 0 && (
                        <div className="p-8 text-center text-sm text-[var(--admin-text-muted)]">
                            No hay conversaciones activas
                        </div>
                    )}
                </div>
            </div>

            {/* --- COLUMNA 2: CHAT ACTIVO --- */}
            <div className="inbox-chat">
                {activeConv ? (
                    <>
                        <div className="inbox-chat__header">
                            <div className="inbox-chat__header-info">
                                <button className="md:hidden text-[var(--admin-primary)] mr-2" onClick={() => setIsMobileChatOpen(false)}>
                                    <ChevronLeft size={24} />
                                </button>
                                <div>
                                    <div className="inbox-chat__header-name">{activeConv.contactName}</div>
                                    <div className="inbox-chat__header-channel">
                                        {activeConv.isBotActive ? (
                                            <span className="inbox-bot-badge bot-active"><Bot size={12}/> Asistente IA Activo</span>
                                        ) : (
                                            <span className="inbox-bot-badge human-active"><User size={12}/> Agente Asignado</span>
                                        )}
                                        {activeConv.phone && <span>• {activeConv.phone}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="inbox-chat__header-actions">
                                <button className="inbox-chat__header-btn resolve" onClick={handleResolve} title="Marcar como Resuelto">
                                    <CheckCircle2 size={16} /> Resuelto
                                </button>
                                <button className="inbox-chat__header-btn" title="Opciones">
                                    <MoreVertical size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="inbox-chat__messages inbox-scrollable">
                            {isLoadingChat ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-[var(--admin-text-muted)] gap-3">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--admin-primary)]"></div>
                                    <span className="text-sm">Cargando mensajes...</span>
                                </div>
                            ) : (
                                Object.keys(groupedMessages).map((date) => (
                                    <div key={date}>
                                        <div className="inbox-date-divider">
                                            <span>{date}</span>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            {groupedMessages[date].map((msg, idx) => (
                                                <div key={msg.id || idx} className={`inbox-message ${msg.direction} ${msg.isInternalNote ? 'internal-note' : ''}`}>
                                                    {msg.mediaUrl && (
                                                        <div className="inbox-message__media">
                                                            {msg.mediaMimeType?.includes('image') ? (
                                                                <img src={msg.mediaUrl} alt="Adjunto" />
                                                            ) : (
                                                                <a href={msg.mediaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[var(--admin-bg)] p-3 rounded-lg text-sm text-[var(--admin-primary)] font-medium">
                                                                    <Paperclip size={16} /> Descargar Archivo Adjunto
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                    
                                                    <div>{msg.content}</div>
                                                    
                                                    <div className="flex justify-between items-end mt-1">
                                                        <div>
                                                            {msg.isAiGenerated && <span className="inbox-message__ai-badge">🤖 IA</span>}
                                                        </div>
                                                        <div className="inbox-message__time">
                                                            {msg.time}
                                                            {msg.direction === 'outbound' && (
                                                                msg.status === 'read' ? <CheckCheck size={12} className="text-[#3B82F6]" /> :
                                                                msg.status === 'delivered' ? <CheckCheck size={12} className="text-gray-400" /> :
                                                                msg.status === 'sent' ? <Check size={12} className="text-gray-400" /> :
                                                                <Clock size={10} className="text-gray-400" />
                                                            )}
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

                        <form onSubmit={handleSendMessage} className="inbox-chat__input">
                            <button type="button" className="text-[var(--admin-text-muted)] hover:text-[var(--admin-primary)] p-2 transition-colors">
                                <Smile size={22} />
                            </button>
                            <button type="button" className="text-[var(--admin-text-muted)] hover:text-[var(--admin-primary)] p-2 transition-colors">
                                <Paperclip size={22} />
                            </button>
                            <textarea 
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder="Escribe un mensaje para el cliente..."
                                rows="1"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(e);
                                    }
                                }}
                            />
                            <button type="submit" className="inbox-chat__send-btn" disabled={!messageInput.trim()}>
                                <Send size={18} /> <span className="hidden sm:inline">Enviar</span>
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="inbox-empty-state">
                        <Inbox />
                        <p>Bandeja Omnicanal</p>
                        <span>Selecciona una conversación del panel izquierdo para ver el historial y responder.</span>
                    </div>
                )}
            </div>

            {/* --- COLUMNA 3: PERFIL DEL CLIENTE --- */}
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
                        </div>
                        
                        <div className="inbox-detail__section">
                            <div className="inbox-detail__section-title">Detalles del Contacto</div>
                            <div className="inbox-detail__info-row">
                                <span className="inbox-detail__info-label">Primera Vez</span>
                                <span className="inbox-detail__info-value">{contactProfile.contact.firstInteraction}</span>
                            </div>
                            {contactProfile.contact.email && (
                                <div className="inbox-detail__info-row">
                                    <span className="inbox-detail__info-label">Email</span>
                                    <span className="inbox-detail__info-value">{contactProfile.contact.email}</span>
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
                                <div className="text-xs text-[var(--admin-text-muted)] italic text-center py-4 bg-[var(--admin-bg)] rounded-lg mt-2 border border-[var(--admin-border)]">
                                    El cliente no tiene compras recientes registradas.
                                </div>
                            )}
                            
                            <button className="inbox-detail__quick-action">
                                <Plus size={16} className="mr-2" /> Crear Orden Manual
                            </button>
                        </div>
                    </>
                ) : activeConv ? (
                    <ProfileSkeleton />
                ) : (
                    <div className="p-8 text-center flex flex-col items-center justify-center h-full text-[var(--admin-text-muted)]">
                        <User size={48} className="mb-4 opacity-50 text-[var(--admin-border)]" />
                        <span className="text-sm">El perfil del cliente aparecerá aquí</span>
                    </div>
                )}
            </div>
        </div>
    );
}
