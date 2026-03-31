import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-hot-toast";
import {
  LuArrowLeft, LuCheck, LuCheckCheck, LuClock3, LuDownload, LuFile, LuImage,
  LuLoaderCircle, LuMail, LuPencil, LuSearch, LuSend, LuTrash2, LuUser, LuUsers, LuX,
} from "react-icons/lu";
import moment from "moment";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS, BASE_URL } from "../../utils/apiPaths";
import { getErrorMessage, getInitials } from "../../utils/helper";
import { useUser } from "../../context/userContext";

const t = (d) => (d ? moment(d).format("hh:mm A") : "");
const listT = (d) => {
  if (!d) return "";
  const m = moment(d);
  if (m.isSame(moment(), "day")) return m.format("hh:mm A");
  if (m.isSame(moment().subtract(1, "day"), "day")) return "Yesterday";
  return m.format("MMM D");
};
const isImg = (a) =>
  Boolean(a && (String(a.mimeType || "").startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(String(a.originalName || ""))));
const preview = (m) => (m?.deletedForEveryone ? "This message was deleted" : m?.text || (m?.attachment?.originalName ? `Attachment: ${m.attachment.originalName}` : "No messages yet"));

const Chat = () => {
  const { user, getRoleLabel } = useUser();
  const socketRef = useRef(null);
  const endRef = useRef(null);
  const typingTimerRef = useRef(null);
  const activeConvRef = useRef("");
  const msgRefs = useRef({});

  const [conversations, setConversations] = useState([]);
  const [convLoading, setConvLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [typingByConv, setTypingByConv] = useState({});
  const [searchEmail, setSearchEmail] = useState("");
  const [searchUsers, setSearchUsers] = useState([]);
  const [searchUsersLoading, setSearchUsersLoading] = useState(false);
  const [chatQuery, setChatQuery] = useState("");
  const [chatResults, setChatResults] = useState([]);
  const [chatSearchLoading, setChatSearchLoading] = useState(false);
  const [highlight, setHighlight] = useState("");
  const [editing, setEditing] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [delModal, setDelModal] = useState(null);
  const [delLoading, setDelLoading] = useState(false);
  const [profileModal, setProfileModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const isMobile = typeof window !== "undefined" ? window.innerWidth < 1024 : false;

  const selectedConv = useMemo(() => conversations.find((c) => c._id === selectedId) || null, [conversations, selectedId]);
  const participant = selectedConv?.participant || null;

  const upsertMessage = (message) => {
    if (!message?._id) return;
    setMessages((prev) => {
      const exists = prev.some((x) => x._id === message._id);
      const next = exists ? prev.map((x) => (x._id === message._id ? { ...x, ...message } : x)) : [...prev, message];
      return next.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    });
  };
  const upsertConv = (conv) => {
    if (!conv?._id) return;
    setConversations((prev) => {
      const ex = prev.find((x) => x._id === conv._id);
      const merged = ex ? { ...ex, ...conv } : conv;
      return [merged, ...prev.filter((x) => x._id !== conv._id)].sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
    });
  };
  const markSeen = useCallback(async (conversationId) => {
    if (!conversationId) return;
    try {
      await axiosInstance.post(API_PATHS.CHAT.MARK_SEEN(conversationId));
      setConversations((prev) => prev.map((x) => (x._id === conversationId ? { ...x, unreadCount: 0 } : x)));
    } catch {
      // ignore passive seen errors
    }
  }, []);
  const scrollBottom = () => endRef.current?.scrollIntoView({ behavior: "smooth" });

  const loadConversations = useCallback(async () => {
    try {
      setConvLoading(true);
      const r = await axiosInstance.get(API_PATHS.CHAT.GET_CONVERSATIONS);
      const list = r.data?.conversations || [];
      setConversations(list);
      if (!selectedId && list[0]?._id) setSelectedId(list[0]._id);
    } catch (e) {
      toast.error(getErrorMessage(e) || "Failed to load conversations");
    } finally {
      setConvLoading(false);
    }
  }, [selectedId]);

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    try {
      setMsgLoading(true);
      const r = await axiosInstance.get(API_PATHS.CHAT.GET_MESSAGES(conversationId), { params: { limit: 100 } });
      setMessages(r.data?.messages || []);
      markSeen(conversationId);
    } catch (e) {
      toast.error(getErrorMessage(e) || "Failed to load messages");
      setMessages([]);
    } finally {
      setMsgLoading(false);
    }
  }, [markSeen]);

  useEffect(() => { loadConversations(); }, [loadConversations]);
  useEffect(() => { if (selectedId) loadMessages(selectedId); }, [selectedId, loadMessages]);
  useEffect(() => { activeConvRef.current = selectedId; }, [selectedId]);
  useEffect(() => { if (highlight) { const id = setTimeout(() => setHighlight(""), 2200); return () => clearTimeout(id); } }, [highlight]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "auto" }); }, [messages.length]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user?._id) return;
    const s = io(BASE_URL, { transports: ["websocket"], auth: { token } });
    socketRef.current = s;

    s.on("chat:message:new", ({ conversationId, message }) => {
      if (!conversationId || !message) return;
      if (conversationId === activeConvRef.current) {
        upsertMessage(message);
        if (String(message.sender?._id) !== String(user._id)) markSeen(conversationId);
        setTimeout(scrollBottom, 20);
      }
      setConversations((prev) => prev.map((c) => {
        if (c._id !== conversationId) return c;
        const unread = conversationId === activeConvRef.current || String(message.sender?._id) === String(user._id) ? c.unreadCount || 0 : (c.unreadCount || 0) + 1;
        return { ...c, lastMessage: message, lastMessageAt: message.createdAt, unreadCount: unread };
      }).sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0)));
    });
    s.on("chat:message:updated", ({ conversationId, message }) => {
      if (!conversationId || !message) return;
      if (conversationId === activeConvRef.current) upsertMessage(message);
      setConversations((prev) => prev.map((c) => (c._id === conversationId && c.lastMessage?._id === message._id ? { ...c, lastMessage: message } : c)));
    });
    s.on("chat:message:delivered", ({ conversationId, messageIds }) => {
      if (conversationId !== activeConvRef.current) return;
      const ids = new Set((messageIds || []).map(String));
      setMessages((prev) => prev.map((m) => (ids.has(String(m._id)) ? { ...m, senderReceipt: { ...(m.senderReceipt || {}), status: "delivered", seenAt: null } } : m)));
    });
    s.on("chat:message:seen", ({ conversationId, messageIds, seenAt }) => {
      const ids = new Set((messageIds || []).map(String));
      if (conversationId === activeConvRef.current) {
        setMessages((prev) => prev.map((m) => (ids.has(String(m._id)) ? { ...m, senderReceipt: { ...(m.senderReceipt || {}), status: "seen", seenAt } } : m)));
      }
      setConversations((prev) => prev.map((c) => (c._id === conversationId ? { ...c, unreadCount: 0 } : c)));
    });
    s.on("chat:user-status", ({ userId, isOnline, lastSeenAt }) => {
      if (!userId) return;
      setConversations((prev) => prev.map((c) => (String(c.participant?._id) === String(userId) ? { ...c, participant: { ...c.participant, isOnline: !!isOnline, lastSeenAt: isOnline ? null : lastSeenAt || c.participant?.lastSeenAt } } : c)));
      setProfile((p) => (p && String(p._id) === String(userId) ? { ...p, isOnline: !!isOnline, lastSeenAt: isOnline ? null : lastSeenAt || p.lastSeenAt } : p));
    });
    s.on("chat:typing", ({ conversationId, userId }) => {
      if (!conversationId || !userId || String(userId) === String(user._id)) return;
      setTypingByConv((prev) => ({ ...prev, [conversationId]: String(userId) }));
    });
    s.on("chat:stop-typing", ({ conversationId, userId }) => {
      setTypingByConv((prev) => {
        if (!conversationId || String(prev[conversationId]) !== String(userId)) return prev;
        const next = { ...prev }; delete next[conversationId]; return next;
      });
    });
    s.on("chat:conversation:updated", loadConversations);

    return () => { s.disconnect(); socketRef.current = null; };
  }, [user?._id, loadConversations, markSeen]);

  useEffect(() => {
    if (!socketRef.current || !selectedId) return;
    socketRef.current.emit("chat:join", { conversationId: selectedId });
    markSeen(selectedId);
    return () => socketRef.current?.emit("chat:leave", { conversationId: selectedId });
  }, [selectedId, markSeen]);

  useEffect(() => {
    const q = String(searchEmail || "").trim();
    const timer = setTimeout(async () => {
      if (q.length < 2) return setSearchUsers([]);
      try {
        setSearchUsersLoading(true);
        const r = await axiosInstance.get(API_PATHS.CHAT.SEARCH_USERS, { params: { email: q } });
        setSearchUsers(r.data?.users || []);
      } catch (e) {
        toast.error(getErrorMessage(e) || "Failed to search users");
        setSearchUsers([]);
      } finally {
        setSearchUsersLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchEmail]);

  useEffect(() => {
    const q = String(chatQuery || "").trim();
    const timer = setTimeout(async () => {
      if (!selectedId || q.length < 2) return setChatResults([]);
      try {
        setChatSearchLoading(true);
        const r = await axiosInstance.get(API_PATHS.CHAT.SEARCH_MESSAGES(selectedId), { params: { query: q } });
        setChatResults(r.data?.messages || []);
      } catch (e) {
        toast.error(getErrorMessage(e) || "Failed to search messages");
        setChatResults([]);
      } finally {
        setChatSearchLoading(false);
      }
    }, 320);
    return () => clearTimeout(timer);
  }, [chatQuery, selectedId]);

  const startConversation = async (u) => {
    try {
      const r = await axiosInstance.post(API_PATHS.CHAT.START_CONVERSATION, { recipientId: u._id });
      const c = r.data?.conversation; if (!c?._id) return;
      upsertConv(c); setSelectedId(c._id); setSearchEmail(""); setSearchUsers([]);
    } catch (e) {
      toast.error(getErrorMessage(e) || "Failed to start conversation");
    }
  };

  const sendTyping = () => {
    if (!selectedId || !socketRef.current) return;
    socketRef.current.emit("chat:typing", { conversationId: selectedId });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => socketRef.current?.emit("chat:stop-typing", { conversationId: selectedId }), 900);
  };

  const sendMessage = async () => {
    const trimmed = String(text || "").trim();
    if (!selectedId || sending || (!trimmed && !file)) return;
    try {
      setSending(true);
      const fd = new FormData();
      fd.append("conversationId", selectedId);
      if (trimmed) fd.append("text", trimmed);
      if (file) fd.append("attachment", file);
      const r = await axiosInstance.post(API_PATHS.CHAT.SEND_MESSAGE, fd, { headers: { "Content-Type": "multipart/form-data" } });
      if (r.data?.message) upsertMessage(r.data.message);
      setText(""); setFile(null); setTimeout(scrollBottom, 25);
      socketRef.current?.emit("chat:stop-typing", { conversationId: selectedId });
    } catch (e) {
      toast.error(getErrorMessage(e) || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const saveEdit = async () => {
    const val = String(editingText || "").trim();
    if (!editing?._id || !val) return toast.error("Message text is required");
    try {
      setEditLoading(true);
      const r = await axiosInstance.put(API_PATHS.CHAT.EDIT_MESSAGE(editing._id), { text: val });
      if (r.data?.message) upsertMessage(r.data.message);
      setEditing(null); setEditingText("");
      toast.success("Message updated");
    } catch (e) {
      toast.error(getErrorMessage(e) || "Failed to edit message");
    } finally {
      setEditLoading(false);
    }
  };

  const deleteMessage = async (scope) => {
    if (!delModal?._id) return;
    try {
      setDelLoading(true);
      await axiosInstance.delete(API_PATHS.CHAT.DELETE_MESSAGE(delModal._id), { data: { scope } });
      if (scope === "me") setMessages((prev) => prev.filter((m) => m._id !== delModal._id));
      setDelModal(null);
      toast.success(scope === "everyone" ? "Message deleted for everyone" : "Message deleted");
    } catch (e) {
      toast.error(getErrorMessage(e) || "Failed to delete message");
    } finally {
      setDelLoading(false);
    }
  };

  const openProfile = async (userId) => {
    if (!userId) return;
    try {
      setProfileModal(true); setProfileLoading(true);
      const r = await axiosInstance.get(API_PATHS.CHAT.GET_USER_PROFILE(userId));
      setProfile(r.data?.user || null);
    } catch (e) {
      toast.error(getErrorMessage(e) || "Failed to load profile");
      setProfileModal(false); setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="my-5 max-w-[1500px] mx-auto">
        <h1 className="text-xl sm:text-2xl font-semibold app-text">Chat</h1>
        <p className="text-sm app-text-muted mt-1">Real-time one-on-one chat with files, read receipts, typing status, and message search.</p>
        <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-4 h-[calc(100vh-190px)] min-h-[520px] overflow-hidden mt-4">
          {(!isMobile || !selectedId) && (
            <div className="h-full flex flex-col app-card rounded-2xl overflow-hidden">
              <div className="p-4 app-border-bottom bg-gradient-to-r from-[var(--app-primary-green)]/10 to-[var(--app-primary-blue)]/10">
                <h2 className="text-lg font-semibold app-text flex items-center gap-2"><LuUsers className="text-primary" />Conversations</h2>
                <div className="mt-3 relative">
                  <LuMail className="absolute left-3 top-1/2 -translate-y-1/2 app-text-muted" />
                  <input value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} placeholder="Search by email..." className="w-full rounded-lg pl-9 pr-3 py-2.5 app-surface app-border app-text text-sm outline-none focus:border-primary" />
                </div>
                {searchEmail.trim().length >= 2 && (
                  <div className="mt-2 rounded-lg app-border app-surface max-h-52 overflow-y-auto">
                    {searchUsersLoading ? <div className="p-3 text-xs app-text-muted flex items-center gap-2"><LuLoaderCircle className="animate-spin" />Searching...</div> : searchUsers.length === 0 ? <div className="p-3 text-xs app-text-muted">No users found</div> : searchUsers.map((u) => (
                      <button key={u._id} onClick={() => startConversation(u)} className="w-full text-left px-3 py-2.5 app-border-bottom last:border-b-0 hover:bg-[var(--app-surface-hover)]">
                        <div className="flex items-center gap-2">
                          {u.profileImageUrl ? <img src={u.profileImageUrl} alt={u.name} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">{getInitials(u.name)}</div>}
                          <div className="min-w-0"><p className="text-sm font-medium app-text truncate">{u.name}</p><p className="text-xs app-text-muted truncate">{u.email}</p></div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">
                {convLoading ? <div className="p-4 text-sm app-text-muted flex items-center gap-2"><LuLoaderCircle className="animate-spin" />Loading...</div> : conversations.length === 0 ? <div className="p-6 text-sm app-text-muted">No active chats yet.</div> : conversations.map((c) => (
                  <button key={c._id} onClick={() => setSelectedId(c._id)} className={`w-full px-4 py-3.5 text-left app-border-bottom ${c._id === selectedId ? "bg-[var(--app-blue-soft)]/50" : "hover:bg-[var(--app-surface-hover)]"}`}>
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        {c.participant?.profileImageUrl ? <img src={c.participant.profileImageUrl} alt={c.participant.name} className="w-11 h-11 rounded-full object-cover" /> : <div className="w-11 h-11 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center">{getInitials(c.participant?.name)}</div>}
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${c.participant?.isOnline ? "bg-emerald-500" : "bg-gray-400"}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between gap-2"><p className="text-sm font-semibold app-text truncate">{c.participant?.name || "Unknown"}</p><span className="text-[11px] app-text-muted">{listT(c.lastMessageAt)}</span></div>
                        <p className="text-xs app-text-muted truncate mt-0.5">{typingByConv[c._id] ? "Typing..." : preview(c.lastMessage)}</p>
                        {Number(c.unreadCount || 0) > 0 && <span className="inline-flex mt-1 text-[11px] min-w-5 h-5 px-1 rounded-full bg-[var(--app-primary-green)] text-white items-center justify-center">{c.unreadCount}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(!isMobile || selectedId) && (
            <div className="h-full min-h-0 app-card rounded-2xl overflow-hidden flex flex-col">
              {!selectedConv ? <div className="h-full flex items-center justify-center app-text-muted">Select a conversation</div> : (
                <>
                  <div className="px-4 py-3.5 app-border-bottom bg-gradient-to-r from-[var(--app-primary-blue)]/10 to-[var(--app-primary-green)]/10">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setSelectedId("")} className="lg:hidden w-8 h-8 rounded-lg app-border app-surface inline-flex items-center justify-center"><LuArrowLeft /></button>
                      {participant?.profileImageUrl ? <img src={participant.profileImageUrl} alt={participant.name} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center">{getInitials(participant?.name)}</div>}
                      <div className="min-w-0 flex-1">
                        <button className="text-left hover:underline" onClick={() => openProfile(participant?._id)}><p className="text-sm font-semibold app-text truncate">{participant?.name}</p></button>
                        <p className="text-xs app-text-muted">{typingByConv[selectedId] ? "Typing..." : participant?.isOnline ? "Online" : participant?.lastSeenAt ? `Last seen ${moment(participant.lastSeenAt).fromNow()}` : "Offline"}</p>
                      </div>
                      <div className="relative w-48">
                        <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 app-text-muted text-sm" />
                        <input value={chatQuery} onChange={(e) => setChatQuery(e.target.value)} placeholder="Search in chat" className="w-full rounded-lg pl-9 pr-3 py-2 text-xs app-surface app-border app-text outline-none focus:border-primary" />
                        {chatQuery.trim().length >= 2 && <div className="absolute top-[calc(100%+6px)] left-0 right-0 rounded-lg app-border app-surface shadow-lg z-20 max-h-64 overflow-y-auto">
                          {chatSearchLoading ? <div className="p-3 text-xs app-text-muted">Searching...</div> : chatResults.length === 0 ? <div className="p-3 text-xs app-text-muted">No messages found</div> : chatResults.map((m) => (
                            <button key={m._id} onClick={() => { setMessages((prev) => prev.some((x) => x._id === m._id) ? prev : [...prev, m].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))); setHighlight(m._id); setChatResults([]); setChatQuery(""); setTimeout(() => msgRefs.current[m._id]?.scrollIntoView({ behavior: "smooth", block: "center" }), 60); }} className="w-full px-3 py-2 text-left hover:bg-[var(--app-surface-hover)] app-border-bottom last:border-b-0"><p className="text-xs app-text truncate">{m.text || m.attachment?.originalName || "Attachment"}</p></button>
                          ))}
                        </div>}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-4 space-y-3 bg-[radial-gradient(circle_at_top,_rgba(25,79,135,0.08),_transparent_40%),radial-gradient(circle_at_bottom,_rgba(15,88,65,0.08),_transparent_35%)]">
                    {msgLoading ? <div className="h-full flex items-center justify-center app-text-muted"><LuLoaderCircle className="animate-spin" /></div> : messages.length === 0 ? <div className="h-full flex items-center justify-center app-text-muted">No messages yet</div> : messages.map((m) => {
                      const own = String(m.sender?._id) === String(user?._id);
                      const canEdit = own && !m.deletedForEveryone && !!m.text;
                      const ownStatus = m.senderReceipt?.status || "sent";
                      return (
                        <div key={m._id} ref={(n) => { msgRefs.current[m._id] = n; }} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[92%] sm:max-w-[78%] rounded-2xl px-3 py-2.5 border shadow-sm ${own ? "bg-[var(--app-primary-blue)] text-white border-[var(--app-primary-blue)]" : "app-surface app-text app-border"} ${highlight === m._id ? "ring-2 ring-[var(--app-primary-green)]" : ""}`}>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className={`text-[11px] font-semibold ${own ? "text-blue-100" : "text-emerald-700"}`}>{m.sender?.name || "User"}</p>
                              <div className="flex items-center gap-1.5">
                                {canEdit && <button onClick={() => { setEditing(m); setEditingText(m.text || ""); }} className={own ? "text-blue-100 hover:text-white" : "app-text-muted"}><LuPencil className="text-[12px]" /></button>}
                                <button onClick={() => setDelModal(m)} className={own ? "text-blue-100 hover:text-white" : "app-text-muted"}><LuTrash2 className="text-[12px]" /></button>
                              </div>
                            </div>
                            {m.text ? <p className="text-sm whitespace-pre-wrap break-words">{m.text}</p> : null}
                            {m.attachment && <div className={`mt-2 rounded-lg p-2 border ${own ? "border-blue-300/40 bg-white/10" : "app-border bg-[var(--app-surface-hover)]"}`}>
                              {isImg(m.attachment) ? <a href={m.attachment.url} target="_blank" rel="noreferrer"><img src={m.attachment.url} alt={m.attachment.originalName || "Attachment"} className="w-full max-h-64 object-cover rounded-lg" /></a> : <div className="flex items-center gap-2"><LuFile /><p className="text-xs truncate">{m.attachment.originalName || "Attachment"}</p></div>}
                              <a href={m.attachment.url} download={m.attachment.originalName || true} className={`mt-2 inline-flex items-center gap-1 text-xs underline ${own ? "text-blue-100 hover:text-white" : "text-primary"}`}><LuDownload />Download</a>
                            </div>}
                            <div className="mt-1.5 flex items-center justify-end gap-2 flex-wrap text-[11px]">
                              <span className={own ? "text-blue-100" : "app-text-muted"}>{t(m.createdAt)}</span>
                              {m.edited && !m.deletedForEveryone && <span className={own ? "text-blue-100" : "app-text-muted"}>Edited</span>}
                              {own && (ownStatus === "seen" ? <span className="inline-flex items-center gap-1 text-emerald-300"><LuCheckCheck />Seen {t(m.senderReceipt?.seenAt)}</span> : ownStatus === "delivered" ? <span className="inline-flex items-center gap-1 text-blue-100"><LuCheck />Delivered</span> : <span className="inline-flex items-center gap-1 text-blue-100"><LuClock3 />Sending</span>)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={endRef} />
                  </div>

                  <div className="sticky bottom-0 z-10 p-3 sm:p-4 app-border-top app-surface">
                    {editing && <div className="mb-3 rounded-lg app-border bg-[var(--app-surface-hover)] p-2.5">
                      <p className="text-xs app-text-muted mb-1">Editing message</p>
                      <div className="flex items-center gap-2">
                        <input value={editingText} onChange={(e) => setEditingText(e.target.value)} className="flex-1 rounded-lg app-border app-surface app-text text-sm px-3 py-2 outline-none focus:border-primary" />
                        <button disabled={editLoading} onClick={saveEdit} className="px-3 py-2 rounded-lg bg-[var(--app-primary-green)] text-white text-sm">{editLoading ? "Saving..." : "Save"}</button>
                        <button onClick={() => { setEditing(null); setEditingText(""); }} className="px-3 py-2 rounded-lg app-border app-text text-sm">Cancel</button>
                      </div>
                    </div>}
                    {file && <div className="mb-2 rounded-lg app-border bg-[var(--app-surface-hover)] p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">{String(file.type || "").startsWith("image/") ? <LuImage className="text-primary" /> : <LuFile className="text-primary" />}<p className="text-xs app-text truncate">{file.name}</p></div>
                      <button onClick={() => setFile(null)} className="app-text-muted"><LuX /></button>
                    </div>}
                    <div className="flex items-end gap-2">
                      <label className="w-10 h-10 rounded-lg app-border app-surface hover:bg-[var(--app-surface-hover)] inline-flex items-center justify-center cursor-pointer"><LuFile className="text-primary" /><input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
                      <textarea value={text} onChange={(e) => { setText(e.target.value); sendTyping(); }} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} rows={1} placeholder="Type a message..." className="flex-1 resize-none rounded-lg app-border app-surface app-text px-3 py-2.5 text-sm outline-none focus:border-primary max-h-28" />
                      <button onClick={sendMessage} disabled={sending || (!text.trim() && !file)} className="w-10 h-10 rounded-lg bg-[var(--app-primary-blue)] text-white inline-flex items-center justify-center disabled:opacity-60">{sending ? <LuLoaderCircle className="animate-spin" /> : <LuSend />}</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {delModal && <div className="fixed inset-0 z-[120] bg-black/50 flex items-end sm:items-center justify-center p-4">
        <div className="app-card rounded-2xl w-full max-w-sm p-5">
          <h3 className="text-base font-semibold app-text">Delete message</h3>
          <p className="text-sm app-text-muted mt-2">Choose delete scope.</p>
          <div className="space-y-2 mt-4">
            <button disabled={delLoading} onClick={() => deleteMessage("me")} className="w-full py-2.5 rounded-lg app-border app-text text-sm hover:bg-[var(--app-surface-hover)]">Delete for me</button>
            {String(delModal.sender?._id) === String(user?._id) && <button disabled={delLoading} onClick={() => deleteMessage("everyone")} className="w-full py-2.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">Delete for everyone</button>}
          </div>
          <button onClick={() => !delLoading && setDelModal(null)} className="w-full mt-3 py-2.5 rounded-lg btn-outline">Cancel</button>
        </div>
      </div>}

      {profileModal && <div className="fixed inset-0 z-[120] bg-black/50 flex items-end sm:items-center justify-center p-4">
        <div className="app-card rounded-2xl w-full max-w-md p-5">
          <div className="flex items-center justify-between"><h3 className="text-base font-semibold app-text">User profile</h3><button onClick={() => { setProfileModal(false); setProfile(null); }} className="w-8 h-8 rounded-lg app-border app-surface inline-flex items-center justify-center"><LuX /></button></div>
          {profileLoading ? <div className="py-10 text-sm app-text-muted flex items-center gap-2"><LuLoaderCircle className="animate-spin" />Loading...</div> : !profile ? <div className="py-8 text-sm app-text-muted">Profile unavailable</div> : <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">{profile.profileImageUrl ? <img src={profile.profileImageUrl} alt={profile.name} className="w-14 h-14 rounded-full object-cover" /> : <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">{getInitials(profile.name)}</div>}<div><p className="text-sm font-semibold app-text">{profile.name}</p><p className="text-xs app-text-muted">{profile.email}</p></div></div>
            <div className="text-sm space-y-1"><p className="app-text"><span className="app-text-muted">Role:</span> {getRoleLabel(profile.role)}</p><p className="app-text"><span className="app-text-muted">Status:</span> {profile.isOnline ? "Online" : profile.lastSeenAt ? `Last seen ${moment(profile.lastSeenAt).fromNow()}` : "Offline"}</p><p className="app-text"><span className="app-text-muted">Joined:</span> {profile.createdAt ? moment(profile.createdAt).format("MMM D, YYYY") : "N/A"}</p></div>
          </div>}
        </div>
      </div>}
    </DashboardLayout>
  );
};

export default Chat;
