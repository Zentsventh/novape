import React, { useEffect, useRef, useState } from "react";
import {
  Users,
  MessageSquare,
  Phone,
  Video,
  CalendarDays,
  Search,
  Plus,
  X,
  FileText,
  Download,
  ArrowUpRight,
  ShieldCheck,
  Clock3,
} from "lucide-react";
import useDialog from "../Admin/useDialog";

export const workerName = (worker) =>
  `${worker.nombres} ${worker.apellidos || ""}`.trim();
export const initials = (name) =>
  name
    ?.split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("") || "N";
export const fileSize = (value) =>
  value >= 1048576
    ? `${(value / 1048576).toFixed(1)} MB`
    : `${Math.ceil((value || 0) / 1024)} KB`;
export const parseDate = (value) =>
  value
    ? new Date(value.includes("T") ? value : value.replace(" ", "T") + "-05:00")
    : null;
export const time = (value) =>
  parseDate(value)?.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  }) || "";
export const callStatus = {
  ringing: "Llamando",
  active: "En curso",
  scheduled: "Programada",
  ended: "Finalizada",
};
export const availability = {
  available: "Disponible",
  busy: "Ocupado",
  away: "Ausente",
  offline: "Desconectado",
};
export function Avatar({ name, status, group = false }) {
  return (
    <span className={`team-avatar ${group ? "group" : ""}`}>
      {group ? <Users size={21} /> : initials(name)}
      {status && <i className={`team-presence ${status}`} />}
    </span>
  );
}
export function Attachment({ file }) {
  if (file.type === "call") return <small>Registro de llamada anterior</small>;
  return (
    <div className="team-attachment">
      {file.type === "image" ? (
        <a href={file.url} target="_blank" rel="noreferrer">
          <img src={file.url} alt={file.file_name} loading="lazy" />
        </a>
      ) : file.type === "audio" ? (
        <audio controls preload="metadata" src={file.url} />
      ) : file.type === "video" ? (
        <video controls preload="metadata" src={file.url} />
      ) : (
        <a href={file.download_url}>
          <FileText size={25} />
          <span>
            <strong>{file.file_name}</strong>
            <small>{fileSize(file.file_size)} · Documento</small>
          </span>
          <Download size={16} />
        </a>
      )}
      {["image", "audio", "video"].includes(file.type) && (
        <a className="team-attachment-caption" href={file.download_url}>
          <span>{file.file_name}</span>
          <Download size={13} />
        </a>
      )}
    </div>
  );
}
export function PendingFile({ file, onRemove }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!file.type.startsWith("image/")) return;
    const value = URL.createObjectURL(file);
    setUrl(value);
    return () => URL.revokeObjectURL(value);
  }, [file]);
  return (
    <div className="team-pending-file">
      {url ? <img src={url} alt="Vista previa" /> : <FileText size={18} />}
      <span>
        <strong>{file.name}</strong>
        <small>{fileSize(file.size)}</small>
      </span>
      <button
        onClick={onRemove}
        type="button"
        aria-label={`Quitar ${file.name}`}
      >
        <X size={14} />
      </button>
    </div>
  );
}
export function Welcome({ onCreate, onDirectory }) {
  return (
    <div className="team-welcome">
      <div className="team-welcome-art">
        <span>
          <MessageSquare size={45} />
        </span>
        <i>
          <Video size={25} />
        </i>
        <b>
          <FileText size={23} />
        </b>
      </div>
      <span className="team-eyebrow">CONECTA. COMPARTE. COLABORA.</span>
      <h2>
        Un gran equipo empieza
        <br />
        con una buena conversación.
      </h2>
      <p>
        Mensajes, archivos y reuniones en un espacio privado, pensado para
        trabajar juntos.
      </p>
      <div>
        <button className="team-primary" onClick={onCreate}>
          <Plus size={17} />
          Nueva conversación
        </button>
        <button className="team-secondary" onClick={onDirectory}>
          <Users size={17} />
          Ver equipo
        </button>
      </div>
      <footer>
        <ShieldCheck size={15} />
        Tus conversaciones permanecen dentro de Novape.
      </footer>
    </div>
  );
}
export function Directory({ workers, user, search, onSearch, onDirect, busy }) {
  return (
    <>
      <div className="team-search directory-search">
        <Search size={17} />
        <input
          aria-label="Buscar trabajador por nombre o extensión"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Buscar nombre o extensión, por ejemplo 10235"
          maxLength={100}
        />
      </div>
      <div className="team-directory-grid">
        {workers.map((worker) => (
          <article key={worker.id}>
            <Avatar name={workerName(worker)} status={worker.availability} />
            <h3>
              {workerName(worker)}
              {Number(worker.id) === Number(user.id) && <small> Tú</small>}
            </h3>
            <p>{worker.role}</p>
            <div className="team-directory-meta">
              <span className={`team-status-dot ${worker.availability}`} />
              {availability[worker.availability]}
              <b>Ext. {worker.extension}</b>
            </div>
            {Number(worker.id) !== Number(user.id) && (
              <footer>
                <button onClick={() => onDirect(worker)} title="Abrir chat">
                  <MessageSquare size={17} />
                  Chat
                </button>
                <button
                  onClick={() => onDirect(worker, "audio")}
                  disabled={busy}
                  title="Llamar por voz"
                >
                  <Phone size={17} />
                </button>
                <button
                  onClick={() => onDirect(worker, "video")}
                  disabled={busy}
                  title="Llamar por vídeo"
                >
                  <Video size={18} />
                </button>
              </footer>
            )}
          </article>
        ))}
      </div>
      {!workers.length && <p>No encontramos trabajadores con esa búsqueda.</p>}
    </>
  );
}
export function CallsAndMeetings({ team, section, onDirectory, onChat, onEditMeeting, onCancelMeeting }) {
  const [cancelId, setCancelId] = useState(null);
  const upcoming = (team?.calls || [])
    .filter((call) => call.status === "scheduled")
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  return section === "calls" ? (
    <>
      <div className="team-call-summary">
        <div>
          <Phone size={21} />
          <span>
            Tu extensión<strong>{team?.profile?.extension || "…"}</strong>
          </span>
        </div>
        <div>
          <Video size={21} />
          <span>
            Llamadas en curso
            <strong>
              {
                (team?.calls || []).filter((call) =>
                  ["ringing", "active"].includes(call.status),
                ).length
              }
            </strong>
          </span>
        </div>
        <div>
          <Clock3 size={21} />
          <span>
            No atendidas
            <strong>
              {
                (team?.calls || []).filter(
                  (call) => call.end_reason === "missed",
                ).length
              }
            </strong>
          </span>
        </div>
      </div>
      <div className="team-dial-card">
        <Phone size={25} />
        <div>
          <strong>Tu próxima conversación está a un clic</strong>
          <p>Busca a una persona por su nombre o número interno.</p>
        </div>
        <button className="team-primary" onClick={onDirectory}>
          Abrir directorio
          <ArrowUpRight size={16} />
        </button>
      </div>
      <h3 className="team-section-subtitle">Historial de llamadas</h3>
      <div className="team-call-history">
        {(team?.calls || [])
          .filter((call) => call.status !== "scheduled")
          .map((call) => (
            <article key={call.id}>
              <span className="team-history-icon">
                {call.kind === "video" ? (
                  <Video size={19} />
                ) : (
                  <Phone size={19} />
                )}
              </span>
              <div>
                <strong>{call.title}</strong>
                <small>
                  {call.participants.map((p) => p.name).join(" · ")}
                </small>
              </div>
              <span className={`team-call-status ${call.status}`}>
                {call.end_reason === "missed"
                  ? "No atendida"
                  : call.end_reason === "cancelled" ? "Cancelada" : callStatus[call.status]}
              </span>
              {call.status !== "ended" && (
                <button
                  className="team-secondary"
                  onClick={() => team.join(call)}
                  disabled={team.busy}
                >
                  Unirse
                </button>
              )}
            </article>
          ))}
        {!(team?.calls || []).some((call) => call.status !== "scheduled") && (
          <div className="team-first-message">
            <Phone size={30} />
            <h3>Aquí aparecerán tus llamadas</h3>
            <p>El historial se guarda para todos los participantes.</p>
          </div>
        )}
      </div>
    </>
  ) : (
    <>
      <div className="team-meeting-intro">
        <span>
          <CalendarDays size={40} />
        </span>
        <div>
          <h3>Reuniones con propósito</h3>
          <p>
            Abre una conversación y elige «Programar reunión» para invitar a sus
            participantes. Puedes usar micrófono, cámara y compartir pantalla.
          </p>
        </div>
        <button className="team-primary" onClick={onChat}>
          Elegir chat
          <ArrowUpRight size={16} />
        </button>
      </div>
      <div className="team-meetings-grid">
        {upcoming.map((call) => (
          <article key={call.id}>
            <span className="team-meeting-date">
              {new Date(call.scheduled_at).toLocaleDateString("es-PE", {
                day: "2-digit",
                month: "short",
              })}
            </span>
            <div>
              <h3>{call.title}</h3>
              <p>
                {new Date(call.scheduled_at).toLocaleTimeString("es-PE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · {call.participants.length} invitados
              </p>
              <small>{call.participants.map((p) => p.name).join(" · ")}</small>
            </div>
            <button
              className="team-primary"
              onClick={() => team.join(call)}
              disabled={team.busy || (Number(call.created_by) !== Number(team.user.id) && new Date(call.scheduled_at).getTime() > Date.now() + 300000)}
            >
              Unirse
            </button>
            {Number(call.created_by) === Number(team.user.id) && <div className="team-meeting-actions">
              <button className="team-secondary" onClick={() => onEditMeeting(call)}>Editar</button>
              <button className="team-secondary" onClick={() => setCancelId(call.id)}>Cancelar reunión</button>
              {cancelId === call.id && <div role="alert">
                <p>¿Cancelar esta reunión para todos los invitados?</p>
                <button className="team-secondary" onClick={async () => { await onCancelMeeting(call); setCancelId(null); }}>Confirmar</button>
                <button className="team-secondary" onClick={() => setCancelId(null)}>Volver</button>
              </div>}
            </div>}
          </article>
        ))}
      </div>
      {!upcoming.length && <p>No tienes reuniones programadas.</p>}
    </>
  );
}
export function WorkspaceDialog({
  mode,
  onClose,
  title,
  setTitle,
  group,
  setGroup,
  workers,
  user,
  members,
  setMembers,
  search,
  setSearch,
  scheduled,
  setScheduled,
  onSubmit,
  busy,
  error,
  maxParticipants,
  ownerId,
  setOwnerId,
  currentMembers = [],
}) {
  const ref = useRef(null);
  const isMeeting = mode === "meeting" || mode === "meeting-edit";
  useDialog(Boolean(mode), ref, onClose);
  if (!mode) return null;
  return (
    <div className="team-modal-overlay" onClick={onClose}>
      <section
        className="team-modal"
        role="dialog"
        aria-modal="true"
        aria-label={
          isMeeting
            ? "Programar reunión"
            : mode === "manage"
              ? "Administrar grupo"
              : "Nueva conversación"
        }
        ref={ref}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <span className="team-modal-icon">
            {isMeeting ? (
              <CalendarDays size={22} />
            ) : (
              <Users size={22} />
            )}
          </span>
          <div>
            <h2>
              {isMeeting
                ? mode === "meeting-edit" ? "Edita la reunión" : "Programa una reunión"
                : mode === "manage"
                  ? "Tu grupo de trabajo"
                  : "Una nueva conversación"}
            </h2>
            <p>
              {isMeeting
                ? "Los miembros de este chat quedarán invitados."
                : "Busca por nombre o extensión interna."}
            </p>
          </div>
          <button onClick={onClose} aria-label="Cerrar diálogo">
            <X size={20} />
          </button>
        </header>
        <form onSubmit={onSubmit}>
          {error && (
            <p role="alert" className="team-modal-error">
              {error}
            </p>
          )}
          {isMeeting ? (
            <>
              <label>
                Título
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  maxLength={120}
                />
              </label>
              <label>
                Fecha y hora
                <input
                  type="datetime-local"
                  value={scheduled}
                  onChange={(event) => setScheduled(event.target.value)}
                  required
                  min={new Date(
                    Date.now() - new Date().getTimezoneOffset() * 60000,
                  )
                    .toISOString()
                    .slice(0, 16)}
                />
              </label>
              <small>Hora local de tu navegador ({Intl.DateTimeFormat().resolvedOptions().timeZone}).</small>
              <div className="team-meeting-note">
                <Video size={18} />
                <p>
                  Sala privada con cámara, voz y pantalla compartida. Hasta{" "}
                  {maxParticipants || 6} participantes conectados a la vez.
                </p>
              </div>
            </>
          ) : (
            <>
              {mode === "create" && (
                <div className="team-modal-mode">
                  <button
                    type="button"
                    className={!group ? "active" : ""}
                    onClick={() => {
                      setGroup(false);
                      setMembers((previous) => previous.slice(0, 1));
                    }}
                  >
                    Chat directo
                  </button>
                  <button
                    type="button"
                    className={group ? "active" : ""}
                    onClick={() => setGroup(true)}
                  >
                    Grupo de trabajo
                  </button>
                </div>
              )}
              {group && (
                <label>
                  Nombre del grupo
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={120}
                    required
                    placeholder="Ej. Equipo comercial"
                  />
                </label>
              )}
              <div className="team-search">
                <Search size={16} />
                <input
                  aria-label="Buscar participantes"
                  placeholder="Nombre o extensión"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="team-selected-members">
                {members.length} compañeros seleccionados (máximo 24)
                {members.map(id => {
                  const worker = workers.find(w => Number(w.id) === Number(id)) || currentMembers.find(w => Number(w.id) === Number(id));
                  return <button type="button" key={id} onClick={() => setMembers(previous => previous.filter(value => value !== id))} aria-label={`Quitar ${worker ? workerName(worker) : id}`}>{worker ? workerName(worker) : `Trabajador ${id}`} ×</button>;
                })}
              </div>
              {mode === "manage" && <label>Responsable del grupo
                <select value={ownerId || user.id} onChange={event => setOwnerId(Number(event.target.value))}>
                  {[Number(user.id), ...members].map(id => {
                    const worker = Number(user.id) === id ? user : workers.find(w => Number(w.id) === id) || currentMembers.find(w => Number(w.id) === id);
                    return <option key={id} value={id}>{worker ? workerName(worker) : `Trabajador ${id}`}</option>;
                  })}
                </select>
              </label>}
              <div className="team-modal-workers">
                {workers
                  .filter((w) => Number(w.id) !== Number(user.id))
                  .map((w) => (
                    <label key={w.id}>
                      <input
                        type="checkbox"
                        checked={members.includes(Number(w.id))}
                        disabled={busy || (group && members.length >= 24 && !members.includes(Number(w.id)))}
                        onChange={(event) =>
                          setMembers((previous) =>
                            event.target.checked
                              ? group
                                ? [...previous, Number(w.id)]
                                : [Number(w.id)]
                              : previous.filter((id) => id !== Number(w.id)),
                          )
                        }
                      />
                      <Avatar name={workerName(w)} status={w.availability} />
                      <div>
                        <strong>{workerName(w)}</strong>
                        <small>
                          Ext. {w.extension} · {availability[w.availability]}
                        </small>
                      </div>
                    </label>
                  ))}
              </div>
            </>
          )}
          <footer>
            <button type="button" className="team-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              className="team-primary"
              disabled={busy || (!isMeeting && !members.length)}
            >
              {busy
                ? "Guardando…"
                : isMeeting
                  ? mode === "meeting-edit" ? "Guardar cambios" : "Programar reunión"
                  : mode === "manage"
                    ? "Guardar grupo"
                    : "Abrir conversación"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
