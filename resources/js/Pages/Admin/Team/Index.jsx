import React, { useCallback, useEffect, useRef, useState } from "react";
import { Head, usePage } from "@inertiajs/react";
import { Users, Send, Plus } from "lucide-react";
import TwentyCrmLayout from "../../../Layouts/TwentyCrmLayout";
import { panelApi, panelError } from "../../../Components/Admin/panelApi";
import "../../../../css/admin/communication.css";

export default function Index() {
  const user = usePage().props.auth.user;
  const [threads, setThreads] = useState([]),
    [active, setActive] = useState(null),
    [messages, setMessages] = useState([]);
  const [workers, setWorkers] = useState([]),
    [members, setMembers] = useState([]),
    [title, setTitle] = useState(""),
    [search, setSearch] = useState("");
  const [create, setCreate] = useState(false),
    [body, setBody] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [more, setMore] = useState(false);
  const current = useRef(null),
    request = useRef(null),
    bottom = useRef(null),
    lastRead = useRef(0),
    exhausted = useRef(false);
  const refresh = useCallback(async () => {
    try {
      setThreads(await panelApi("/admin/api/team/threads"));
      const id = current.current;
      if (!id) return;
      const result = await panelApi(`/admin/api/team/threads/${id}/messages`);
      if (current.current !== id) return;
      setMessages((prev) => {
        const combined = new Map(prev.map((m) => [m.id, m]));
        result.data.forEach((m) => combined.set(m.id, m));
        return [...combined.values()].sort((a, b) => a.id - b.id);
      });
      setMore(!exhausted.current && result.has_more);
      const last = result.data.at(-1)?.id;
      if (last && last > lastRead.current && !document.hidden) {
        await panelApi(`/admin/api/team/threads/${id}/read`, {
          message_id: last,
        });
        lastRead.current = last;
        setThreads((prev) =>
          prev.map((t) => (t.id === id ? { ...t, unread: 0 } : t)),
        );
      }
    } catch (e) {
      setError(panelError(e));
    }
  }, []);
  useEffect(() => {
    refresh();
    const timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, 20000);
    const channel = `novape-team.user.${user.id}`;
    window.Echo?.private(channel).listen(".team.updated", refresh);
    return () => {
      clearInterval(timer);
      window.Echo?.leave(channel);
    };
  }, [refresh, user.id]);
  useEffect(() => {
    current.current = active;
    lastRead.current = 0;
    exhausted.current = false;
    setMessages([]);
    setMore(false);
    refresh();
  }, [active, refresh]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [messages.at(-1)?.id]);
  useEffect(() => {
    if (!create) return;
    let cancelled = false;
    const timer = setTimeout(
      () =>
        panelApi("/admin/api/team/workers?q=" + encodeURIComponent(search))
          .then((data) => {
            if (!cancelled) setWorkers(data);
          })
          .catch((e) => {
            if (!cancelled) setError(panelError(e));
          }),
      250,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [create, search]);
  const start = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const t = await panelApi("/admin/api/team/threads", { members, title });
      setActive(t.id);
      setCreate(false);
      setMembers([]);
      setTitle("");
      setSearch("");
      setWorkers([]);
      await refresh();
    } catch (e) {
      setError(panelError(e));
    } finally {
      setBusy(false);
    }
  };
  const send = async (e) => {
    e.preventDefault();
    if (busy || !body.trim() || !active) return;
    const key = `${active}:${body}`;
    if (request.current?.key !== key)
      request.current = { key, id: crypto.randomUUID() };
    setBusy(true);
    setError("");
    try {
      await panelApi(`/admin/api/team/threads/${active}/messages`, {
        body,
        request_id: request.current.id,
      });
      setBody("");
      request.current = null;
      await refresh();
    } catch (e) {
      setError(panelError(e));
    } finally {
      setBusy(false);
    }
  };
  const older = async () => {
    const id = active;
    try {
      const result = await panelApi(
        `/admin/api/team/threads/${id}/messages?before=${messages[0].id}`,
      );
      if (current.current === id) {
        setMessages((prev) =>
          [...result.data, ...prev].filter(
            (m, i, all) => all.findIndex((x) => x.id === m.id) === i,
          ),
        );
        exhausted.current = !result.has_more;
        setMore(result.has_more);
      }
    } catch (e) {
      setError(panelError(e));
    }
  };
  const selected = threads.find((t) => t.id === active);
  const label = (t) =>
    t.direct_key
      ? t.members
          .filter((m) => m.id !== user.id)
          .map((m) => `${m.nombres} ${m.apellidos}`)
          .join(", ")
      : t.title;
  return (
    <TwentyCrmLayout title="Chat de equipo">
      <Head title="Equipo" />
      <div className="panel-communication-page">
        <h1>Equipo</h1>
        <p>
          Comunicación interna entre trabajadores · mensajes separados de los
          clientes.
        </p>
        {error && (
          <p role="alert" className="panel-communication-error">
            {error}
          </p>
        )}
        <div className="panel-team-grid">
          <aside>
            <button
              className="panel-team-new"
              onClick={() => setCreate(!create)}
            >
              <Plus size={18} /> Nueva conversación
            </button>
            {create && (
              <form className="panel-team-create" onSubmit={start}>
                <input
                  aria-label="Nombre del grupo"
                  placeholder="Nombre del grupo (opcional)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                />
                <input
                  aria-label="Buscar trabajador"
                  placeholder="Buscar trabajador…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <small>{members.length} trabajadores seleccionados</small>
                <div className="panel-team-workers">
                  {workers.map((w) => (
                    <label key={w.id}>
                      <input
                        type="checkbox"
                        checked={members.includes(w.id)}
                        onChange={(e) =>
                          setMembers((prev) =>
                            e.target.checked
                              ? [...prev, w.id]
                              : prev.filter((id) => id !== w.id),
                          )
                        }
                      />
                      {w.nombres} {w.apellidos}
                    </label>
                  ))}
                </div>
                <button disabled={busy || !members.length}>Crear chat</button>
              </form>
            )}
            <nav aria-label="Conversaciones internas">
              {threads.map((t) => (
                <button
                  key={t.id}
                  className={active === t.id ? "selected" : ""}
                  disabled={busy}
                  onClick={() => {
                    setActive(t.id);
                    setBody("");
                  }}
                >
                  {label(t)}
                  {t.unread > 0 && <b>{t.unread}</b>}
                  <small>{t.members.length} participantes</small>
                </button>
              ))}
              {!threads.length && <p>Aún no tienes conversaciones.</p>}
            </nav>
          </aside>
          <section className="panel-team-chat">
            {selected ? (
              <>
                <header>
                  <Users size={20} />
                  <div>
                    <strong>{label(selected)}</strong>
                    <small>
                      {selected.members.map((m) => m.nombres).join(" · ")}
                    </small>
                  </div>
                </header>
                <div className="panel-team-messages" aria-live="polite">
                  {more && (
                    <button onClick={older}>Ver mensajes anteriores</button>
                  )}
                  {messages.map((m) => (
                    <article
                      key={m.id}
                      className={m.user_id === user.id ? "own" : ""}
                    >
                      <small>
                        {m.nombres} {m.apellidos} ·{" "}
                        {new Date(m.created_at).toLocaleString("es-PE")}
                      </small>
                      <p>{m.body}</p>
                      {m.user_id === user.id && (
                        <small>
                          {selected.members.filter(
                            (member) =>
                              member.id !== user.id &&
                              Number(member.last_read_id) >= m.id,
                          ).length
                            ? "Leído por " +
                              selected.members
                                .filter(
                                  (member) =>
                                    member.id !== user.id &&
                                    Number(member.last_read_id) >= m.id,
                                )
                                .map((member) => member.nombres)
                                .join(", ")
                            : "Enviado"}
                        </small>
                      )}
                    </article>
                  ))}
                  {!messages.length && (
                    <p>Inicia la conversación con tu equipo.</p>
                  )}
                  <div ref={bottom} />
                </div>
                <form onSubmit={send} className="panel-communication-compose">
                  <textarea
                    aria-label="Mensaje interno al equipo"
                    placeholder="Escribe solo para el equipo…"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    maxLength={5000}
                    disabled={busy}
                  />
                  <button
                    disabled={busy || !body.trim()}
                    aria-label="Enviar mensaje interno"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </>
            ) : (
              <div className="panel-communication-empty">
                <Users size={36} />
                <h2>Coordina con tus compañeros</h2>
                <p>Abre un chat directo o crea un grupo de trabajo.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </TwentyCrmLayout>
  );
}
