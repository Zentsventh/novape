import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { panelApi, panelError } from "../Components/Admin/panelApi";
import TeamRtc from "../Components/Team/TeamRtc";
import TeamCallDock from "../Components/Team/TeamCallDock";
import "../../css/admin/team-workspace.css";

const Context = createContext(null);
export const useTeamCalls = () => useContext(Context);
const audioConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};
const mediaError = (error) =>
  error.name === "NotAllowedError"
    ? "Permite el acceso al micrófono y la cámara en tu navegador."
    : error.name === "NotFoundError"
      ? "No encontramos el dispositivo de audio o cámara solicitado."
      : error.response
        ? panelError(error)
        : error.message || panelError(error);

export default function TeamCallProvider({ user, children }) {
  const [calls, setCalls] = useState([]),
    [call, setCall] = useState(null),
    [peers, setPeers] = useState([]),
    [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [minimized, setMinimized] = useState(false),
    [muted, setMuted] = useState(false),
    [camera, setCamera] = useState(false),
    [sharing, setSharing] = useState(false),
    [hand, setHand] = useState(false);
  const [devices, setDevices] = useState([]),
    [profile, setProfile] = useState(null),
    [realtime, setRealtime] = useState(false),
    [config, setConfig] = useState(null),
    [audioBlocked, setAudioBlocked] = useState(false);
  const session = useRef(crypto.randomUUID()),
    engine = useRef(null),
    callRef = useRef(null),
    media = useRef(null),
    screen = useRef(null),
    mixed = useRef(null),
    controls = useRef({}),
    cursor = useRef(0),
    polling = useRef(false),
    starting = useRef(false),
    userRef = useRef(user);
  userRef.current = user;
  controls.current = {
    audio_muted: muted,
    video_enabled: camera,
    screen_sharing: sharing,
    hand_raised: hand,
  };
  const updateCall = (value) => {
    callRef.current = value;
    setCall(value);
  };
  const updatePreview = () =>
    setPreview(
      new MediaStream([
        ...(media.current?.getAudioTracks() || []),
        ...(screen.current
          ? screen.current.getVideoTracks()
          : media.current?.getVideoTracks() || []),
      ]),
    );
  const release = useCallback(() => {
    engine.current?.close();
    engine.current = null;
    media.current?.getTracks().forEach((track) => track.stop());
    screen.current?.getTracks().forEach((track) => track.stop());
    mixed.current?.close().catch(() => {});
    media.current = null;
    screen.current = null;
    mixed.current = null;
    callRef.current = null;
    setCall(null);
    setPeers([]);
    setPreview(null);
    setSharing(false);
    setCamera(false);
    setMuted(false);
    setHand(false);
    setMinimized(false);
  }, []);
  const refreshCalls = useCallback(async () => {
    if (userRef.current?.id) setCalls(await panelApi("/admin/api/team/calls"));
  }, []);
  const pulse = useCallback(async () => {
    const current = callRef.current;
    if (current)
      await panelApi(`/admin/api/team/calls/${current.id}/heartbeat`, {
        client_id: session.current,
        ...controls.current,
      });
  }, []);
  const sync = useCallback(async () => {
    const current = callRef.current;
    if (!current || polling.current) return;
    polling.current = true;
    try {
      const result = await panelApi(
        `/admin/api/team/calls/${current.id}?after=${cursor.current}&client_id=${session.current}`,
      );
      if (callRef.current?.id !== current.id) return;
      if (result.call.status === "ended") {
        release();
        await refreshCalls();
        return;
      }
      updateCall(result.call);
      engine.current?.sync(result.call.participants);
      for (const signal of result.signals) {
        await engine.current?.receive(signal);
        cursor.current = Math.max(cursor.current, signal.id);
      }
    } catch (failure) {
      if ([403, 404, 409].includes(failure.response?.status)) {
        release();
        setError(panelError(failure));
      } else
        setError("La señalización está reconectando. Conservamos la llamada.");
    } finally {
      polling.current = false;
    }
  }, [refreshCalls, release]);
  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;
    const init = async () => {
      try {
        const [settings, own] = await Promise.all([
          panelApi("/admin/api/team/call-config"),
          panelApi("/admin/api/team/presence", {}),
        ]);
        if (mounted) {
          setConfig(settings);
          setProfile(own);
          await refreshCalls();
        }
      } catch (failure) {
        if (mounted) setError(panelError(failure));
      }
    };
    init();
    const channelName = `novape-team.user.${user.id}`;
    const channel = window.Echo?.private(channelName);
    channel?.listen(".team.call", () => {
      sync();
      refreshCalls().catch(() => {});
    });
    const connection = window.Echo?.connector?.pusher?.connection;
    const changed = () => setRealtime(connection?.state === "connected");
    changed();
    connection?.bind("state_change", changed);
    const incomingTimer = setInterval(() => {
      if (!document.hidden || callRef.current) refreshCalls().catch(() => {});
    }, 5000);
    const presenceTimer = setInterval(() => {
      if (!document.hidden || callRef.current)
        panelApi("/admin/api/team/presence", {})
          .then(setProfile)
          .catch(() => {});
    }, 25000);
    const signalsTimer = setInterval(sync, 1000);
    const heartTimer = setInterval(() => pulse().catch(() => {}), 10000);
    const beforeUnload = (event) => {
      if (callRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const unload = () => {
      if (!callRef.current) return;
      const form = new FormData();
      form.append("client_id", session.current);
      form.append(
        "_token",
        document.querySelector('meta[name="csrf-token"]')?.content || "",
      );
      navigator.sendBeacon(
        `/admin/api/team/calls/${callRef.current.id}/leave`,
        form,
      );
    };
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("pagehide", unload);
    return () => {
      mounted = false;
      clearInterval(incomingTimer);
      clearInterval(presenceTimer);
      clearInterval(signalsTimer);
      clearInterval(heartTimer);
      channel?.stopListening(".team.call");
      connection?.unbind("state_change", changed);
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("pagehide", unload);
      unload();
      release();
    };
  }, [user?.id, refreshCalls, sync, pulse, release]);
  useEffect(() => {
    if (!call) return;
    pulse().catch(() => {});
  }, [muted, camera, sharing, hand, pulse]);
  const prepare = async (video) => {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)
      throw new Error(
        "Usa HTTPS o localhost para habilitar micrófono y cámara.",
      );
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: audioConstraints,
      video: video
        ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 24, max: 30 },
          }
        : false,
    });
    media.current = stream;
    setPreview(new MediaStream(stream.getTracks()));
    setCamera(video);
    setMuted(false);
    setSharing(false);
    setHand(false);
    setDevices(await navigator.mediaDevices.enumerateDevices());
    return stream;
  };
  const attach = async (value, stream, settings) => {
    cursor.current = value.signal_cursor || 0;
    updateCall(value);
    engine.current = new TeamRtc({
      userId: Number(user.id),
      clientId: session.current,
      callId: value.id,
      stream: new MediaStream(stream.getTracks()),
      iceServers: settings.ice_servers,
      api: panelApi,
      onPeers: setPeers,
      onError: (failure) => setError(mediaError(failure)),
    });
    engine.current.sync(value.participants);
    setMinimized(false);
    await sync();
    await refreshCalls();
  };
  const startCall = async (thread, kind = "video") => {
    if (starting.current || callRef.current) {
      setMinimized(false);
      return;
    }
    starting.current = true;
    setBusy(true);
    setError("");
    try {
      const stream = await prepare(kind === "video");
      const settings =
        config || (await panelApi("/admin/api/team/call-config"));
      const value = await panelApi(`/admin/api/team/threads/${thread}/call`, {
        request_id: crypto.randomUUID(),
        client_id: session.current,
        kind,
      });
      await attach(value, stream, settings);
    } catch (failure) {
      release();
      setError(
        failure.message && !failure.response
          ? mediaError(failure) || failure.message
          : panelError(failure),
      );
    } finally {
      setBusy(false);
      starting.current = false;
    }
  };
  const join = async (value, video = value.kind === "video") => {
    if (starting.current || callRef.current) {
      setMinimized(false);
      return;
    }
    starting.current = true;
    setBusy(true);
    setError("");
    try {
      const stream = await prepare(video);
      const settings =
        config || (await panelApi("/admin/api/team/call-config"));
      const joined = await panelApi(`/admin/api/team/calls/${value.id}/join`, {
        client_id: session.current,
        video_enabled: video,
        take_over: value.self === "joined",
      });
      await attach(joined, stream, settings);
    } catch (failure) {
      release();
      setError(
        failure.message && !failure.response
          ? mediaError(failure) || failure.message
          : panelError(failure),
      );
    } finally {
      starting.current = false;
      setBusy(false);
    }
  };
  const leave = async (endForAll = false) => {
    const value = callRef.current;
    try {
      if (value)
        await panelApi(`/admin/api/team/calls/${value.id}/leave`, {
          client_id: session.current,
          end_for_all: endForAll,
        });
    } catch (failure) {
      setError(panelError(failure));
    } finally {
      release();
      refreshCalls().catch(() => {});
    }
  };
  const decline = async (value) => {
    try {
      await panelApi(`/admin/api/team/calls/${value.id}/leave`, {
        decline: true,
      });
      await refreshCalls();
    } catch (failure) {
      setError(panelError(failure));
    }
  };
  const toggleMute = () => {
    const next = !muted;
    media.current?.getAudioTracks().forEach((track) => (track.enabled = !next));
    engine.current?.stream.getAudioTracks().forEach((track) => (track.enabled = !next));
    setMuted(next);
  };
  const toggleCamera = async () => {
    try {
      if (camera) {
        const old = media.current?.getVideoTracks() || [];
        old.forEach((track) => {
          media.current.removeTrack(track);
          track.stop();
        });
        if (!sharing) await engine.current?.replace("video", null);
        setCamera(false);
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        const track = stream.getVideoTracks()[0];
        media.current.addTrack(track);
        if (!sharing) await engine.current?.replace("video", track);
        setCamera(true);
      }
      updatePreview();
    } catch (failure) {
      setError(mediaError(failure));
    }
  };
  const stopShare = async () => {
    const captured = screen.current;
    screen.current = null;
    captured?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    await engine.current?.replace(
      "video",
      media.current?.getVideoTracks()[0] || null,
    );
    await engine.current?.replace(
      "audio",
      media.current?.getAudioTracks()[0] || null,
    );
    mixed.current?.close().catch(() => {});
    mixed.current = null;
    setSharing(false);
    setPreview(new MediaStream(media.current?.getTracks() || []));
  };
  const shareScreen = async () => {
    if (sharing) {
      await stopShare();
      return;
    }
    try {
      const captured = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 15, max: 30 } },
        audio: true,
      });
      screen.current = captured;
      const track = captured.getVideoTracks()[0];
      track.onended = () => stopShare().catch(() => {});
      await engine.current?.replace("video", track);
      if (captured.getAudioTracks().length) {
        const context = new AudioContext();
        mixed.current = context;
        const output = context.createMediaStreamDestination();
        context
          .createMediaStreamSource(
            new MediaStream(media.current.getAudioTracks()),
          )
          .connect(output);
        context
          .createMediaStreamSource(new MediaStream(captured.getAudioTracks()))
          .connect(output);
        output.stream.getAudioTracks().forEach(track => { track.enabled = !muted; });
        await engine.current?.replace(
          "audio",
          output.stream.getAudioTracks()[0],
        );
      }
      setSharing(true);
      setPreview(new MediaStream([...media.current.getAudioTracks(), track]));
    } catch (failure) {
      if (screen.current) await stopShare().catch(() => {});
      if (failure.name !== "NotAllowedError") setError(mediaError(failure));
    }
  };
  const changeDevice = async (kind, id) => {
    try {
      if (sharing && kind === "audio") await stopShare();
      const acquired = await navigator.mediaDevices.getUserMedia(
        kind === "audio"
          ? { audio: { ...audioConstraints, deviceId: { exact: id } } }
          : { video: { deviceId: { exact: id } } },
      );
      const track = acquired.getTracks()[0];
      if (kind === "audio") track.enabled = !muted;
      const old =
        kind === "audio"
          ? media.current.getAudioTracks()
          : media.current.getVideoTracks();
      old.forEach((t) => {
        media.current.removeTrack(t);
        t.stop();
      });
      media.current.addTrack(track);
      if (kind === "audio" || !sharing)
        await engine.current?.replace(kind, track);
      if (kind === "video") setCamera(true);
      updatePreview();
    } catch (failure) {
      setError(mediaError(failure));
    }
  };
  const setAvailability = async (availability) => {
    try {
      setProfile(await panelApi("/admin/api/team/presence", { availability }));
    } catch (failure) {
      setError(panelError(failure));
    }
  };
  const value = {
    calls,
    call,
    peers,
    preview,
    busy,
    error,
    setError,
    minimized,
    setMinimized,
    muted,
    camera,
    sharing,
    hand,
    setHand,
    devices,
    profile,
    realtime,
    config,
    audioBlocked,
    setAudioBlocked,
    startCall,
    join,
    leave,
    decline,
    toggleMute,
    toggleCamera,
    shareScreen,
    changeDevice,
    setAvailability,
    refreshCalls,
    user,
  };
  return (
    <Context.Provider value={value}>
      {children}
      <TeamCallDock />
      {peers.map((peer) => (
        <RemoteAudio
          key={peer.id}
          stream={peer.stream}
          onBlocked={() => setAudioBlocked(true)}
        />
      ))}
    </Context.Provider>
  );
}

function RemoteAudio({ stream, onBlocked }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
      ref.current.play().catch(onBlocked);
    }
  }, [stream]);
  return <audio ref={ref} autoPlay className="team-remote-audio" />;
}
