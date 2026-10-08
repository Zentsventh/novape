import { useState, useEffect, useRef } from 'react';

/* Botón flotante de chatbot inteligente conectado a Gemini */
export default function ChatBot({ user }) {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [agentName, setAgentName] = useState('Novabot');
    const [isResolved, setIsResolved] = useState(false);
    
    const wrapperRef = useRef(null);
    const panelRef = useRef(null);
    const pollInFlight = useRef(false);
    const messagesEndRef = useRef(null);

    const authUser = user ?? null;

    useEffect(() => {
        if (!isOpen) return;
        const viewport = window.visualViewport;
        const resize = () => {
            const inset = Math.max(0, window.innerHeight - (viewport?.height ?? window.innerHeight) - (viewport?.offsetTop ?? 0));
            panelRef.current?.style.setProperty('--chat-keyboard-inset', `${inset}px`);
            panelRef.current?.style.setProperty('--chat-visible-height', `${viewport?.height ?? window.innerHeight}px`);
        };
        resize();
        viewport?.addEventListener('resize', resize);
        viewport?.addEventListener('scroll', resize);
        window.addEventListener('resize', resize);
        return () => {
            viewport?.removeEventListener('resize', resize);
            viewport?.removeEventListener('scroll', resize);
            window.removeEventListener('resize', resize);
        };
    }, [isOpen]);

    // Auto-scroll al último mensaje
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Conversation ownership is derived from the server session, never a browser-supplied ID.
    const getSessionId = () => '';

    // Cargar historial al abrir el chat (persistencia ante F5)
    useEffect(() => {
        if (isOpen && !historyLoaded) {
            loadHistory();
        }
    }, [isOpen]);

    const loadHistory = async () => {
        try {
            const sessionId = getSessionId();
            const res = await fetch(`/chatbot/history?session_id=${sessionId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.has_active_conversation && data.messages?.length > 0) {
                    setMessages(data.messages.map(m => ({
                        id: m.id,
                        role: m.role,
                        text: m.text,
                        is_human: m.is_human,
                        time: m.time,
                        agent_name: m.agent_name
                    })));
                }
                if (data.agent_name) {
                    setAgentName(data.agent_name);
                } else {
                    setAgentName('Novabot');
                }
            }
        } catch (e) {
            console.error('Error loading chat history:', e);
        } finally {
            setHistoryLoaded(true);
        }
    };

    // Polling para mensajes del agente
    useEffect(() => {
        let interval;
        if (isOpen) {
            interval = setInterval(async () => {
                if (pollInFlight.current || document.hidden) return;
                pollInFlight.current = true;
                try {
                    const sessionId = getSessionId();
                    const lastMessageId = messages.reduce((max, m) => m.id && m.id > max ? m.id : max, 0);
                    
                    const res = await fetch(`/chatbot/poll?session_id=${sessionId}&last_message_id=${lastMessageId}`);
                    if (res.ok) {
                        const data = await res.json();
                        
                        if (data.conversation_ended) {
                            setIsResolved(true);
                            return; // Stop processing further for this tick
                        } else {
                            setIsResolved(false);
                        }

                        if (data.agent_name) {
                            setAgentName(data.agent_name);
                        } else {
                            setAgentName('Novabot');
                        }

                        if (data.messages && data.messages.length > 0) {
                            setMessages(prev => {
                                const newMessages = [...prev];
                                data.messages.forEach(msg => {
                                    if (!newMessages.find(m => m.id === msg.id)) {
                                        if (msg.role === 'user' || msg.role === 'bot') {
                                            // Buscar un mensaje local (optimista) que coincida en rol, texto y no tenga ID
                                            const localMsg = newMessages.find(m => m.role === msg.role && !m.id && m.text.trim() === msg.text.trim());
                                            if (localMsg) {
                                                localMsg.id = msg.id;
                                                localMsg.time = msg.time;
                                                return; // Ya lo actualizamos, no lo empujamos de nuevo
                                            }
                                        }
                                        newMessages.push(msg);
                                    }
                                });
                                return newMessages;
                            });
                        }
                    }
                } catch (e) {
                    console.error('Error polling messages:', e);
                } finally { pollInFlight.current = false; }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isOpen, messages]);

    // Enviar mensaje a Laravel / Gemini
    const sendMessage = async (text) => {
        if (!text.trim() || isLoading || isResolved) return;
        
        const newMessages = [...messages, { role: 'user', text }];
        setMessages(newMessages);
        setMessage('');
        setIsLoading(true);

        try {
            const token = document.head.querySelector('meta[name="csrf-token"]')?.content;
            const sessionId = getSessionId();
            const res = await fetch('/chatbot/message', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token 
                },
                body: JSON.stringify({ 
                    messages: newMessages,
                    session_id: sessionId
                })
            });
            const data = await res.json();
            if (data.success && data.reply) {
                // Solo añadir la respuesta del bot de gemini de inmediato si recibimos reply.
                // (Si el bot estaba pausado, reply viene vacío y el polling recogerá lo que el agente mande).
                if (!data.is_bot_paused) {
                     setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
                }
            } else if (!data.success) {
                setMessages(prev => [...prev, { role: 'bot', text: 'Lo siento, hubo un error al procesar tu solicitud.' }]);
            }
        } catch (e) {
            setMessages(prev => [...prev, { role: 'bot', text: 'Error de conexión. Intenta de nuevo más tarde.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Finalizar conversación (el visitante cierra el chat)
    const handleEndConversation = async () => {
        try {
            const token = document.head.querySelector('meta[name="csrf-token"]')?.content;
            const sessionId = getSessionId();
            await fetch('/chatbot/close', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token
                },
                body: JSON.stringify({ session_id: sessionId })
            });
        } catch (e) {
            console.error('Error closing conversation:', e);
        }
        
        // Resetear estado del widget
        setMessages([]);
        setHistoryLoaded(false);
        setShowEndConfirm(false);
        setIsOpen(false);
        setIsResolved(false);

        // Generar nueva session_id para la próxima conversación (solo visitantes)
        if (!authUser) {
            localStorage.setItem('novabot_session', 'web_' + Math.random().toString(36).substr(2, 9));
        } else {
            // Para usuarios autenticados, renovar el session_id también
            const newSession = 'user_' + authUser.id + '_' + Math.random().toString(36).substr(2, 5);
            localStorage.setItem('novabot_session', newSession);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            sendMessage(message);
        }
    };

    // Renderizar texto con saltos de línea
    const renderText = (text) => {
        return text.split('\n').map((line, i) => (
            <span key={i}>
                {line}
                <br />
            </span>
        ));
    };

    // Nombre a mostrar en el header para el visitante
    const getVisitorName = () => {
        if (authUser) {
            return authUser.nombres || 'Cliente';
        }
        return null;
    };

    return (
        <>
            <div ref={wrapperRef} className="efe-chatbot-wrapper">
                {isOpen ? (
                    <button
                        className="efe-chatbot-btn--close"
                        onClick={() => setIsOpen(false)}
                        aria-label="Cerrar chat"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                ) : (
                    <button
                        className="efe-chatbot-btn"
                        onClick={() => setIsOpen(true)}
                        aria-label="Abrir chat"
                    >
                        <img
                            src="/images/chatbot_novape.png"
                            alt="Chatbot Novabot"
                        />
                    </button>
                )}
            </div>

            {isOpen && (
                <div ref={panelRef} className="efe-chat-panel" role="dialog" aria-label="Chat de ayuda" onKeyDown={event => {
                    if (event.key === 'Escape') {
                        setIsOpen(false);
                        wrapperRef.current?.querySelector('button')?.focus();
                    }
                }}>
                    <div className="efe-chat-header">
                        <div className="efe-chat-header-left">
                            <div className="efe-chat-header-text">
                                <h4>{agentName}</h4>
                                <div className="efe-chat-online">
                                    <span className="efe-chat-online-dot" />
                                    En línea
                                </div>
                            </div>
                        </div>
                        <div className="efe-chat-header-actions">
                            {messages.length > 0 && (
                                <button 
                                    className="efe-chat-end-btn" 
                                    onClick={() => setShowEndConfirm(true)}
                                    title="Finalizar conversación"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                                        <line x1="12" y1="2" x2="12" y2="12" />
                                    </svg>
                                </button>
                            )}
                            <button className="efe-chat-minimize" aria-label="Cerrar chat" onClick={() => setIsOpen(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Modal de confirmación para finalizar */}
                    {showEndConfirm && (
                        <div className="efe-chat-confirm-overlay">
                            <div className="efe-chat-confirm-modal">
                                <p>¿Deseas finalizar esta conversación?</p>
                                <span className="efe-chat-confirm-hint">Se cerrará el chat actual. Podrás iniciar uno nuevo después.</span>
                                <div className="efe-chat-confirm-actions">
                                    <button 
                                        className="efe-chat-confirm-cancel" 
                                        onClick={() => setShowEndConfirm(false)}
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        className="efe-chat-confirm-end" 
                                        onClick={handleEndConversation}
                                    >
                                        Finalizar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="efe-chat-body" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="efe-chat-welcome">
                            <h5 className="efe-chat-welcome-title">
                                {getVisitorName() 
                                    ? `¡Hola, ${getVisitorName()}! 👋` 
                                    : `¡Hola! Soy ${agentName}`}
                            </h5>
                            <p className="efe-chat-welcome-text">
                                Tu asistente virtual de Novape. Estoy aquí para ayudarte con tus compras, consultas y más.
                            </p>
                        </div>

                        {messages.length === 0 && (
                            <div className="efe-chat-suggestions">
                                <span className="efe-chat-suggestions-label">Preguntas frecuentes</span>
                                <button className="efe-chat-chip" onClick={() => sendMessage("¿Cómo veo el estado de mi pedido?")}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                        <line x1="12" y1="22.08" x2="12" y2="12" />
                                    </svg>
                                    Estado de mi pedido
                                </button>
                                <button className="efe-chat-chip" onClick={() => sendMessage("¿Cuáles son los métodos de pago?")}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="1" y="4" width="22" height="16" rx="2" />
                                        <line x1="1" y1="10" x2="23" y2="10" />
                                    </svg>
                                    Métodos de pago
                                </button>
                                <button className="efe-chat-chip" onClick={() => sendMessage("¿Tienen stock de los últimos modelos de celulares?")}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="23 4 23 10 17 10" />
                                        <polyline points="1 20 1 14 7 14" />
                                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                    </svg>
                                    Consultar productos
                                </button>
                            </div>
                        )}

                        <div className="efe-chat-messages" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                            {messages.map((m, i) => (
                                <div key={m.id || `msg-${i}`} style={{
                                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                    background: m.role === 'user' ? '#004797' : '#ffffff',
                                    color: m.role === 'user' ? '#FFFFFF' : '#1E293B',
                                    padding: '12px 16px',
                                    borderRadius: '16px',
                                    borderBottomRightRadius: m.role === 'user' ? '4px' : '16px',
                                    borderBottomLeftRadius: m.role === 'bot' ? '4px' : '16px',
                                    maxWidth: '85%',
                                    fontSize: '14px',
                                    lineHeight: '1.5',
                                    boxShadow: m.role === 'user' ? '0 4px 12px rgba(0, 71, 151,0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
                                    border: m.role === 'bot' ? '1px solid #E2E8F0' : 'none'
                                }}>
                                    {m.is_human && (
                                        <div style={{ 
                                            fontSize: '11px', 
                                            color: '#0EA5E9', 
                                            marginBottom: '4px', 
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                            {m.agent_name || 'Agente'}
                                        </div>
                                    )}
                                    {renderText(m.text)}
                                    {m.time && (
                                        <div style={{
                                            fontSize: '10px',
                                            opacity: 0.5,
                                            textAlign: 'right',
                                            marginTop: '4px',
                                        }}>
                                            {m.time}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="efe-chat-typing">
                                    <div className="efe-chat-typing-dot"></div>
                                    <div className="efe-chat-typing-dot"></div>
                                    <div className="efe-chat-typing-dot"></div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    <div className="efe-chat-footer">
                        {isResolved ? (
                            <div className="efe-chat-resolved-notice" style={{ padding: '12px', textAlign: 'center', background: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: '13px', color: '#64748b' }}>
                                <p style={{ margin: '0 0 8px 0' }}>Esta conversación ha finalizado.</p>
                                <button 
                                    onClick={handleEndConversation}
                                    style={{ background: '#004797', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
                                >
                                    Iniciar nuevo chat
                                </button>
                            </div>
                        ) : (
                            <div className="efe-chat-input-row">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Escribe tu mensaje..."
                                    aria-label="Mensaje al asistente"
                                    className="efe-chat-input"
                                    disabled={isLoading}
                                />
                                <button className="efe-chat-send" aria-label="Enviar mensaje" onClick={() => sendMessage(message)} disabled={!message.trim() || isLoading}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13" />
                                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                    </svg>
                                </button>
                            </div>
                        )}
                        <span className="efe-chat-powered">{agentName}</span>
                    </div>
                </div>
            )}
        </>
    );
}
