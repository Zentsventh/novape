import React from "react";
import { Reply, Pencil, Trash2, CheckCheck, Phone, Video } from "lucide-react";
import {
  Avatar,
  Attachment,
  workerName,
  time,
  callStatus,
} from "./WorkspaceViews";

export default function TeamMessage({
  message,
  user,
  thread,
  onAction,
  onQuote,
  onEdit,
  onJoin,
  busy,
}) {
  const own = Number(message.user_id) === Number(user.id);
  const [confirm, setConfirm] = React.useState(false);
  return (
    <article
      className={`team-message-row ${own ? "own" : ""} ${message.deleted_at ? "deleted" : ""}`}
    >
      <Avatar name={workerName(message)} />
      <div className="team-message-content">
        <div className="team-message-meta">
          <strong>{own ? "Tú" : workerName(message)}</strong>
          <time>{time(message.created_at)}</time>
          {message.edited_at && <small>Editado</small>}
          {Boolean(message.important) && !message.deleted_at && (
            <span className="team-important-label">Importante</span>
          )}
        </div>
        <div className="team-message-bubble">
          {message.reply && !message.deleted_at && (
            <blockquote>
              <strong>{message.reply.name}</strong>
              <p>{message.reply.body}</p>
            </blockquote>
          )}
          {message.call ? (
            <div className="team-call-card">
              <span>
                {message.call.kind === "video" ? (
                  <Video size={23} />
                ) : (
                  <Phone size={23} />
                )}
              </span>
              <div>
                <strong>{message.call.title}</strong>
                <small>
                  {callStatus[message.call.status]}
                  {message.call.scheduled_at
                    ? ` · ${new Date(message.call.scheduled_at).toLocaleString("es-PE")}`
                    : ""}
                </small>
              </div>
              {message.call.status !== "ended" && (
                <button onClick={() => onJoin(message.call)} disabled={busy}>
                  Unirse
                </button>
              )}
            </div>
          ) : (
            <>
              {message.deleted_at ? (
                <p className="team-deleted-text">Este mensaje fue eliminado.</p>
              ) : (
                message.body && <p>{message.body}</p>
              )}
              {message.attachments?.map((file) => (
                <Attachment key={file.id} file={file} />
              ))}
            </>
          )}
          {message.reactions?.length > 0 && (
            <div className="team-reactions">
              {message.reactions.map((reaction) => (
                <button
                  key={reaction.emoji}
                  disabled={busy}
                  className={reaction.mine ? "mine" : ""}
                  onClick={() =>
                    onAction(message, "reaction", {
                      emoji: reaction.emoji,
                      active: !reaction.mine,
                    })
                  }
                >
                  {reaction.emoji}
                  <span>{reaction.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {own && !message.deleted_at && (
          <small className="team-read-status">
            <CheckCheck size={12} />
            <span title={thread.members.filter(member => Number(member.id) !== Number(user.id) && Number(member.last_read_id) >= message.id).map(workerName).join(", ")}>
            {thread.members.filter(
              (member) =>
                Number(member.id) !== Number(user.id) &&
                Number(member.last_read_id) >= message.id,
            ).length
              ? "Leído"
              : "Enviado"}
            </span>
          </small>
        )}
        {!message.deleted_at && !message.call_id && (
          <div className="team-message-tools">
            {["👍", "❤️", "😂", "🎉"].map((reaction) => (
              <button
                key={reaction}
                disabled={busy}
                title={`Reaccionar ${reaction}`}
                onClick={() =>
                  onAction(message, "reaction", {
                    emoji: reaction,
                    active: !message.reactions?.find(
                      (item) => item.emoji === reaction,
                    )?.mine,
                  })
                }
              >
                {reaction}
              </button>
            ))}
            <button
              title="Responder a este mensaje"
              disabled={busy}
              onClick={() => onQuote(message)}
            >
              <Reply size={14} />
            </button>
            {message.can_edit && (
              <button title="Editar mensaje" disabled={busy} onClick={() => onEdit(message)}>
                <Pencil size={14} />
              </button>
            )}
            {message.can_delete && (
              <button
                title="Eliminar mensaje"
                disabled={busy}
                onClick={() => setConfirm(!confirm)}
              >
                <Trash2 size={14} />
              </button>
            )}
            {confirm && (
              <span className="team-delete-confirm">
                ¿Eliminar?
                <button
                  onClick={() => {
                    onAction(message, "delete");
                    setConfirm(false);
                  }}
                >
                  Sí
                </button>
                <button onClick={() => setConfirm(false)}>Cancelar</button>
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
