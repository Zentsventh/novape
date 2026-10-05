import React, { useEffect, useRef, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import { Bot, X, Send, Plus } from "lucide-react";
import { panelApi, panelError } from "./panelApi";
import "/resources/css/admin/communication.css";

export function AssistantWorkspace({ context, onDraft }) {
  const [sessions, setSessions] = useState([]),
    [session, setSession] = useState(null),
    [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const request = useRef(null),
    generation = useRef(0),
    bottom = useRef(null);
  useEffect(() => {
    panelApi("/admin/api/panel-assistant/sessions")
      .then(setSessions)
      .catch((e) => setError(panelError(e)));
  }, []);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [messages, busy]);
  const load = async (id) => {
    const version = ++generation.current;
    setSession(id);
    setMessages([]);
    setError("");
    if (!id) return;
    setBusy(true);
    try {
      const data = await panelApi(
        `/admin/api/panel-assistant/sessions/${id}/messages`,
      );
      if (version === generation.current) setMessages(data);
    } catch (e) {
      setError(panelError(e));
    } finally {
      setBusy(false);
    }
  };
  const ask = async (intent = "help", text = question) => {
    if (busy || !text.trim()) return;
    setBusy(true);
    setError("");
    const key = JSON.stringify([session, text, intent, context?.id]);
    if (request.current?.key !== key)
      request.current = { key, id: crypto.randomUUID() };
    try {
      const result = await panelApi("/admin/api/panel-assistant/ask", {
        question: text,
        intent,
        session_id: session,
        conversation_id: intent === "overview" ? null : context?.id || null,
        request_id: request.current.id,
      });
      setSession(result.session_id);
      setMessages((prev) => [...prev, { question: text, ...result }]);
      setQuestion("");
      request.current = null;
      panelApi("/admin/api/panel-assistant/sessions")
        .then(setSessions)
        .catch(() => {});
    } catch (e) {
      setError(panelError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="panel-assistant-workspace">
      <div className="panel-communication-toolbar">
        <select
          aria-label="Historial privado del asistente"
          value={session || ""}
          disabled={busy}
          onChange={(e) => load(Number(e.target.value) || null)}
        >
          <option value="">Nueva consulta privada</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
        <button
          disabled={busy}
          onClick={() => load(null)}
          aria-label="Nueva consulta"
        >
          <Plus size={18} />
        </button>
      </div>
      <p className="panel-assistant-context">
        {context
          ? `Conversación #${context.id} · ${context.contactName || "CRM"}`
          : "Asistente operativo · historial privado por trabajador"}
      </p>
      <div className="panel-communication-shortcuts">
        <button
          disabled={busy}
          onClick={() => ask("overview", "Dame mi resumen operativo")}
        >
          Resumen operativo
        </button>
        {context && (
          <>
            <button
              disabled={busy}
              onClick={() =>
                ask(
                  "summary",
                  "Resume esta conversación y recomienda el siguiente paso",
                )
              }
            >
              Resumir conversación
            </button>
            <button
              disabled={busy}
              onClick={() =>
                ask(
                  "draft",
                  "Prepara una respuesta para este cliente, sin inventar datos",
                )
              }
            >
              Preparar respuesta
            </button>
          </>
        )}
      </div>
      <div className="panel-assistant-messages" aria-live="polite">
        {!messages.length && (
          <div className="panel-communication-empty">
            <Bot size={32} />
            <h3>Tu asistente del panel</h3>
            <p>
              Consulta la operación, revisa conversaciones y prepara respuestas
              para revisión humana.
            </p>
            <Link href="/admin/equipo">Coordinar con el equipo</Link>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={m.id || i}>
            <div className="panel-assistant-question">{m.question}</div>
            <div className="panel-assistant-answer">
              {m.answer}
              <small>
                {m.mode === "gemini"
                  ? "Generado con IA · verifica los datos"
                  : m.mode === "local_fallback"
                    ? "Proveedor no disponible · respuesta local"
                    : "Modo local · datos autorizados"}
              </small>
              {m.links?.map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label}
                </Link>
              ))}
              {m.is_draft &&
                onDraft &&
                Number(m.conversation_id) === Number(context?.id) && (
                  <button onClick={() => onDraft(m.answer)}>
                    Usar como borrador en la bandeja
                  </button>
                )}
            </div>
          </div>
        ))}
        {busy && <p role="status">Consultando información autorizada…</p>}
        <div ref={bottom} />
      </div>
      {error && (
        <p role="alert" className="panel-communication-error">
          {error}
        </p>
      )}
      <form
        className="panel-communication-compose"
        onSubmit={(e) => {
          e.preventDefault();
          ask();
        }}
      >
        <textarea
          aria-label="Consulta al asistente del panel"
          placeholder="¿Qué necesitas revisar?"
          maxLength={2000}
          disabled={busy}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button disabled={busy || !question.trim()} aria-label="Consultar">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}

export default function PanelAssistant() {
  const { url } = usePage();
  const [open, setOpen] = useState(false),
    [context, setContext] = useState(null);
  useEffect(() => {
    setContext(null);
    setOpen(false);
  }, [url]);
  useEffect(() => {
    const handler = (e) => {
      setContext(e.detail);
      setOpen(true);
    };
    window.addEventListener("panel-assistant:open", handler);
    return () => window.removeEventListener("panel-assistant:open", handler);
  }, []);
  return (
    <div className="panel-assistant-widget">
      {open && (
        <section
          className="panel-assistant-drawer"
          aria-label="Asistente privado del panel"
        >
          <header>
            <span>
              <Bot size={20} /> Asistente del panel
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar asistente"
            >
              <X size={20} />
            </button>
          </header>
          <AssistantWorkspace
            key={context?.id || "general"}
            context={context}
            onDraft={(text) => {
              window.dispatchEvent(
                new CustomEvent("panel-assistant:draft", {
                  detail: { text, conversationId: context?.id },
                }),
              );
              setOpen(false);
            }}
          />
        </section>
      )}
      <button
        className="panel-assistant-launcher"
        aria-expanded={open}
        onClick={() => {
          if (!open) setContext(null);
          setOpen(!open);
        }}
      >
        <Bot size={20} /> Asistente del panel
      </button>
    </div>
  );
}
