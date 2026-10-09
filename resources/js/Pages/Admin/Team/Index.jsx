import React, { useCallback, useEffect, useRef, useState } from "react";
import { Head, usePage } from "@inertiajs/react";
import {
  MessageSquare,
  Users,
  Phone,
  Video,
  CalendarDays,
  Search,
  Plus,
  Send,
  Paperclip,
  Mic,
  Square,
  X,
  FileText,
  Download,
  ChevronLeft,
  MoreHorizontal,
  Pin,
  BellOff,
  Reply,
  Smile,
  CheckCheck,
  Star,
  ShieldCheck,
  Hash,
  Loader2,
} from "lucide-react";
import TwentyCrmLayout from "../../../Layouts/TwentyCrmLayout";
import { panelApi, panelError } from "../../../Components/Admin/panelApi";
import { useTeamCalls } from "../../../Contexts/TeamCallContext";
import {
  Avatar,
  PendingFile,
  Welcome,
  Directory,
  CallsAndMeetings,
  WorkspaceDialog,
  workerName,
  fileSize,
  parseDate,
  time,
  availability,
} from "../../../Components/Team/WorkspaceViews";
import TeamMessage from "../../../Components/Team/TeamMessage";
import "../../../../css/admin/team-workspace.css";

export default function Index() {
  const user = usePage().props.auth.user,
    team = useTeamCalls();
  const [threads, setThreads] = useState([]),
    [active, setActive] = useState(() =>
      typeof window === "undefined"
        ? null
        : Number(new URLSearchParams(window.location.search).get("thread")) ||
          null,
    ),
    [messages, setMessages] = useState([]),
    [workers, setWorkers] = useState([]),
    [draftOwner, setDraftOwner] = useState(null);
  const [section, setSection] = useState("chat"),
    [filter, setFilter] = useState("all"),
    [search, setSearch] = useState(""),
    [directorySearch, setDirectorySearch] = useState(""),
    [messageSearch, setMessageSearch] = useState("");
  const [body, setBody] = useState(""),
    [files, setFiles] = useState([]),
    [reply, setReply] = useState(null),
    [important, setImportant] = useState(false),
    [editing, setEditing] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [more, setMore] = useState(false),
    [recording, setRecording] = useState(false),
    [recordTime, setRecordTime] = useState(0),
    [drag, setDrag] = useState(false),
    [mobileChat, setMobileChat] = useState(Boolean(active)),
    [tab, setTab] = useState("messages"),
    [sharedFiles, setSharedFiles] = useState([]),
    [filePage, setFilePage] = useState(1),
    [fileLast, setFileLast] = useState(1);
  const [modal, setModal] = useState(null),
    [title, setTitle] = useState(""),
    [memberIds, setMemberIds] = useState([]),
    [modalSearch, setModalSearch] = useState(""),
    [group, setGroup] = useState(false),
    [scheduledAt, setScheduledAt] = useState(""),
    [emoji, setEmoji] = useState(false),
    [menu, setMenu] = useState(false),
    [meetingToEdit, setMeetingToEdit] = useState(null),
    [ownerId, setOwnerId] = useState(null),
    [leaveConfirm, setLeaveConfirm] = useState(false);
  const current = useRef(active),
    query = useRef(""),
    draft = useRef({}),
    latest = useRef(0),
    scroll = useRef(null),
    fileInput = useRef(null),
    recorder = useRef(null),
    recordStream = useRef(null),
    recordThread = useRef(null),
    cancelRecording = useRef(false),
    pending = useRef(null),
    refreshing = useRef(false),
    sequence = useRef(0),
    typingAt = useRef(0),
    hasOlder = useRef(false),
    notificationBaseline = useRef(null),
    beforeEdit = useRef(null),
    loadedMessages = useRef([]),
    viewing = useRef(false);
  current.current = active;
  loadedMessages.current = messages;
  viewing.current = section === "chat" && tab === "messages" && (typeof window === "undefined" || !window.matchMedia("(max-width: 768px)").matches || mobileChat);
  query.current = messageSearch;
  draft.current = { body, reply, important };
  const label = (thread) =>
    thread.direct_key
      ? thread.members
          .filter((member) => Number(member.id) !== Number(user.id))
          .map(workerName)
          .join(", ")
      : thread.title;
  const selected = threads.find(
    (thread) => Number(thread.id) === Number(active),
  );
  const remember = (id, value) => {
    if (!id) return;
    try {
      const key = `novape.team.draft.${user.id}.${id}`;
      value.body || value.reply
        ? sessionStorage.setItem(key, JSON.stringify(value))
        : sessionStorage.removeItem(key);
    } catch {}
  };
  const restore = (id) => {
    try {
      return (
        JSON.parse(
          sessionStorage.getItem(`novape.team.draft.${user.id}.${id}`),
        ) || {}
      );
    } catch {
      return {};
    }
  };
  const merge = (data) =>
    setMessages((previous) => {
      const map = new Map(previous.map((message) => [message.id, message]));
      data.forEach((message) => map.set(message.id, message));
      return [...map.values()].sort((a, b) => a.id - b.id);
    });
  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    const id = current.current,
      q = query.current;
    try {
      const updatedThreads = await panelApi("/admin/api/team/threads");
      if (notificationBaseline.current && typeof Notification !== "undefined" && Notification.permission === "granted") {
        for (const thread of updatedThreads) {
          const previous = notificationBaseline.current.get(thread.id);
          if (previous !== undefined && thread.last_message_id > previous && !thread.muted && Number(thread.last_message_user_id) !== Number(user.id) && (Number(current.current) !== Number(thread.id) || document.hidden)) {
            const notification = new Notification(label(thread), {body:thread.preview,tag:`team-thread-${thread.id}`});
            notification.onclick = () => {window.focus();setActive(thread.id);setSection("chat");setMobileChat(true);notification.close();};
          }
        }
      }
      notificationBaseline.current = new Map(updatedThreads.map(thread => [thread.id, thread.last_message_id || 0]));
      setThreads(updatedThreads);
      if (!id) return;
      if (!updatedThreads.some(thread => Number(thread.id) === Number(id))) {
        current.current = null;
        setActive(null);
        setMessages([]);
        return;
      }
      const result = await panelApi(
        `/admin/api/team/threads/${id}/messages${q ? "?q=" + encodeURIComponent(q) : ""}`,
      );
      if (current.current !== id || query.current !== q) return;
      // Refresh older loaded messages as well: edits, deletions and reactions can
      // occur outside the most recent page.
      const oldIds = loadedMessages.current.filter(message => message.id < (result.data[0]?.id ?? Infinity)).map(message => message.id);
      if (oldIds.length) {
        for (let offset = 0; offset < oldIds.length; offset += 200) {
          const params = new URLSearchParams();
          if (q) params.set("q", q);
          oldIds.slice(offset, offset + 200).forEach(value => params.append("ids[]", value));
          const older = await panelApi(`/admin/api/team/threads/${id}/messages?${params}`);
          if (current.current !== id || query.current !== q) return;
          if (q) {
            const chunk = new Set(oldIds.slice(offset, offset + 200));
            setMessages(previous => previous.filter(message => !chunk.has(message.id)));
          }
          merge(older.data);
        }
      }
      const near =
        scroll.current &&
        scroll.current.scrollHeight -
          scroll.current.scrollTop -
          scroll.current.clientHeight <
          100;
      if (q && !hasOlder.current) setMessages(result.data);
      else merge(result.data);
      if (!hasOlder.current) setMore(result.has_more);
      const last = result.data.at(-1)?.id;
      if (last && last > latest.current && !q && !document.hidden && viewing.current && near) {
        await panelApi(`/admin/api/team/threads/${id}/read`, {
          message_id: last,
        });
        latest.current = last;
        setThreads((previous) =>
          previous.map((thread) =>
            Number(thread.id) === Number(id)
              ? { ...thread, unread: 0 }
              : thread,
          ),
        );
      }
      if (near)
        requestAnimationFrame(() =>
          scroll.current?.scrollTo({
            top: scroll.current.scrollHeight,
            behavior: "smooth",
          }),
        );
    } catch (failure) {
      setError(panelError(failure));
    } finally {
      refreshing.current = false;
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh();
    const timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, 4000);
    const channel = window.Echo?.private(`novape-team.user.${user.id}`);
    channel?.listen(".team.updated", refresh);
    return () => {
      clearInterval(timer);
      channel?.stopListening(".team.updated", refresh);
    };
  }, [refresh, user.id]);
  useEffect(() => {
    latest.current = 0;
    hasOlder.current = false;
    setMessages([]);
    setMore(false);
    setTab("messages");
    setMessageSearch("");
    query.current = "";
    setLoading(true);
    setEditing(null);
    setFiles([]);
    setMenu(false);
    setLeaveConfirm(false);
    setSharedFiles([]);
    setFilePage(1);
    beforeEdit.current = null;
    pending.current = null;
    const value = restore(active);
    setDraftOwner(active);
    setBody(value.body || "");
    setReply(value.reply || null);
    setImportant(Boolean(value.important));
    const epoch = ++sequence.current;
    if (!active) {
      setLoading(false);
      return;
    }
    panelApi(`/admin/api/team/threads/${active}/messages`)
      .then((result) => {
        if (sequence.current !== epoch) return;
        setMessages(result.data);
        setMore(result.has_more);
        requestAnimationFrame(() =>
          scroll.current?.scrollTo({ top: scroll.current.scrollHeight }),
        );
        const last = result.data.at(-1)?.id;
        if (last && viewing.current && !document.hidden) {
          latest.current = last;
          panelApi(`/admin/api/team/threads/${active}/read`, {
            message_id: last,
          })
            .then(refresh)
            .catch(() => {});
        }
      })
      .catch((failure) => {
        if (sequence.current === epoch) setError(panelError(failure));
      })
      .finally(() => {
        if (sequence.current === epoch) setLoading(false);
      });
  }, [active]);
  useEffect(() => {
    const visible = () => { if (!document.hidden) refresh(); };
    document.addEventListener("visibilitychange", visible);
    return () => document.removeEventListener("visibilitychange", visible);
  }, [refresh]);
  useEffect(() => {
    if (modal === "manage" && ownerId && Number(ownerId) !== Number(user.id) && !memberIds.includes(Number(ownerId))) setOwnerId(Number(user.id));
  }, [modal, ownerId, memberIds, user.id]);
  useEffect(() => { if (section === "chat" && tab === "messages") refresh(); }, [section, tab, refresh]);
  useEffect(() => {
    if (draftOwner === active && !editing)
      remember(active, { body, reply, important });
  }, [active, draftOwner, body, reply, important, editing]);
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      () =>
        panelApi(
          "/admin/api/team/workers?q=" +
            encodeURIComponent(modal ? modalSearch : directorySearch),
        )
          .then((data) => {
            if (!cancelled) setWorkers(data);
          })
          .catch((failure) => {
            if (!cancelled) setError(panelError(failure));
          }),
      250,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [directorySearch, modalSearch, modal]);
  useEffect(() => {
    if (!active || tab !== "files") return;
    const id = active;
    panelApi(`/admin/api/team/threads/${active}/files?page=${filePage}`)
      .then((data) => {
        if (current.current === id) {
          setSharedFiles(data.data);
          setFileLast(data.last_page);
        }
      })
      .catch((failure) => setError(panelError(failure)));
  }, [active, tab, filePage]);
  useEffect(() => {
    if (!active || !messageSearch) return;
    hasOlder.current = false;
    let cancelled = false;
    const id = active;
    const timer = setTimeout(() => {
      panelApi(
        `/admin/api/team/threads/${id}/messages?q=${encodeURIComponent(messageSearch)}`,
      )
        .then((result) => {
          if (!cancelled && current.current === id) {
            setMessages(result.data);
            setMore(result.has_more);
          }
        })
        .catch((failure) => {
          if (!cancelled) setError(panelError(failure));
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [active, messageSearch]);
  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => {
      setRecordTime((value) => {
        if (value >= 299) {
          recorder.current?.stop();
          setRecording(false);
        }
        return value + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [recording]);
  useEffect(() => {
    const escape = (event) => {
      if (event.key === "Escape") {
        setEmoji(false);
        setMenu(false);
        setModal(null);
      }
    };
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("keydown", escape);
      cancelRecording.current = true;
      if (recorder.current?.state === "recording") recorder.current.stop();
      recordStream.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);
  const choose = (id) => {
    if (busy || recording) return;
    remember(active, editing ? beforeEdit.current || {} : draft.current);
    current.current = id;
    setActive(id);
    setMobileChat(true);
    setSection("chat");
  };
  const direct = async (worker, kind) => {
    setError("");
    try {
      const thread = await panelApi("/admin/api/team/threads", {
        members: [worker.id],
      });
      await refresh();
      choose(thread.id);
      if (kind) await team.startCall(thread.id, kind);
    } catch (failure) {
      setError(panelError(failure));
    }
  };
  const addFiles = (incoming) => {
    if (editing) return;
    if (recording || files.some((file) => file.voice)) {
      setError(
        "Envía o retira la nota de voz antes de adjuntar otros archivos.",
      );
      return;
    }
    if (
      incoming.length + files.length > 6 ||
      incoming.some((file) => file.size > 20 * 1048576) ||
      [...files, ...incoming].reduce((sum, file) => sum + file.size, 0) >
        40 * 1048576
    ) {
      setError("Hasta 6 archivos, 20 MB por archivo y 40 MB por mensaje.");
      return;
    }
    setFiles((previous) => [...previous, ...incoming]);
    pending.current = null;
  };
  const startRecording = async () => {
    if (files.length || busy) {
      setError("Envía primero los archivos seleccionados.");
      return;
    }
    try {
      if (
        !window.isSecureContext ||
        !navigator.mediaDevices?.getUserMedia ||
        !window.MediaRecorder
      )
        throw Error(
          "La grabación requiere HTTPS o localhost y un navegador compatible.",
        );
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      recordStream.current = stream;
      recordThread.current = active;
      cancelRecording.current = false;
      const chunks = [],
        type = [
          "audio/webm;codecs=opus",
          "audio/mp4",
          "audio/ogg;codecs=opus",
        ].find((value) => MediaRecorder.isTypeSupported(value));
      const instance = new MediaRecorder(
        stream,
        type ? { mimeType: type } : undefined,
      );
      recorder.current = instance;
      instance.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      instance.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (cancelRecording.current || current.current !== recordThread.current)
          return;
        const mime = instance.mimeType,
          extension = mime.includes("mp4")
            ? "m4a"
            : mime.includes("ogg")
              ? "ogg"
              : "webm";
        const file = new File(
          [new Blob(chunks, { type: mime })],
          `Nota-de-voz-${Date.now()}.${extension}`,
          { type: mime },
        );
        file.voice = true;
        if (file.size > 20 * 1048576) setError("La nota supera 20 MB.");
        else setFiles([file]);
      };
      instance.start(500);
      setRecording(true);
      setRecordTime(0);
    } catch (failure) {
      recordStream.current?.getTracks().forEach((track) => track.stop());
      setError(
        failure.name === "NotAllowedError"
          ? "Permite el acceso al micrófono para grabar."
          : failure.message,
      );
    }
  };
  const stopRecording = (cancel) => {
    cancelRecording.current = cancel;
    if (recorder.current?.state === "recording") recorder.current.stop();
    setRecording(false);
  };
  const cancelEdit = () => {
    const saved = beforeEdit.current || {};
    setEditing(null);setBody(saved.body || "");setReply(saved.reply || null);setImportant(Boolean(saved.important));setFiles(saved.files || []);beforeEdit.current=null;
  };
  const send = async (event) => {
    event.preventDefault();
    if (busy || recording || !active || (!body.trim() && !files.length)) return;
    const id = active;
    setBusy(true);
    setError("");
    try {
      if (editing) {
        await panelApi(
          `/admin/api/team/threads/${id}/messages/${editing.id}/edit`,
          { body },
        );
        cancelEdit();
        await refresh();
        return;
      } else {
        const signature = JSON.stringify([
          body,
          reply?.id,
          important,
          files.map((file) => [file.name, file.size, file.lastModified]),
        ]);
        if (pending.current?.signature !== signature)
          pending.current = { signature, id: crypto.randomUUID() };
        const data = new FormData();
        data.append("body", body);
        data.append("request_id", pending.current.id);
        data.append("important", important ? "1" : "0");
        if (reply) data.append("reply_to_id", reply.id);
        if (files.some((file) => file.voice)) data.append("kind", "voice");
        files.forEach((file, index) =>
          data.append(`attachments[${index}]`, file),
        );
        const message = await panelApi(
          `/admin/api/team/threads/${id}/messages`,
          data,
        );
        if (current.current === id) merge([message]);
        pending.current = null;
      }
      setBody("");
      setReply(null);
      setFiles([]);
      setImportant(false);
      remember(id, {});
      await refresh();
      requestAnimationFrame(() =>
        scroll.current?.scrollTo({
          top: scroll.current.scrollHeight,
          behavior: "smooth",
        }),
      );
    } catch (failure) {
      setError(panelError(failure));
    } finally {
      setBusy(false);
    }
  };
  const older = async () => {
    if (!messages[0]) return;
    const id = active,
      previous = scroll.current?.scrollHeight;
    try {
      const result = await panelApi(
        `/admin/api/team/threads/${id}/messages?before=${messages[0].id}${messageSearch ? "&q=" + encodeURIComponent(messageSearch) : ""}`,
      );
      if (current.current !== id) return;
      merge(result.data);
      hasOlder.current = true;
      setMore(result.has_more);
      requestAnimationFrame(() => {
        if (scroll.current)
          scroll.current.scrollTop += scroll.current.scrollHeight - previous;
      });
    } catch (failure) {
      setError(panelError(failure));
    }
  };
  const act = async (message, action, data) => {
    try {
      await panelApi(
        `/admin/api/team/threads/${active}/messages/${message.id}/${action}`,
        data || {},
      );
      await refresh();
    } catch (failure) {
      setError(panelError(failure));
    }
  };
  const preference = async (data) => {
    try {
      await panelApi(`/admin/api/team/threads/${active}/preferences`, data);
      await refresh();
    } catch (failure) {
      setError(panelError(failure));
    }
  };
  const dismiss = useCallback(() => setModal(null), []);
  const leaveGroup = async () => {
    setBusy(true);
    try {
      await panelApi(`/admin/api/team/threads/${active}/leave`, {});
      remember(active, {});
      current.current = null;
      setActive(null);
      setLeaveConfirm(false);
      await refresh();
      await team.refreshCalls();
    } catch (failure) { setError(panelError(failure)); }
    finally { setBusy(false); }
  };
  const editMeeting = (call) => {
    const date = new Date(call.scheduled_at);
    setMeetingToEdit(call);
    setTitle(call.title);
    setScheduledAt(new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    setError("");
    setModal("meeting-edit");
  };
  const cancelMeeting = async (call) => {
    try {
      await panelApi(`/admin/api/team/calls/${call.id}/meeting`, {cancel:true});
      await team.refreshCalls();
      await refresh();
    } catch (failure) { setError(panelError(failure)); }
  };
  const openCreate = () => {
    setModal("create");
    setTitle("");
    setMemberIds([]);
    setModalSearch("");
    setGroup(false);
  };
  const openManage = () => {
    setModal("manage");
    setGroup(true);
    setTitle(selected.title);
    setOwnerId(Number(selected.created_by));
    setMemberIds(
      selected.members
        .filter((member) => Number(member.id) !== Number(user.id))
        .map((member) => Number(member.id)),
    );
    setModalSearch("");
  };
  const saveModal = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (modal === "meeting-edit") {
        await panelApi(`/admin/api/team/calls/${meetingToEdit.id}/meeting`, {title, scheduled_at: new Date(scheduledAt).toISOString()});
        await team.refreshCalls();
      } else if (modal === "meeting") {
        await panelApi(`/admin/api/team/threads/${active}/call`, {
          request_id: crypto.randomUUID(),
          client_id: crypto.randomUUID(),
          kind: "video",
          title,
          scheduled_at: new Date(scheduledAt).toISOString(),
        });
        await team.refreshCalls();
      } else if (modal === "manage") {
        await panelApi(`/admin/api/team/threads/${active}/manage`, {
          title,
          members: [Number(user.id), ...memberIds],
          owner_id: ownerId,
        });
      } else {
        const thread = await panelApi("/admin/api/team/threads", {
          members: memberIds,
          title,
          is_group: group,
        });
        remember(active, draft.current);
        current.current = thread.id;
        setActive(thread.id);
        setMobileChat(true);
        setSection("chat");
      }
      setModal(null);
      await refresh();
    } catch (failure) {
      setError(panelError(failure));
    } finally {
      setBusy(false);
    }
  };
  const onBody = (value) => {
    setBody(value);
    if (active && Date.now() - typingAt.current > 3000) {
      typingAt.current = Date.now();
      panelApi(`/admin/api/team/threads/${active}/typing`, {
        typing: Boolean(value.trim()),
      }).catch(() => {});
    }
  };
  const visibleThreads = threads.filter(
    (thread) =>
      label(thread).toLowerCase().includes(search.toLowerCase()) &&
      (filter !== "unread" || thread.unread > 0) &&
      (filter !== "pinned" || Boolean(thread.pinned)) &&
      (filter === "archived" ? Boolean(thread.archived) : !thread.archived),
  );
  return (
    <TwentyCrmLayout title="Chat de equipo">
      <Head title="Chat de equipo" />
      <div className={`team-workspace ${mobileChat ? "mobile-chat" : ""}`}>
        <aside className="team-app-rail">
          <div className="team-app-mark">
            <Users size={26} />
          </div>
          {[
            ["chat", "Chat", MessageSquare],
            ["directory", "Equipo", Users],
            ["calls", "Llamadas", Phone],
            ["meetings", "Reuniones", CalendarDays],
          ].map(([id, text, Icon]) => (
            <button
              key={id}
              disabled={recording}
              onClick={() => {
                setSection(id);
                setMobileChat(false);
              }}
              className={section === id ? "active" : ""}
              aria-label={text}
              aria-current={section === id ? "page" : undefined}
            >
              <Icon size={22} />
              <span>{text}</span>
              {id === "chat" && threads.some((thread) => thread.unread > 0) && (
                <i />
              )}
            </button>
          ))}
          <div className="team-rail-bottom">
            <ShieldCheck size={19} />
            <span>Privado</span>
          </div>
        </aside>
        <header className="team-topbar">
          <div>
            <span className="team-eyebrow">NOVAPE · ESPACIO DE TRABAJO</span>
            <h1>
              {section === "chat"
                ? "Chat de equipo"
                : section === "directory"
                  ? "Directorio del equipo"
                  : section === "calls"
                    ? "Centro de llamadas"
                    : "Reuniones"}
            </h1>
          </div>
          <div className="team-topbar-right">
            <span className={`team-connection ${team?.realtime ? "live" : ""}`}>
              <i />
              {team?.realtime ? "En tiempo real" : "Actualización periódica"}
            </span>
            <span className="team-extension">
              <Hash size={13} />
              {team?.profile?.extension || "…"}
            </span>
            <select
              aria-label="Mi disponibilidad"
              value={team?.profile?.availability || "available"}
              onChange={(event) => team?.setAvailability(event.target.value)}
            >
              {Object.entries(availability).map(([id, text]) => (
                <option key={id} value={id}>
                  {text}
                </option>
              ))}
            </select>
            <Avatar name={workerName(user)} />
          </div>
        </header>
        {error && (
          <div className="team-page-error" role="alert">
            <span>{error}</span>
            <button onClick={() => setError("")} aria-label="Cerrar error">
              <X size={16} />
            </button>
          </div>
        )}
        {section === "chat" ? (
          <>
            <aside className="team-chat-sidebar">
              <div className="team-sidebar-heading">
                <h2>Conversaciones</h2>
                <button onClick={openCreate} title="Nueva conversación">
                  <Plus size={19} />
                </button>
              </div>
              <div className="team-search">
                <Search size={16} />
                <input
                  aria-label="Buscar conversación"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar en tus chats"
                />
              </div>
              <div className="team-list-tabs">
                {[
                  ["all", "Todos"],
                  ["unread", "No leídos"],
                  ["pinned", "Favoritos"],
                  ["archived", "Archivados"],
                ].map(([id, text]) => (
                  <button
                    key={id}
                    className={filter === id ? "active" : ""}
                    onClick={() => setFilter(id)}
                  >
                    {text}
                  </button>
                ))}
              </div>
              <nav aria-label="Chats del equipo">
                {visibleThreads.map((thread) => (
                  <button
                    key={thread.id}
                    className={`team-thread ${Number(active) === Number(thread.id) ? "active" : ""}`}
                    onClick={() => choose(thread.id)}
                    disabled={busy || recording}
                  >
                    <Avatar
                      name={label(thread)}
                      group={!thread.direct_key}
                      status={
                        thread.direct_key
                          ? thread.members.find(
                              (member) => Number(member.id) !== Number(user.id),
                            )?.availability
                          : null
                      }
                    />
                    <span>
                      <strong>{label(thread)}</strong>
                      <small>{thread.preview}</small>
                    </span>
                    <div>
                      <time>{time(thread.last_message_at)}</time>
                      {thread.unread > 0 && <b>{thread.unread}</b>}
                      {Boolean(thread.pinned) && <Pin size={11} />}
                    </div>
                  </button>
                ))}
                {!visibleThreads.length && (
                  <div className="team-empty-list">
                    <MessageSquare size={28} />
                    <strong>
                      {loading
                        ? "Cargando chats…"
                        : "Todo empieza con un mensaje"}
                    </strong>
                    <p>Crea un chat o busca a un compañero en el directorio.</p>
                    <button onClick={openCreate}>Nuevo chat</button>
                  </div>
                )}
              </nav>
              <footer>
                <span className="team-live-dot" />
                <span>Solo trabajadores de Novape</span>
              </footer>
            </aside>
            <section
              className="team-main-chat"
              onDragOver={(event) => {
                if (event.dataTransfer.types.includes("Files")) {
                  event.preventDefault();
                  setDrag(true);
                }
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget))
                  setDrag(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDrag(false);
                if (active) addFiles(Array.from(event.dataTransfer.files));
              }}
            >
              {selected ? (
                <>
                  <header className="team-conversation-heading">
                    <button
                      className="team-mobile-back"
                      onClick={() => setMobileChat(false)}
                      aria-label="Volver a chats"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <Avatar
                      name={label(selected)}
                      group={!selected.direct_key}
                    />
                    <div>
                      <h2>{label(selected)}</h2>
                      <p>
                        {selected.members.length} participantes ·{" "}
                        {selected.direct_key
                          ? selected.members
                              .filter(
                                (member) =>
                                  Number(member.id) !== Number(user.id),
                              )
                              .map(
                                (member) =>
                                  `Ext. ${member.extension || 10000 + Number(member.id)}`,
                              )
                              .join(" ")
                          : "Conversación de grupo"}
                      </p>
                    </div>
                    <div className="team-chat-actions">
                      <button
                        onClick={() => team?.startCall(active, "audio")}
                        disabled={team?.busy}
                        title="Llamada de voz"
                      >
                        <Phone size={18} />
                      </button>
                      <button
                        onClick={() => team?.startCall(active, "video")}
                        disabled={team?.busy}
                        title="Videollamada"
                      >
                        <Video size={20} />
                      </button>
                      <button
                        onClick={() => preference({ pinned: !selected.pinned })}
                        title={
                          selected.pinned
                            ? "Quitar favorito"
                            : "Marcar favorito"
                        }
                        className={selected.pinned ? "selected" : ""}
                      >
                        <Star size={18} />
                      </button>
                      <button
                        onClick={() => setMenu(!menu)}
                        title="Opciones del chat"
                      >
                        <MoreHorizontal size={19} />
                      </button>
                      {menu && (
                        <div className="team-thread-menu">
                          <button
                            onClick={() => preference({ archived: !selected.archived })}
                          >
                            {selected.archived ? "Restaurar conversación" : "Archivar conversación"}
                          </button>
                          <button
                            onClick={() =>
                              preference({ muted: !selected.muted })
                            }
                          >
                            <BellOff size={15} />
                            {selected.muted
                              ? "Activar avisos"
                              : "Silenciar avisos"}
                          </button>
                          <button
                            onClick={() => {
                              setModal("meeting");
                              setTitle("Reunión de " + label(selected));
                              setScheduledAt("");
                              setMenu(false);
                            }}
                          >
                            <CalendarDays size={15} />
                            Programar reunión
                          </button>
                          {selected.can_manage && (
                              <button onClick={openManage}>
                                <Users size={15} />
                                Administrar grupo
                              </button>
                            )}
                          {!selected.direct_key && (
                            <button disabled={busy || recording} onClick={() => setLeaveConfirm(true)}>Salir del grupo</button>
                          )}
                          {leaveConfirm && <div className="team-group-confirm" role="alert">
                            <p>Dejarás de tener acceso a los mensajes y archivos. Si eres responsable, otro miembro asumirá el grupo.</p>
                            <button disabled={busy} onClick={leaveGroup}>Confirmar salida</button>
                            <button onClick={() => setLeaveConfirm(false)}>Cancelar</button>
                          </div>}
                        </div>
                      )}
                    </div>
                  </header>
                  <div className="team-chat-tabs">
                    <button
                      className={tab === "messages" ? "active" : ""}
                      onClick={() => setTab("messages")}
                    >
                      Conversación
                    </button>
                    <button
                      className={tab === "files" ? "active" : ""}
                      onClick={() => {
                        setFilePage(1);
                        setTab("files");
                      }}
                    >
                      Archivos compartidos
                    </button>
                    <div className="team-message-search">
                      <Search size={14} />
                      <input
                        aria-label="Buscar mensajes"
                        value={messageSearch}
                        onChange={(event) => {
                          query.current = event.target.value;
                          setMessageSearch(event.target.value);
                          if (!event.target.value) {
                            setMessages([]);
                            hasOlder.current = false;
                            setTimeout(refresh, 0);
                          }
                        }}
                        maxLength={150}
                        placeholder="Buscar en este chat"
                      />
                    </div>
                    <button className={tab === "members" ? "active" : ""} onClick={() => setTab("members")}>Participantes</button>
                  </div>
                  {tab === "members" ? <div className="team-files-view">
                    <h3>Participantes de la conversación</h3>
                    {selected.members.map(member => <div className="team-shared-file" key={member.id}>
                      <Avatar name={workerName(member)} status={member.availability} />
                      <span><strong>{workerName(member)}{Number(member.id) === Number(user.id) ? " (tú)" : ""}</strong>
                      <small>Ext. {member.extension || 10000 + Number(member.id)} · {availability[member.availability]}{!selected.direct_key && Number(member.id) === Number(selected.created_by) ? " · Responsable" : ""}</small></span>
                    </div>)}
                  </div> : tab === "files" ? (
                    <div className="team-files-view">
                      <h3>Todos los archivos, en un solo lugar</h3>
                      <p>
                        Disponibles únicamente para los miembros de esta
                        conversación.
                      </p>
                      <div>
                        {sharedFiles.map((file) => (
                          <div className="team-shared-file" key={file.id}>
                            <FileText size={25} />
                            <span>
                              <strong>{file.file_name}</strong>
                              <small>
                                {fileSize(file.file_size)} · {file.type}
                              </small>
                            </span>
                            <a
                              href={file.download_url}
                              aria-label={`Descargar ${file.file_name}`}
                            >
                              <Download size={18} />
                            </a>
                          </div>
                        ))}
                      </div>
                      {!sharedFiles.length && (
                        <p>Aún no se han compartido archivos.</p>
                      )}
                      <div className="team-file-pagination">
                        <button
                          disabled={filePage <= 1}
                          onClick={() => setFilePage(filePage - 1)}
                        >
                          Anterior
                        </button>
                        <span>
                          {filePage}/{fileLast}
                        </span>
                        <button
                          disabled={filePage >= fileLast}
                          onClick={() => setFilePage(filePage + 1)}
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className="team-messages"
                        ref={scroll}
                        onScroll={() => {
                          const box = scroll.current;
                          if (box && box.scrollHeight - box.scrollTop - box.clientHeight < 100) refresh();
                        }}
                        aria-live="polite"
                      >
                        {more && (
                          <button className="team-load-older" onClick={older}>
                            Mensajes anteriores
                          </button>
                        )}
                        {loading ? (
                          <div className="team-chat-loading">
                            <Loader2 className="animate-spin" size={25} />
                            <p>Cargando conversación…</p>
                          </div>
                        ) : (
                          messages.map((message, index) => {
                            const previousDay = index
                              ? parseDate(
                                  messages[index - 1].created_at,
                                )?.toDateString()
                              : null;
                            return (
                              <React.Fragment key={message.id}>
                                {parseDate(
                                  message.created_at,
                                )?.toDateString() !== previousDay && (
                                  <div className="team-day-divider">
                                    <span>
                                      {parseDate(
                                        message.created_at,
                                      )?.toLocaleDateString("es-PE", {
                                        weekday: "long",
                                        day: "numeric",
                                        month: "long",
                                      })}
                                    </span>
                                  </div>
                                )}
                                <TeamMessage
                                  message={message}
                                  user={user}
                                  thread={selected}
                                  onAction={act}
                                  onQuote={(message) => {
                                    if (editing) cancelEdit();
                                    setReply({
                                      id: message.id,
                                      name: workerName(message),
                                      body: message.body || "Archivo adjunto",
                                    });
                                    setEditing(null);
                                  }}
                                  onEdit={(message) => {
                                    if(!editing)beforeEdit.current={...draft.current,files};
                                    setEditing(message);
                                    setBody(message.body);
                                    setReply(null);
                                    setFiles([]);
                                  }}
                                  onJoin={(value) => team?.join(value)}
                                  busy={busy || recording || team?.busy}
                                />
                              </React.Fragment>
                            );
                          })
                        )}
                        {!loading && !messages.length && (
                          <div className="team-first-message">
                            <MessageSquare size={29} />
                            <h3>
                              {messageSearch
                                ? "No encontramos mensajes"
                                : "Tu equipo, más cerca"}
                            </h3>
                            <p>
                              {messageSearch
                                ? "Prueba con otro texto."
                                : "Comparte una idea, un archivo o una nota de voz."}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="team-typing">
                        {selected.members
                          .filter(
                            (member) =>
                              Number(member.id) !== Number(user.id) &&
                              member.typing,
                          )
                          .map((member) => member.nombres)
                          .join(", ")}
                        {selected.members.some(
                          (member) =>
                            Number(member.id) !== Number(user.id) &&
                            member.typing,
                        )
                          ? " está escribiendo…"
                          : ""}
                      </div>
                      <div
                        className={`team-composer ${important ? "is-important" : ""}`}
                      >
                        {(reply || editing) && (
                          <div className="team-reply-preview">
                            <Reply size={17} />
                            <div>
                              <strong>
                                {editing
                                  ? "Editando tu mensaje"
                                  : `Respuesta a ${reply.name}`}
                              </strong>
                              <span>{editing?.body || reply?.body}</span>
                            </div>
                            <button
                              onClick={() => {
                                setReply(null);
                                if (editing) {
                                  cancelEdit();
                                }
                              }}
                              aria-label="Cancelar cita o edición"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}
                        {files.length > 0 && (
                          <div className="team-pending-files">
                            {files.map((file, index) => (
                              <PendingFile
                                key={`${file.name}-${index}`}
                                file={file}
                                onRemove={() =>
                                  setFiles((previous) =>
                                    previous.filter((_, i) => i !== index),
                                  )
                                }
                              />
                            ))}
                          </div>
                        )}
                        {recording ? (
                          <div className="team-recording">
                            <span />
                            <Mic size={19} />
                            <strong>Grabando nota de voz</strong>
                            <time>
                              {Math.floor(recordTime / 60)}:
                              {String(recordTime % 60).padStart(2, "0")}
                            </time>
                            <button onClick={() => stopRecording(true)}>
                              Descartar
                            </button>
                            <button
                              className="team-primary"
                              onClick={() => stopRecording(false)}
                            >
                              <Square size={14} />
                              Terminar
                            </button>
                          </div>
                        ) : (
                          <form onSubmit={send}>
                            <textarea
                              aria-label="Mensaje al equipo"
                              placeholder={
                                editing
                                  ? "Edita tu mensaje…"
                                  : "Escribe un mensaje para tu equipo…"
                              }
                              value={body}
                              onChange={(event) => onBody(event.target.value)}
                              maxLength={5000}
                              disabled={busy}
                              onPaste={(event) => {
                                const incoming = Array.from(
                                  event.clipboardData.files,
                                );
                                if (incoming.length) {
                                  event.preventDefault();
                                  addFiles(incoming);
                                }
                              }}
                              onKeyDown={(event) => {
                                if (
                                  event.key === "Enter" &&
                                  !event.shiftKey &&
                                  !event.nativeEvent.isComposing
                                ) {
                                  event.preventDefault();
                                  send(event);
                                }
                              }}
                            />
                            <div className="team-composer-toolbar">
                              <div>
                                <button
                                  type="button"
                                  onClick={() => fileInput.current?.click()}
                                  disabled={busy || Boolean(editing)}
                                  title="Adjuntar imágenes, documentos o archivos"
                                >
                                  <Paperclip size={18} />
                                </button>
                                <input
                                  ref={fileInput}
                                  hidden
                                  type="file"
                                  multiple
                                  accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z,.mp4,.mov,.mp3,.wav,.ogg,.m4a,.webm"
                                  onChange={(event) => {
                                    addFiles(Array.from(event.target.files));
                                    event.target.value = "";
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={startRecording}
                                  disabled={busy || Boolean(editing)}
                                  title="Grabar nota de voz"
                                >
                                  <Mic size={18} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEmoji(!emoji)}
                                  title="Insertar emoji"
                                >
                                  <Smile size={18} />
                                </button>
                                <button
                                  type="button"
                                  className={important ? "selected" : ""}
                                  onClick={() => setImportant(!important)}
                                  title="Marcar como importante"
                                >
                                  <Hash size={17} />
                                </button>
                              </div>
                              <span>
                                Enter para enviar · Shift + Enter para nueva
                                línea
                              </span>
                              <button
                                className="team-send"
                                disabled={
                                  busy || (!body.trim() && !files.length)
                                }
                                title="Enviar mensaje"
                              >
                                {busy ? (
                                  <Loader2 size={17} className="animate-spin" />
                                ) : (
                                  <Send size={17} />
                                )}
                                <span>{editing ? "Guardar" : "Enviar"}</span>
                              </button>
                            </div>
                          </form>
                        )}
                        {emoji && (
                          <div className="team-emoji-picker">
                            {[
                              "😊",
                              "👍",
                              "❤️",
                              "🎉",
                              "🙌",
                              "✅",
                              "📌",
                              "👋",
                            ].map((value) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => {
                                  setBody((previous) => previous + value);
                                  setEmoji(false);
                                }}
                              >
                                {value}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {drag && (
                    <div className="team-drop-overlay">
                      <Paperclip size={38} />
                      <strong>Suelta los archivos aquí</strong>
                      <span>Solo los miembros del chat podrán abrirlos.</span>
                    </div>
                  )}
                </>
              ) : (
                <Welcome
                  onCreate={openCreate}
                  onDirectory={() => setSection("directory")}
                />
              )}
            </section>
          </>
        ) : (
          <main className="team-section-main">
            <header>
              <div>
                <span className="team-eyebrow">
                  {section === "directory"
                    ? "PERSONAS QUE HACEN LA DIFERENCIA"
                    : "COLABORACIÓN SIN DISTANCIAS"}
                </span>
                <h2>
                  {section === "directory"
                    ? "Encuentra a tu compañero"
                    : section === "calls"
                      ? "Llama por nombre o extensión"
                      : "Haz espacio para trabajar juntos"}
                </h2>
                <p>
                  {section === "directory"
                    ? "Cada trabajador tiene una extensión interna propia."
                    : section === "calls"
                      ? "Inicia llamadas de voz o vídeo desde el directorio."
                      : "Programa una reunión en tus chats y reúne al equipo."}
                </p>
              </div>
              <button
                className="team-secondary"
                onClick={() => {
                  if ("Notification" in window)
                    Notification.requestPermission();
                }}
              >
                Activar notificaciones
              </button>
            </header>
            {section === "directory" ? (
              <Directory
                workers={workers}
                user={user}
                search={directorySearch}
                onSearch={setDirectorySearch}
                onDirect={direct}
                busy={team?.busy}
              />
            ) : (
              <CallsAndMeetings
                team={team}
                section={section}
                onDirectory={() => setSection("directory")}
                onChat={() => setSection("chat")}
                onEditMeeting={editMeeting}
                onCancelMeeting={cancelMeeting}
              />
            )}
          </main>
        )}
        <WorkspaceDialog
          mode={modal}
          onClose={dismiss}
          title={title}
          setTitle={setTitle}
          group={group}
          setGroup={setGroup}
          workers={workers}
          user={user}
          members={memberIds}
          setMembers={setMemberIds}
          search={modalSearch}
          setSearch={setModalSearch}
          scheduled={scheduledAt}
          setScheduled={setScheduledAt}
          onSubmit={saveModal}
          busy={busy}
          error={error}
          maxParticipants={team?.config?.max_participants}
          ownerId={ownerId}
          setOwnerId={setOwnerId}
          currentMembers={selected?.members || []}
        />
      </div>
    </TwentyCrmLayout>
  );
}
