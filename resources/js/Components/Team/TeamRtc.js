// Media stays between participants. Laravel authenticates and relays signaling.
export default class TeamRtc {
  constructor({
    userId,
    clientId,
    callId,
    stream,
    iceServers,
    api,
    onPeers,
    onError,
  }) {
    Object.assign(this, {
      userId,
      clientId,
      callId,
      stream,
      iceServers,
      api,
      onPeers,
      onError,
    });
    this.peers = new Map();
    this.closed = false;
  }
  async send(target, kind, payload) {
    if (this.closed) return;
    const data = {
      target_id: target,
      kind,
      payload,
      client_id: this.clientId,
      request_id: crypto.randomUUID(),
    };
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await this.api(
          `/admin/api/team/calls/${this.callId}/signal`,
          data,
        );
      } catch (error) {
        if (attempt || error.response?.status < 500) throw error;
      }
    }
  }
  publish() {
    this.onPeers(
      [...this.peers.entries()].map(([id, peer]) => ({
        id,
        stream: peer.remote,
        state: peer.pc.connectionState,
        participant: peer.participant,
      })),
    );
  }
  peer(participant) {
    const id = Number(participant.user_id);
    const old = this.peers.get(id);
    if (old?.participant.connection_id === participant.connection_id) {
      old.participant = participant;
      return old;
    }
    if (old) {
      old.pc.close();
      this.peers.delete(id);
    }
    const pc = new RTCPeerConnection({
      iceServers: this.iceServers,
      bundlePolicy: "max-bundle",
    });
    const peer = {
      pc,
      participant,
      remote: new MediaStream(),
      polite: this.userId > id,
      making: false,
      answering: false,
      ignore: false,
      candidates: [],
      sequence: Promise.resolve(),
      retries: 0,
    };
    this.peers.set(id, peer);
    pc.ontrack = ({ track }) => {
      if (!peer.remote.getTracks().some((t) => t.id === track.id))
        peer.remote.addTrack(track);
      track.onunmute = () => this.publish();
      track.onended = () => {
        peer.remote.removeTrack(track);
        this.publish();
      };
      this.publish();
    };
    pc.onicecandidate = ({ candidate }) => {
      if (candidate && !this.closed)
        this.send(id, "ice", candidate.toJSON()).catch((error) =>
          this.report(error),
        );
    };
    pc.onconnectionstatechange = () => {
      this.publish();
      if (pc.connectionState === "failed" && peer.retries++ < 2)
        pc.restartIce();
    };
    pc.onnegotiationneeded = async () => {
      try {
        if (this.closed || pc.signalingState === "closed") return;
        peer.making = true;
        await pc.setLocalDescription();
        await this.send(
          id,
          pc.localDescription.type,
          pc.localDescription.toJSON(),
        );
      } catch (error) {
        this.report(error);
      } finally {
        peer.making = false;
      }
    };
    peer.audio = pc.addTransceiver(this.stream.getAudioTracks()[0] || "audio", {
      direction: "sendrecv",
      streams: [this.stream],
    });
    peer.video = pc.addTransceiver(this.stream.getVideoTracks()[0] || "video", {
      direction: "sendrecv",
      streams: [this.stream],
    });
    this.publish();
    return peer;
  }
  sync(participants) {
    const joined = participants.filter(
      (p) => p.state === "joined" && Number(p.user_id) !== this.userId,
    );
    const ids = new Set(joined.map((p) => Number(p.user_id)));
    for (const [id, peer] of this.peers)
      if (!ids.has(id)) {
        peer.pc.close();
        this.peers.delete(id);
      }
    joined.forEach((participant) => this.peer(participant));
    this.publish();
  }
  receive(signal) {
    const peer = this.peers.get(Number(signal.from_id));
    if (
      !peer ||
      peer.participant.connection_id !== signal.client_id ||
      this.closed
    )
      return Promise.resolve();
    peer.sequence = peer.sequence
      .then(async () => {
        if (this.closed || peer.pc.signalingState === "closed") return;
        const pc = peer.pc;
        if (signal.kind === "ice") {
          if (peer.ignore) return;
          if (!pc.remoteDescription) peer.candidates.push(signal.payload);
          else await pc.addIceCandidate(signal.payload);
        } else {
          const description = signal.payload;
          const ready =
            !peer.making && (pc.signalingState === "stable" || peer.answering);
          peer.ignore = !peer.polite && description.type === "offer" && !ready;
          if (peer.ignore) return;
          peer.answering = description.type === "answer";
          await pc.setRemoteDescription(description);
          peer.answering = false;
          for (const candidate of peer.candidates.splice(0))
            await pc.addIceCandidate(candidate);
          if (description.type === "offer") {
            await pc.setLocalDescription();
            await this.send(
              Number(signal.from_id),
              "answer",
              pc.localDescription.toJSON(),
            );
          }
        }
      })
      .catch((error) => {
        if (!peer.ignore) this.report(error);
      });
    return peer.sequence;
  }
  report(error) {
    if (!this.closed && error.name !== "InvalidStateError") this.onError(error);
  }
  async replace(kind, track) {
    const old =
      kind === "audio"
        ? this.stream.getAudioTracks()
        : this.stream.getVideoTracks();
    old.forEach((t) => this.stream.removeTrack(t));
    if (track) this.stream.addTrack(track);
    await Promise.all(
      [...this.peers.values()].map((peer) =>
        peer[kind].sender.replaceTrack(track),
      ),
    );
  }
  close() {
    this.closed = true;
    this.peers.forEach((peer) => peer.pc.close());
    this.peers.clear();
  }
}
