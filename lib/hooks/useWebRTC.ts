"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Socket } from "socket.io-client";

interface RemotePeer {
  stream: MediaStream | null;
  socketId: string;
}

export function useWebRTC(meetingId: string, socket: Socket | null, userId: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, RemotePeer>>({});
  
  const pcs = useRef<Record<string, RTCPeerConnection>>({});
  const userIdBySocketId = useRef<Record<string, string>>({});
  const localStreamRef = useRef<MediaStream | null>(null);

  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
  };

  const cleanupPeer = useCallback((socketId: string) => {
    const peerUserId = userIdBySocketId.current[socketId];
    if (pcs.current[socketId]) {
      console.log(`[WebRTC] Closing connection with ${peerUserId} (${socketId})`);
      pcs.current[socketId].close();
      delete pcs.current[socketId];
    }
    if (peerUserId) {
      delete userIdBySocketId.current[socketId];
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[peerUserId];
        return next;
      });
    }
  }, []);

  const createPeerConnection = useCallback((socketId: string, peerUserId: string) => {
    if (pcs.current[socketId]) return pcs.current[socketId];

    console.log(`[WebRTC] Creating RTCPeerConnection for ${peerUserId}`);
    const pc = new RTCPeerConnection(iceServers);
    pcs.current[socketId] = pc;
    userIdBySocketId.current[socketId] = peerUserId;

    // Add current local tracks if they exist
    if (localStreamRef.current) {
      console.log(`[WebRTC] Adding local tracks to new connection for ${peerUserId}`);
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit("ice-candidate", { to: socketId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote track from ${peerUserId}`);
      setRemoteStreams((prev) => ({
        ...prev,
        [peerUserId]: { stream: event.streams[0], socketId },
      }));
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state with ${peerUserId}: ${pc.connectionState}`);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        cleanupPeer(socketId);
      }
    };

    return pc;
  }, [socket, cleanupPeer]);

  useEffect(() => {
    if (!socket || !meetingId || !userId) return;

    console.log(`[WebRTC] Initializing signaling for user ${userId} in meeting ${meetingId}`);

    const handlePeerJoined = async ({ socketId, userId: peerUserId }: any) => {
      console.log(`[WebRTC] Peer joined: ${peerUserId}`);
      const pc = createPeerConnection(socketId, peerUserId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { to: socketId, offer, fromUserId: userId });
    };

    const handleOffer = async ({ from, offer, fromUserId }: any) => {
      console.log(`[WebRTC] Received offer from ${fromUserId}`);
      const pc = createPeerConnection(from, fromUserId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { to: from, answer, fromUserId: userId });
    };

    const handleAnswer = async ({ from, answer, fromUserId }: any) => {
      console.log(`[WebRTC] Received answer from ${fromUserId}`);
      const pc = pcs.current[from];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleIceCandidate = async ({ from, candidate }: any) => {
      const pc = pcs.current[from];
      if (pc) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("[WebRTC] Error adding ICE candidate", e);
        }
      }
    };

    const handlePeerLeft = (socketId: string) => {
      cleanupPeer(socketId);
    };

    socket.on("peerJoined", handlePeerJoined);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("peerLeft", handlePeerLeft);

    return () => {
      console.log("[WebRTC] Cleaning up signaling listeners");
      socket.off("peerJoined", handlePeerJoined);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("peerLeft", handlePeerLeft);
    };
  }, [socket, meetingId, userId, createPeerConnection, cleanupPeer]);

  const startMedia = async (video: boolean, audio: boolean) => {
    try {
      console.log("[WebRTC] Requesting media permissions...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } : false, 
        audio: audio 
      });
      
      setLocalStream(stream);
      localStreamRef.current = stream;

      // Update all existing connections with the new stream
      for (const [socketId, pc] of Object.entries(pcs.current)) {
        const peerUserId = userIdBySocketId.current[socketId];
        console.log(`[WebRTC] Adding local tracks to existing connection for ${peerUserId}`);
        
        // Remove old tracks if any (to avoid duplicates)
        const senders = pc.getSenders();
        senders.forEach(sender => pc.removeTrack(sender));

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
        
        // Renegotiate
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket?.emit("offer", { to: socketId, offer, fromUserId: userId });
      }

      return stream;
    } catch (err) {
      console.error("[WebRTC] Media Error:", err);
      return null;
    }
  };

  const toggleVideo = (enabled: boolean) => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => t.enabled = enabled);
      console.log(`[WebRTC] Video ${enabled ? 'enabled' : 'disabled'}`);
    }
  };

  const toggleAudio = (enabled: boolean) => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => t.enabled = enabled);
      console.log(`[WebRTC] Audio ${enabled ? 'enabled' : 'disabled'}`);
    }
  };

  return {
    localStream,
    remoteStreams,
    startMedia,
    toggleVideo,
    toggleAudio
  };
}
