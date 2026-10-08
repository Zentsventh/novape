import React, { useEffect, useRef, useState } from "react";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  MonitorUp,
  Hand,
  Users,
  MessageSquare,
  Settings,
  Minimize2,
  Maximize2,
  X,
  Volume2,
  Send,
  Clock3,
} from "lucide-react";
import { useTeamCalls } from "../../Contexts/TeamCallContext";
import { panelApi, panelError } from "../Admin/panelApi";
import useDialog from "../Admin/useDialog";

const initials = (name) =>
  name
    ?.split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("") || "N";
function VideoTile({ stream, name, self = false, participant, state }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
      ref.current.play().catch(() => {});
    }
  }, [stream]);
  const visible = participant?.video_enabled || participant?.screen_sharing;
  return (
    <div
      className={`team-video-tile ${participant?.screen_sharing ? "is-screen" : ""}`}
      data-peer-state={state || "local"}
    >
      <video
        ref={ref}
        autoPlay
        playsInline
        muted
        className={`${!visible ? "is-hidden" : ""} ${self && !participant?.screen_sharing ? "mirror" : ""}`}
      />
      {!visible && <div className="team-video-avatar">{initials(name)}</div>}
      <div className="team-video-label">
        <span>
          {name}
          {self ? " (tú)" : ""}
        </span>
        {participant?.hand_raised && <Hand size={16} />}{" "}
        {participant?.audio_muted && <MicOff size={14} />}
      </div>
      {!self && state !== "connected" && (
        <span className="team-peer-status">
          {state === "failed"
            ? "No se pudo conectar"
            : state === "disconnected"
              ? "Reconectando…"
              : "Conectando…"}
        </span>
      )}
    </div>
  );
}
function MeetingChat({ thread }) {
  const [messages, setMessages] = useState([]),
    [body, setBody] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const bottom = useRef(null);
  const refresh = async () => {
    try {
      const data = await panelApi(`/admin/api/team/threads/${thread}/messages`);
      setMessages(data.data);
    } catch (e) {
      setError(panelError(e));
    }
  };
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 4000);
    return () => clearInterval(timer);
  }, [thread]);
  useEffect(
    () => bottom.current?.scrollIntoView({ block: "nearest" }),
    [messages.at(-1)?.id],
  );
  const send = async (event) => {
    event.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true);
    try {
      await panelApi(`/admin/api/team/threads/${thread}/messages`, {
        body,
        request_id: crypto.randomUUID(),
      });
      setBody("");
      await refresh();
    } catch (e) {
      setError(panelError(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="team-meeting-chat">
      {error && <p role="alert">{error}</p>}
      <div>
        {messages
          .filter((message) => !message.call_id)
          .map((message) => (
            <article key={message.id}>
              <strong>{message.nombres}</strong>
              <p>
                {message.deleted_at
                  ? "Mensaje eliminado"
                  : message.body || "Archivo compartido"}
              </p>
            </article>
          ))}
        <div ref={bottom} />
      </div>
      <form onSubmit={send}>
        <textarea
          aria-label="Mensaje en la reunión"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={5000}
          placeholder="Escribe al equipo…"
        />
        <button
          disabled={busy || !body.trim()}
          aria-label="Enviar al chat de la reunión"
        >
          <Send size={17} />
        </button>
      </form>
    </div>
  );
}
export default function TeamCallDock() {
  const team = useTeamCalls();
  const dialog = useRef(null);
  const [side, setSide] = useState(null),
    [elapsed, setElapsed] = useState(0);
  const close = React.useCallback(
    () => team.setMinimized(true),
    [team.setMinimized],
  );
  useDialog(Boolean(team.call && !team.minimized), dialog, close);
  useEffect(() => {
    const timer = setInterval(
      () =>
        setElapsed(
          team.call?.started_at
            ? Math.max(
                0,
                Math.floor(
                  (Date.now() - new Date(team.call.started_at).getTime()) /
                    1000,
                ),
              )
            : 0,
        ),
      1000,
    );
    return () => clearInterval(timer);
  }, [team.call?.started_at]);
  const incoming = team.calls.filter(
    (call) =>
      call.id !== team.call?.id &&
      ["ringing", "active"].includes(call.status) &&
      ["invited", "joined"].includes(call.self),
  );
  useEffect(() => {
    if (
      !incoming[0] ||
      !document.hidden ||
      !("Notification" in window) ||
      Notification.permission !== "granted"
    )
      return;
    const notice = new Notification(
      incoming[0].self === "joined"
        ? "Tu llamada sigue abierta"
        : "Llamada de equipo",
      { body: incoming[0].title, tag: incoming[0].id },
    );
    notice.onclick = () => {
      window.focus();
      notice.close();
    };
    return () => notice.close();
  }, [incoming[0]?.id]);
  const activateAudio = () => {
    document
      .querySelectorAll(".team-remote-audio")
      .forEach((audio) => audio.play().catch(() => {}));
    team.setAudioBlocked(false);
  };
  const own = team.call?.participants.find(
    (p) => Number(p.user_id) === Number(team.user.id),
  );
  const joined =
    team.call?.participants.filter((p) => p.state === "joined") || [];
  const duration = `${Math.floor(elapsed / 60)
    .toString()
    .padStart(2, "0")}:${(elapsed % 60).toString().padStart(2, "0")}`;
  return (
    <>
      {team.error && (
        <div className="team-global-error" role="alert">
          <span>{team.error}</span>
          <button onClick={() => team.setError("")} aria-label="Cerrar aviso">
            <X size={16} />
          </button>
        </div>
      )}
      {incoming.length > 0 && !team.call && (
        <div
          className="team-incoming"
          role="dialog"
          aria-label="Llamada entrante"
        >
          <div className="team-incoming-icon">
            {incoming[0].kind === "video" ? (
              <Video size={27} />
            ) : (
              <Phone size={27} />
            )}
          </div>
          <small>
            {incoming[0].self === "joined"
              ? "LLAMADA ABIERTA EN OTRA SESIÓN"
              : "LLAMADA ENTRANTE"}
          </small>
          <h3>
            {
              incoming[0].participants.find(
                (p) => p.user_id === incoming[0].created_by,
              )?.name
            }
          </h3>
          <p>
            {incoming[0].title} ·{" "}
            {incoming[0].kind === "video" ? "Videollamada" : "Llamada de voz"}
          </p>
          <div>
            <button
              className="decline"
              onClick={() => team.decline(incoming[0])}
              disabled={team.busy || incoming[0].self === "joined"}
            >
              <PhoneOff size={18} /> Rechazar
            </button>
            <button
              className="accept"
              onClick={() => team.join(incoming[0])}
              disabled={team.busy}
            >
              <Phone size={18} />
              {incoming[0].self === "joined" ? "Retomar aquí" : "Responder"}
            </button>
          </div>
          {incoming[0].kind === "video" && (
            <button
              className="team-text-button"
              onClick={() => team.join(incoming[0], false)}
              disabled={team.busy}
            >
              Responder solo con audio
            </button>
          )}
        </div>
      )}
      {team.call && team.minimized && (
        <div className="team-call-mini">
          <span className="team-live-dot" />
          <div>
            <strong>{team.call.title}</strong>
            <small>
              {duration} · {joined.length} participantes
            </small>
          </div>
          <button
            onClick={() => team.setMinimized(false)}
            aria-label="Abrir llamada"
          >
            <Maximize2 size={17} />
          </button>
          <button
            className="danger"
            onClick={() => team.leave()}
            aria-label="Colgar"
          >
            <PhoneOff size={18} />
          </button>
        </div>
      )}
      {team.call && !team.minimized && (
        <div className="team-call-overlay">
          <section
            className="team-call-room"
            ref={dialog}
            role="dialog"
            aria-modal="true"
            aria-label="Reunión de equipo"
            tabIndex={-1}
          >
            <header>
              <div className="team-call-brand">
                <Video size={22} />
                <div>
                  <strong>{team.call.title}</strong>
                  <small>
                    {team.call.status === "ringing"
                      ? "Llamando al equipo…"
                      : `${duration} · Reunión en curso`}
                  </small>
                </div>
              </div>
              <div>
                <span className="team-call-privacy">
                  Acceso privado · {joined.length}/{team.call.max_participants}
                </span>
                <button
                  onClick={() => team.setMinimized(true)}
                  aria-label="Minimizar reunión"
                >
                  <Minimize2 size={18} />
                </button>
                <button
                  onClick={() =>
                    dialog.current?.requestFullscreen?.().catch(() => {})
                  }
                  aria-label="Pantalla completa"
                >
                  <Maximize2 size={18} />
                </button>
              </div>
            </header>
            {team.audioBlocked && (
              <div className="team-audio-banner">
                <Volume2 size={17} />
                El navegador pausó el audio.
                <button onClick={activateAudio}>Activar sonido</button>
              </div>
            )}
            <div className={`team-call-body ${side ? "with-side" : ""}`}>
              <div
                className={`team-video-grid ${team.peers.some((peer) => peer.participant.screen_sharing) || team.sharing ? "has-screen" : ""}`}
              >
                <VideoTile
                  stream={team.preview}
                  name={`${team.user.nombres} ${team.user.apellidos || ""}`}
                  self
                  participant={{
                    ...own,
                    video_enabled: team.camera,
                    screen_sharing: team.sharing,
                    audio_muted: team.muted,
                    hand_raised: team.hand,
                  }}
                />
                {team.peers.map((peer) => (
                  <VideoTile
                    key={peer.id}
                    stream={peer.stream}
                    name={peer.participant.name}
                    participant={peer.participant}
                    state={peer.state}
                  />
                ))}
                {team.peers.length === 0 && (
                  <div className="team-call-waiting">
                    <Users size={35} />
                    <h3>
                      {team.call.status === "ringing"
                        ? "Esperando respuesta"
                        : "Esperando a tus compañeros"}
                    </h3>
                    <p>Tu micrófono y cámara están bajo tu control.</p>
                  </div>
                )}
              </div>
              {side && (
                <aside className="team-call-side">
                  <header>
                    <strong>
                      {side === "chat"
                        ? "Chat de la reunión"
                        : side === "devices"
                          ? "Dispositivos"
                          : "Participantes"}
                    </strong>
                    <button
                      onClick={() => setSide(null)}
                      aria-label="Cerrar panel"
                    >
                      <X size={17} />
                    </button>
                  </header>
                  {side === "chat" ? (
                    <MeetingChat thread={team.call.thread_id} />
                  ) : side === "devices" ? (
                    <div className="team-device-list">
                      <label>
                        Micrófono
                        <select
                          aria-label="Seleccionar micrófono"
                          onChange={(e) =>
                            team.changeDevice("audio", e.target.value)
                          }
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Elegir dispositivo
                          </option>
                          {team.devices
                            .filter((d) => d.kind === "audioinput")
                            .map((d) => (
                              <option key={d.deviceId} value={d.deviceId}>
                                {d.label || "Micrófono"}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label>
                        Cámara
                        <select
                          aria-label="Seleccionar cámara"
                          onChange={(e) =>
                            team.changeDevice("video", e.target.value)
                          }
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Elegir dispositivo
                          </option>
                          {team.devices
                            .filter((d) => d.kind === "videoinput")
                            .map((d) => (
                              <option key={d.deviceId} value={d.deviceId}>
                                {d.label || "Cámara"}
                              </option>
                            ))}
                        </select>
                      </label>
                      <p>
                        La captura de pantalla se elige en el selector de
                        seguridad del navegador.
                      </p>
                    </div>
                  ) : (
                    <div className="team-call-participants">
                      {team.call.participants.map((p) => (
                        <div key={p.user_id}>
                          <span className="team-avatar">
                            {initials(p.name)}
                          </span>
                          <div>
                            <strong>{p.name}</strong>
                            <small>
                              {p.state === "joined"
                                ? "En la reunión"
                                : p.state === "invited"
                                  ? "Invitado"
                                  : p.state === "declined"
                                    ? "Rechazó la llamada"
                                    : "Salió"}
                            </small>
                          </div>
                          {p.hand_raised && <Hand size={17} />}
                        </div>
                      ))}
                    </div>
                  )}
                </aside>
              )}
            </div>
            <footer>
              <div className="team-call-controls">
                <button
                  onClick={team.toggleMute}
                  className={team.muted ? "off" : ""}
                  aria-pressed={team.muted}
                  title={
                    team.muted ? "Activar micrófono" : "Silenciar micrófono"
                  }
                >
                  {team.muted ? <MicOff /> : <Mic />}
                  <span>Micrófono</span>
                </button>
                <button
                  onClick={team.toggleCamera}
                  className={!team.camera ? "off" : ""}
                  aria-pressed={team.camera}
                  title={team.camera ? "Apagar cámara" : "Activar cámara"}
                >
                  {team.camera ? <Video /> : <VideoOff />}
                  <span>Cámara</span>
                </button>
                <button
                  onClick={team.shareScreen}
                  className={team.sharing ? "active" : ""}
                  aria-pressed={team.sharing}
                  title={
                    team.sharing
                      ? "Dejar de compartir pantalla"
                      : "Compartir pantalla"
                  }
                >
                  <MonitorUp />
                  <span>{team.sharing ? "Detener" : "Compartir"}</span>
                </button>
                <button
                  onClick={() => team.setHand(!team.hand)}
                  className={team.hand ? "active" : ""}
                  aria-pressed={team.hand}
                  title="Levantar la mano"
                >
                  <Hand />
                  <span>Mano</span>
                </button>
                <button
                  onClick={() => setSide(side === "people" ? null : "people")}
                  title="Ver participantes"
                >
                  <Users />
                  <span>Personas</span>
                </button>
                <button
                  onClick={() => setSide(side === "chat" ? null : "chat")}
                  title="Chat de la reunión"
                >
                  <MessageSquare />
                  <span>Chat</span>
                </button>
                <button
                  onClick={() => setSide(side === "devices" ? null : "devices")}
                  title="Dispositivos"
                >
                  <Settings />
                  <span>Ajustes</span>
                </button>
                <button
                  onClick={() => team.leave()}
                  className="hangup"
                  title="Colgar"
                >
                  <PhoneOff />
                  <span>Salir</span>
                </button>
              </div>
              {Number(team.call.created_by) === Number(team.user.id) && (
                <button
                  className="team-end-all"
                  onClick={() => team.leave(true)}
                >
                  Finalizar para todos
                </button>
              )}
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
