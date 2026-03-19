"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getMeeting, updateMeeting, addAttendeeToMeeting, getAllUsers } from "@/lib/firebase/firestore";
import { useAuth } from "@/lib/hooks/useAuth";
import { useSocket } from "@/lib/hooks/useSocket";
import { useWebRTC } from "@/lib/hooks/useWebRTC";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar, Clock, Users, ArrowLeft,
    CheckCircle2, AlertCircle, Save,
    Play, CheckCircle, Loader2, Info,
    StickyNote, ChevronRight, Mic, MicOff, Video, VideoOff,
    Smile, Share2, MessageSquare, Maximize2, X, TrendingUp, DollarSign, BarChart3, Shield
} from "lucide-react";
import { formatDate, formatRF } from "@/lib/utils/format";
import type { Meeting, CampusUser } from "@/lib/types";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

type Reaction = { id: number; emoji: string; x: number };
type Message = { id: string; senderId: string; senderName: string; text: string; timestamp: number };

export default function MeetingRoom() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { profile } = useAuth();
    const socket = useSocket(profile?.uid);
    const { localStream, remoteStreams, startMedia, toggleVideo, toggleAudio } = useWebRTC(id, socket, profile?.uid || "");

    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [allUsers, setAllUsers] = useState<CampusUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [minutes, setMinutes] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState("");
    const [activeTab, setActiveTab] = useState<"agenda" | "minutes" | "financials" | "chat">("agenda");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [expandedAgenda, setExpandedAgenda] = useState(false);

    // Media States
    const [isMicOn, setIsMicOn] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(false);
    const [reactions, setReactions] = useState<Reaction[]>([]);
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        fetchData();
        // Simulate real-time polling
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [id]);

    useEffect(() => {
        if (meeting?.status !== "planned") return;
        const timer = setInterval(() => {
            const start = new Date(meeting.date).getTime();
            const now = new Date().getTime();
            const diff = start - now;
            if (diff <= 0) {
                setTimeLeft("00:00:00");
                return;
            }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(timer);
    }, [meeting?.status, meeting?.date]);

    const fetchData = async () => {
        try {
            const [m, users] = await Promise.all([
                getMeeting(id),
                getAllUsers()
            ]);
            if (m) {
                setMeeting(m);
                setMinutes(m.minutes || "");
            }
            setAllUsers(users);
        } catch (err) {
            console.error(err);
        } finally {
            if (loading) setLoading(false);
        }
    };

    useEffect(() => {
        if (!loading && socket && profile && meeting) {
            socket.emit("joinMeeting", id, profile.uid);
            
            // Listen for reactions
            const handleIncomingReaction = (emoji: string) => {
                const reaction: Reaction = {
                    id: Date.now() + Math.random(),
                    emoji,
                    x: Math.random() * 80 + 10,
                };
                setReactions(prev => [...prev, reaction]);
                setTimeout(() => {
                    setReactions(prev => prev.filter(r => r.id !== reaction.id));
                }, 4000);
            };

            socket.on("reactionReceived", handleIncomingReaction);

            // Listen for chat messages
            const handleIncomingMessage = (msg: Message) => {
                setMessages(prev => [...prev, msg]);
                toast.info(`New comment from ${msg.senderName}`, {
                   description: msg.text,
                   position: "bottom-right",
                   duration: 3000,
                });
            };

            socket.on("messageReceived", handleIncomingMessage);

            return () => {
                socket.off("reactionReceived", handleIncomingReaction);
                socket.off("messageReceived", handleIncomingMessage);
            };
        }
    }, [loading, !!socket, !!profile, !!meeting]);

    const addReaction = (emoji: string) => {
        const reaction: Reaction = {
            id: Date.now(),
            emoji,
            x: Math.random() * 80 + 10, // 10% to 90%
        };
        setReactions(prev => [...prev, reaction]);
        
        // Emit to others
        if (socket) {
            socket.emit("meetingReaction", { meetingId: id, emoji });
        }

        setTimeout(() => {
            setReactions(prev => prev.filter(r => r.id !== reaction.id));
        }, 4000);
    };

    const handleAttend = async () => {
        if (!profile || !meeting) return;
        if (meeting.attendees.includes(profile.uid)) return;
        try {
            await addAttendeeToMeeting(id, profile.uid);
            // Local state update
            setMeeting({ ...meeting, attendees: [...meeting.attendees, profile.uid] });
            toast.success("Joined Meeting");
        } catch (err) {
            toast.error("Failed to join");
        }
    };

    const handleJoinMedia = async () => {
        if (!meeting) return;
        if (!meeting.attendees.includes(profile?.uid || "")) {
            await handleAttend();
        }
        
        // Optimistic UI update
        setIsMicOn(true);
        setIsVideoOn(true);
        
        const stream = await startMedia(true, true);
        if (!stream) {
            setIsMicOn(false);
            setIsVideoOn(false);
        }
    };

    const handleToggleMic = async () => {
        const newState = !isMicOn;
        setIsMicOn(newState); // Immediate feedback
        
        if (!localStream) {
            await handleJoinMedia();
            return;
        }
        toggleAudio(newState);
    };

    const handleToggleVideo = async () => {
        const newState = !isVideoOn;
        setIsVideoOn(newState); // Immediate feedback
        
        if (!localStream) {
            await handleJoinMedia();
            return;
        }
        toggleVideo(newState);
    };

    const updateStatus = async (status: Meeting["status"]) => {
        if (!meeting) return;
        try {
            await updateMeeting(id, { status });
            setMeeting({ ...meeting, status });
            toast.success(`Meeting ${status}`);
        } catch (err) {
            toast.error("Status update failed");
        }
    };

    const saveMinutes = async () => {
        if (!meeting) return;
        setSaving(true);
        try {
            await updateMeeting(id, { minutes });
            setMeeting({ ...meeting, minutes });
            toast.success("Resolutions archived");
        } catch (err) {
            toast.error("Failed to save minutes");
        } finally {
            setSaving(false);
        }
    };

    const sendMessage = () => {
        if (!messageInput.trim() || !profile || !meeting) return;
        
        const newMessage: Message = {
            id: Date.now().toString(),
            senderId: profile.uid,
            senderName: profile.fullName,
            text: messageInput.trim(),
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, newMessage]);
        socket?.emit("meetingMessage", { meetingId: id, message: newMessage });
        setMessageInput("");
    };

    if (loading) return <div className="h-screen bg-stone-900 flex items-center justify-center"><Loader2 className="animate-spin text-amber-500" size={48} /></div>;
    if (!meeting) return <div className="p-20 text-center text-stone-500 font-medium h-screen bg-stone-950">Meeting not found.</div>;

    const attendees = allUsers.filter(u => meeting.attendees.includes(u.uid));
    const canManageMeeting = profile?.uid === meeting.createdBy || profile?.role === "president" || profile?.role === "secretary";

    const handleToggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    // Financial Data Mock for Charts
    const chartData = [
        { name: "Total Capital", value: allUsers.reduce((s, u) => s + u.paidSoFar, 0) },
        { name: "Emergency Fund", value: allUsers.reduce((s, u) => s + u.emergencyTaken, 0) },
        { name: "Available", value: allUsers.reduce((s, u) => s + (u.paidSoFar - u.emergencyTaken), 0) },
    ];

    const isPlanned = meeting.status === "planned";
    const isOngoing = meeting.status === "ongoing";
    const isExpired = meeting.status === "expired";
    const isCompleted = meeting.status === "completed";

    return (
        <div className="h-screen bg-stone-950 text-white overflow-hidden flex flex-col font-sans">
            {/* Immersive Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 to-stone-950 pointer-events-none" />

            {/* Top Bar */}
            <header className="relative z-20 px-6 py-4 border-b border-stone-800 bg-stone-900/40 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/board/meetings")}
                        className="p-2 hover:bg-stone-800 rounded-xl transition-colors text-stone-400"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">{meeting.title}</h1>
                        <div className="flex items-center gap-3 mt-0.5">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                isOngoing ? 'bg-amber-500/10 text-amber-500 animate-pulse' : 
                                isExpired ? 'bg-red-500/10 text-red-500' :
                                'bg-stone-800 text-stone-400'
                            }`}>
                                {meeting.status}
                            </span>
                            <span className="text-[10px] text-stone-500 font-medium uppercase tracking-widest flex items-center gap-1">
                                <Users size={12} /> {attendees.length} Present
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex flex-col items-end px-4 border-r border-stone-800">
                        <span className="text-[10px] text-stone-500 font-black uppercase leading-none">Meeting Duration</span>
                        <span className="text-sm font-mono text-amber-500">00:45:12</span>
                    </div>

                    {canManageMeeting && isPlanned && (
                        <button
                            onClick={() => updateStatus("ongoing")}
                            className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-900/20 flex items-center gap-2"
                        >
                            <Play size={14} fill="currentColor" />
                            Start Session Now
                        </button>
                    )}

                    {canManageMeeting && isOngoing && (
                        <button
                            onClick={() => updateStatus("completed")}
                            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 font-bold text-xs uppercase tracking-widest transition-all"
                        >
                            End Session
                        </button>
                    )}

                    {isOngoing && !localStream && (
                        <button
                            onClick={handleJoinMedia}
                            className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-900/20 flex items-center gap-2"
                        >
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            {meeting.attendees.includes(profile?.uid || "") ? "Join Session" : "Connect"}
                        </button>
                    )}

                    {isExpired && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-red-600/10 border border-red-500/20 text-red-500 rounded-xl">
                            <AlertCircle size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Session Expired</span>
                        </div>
                    )}
                    
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`p-2.5 rounded-xl border transition-all ${isSidebarOpen ? "bg-amber-600 border-amber-500 text-white" : "bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200"
                            }`}
                    >
                        {isSidebarOpen ? <X size={18} /> : <MessageSquare size={18} />}
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="relative z-10 flex-1 flex overflow-hidden">
                {isExpired && (
                    <div className="absolute inset-x-0 top-0 z-50 p-4 bg-red-600 text-white flex items-center justify-center gap-3 font-black text-xs uppercase tracking-[0.3em] shadow-2xl">
                        <AlertCircle size={20} />
                        Strategic Session Terminated: Archived for Internal Review
                    </div>
                )}

                {isPlanned && !canManageMeeting && (
                    <div className="absolute inset-0 z-[100] bg-stone-950/90 backdrop-blur-xl flex flex-col items-center justify-center text-center p-10">
                        <div className="w-24 h-24 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-8 animate-pulse text-amber-500">
                             <Clock size={48} />
                        </div>
                        <h2 className="text-4xl font-black tracking-tighter mb-4 uppercase">Session Pending</h2>
                        <p className="text-stone-400 font-bold text-sm max-w-md mb-10 leading-relaxed uppercase tracking-widest">
                            The chairman has not yet initiated the legislative floor. Please stand by for synchronization.
                        </p>
                        <div className="flex flex-col items-center gap-2">
                             <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em]">Est. Countdown</span>
                             <span className="text-6xl font-black text-white font-mono tracking-tighter">{timeLeft}</span>
                        </div>
                    </div>
                )}

                {/* Left: Video Grid Simulation */}
                <div className="flex-1 p-6 relative flex flex-col">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
                        {/* My Feed */}
                        {(isOngoing || isCompleted || (isPlanned && canManageMeeting)) && (
                            <ParticipantVideo
                                name={`${profile?.fullName || 'Me'} (You)`}
                                isMe
                                isVideoOn={isVideoOn}
                                isMicOn={isMicOn}
                                stream={localStream}
                                role={profile?.role || "Board"}
                            />
                        )}

                        {/* Other Attendees */}
                        {attendees.map((u, i) => {
                            const remoteData = remoteStreams[u.uid];
                            const remoteStream = remoteData?.stream || null;
                            return u.uid !== profile?.uid && (
                                <ParticipantVideo
                                    key={u.uid}
                                    name={u.fullName}
                                    role={u.role}
                                    stream={remoteStream}
                                    isVideoOn={!!remoteStream && remoteStream.getVideoTracks().some(t => t.enabled)}
                                    isMicOn={!!remoteStream && remoteStream.getAudioTracks().some(t => t.enabled)}
                                />
                            );
                        })}

                        {/* Empty Slots */}
                        {Array.from({ length: Math.max(0, 6 - attendees.length) }).map((_, i) => (
                            <div key={i} className="rounded-3xl bg-stone-900/50 border border-stone-800 border-dashed flex items-center justify-center text-stone-700">
                                <Users size={40} opacity={0.1} />
                            </div>
                        ))}
                    </div>

                    {/* Reaction Overlay - Front of everything */}
                    <div className="absolute inset-x-0 top-0 bottom-24 pointer-events-none overflow-hidden z-[999]">
                        <AnimatePresence>
                            {reactions.map(r => (
                                <motion.div
                                    key={r.id}
                                    initial={{ y: "100vh", opacity: 0, x: `${r.x}vw`, scale: 0.5 }}
                                    animate={{ 
                                        y: "-10vh", 
                                        opacity: [0, 1, 1, 0], 
                                        scale: [0.5, 1.5, 1, 0.5],
                                        x: [`${r.x}vw`, `${r.x + (Math.random() * 20 - 10)}vw`, `${r.x + (Math.random() * 40 - 20)}vw`]
                                    }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 4, ease: "easeOut" }}
                                    className="absolute text-5xl filter drop-shadow-lg"
                                >
                                    {r.emoji}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Floating Controls Bar */}
                    <div className="mt-6 flex justify-center">
                        <motion.div
                            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                            className="bg-stone-900/90 backdrop-blur-2xl border border-stone-700/50 px-8 py-4 rounded-3xl flex items-center gap-8 shadow-2xl"
                        >
                             <ControlBtn
                                onClick={handleToggleMic}
                                active={isMicOn}
                                icon={isMicOn ? Mic : MicOff}
                                color={isMicOn ? "bg-amber-600" : "bg-red-600"}
                            />
                            <ControlBtn
                                onClick={handleToggleVideo}
                                active={isVideoOn}
                                icon={isVideoOn ? Video : VideoOff}
                                color={isVideoOn ? "bg-amber-600" : "bg-red-600"}
                            />

                            <div className="w-px h-8 bg-stone-700 mx-2" />

                            <div className="flex gap-4">
                                {["👍", "❤️", "👏", "🔥", "❓"].map(e => (
                                    <button
                                        key={e}
                                        onClick={() => addReaction(e)}
                                        className="w-10 h-10 rounded-full hover:bg-stone-800 flex items-center justify-center text-xl transition-all hover:scale-125"
                                    >
                                        {e}
                                    </button>
                                ))}
                            </div>

                            <div className="w-px h-8 bg-stone-700 mx-2" />

                            <ControlBtn 
                                icon={Share2} 
                                onClick={() => {
                                    const url = window.location.origin + `/board/meetings/${id}`;
                                    navigator.clipboard.writeText(url);
                                    toast.success("Meeting link copied");
                                }}
                            />
                            <ControlBtn 
                                icon={MessageSquare} 
                                onClick={() => {
                                    setActiveTab("chat");
                                    setIsSidebarOpen(true);
                                }}
                            />
                            <ControlBtn 
                                icon={Maximize2} 
                                onClick={handleToggleFullscreen}
                            />
                        </motion.div>
                    </div>
                </div>

                {/* Overlay Backdrop when sidebar is open */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="absolute inset-0 bg-stone-950/40 backdrop-blur-sm z-40"
                        />
                    )}
                </AnimatePresence>

                {/* Right: Tabbed Info Sidebar Overlay */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.aside
                            initial={{ x: 600, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 600, opacity: 0 }}
                            transition={{ type: "spring", damping: 30, stiffness: 200 }}
                            className="absolute top-0 right-0 w-[600px] bg-stone-900 h-full border-l border-stone-800 flex flex-col z-50 shadow-[-40px_0_80px_rgba(0,0,0,0.6)]"
                        >
                            <div className="flex border-b border-stone-800">
                                <TabBtn active={activeTab === "agenda"} onClick={() => setActiveTab("agenda")} label="Agenda" icon={Info} />
                                <TabBtn active={activeTab === "chat"} onClick={() => setActiveTab("chat")} label="Chat" icon={MessageSquare} />
                                <TabBtn active={activeTab === "minutes"} onClick={() => setActiveTab("minutes")} label="Minutes" icon={StickyNote} />
                                <TabBtn active={activeTab === "financials"} onClick={() => setActiveTab("financials")} label="Financials" icon={TrendingUp} />
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                                <AnimatePresence mode="wait">
                                    {activeTab === "agenda" && (
                                        <motion.div
                                            key="agenda" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                            className="space-y-8"
                                        >
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest">Main Purpose</h3>
                                                <button
                                                    onClick={() => setExpandedAgenda(true)}
                                                    className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 transition-colors"
                                                >
                                                    <Maximize2 size={14} />
                                                </button>
                                            </div>
                                            <div className="p-8 bg-gradient-to-br from-stone-800/80 to-stone-900 border border-stone-700/50 rounded-[32px] shadow-inner">
                                                <p className="text-stone-100 text-lg font-medium leading-relaxed whitespace-pre-wrap">{meeting.agenda}</p>
                                            </div>

                                            <div className="space-y-4">
                                                <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest">Meeting Host</h3>
                                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-stone-800/30 border border-stone-800">
                                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                                        <Shield size={24} className="text-amber-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white">CampusLink Board</p>
                                                        <p className="text-[10px] text-stone-500 uppercase font-black tracking-widest">Official Strategic Session</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === "minutes" && (
                                        <motion.div
                                            key="minutes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                            className="h-full flex flex-col space-y-4"
                                        >
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest">Session Minutes</h3>
                                                {canManageMeeting && (
                                                    <button
                                                        onClick={saveMinutes} disabled={saving}
                                                        className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                                                    >
                                                        {saving ? "Saving..." : <><Save size={12} /> Save Decisions</>}
                                                    </button>
                                                )}
                                            </div>

                                            {canManageMeeting ? (
                                                <textarea
                                                    value={minutes}
                                                    onChange={(e) => setMinutes(e.target.value)}
                                                    placeholder="Start capturing decisions..."
                                                    className="flex-1 w-full bg-stone-950/50 border border-stone-800 rounded-[32px] p-8 text-stone-200 text-base focus:outline-none focus:ring-1 focus:ring-amber-500/30 resize-none min-h-[500px] leading-relaxed"
                                                />
                                            ) : (
                                                <div className="p-8 bg-stone-950/50 rounded-[32px] border border-stone-800 text-stone-400 text-base italic leading-relaxed">
                                                    {meeting.minutes || "The secretary is currently capturing meeting minutes."}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                     {activeTab === "chat" && (
                                        <motion.div
                                            key="chat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                            className="h-full flex flex-col"
                                        >
                                            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide mb-4">
                                                {messages.length === 0 ? (
                                                    <div className="h-full flex flex-col items-center justify-center text-stone-600 gap-4 opacity-40">
                                                        <MessageSquare size={48} />
                                                        <p className="text-xs font-black uppercase tracking-widest text-center"> Legislative floor is quiet.<br/>Start the discourse.</p>
                                                    </div>
                                                ) : (
                                                    messages.map((m) => (
                                                        <div key={m.id} className={`flex flex-col ${m.senderId === profile?.uid ? 'items-end' : 'items-start'}`}>
                                                            <div className="flex items-center gap-2 mb-1 px-1">
                                                                <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest">{m.senderName}</span>
                                                                <span className="text-[8px] text-stone-700 font-mono">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                                                                m.senderId === profile?.uid 
                                                                ? 'bg-amber-600 text-white rounded-tr-none' 
                                                                : 'bg-stone-800 text-stone-200 rounded-tl-none border border-stone-700/50'
                                                            }`}>
                                                                {m.text}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            
                                            <div className="relative mt-auto">
                                                <input
                                                    type="text"
                                                    value={messageInput}
                                                    onChange={(e) => setMessageInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                                    placeholder="Share strategic insights..."
                                                    className="w-full bg-stone-950 border border-stone-800 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/30 pr-16"
                                                />
                                                <button 
                                                    onClick={sendMessage}
                                                    className="absolute right-2 top-2 bottom-2 aspect-square bg-amber-600 hover:bg-amber-700 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg"
                                                >
                                                    <ChevronRight size={18} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeTab === "financials" && (
                                        <motion.div
                                            key="financials" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                            className="space-y-8"
                                        >
                                            <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest">Real-time Fund Metrics</h3>

                                            <div className="h-[300px] w-full bg-stone-950/50 p-6 rounded-[32px] border border-stone-800 shadow-inner">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={chartData} layout="vertical" margin={{ left: -20, right: 20 }}>
                                                        <XAxis type="number" hide />
                                                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#78716c", fontWeight: 700 }} width={80} />
                                                        <Tooltip
                                                            cursor={{ fill: '#ffffff05' }}
                                                            contentStyle={{ background: '#1c1917', border: '1px solid #333', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                                                            formatter={(v: number) => formatRF(v)}
                                                        />
                                                        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32}>
                                                            {chartData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={index === 0 ? "#f59e0b" : index === 1 ? "#ef4444" : "#10b981"} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>

                                            <div className="grid gap-4">
                                                {chartData.map((d, i) => (
                                                    <div key={d.name} className="flex items-center justify-between p-5 rounded-3xl bg-stone-800/40 border border-stone-800/50 hover:bg-stone-800/60 transition-colors">
                                                        <div>
                                                            <p className="text-[10px] text-stone-500 font-black uppercase tracking-widest leading-none mb-1.5">{d.name}</p>
                                                            <p className="font-bold text-white text-lg tracking-tight">{formatRF(d.value)}</p>
                                                        </div>
                                                        <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${i === 0 ? "bg-amber-500" : i === 1 ? "bg-red-500" : "bg-green-500"}`} />
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-3">
                                                <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                                <p className="text-[11px] text-stone-400 font-medium leading-relaxed">
                                                    The figures above are aggregated in real-time. Board decisions impacting capital should consider current liquidity ratios.
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Modal for Expanded Agenda */}
                <AnimatePresence>
                    {expandedAgenda && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setExpandedAgenda(false)}
                                className="absolute inset-0 bg-stone-950/90 backdrop-blur-xl"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="relative w-full max-w-3xl bg-stone-900 border border-stone-800 rounded-[48px] p-12 overflow-hidden shadow-2xl"
                            >
                                <div className="absolute top-8 right-8">
                                    <button
                                        onClick={() => setExpandedAgenda(false)}
                                        className="p-3 rounded-full bg-stone-800 hover:bg-stone-700 text-white transition-all"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                                <div className="flex flex-col h-full max-h-[70vh]">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                                            <Info size={28} className="text-amber-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-bold tracking-tight text-white">{meeting.title}</h2>
                                            <p className="text-amber-500 font-black text-xs uppercase tracking-widest mt-1">Full Session Agenda</p>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide">
                                        <p className="text-stone-300 text-2xl font-medium leading-relaxed whitespace-pre-wrap">
                                            {meeting.agenda}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

function ParticipantVideo({ name, role, isMe, isVideoOn, isMicOn, stream }: any) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="relative rounded-[32px] bg-stone-900 border border-stone-800 overflow-hidden aspect-video group shadow-xl">
            <div className="absolute inset-0 flex items-center justify-center">
                {/* Always render video element if stream exists to keep audio playing */}
                {stream && (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted={isMe}
                        className={`w-full h-full object-cover transition-opacity duration-500 ${isVideoOn ? 'opacity-100' : 'opacity-0'}`}
                    />
                )}
                
                {!isVideoOn && (
                    <div className="absolute inset-0 bg-stone-800 overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-blue-500/5 animate-pulse" />
                        {isMe ? (
                            <div className="w-24 h-24 rounded-full bg-amber-500 flex items-center justify-center text-4xl font-bold border-4 border-amber-400/50 shadow-2xl">
                                {name.charAt(0)}
                            </div>
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-stone-700 flex items-center justify-center text-3xl font-bold border-2 border-stone-600">
                                {name.charAt(0)}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className={`absolute top-4 right-4 p-1.5 rounded-lg ${isMicOn ? 'bg-amber-500' : 'bg-red-500/20 text-red-500'}`}>
                {isMicOn ? <Mic size={14} /> : <MicOff size={14} />}
            </div>

            <div className="absolute bottom-4 left-4 right-4 p-3 bg-stone-950/60 backdrop-blur-md border border-white/5 rounded-2xl flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold leading-none">{name}</p>
                    <p className="text-[9px] text-stone-400 uppercase font-black tracking-widest mt-1">{role}</p>
                </div>
                {isMicOn && (
                    <div className="flex gap-1">
                        {[1, 2, 3].map(i => (
                            <motion.div
                                key={i}
                                animate={{ height: [4, 12, 4] }}
                                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                className="w-1 bg-amber-500 rounded-full"
                            />
                        ))}
                    </div>
                )}
            </div>

            {isMicOn && (
                <div className="absolute inset-0 border-2 border-amber-500/50 rounded-[32px] pointer-events-none" />
            )}
        </div>
    );
}

function ControlBtn({ icon: Icon, active, color, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${color || "bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300"
                }`}
        >
            <Icon size={20} />
        </button>
    );
}

function TabBtn({ active, onClick, label, icon: Icon }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-2 py-4 border-b-2 transition-all ${active
                ? "border-amber-500 bg-stone-800/50 text-white font-bold"
                : "border-transparent text-stone-500 hover:text-stone-300"
                }`}
        >
            <Icon size={16} />
            <span className="text-xs uppercase font-black tracking-widest">{label}</span>
        </button>
    );
}
