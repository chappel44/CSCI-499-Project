/* eslint-disable react-hooks/immutability, react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, ShieldAlert, UserX, X } from "lucide-react";
import { supabase } from "../../supabase-client";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Conversation = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
};

type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string | null;
  body: string;
  created_at: string;
};

type ListingMeta = {
  id: string;
  title: string;
};

const REPORT_REASONS = [
  { id: "scam", label: "Scam or deceptive behavior" },
  { id: "harassment", label: "Harassment or abusive language" },
  { id: "spam", label: "Spam" },
  { id: "unsafe", label: "Unsafe meetup/payment behavior" },
  { id: "other", label: "Other", requiresDetails: true },
];

function looksLikeMissingSafetyTables(message?: string) {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("marketplace_user_blocks") ||
    lower.includes("marketplace_user_reports") ||
    lower.includes("does not exist")
  );
}

function formatMessageTime(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MarketplaceInbox() {
  const navigate = useNavigate();
  const { conversationId } = useParams();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [listingMap, setListingMap] = useState<Record<string, ListingMeta>>({});

  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [otherParticipantBlocked, setOtherParticipantBlocked] = useState(false);
  const [blockedByOtherParticipant, setBlockedByOtherParticipant] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockSubmitting, setBlockSubmitting] = useState(false);
  const [blockMessage, setBlockMessage] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);

  const activeConversationId = useMemo(() => {
    if (conversationId) return conversationId;
    return conversations[0]?.id || null;
  }, [conversationId, conversations]);

  const activeConversation = useMemo(() => {
    if (!activeConversationId) return null;
    return conversations.find((c) => c.id === activeConversationId) || null;
  }, [activeConversationId, conversations]);

  const otherParticipantId = useMemo(() => {
    if (!activeConversation || !currentUserId) return null;
    return activeConversation.buyer_id === currentUserId
      ? activeConversation.seller_id
      : activeConversation.buyer_id;
  }, [activeConversation, currentUserId]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) {
        navigate("/login");
        return;
      }
      setCurrentUserId(user.id);
      setCurrentUserName(user.user_metadata?.username || user.email?.split("@")[0] || "User");
      await loadConversations(user.id);
    });
  }, [navigate]);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    loadMessages(activeConversationId);
  }, [activeConversationId]);

  useEffect(() => {
    let active = true;

    if (!currentUserId || !otherParticipantId) {
      setOtherParticipantBlocked(false);
      setBlockedByOtherParticipant(false);
      return () => {
        active = false;
      };
    }

    // Reset immediately while switching conversations so old values don't bleed into new chats.
    setOtherParticipantBlocked(false);
    setBlockedByOtherParticipant(false);

    (async () => {
      const state = await loadBlockState(currentUserId, otherParticipantId);
      if (!active || !state) return;
      setOtherParticipantBlocked(state.otherParticipantBlocked);
      setBlockedByOtherParticipant(state.blockedByOtherParticipant);
    })();

    return () => {
      active = false;
    };
  }, [currentUserId, otherParticipantId]);

  useEffect(() => {
    if (!activeConversationId) return;

    const channel: RealtimeChannel = supabase
      .channel(`marketplace-inbox-${activeConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "marketplace_messages",
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        async () => {
          await loadMessages(activeConversationId);
          if (currentUserId) {
            await loadConversations(currentUserId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversationId, currentUserId]);

  async function loadConversations(userId: string) {
    setLoadingConversations(true);
    const { data, error } = await supabase
      .from("marketplace_conversations")
      .select("*")
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order("last_message_at", { ascending: false });

    if (error) {
      alert("Unable to load inbox: " + error.message);
      setLoadingConversations(false);
      return;
    }

    const rows = (data || []) as Conversation[];
    setConversations(rows);

    if (rows.length > 0) {
      const listingIds = [...new Set(rows.map((row) => row.listing_id))];
      const { data: listingData } = await supabase
        .from("marketplace_listings")
        .select("id,title")
        .in("id", listingIds);

      const nextMap: Record<string, ListingMeta> = {};
      for (const listing of listingData || []) {
        nextMap[listing.id] = listing as ListingMeta;
      }
      setListingMap(nextMap);

      if (!conversationId) {
        navigate(`/marketplace/inbox/${rows[0].id}`, { replace: true });
      }
    }

    setLoadingConversations(false);
  }

  async function loadMessages(id: string) {
    setLoadingMessages(true);
    const { data, error } = await supabase
      .from("marketplace_messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      alert("Unable to load messages: " + error.message);
      setLoadingMessages(false);
      return;
    }

    setMessages((data || []) as ChatMessage[]);
    setLoadingMessages(false);
  }

  async function loadBlockState(userId: string, otherId: string) {
    const [mine, theirs] = await Promise.all([
      supabase
        .from("marketplace_user_blocks")
        .select("id")
        .eq("blocker_id", userId)
        .eq("blocked_id", otherId)
        .maybeSingle(),
      supabase
        .from("marketplace_user_blocks")
        .select("id")
        .eq("blocker_id", otherId)
        .eq("blocked_id", userId)
        .maybeSingle(),
    ]);

    if (mine.error || theirs.error) {
      const message = mine.error?.message || theirs.error?.message;
      if (looksLikeMissingSafetyTables(message)) {
        return { otherParticipantBlocked: false, blockedByOtherParticipant: false };
      }
      console.error("Unable to load block state:", message);
      return null;
    }

    return {
      otherParticipantBlocked: !!mine.data,
      blockedByOtherParticipant: !!theirs.data,
    };
  }

  const openBlockModal = () => {
    if (!activeConversation || !currentUserId) return;
    setBlockMessage(null);
    setIsBlockModalOpen(true);
  };

  const closeBlockModal = () => {
    setIsBlockModalOpen(false);
    setBlockMessage(null);
    setBlockSubmitting(false);
  };

  const submitBlockParticipant = async () => {
    if (!activeConversation || !currentUserId || !otherParticipantId) return;

    setBlockSubmitting(true);
    setBlockMessage(null);

    const { error } = await supabase.from("marketplace_user_blocks").insert([
      {
        blocker_id: currentUserId,
        blocked_id: otherParticipantId,
        reason: "Blocked from inbox",
      },
    ]);

    if (error) {
      const errorCode = (error as { code?: string }).code;
      if (errorCode === "23505") {
        setBlockMessage("This user is already blocked.");
      } else if (looksLikeMissingSafetyTables(error.message)) {
        setBlockMessage(
          "Safety tables are not set up yet. Run src/sql/marketplace_messaging.sql in Supabase SQL Editor."
        );
      } else {
        setBlockMessage("Unable to block this user: " + error.message);
      }
      setBlockSubmitting(false);
      return;
    }

    setOtherParticipantBlocked(true);
    setBlockMessage("User blocked. You can always unblock in Settings > Blocked Users.");
    setBlockSubmitting(false);
  };

  const openReportModal = () => {
    if (!activeConversation || !currentUserId) return;
    setSelectedReportReason("");
    setReportDetails("");
    setReportError(null);
    setReportSuccess(null);
    setIsReportModalOpen(true);
  };

  const closeReportModal = () => {
    setIsReportModalOpen(false);
    setSelectedReportReason("");
    setReportDetails("");
    setReportError(null);
    setReportSuccess(null);
    setReportSubmitting(false);
  };

  const submitReportParticipant = async () => {
    if (!activeConversation || !currentUserId || !otherParticipantId) return;
    if (!selectedReportReason) {
      setReportError("Please select a reason.");
      return;
    }

    const selected = REPORT_REASONS.find((reason) => reason.id === selectedReportReason);
    if (!selected) {
      setReportError("Please choose a valid reason.");
      return;
    }

    const details = reportDetails.trim();
    if (selected.requiresDetails && (details.length < 3 || details.length > 500)) {
      setReportError("For 'Other', add details between 3 and 500 characters.");
      return;
    }

    setReportSubmitting(true);
    setReportError(null);

    const { error } = await supabase.from("marketplace_user_reports").insert([
      {
        conversation_id: activeConversation.id,
        listing_id: activeConversation.listing_id,
        reporter_id: currentUserId,
        reported_id: otherParticipantId,
        reason: selected.label,
        details: details || null,
      },
    ]);

    if (error) {
      if (looksLikeMissingSafetyTables(error.message)) {
        setReportError(
          "Safety tables are not set up yet. Run src/sql/marketplace_messaging.sql in Supabase SQL Editor."
        );
      } else {
        setReportError("Unable to submit report: " + error.message);
      }
      setReportSubmitting(false);
      return;
    }

    setReportSuccess("Report submitted. Our team can review this conversation.");
    setReportSubmitting(false);
  };

  const sendMessage = async () => {
    if (!activeConversationId || !currentUserId) return;
    if (otherParticipantBlocked || blockedByOtherParticipant) return;
    const body = draft.trim();
    if (!body) return;

    setSending(true);

    const { error: msgError } = await supabase.from("marketplace_messages").insert([
      {
        conversation_id: activeConversationId,
        sender_id: currentUserId,
        sender_name: currentUserName || "User",
        body,
      },
    ]);

    if (msgError) {
      alert("Unable to send: " + msgError.message);
      setSending(false);
      return;
    }

    await supabase
      .from("marketplace_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", activeConversationId);

    setDraft("");
    await loadMessages(activeConversationId);
    if (currentUserId) {
      await loadConversations(currentUserId);
    }
    setSending(false);
  };

  return (
    <div
      className="min-h-screen px-4 pt-24 pb-10 relative overflow-hidden"
      style={{ background: "radial-gradient(circle at 20% 20%, #083f5f 0%, #071a3a 40%, #080f2b 100%)" }}
    >
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div
          style={{
            position: "absolute",
            top: "-15%",
            left: "-8%",
            width: "60vw",
            height: "60vw",
            background: "radial-gradient(circle, rgba(0,170,255,0.2) 0%, transparent 68%)",
            borderRadius: "50%",
            filter: "blur(54px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "-5%",
            right: "-8%",
            width: "52vw",
            height: "52vw",
            background: "radial-gradient(circle, rgba(107,48,255,0.2) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(56px)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <button
            onClick={() => navigate("/marketplace")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0f213f]/85 backdrop-blur-md border border-cyan-500/30 text-slate-100 font-semibold hover:bg-[#142a4f] transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Marketplace
          </button>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-400 text-transparent bg-clip-text">
            Marketplace Messages
          </h1>
        </div>

        <div className="bg-[#0b1733]/75 backdrop-blur-xl rounded-[2rem] border border-cyan-500/20 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-[320px_1fr] min-h-[72vh]">
          <aside className="border-r border-cyan-500/20 p-4 bg-[#111f3d]/75">
            <h2 className="text-xl font-black text-slate-100 mb-3">Inbox</h2>
            {loadingConversations ? (
              <p className="text-sm text-slate-300">Loading conversations...</p>
            ) : conversations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-cyan-500/30 p-4 text-sm text-slate-300 bg-[#0f203f]/70">
                No conversations yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {conversations.map((conversation) => {
                  const selected = conversation.id === activeConversationId;
                  return (
                    <button
                      key={conversation.id}
                      onClick={() => navigate(`/marketplace/inbox/${conversation.id}`)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                        selected
                          ? "bg-gradient-to-r from-cyan-500/25 to-violet-500/20 border-cyan-300/60 shadow-md"
                          : "bg-[#0f203f]/70 border-cyan-500/20 hover:border-cyan-300/50 hover:bg-[#12284f]"
                      }`}
                    >
                      <p className="text-sm font-bold text-slate-100 truncate">
                        {listingMap[conversation.listing_id]?.title || "Listing"}
                      </p>
                      <p className="text-xs text-slate-300 mt-1">
                        {formatMessageTime(conversation.last_message_at)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <section className="flex flex-col min-h-[72vh]">
            <div className="p-4 border-b border-cyan-500/20 bg-[#111f3d]/70 flex items-center justify-between gap-3 flex-wrap">
              <h3 className="text-lg font-black text-slate-100 truncate">
                {activeConversation
                  ? listingMap[activeConversation.listing_id]?.title || "Conversation"
                  : "Select a conversation"}
              </h3>
              {activeConversation && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openReportModal}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-200 border border-amber-300/30 bg-amber-400/10 hover:bg-amber-400/20 transition"
                  >
                    <ShieldAlert size={14} />
                    Report
                  </button>
                  <button
                    onClick={openBlockModal}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-200 border border-red-300/30 bg-red-400/10 hover:bg-red-400/20 transition"
                  >
                    <UserX size={14} />
                    {otherParticipantBlocked ? "Blocked" : "Block"}
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#0c1a36]/55">
              {!activeConversation ? (
                <p className="text-slate-300">Choose a conversation from the left.</p>
              ) : loadingMessages ? (
                <p className="text-slate-300">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-slate-300">Start the conversation.</p>
              ) : (
                messages.map((message) => {
                  const mine = message.sender_id === currentUserId;
                  return (
                    <div key={message.id} className={`max-w-[78%] ${mine ? "ml-auto" : "mr-auto"}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 shadow-sm ${
                          mine
                            ? "text-white"
                            : "bg-[#13284d] border border-cyan-500/20 text-slate-100"
                        }`}
                        style={
                          mine
                            ? { background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }
                            : undefined
                        }
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 px-1">
                        {message.sender_name || "User"} · {formatMessageTime(message.created_at)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-cyan-500/20 p-4 flex flex-col gap-2 bg-[#111f3d]/70">
              {otherParticipantBlocked && (
                <p className="text-xs text-amber-200 bg-amber-500/15 border border-amber-300/30 px-3 py-2 rounded-xl">
                  You blocked this user. You can unblock them in Settings &gt; Blocked Users.
                </p>
              )}
              {blockedByOtherParticipant && (
                <p className="text-xs text-red-200 bg-red-500/15 border border-red-300/30 px-3 py-2 rounded-xl">
                  You cannot send messages in this chat because this user blocked you.
                </p>
              )}
              <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 rounded-2xl border border-cyan-500/25 bg-[#0c1b37] text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-400 outline-none"
                maxLength={2000}
                disabled={!activeConversation || otherParticipantBlocked || blockedByOtherParticipant}
              />
              <button
                onClick={sendMessage}
                disabled={
                  !activeConversation ||
                  sending ||
                  draft.trim().length === 0 ||
                  otherParticipantBlocked ||
                  blockedByOtherParticipant
                }
                className="px-5 py-3 rounded-2xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 shadow-sm"
                style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
              >
                <Send size={16} />
                Send
              </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {isBlockModalOpen && activeConversation && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="report-modal-shell bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100">
            <div className="p-6 md:p-7">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-2xl font-black text-gray-900">Block User</h2>
                <button onClick={closeBlockModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="text-gray-500" />
                </button>
              </div>
              <p className="text-sm text-gray-700">
                Block this user from messaging you? You won't see each other in active conversations.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                You can always unblock them in Settings under <span className="font-semibold">Blocked Users</span>.
              </p>
              {blockMessage && (
                <div className="report-status-message rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 p-3 mt-4">
                  {blockMessage}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 mt-5">
                <button
                  type="button"
                  onClick={closeBlockModal}
                  className="report-cancel-button w-full py-3 rounded-xl border border-slate-200 text-slate-700 font-bold bg-slate-50 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitBlockParticipant}
                  disabled={blockSubmitting}
                  className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
                >
                  {blockSubmitting ? "Blocking..." : otherParticipantBlocked ? "Blocked" : "Block User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isReportModalOpen && activeConversation && (
        <div className="fixed inset-0 z-[96] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="report-modal-shell bg-white rounded-[2rem] w-full max-w-xl overflow-hidden shadow-2xl border border-gray-100">
            <div className="p-6 md:p-7">
              <div className="flex items-center justify-between gap-3 mb-5">
                <h2 className="text-2xl font-black text-gray-900">Report Conversation</h2>
                <button onClick={closeReportModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="text-gray-500" />
                </button>
              </div>

              {reportSuccess ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm p-4">
                    {reportSuccess}
                  </div>
                  <button
                    onClick={closeReportModal}
                    className="w-full py-3 rounded-xl text-white font-bold"
                    style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-4">Choose a reason to report this conversation.</p>
                  <div className="space-y-2.5 mb-4">
                    {REPORT_REASONS.map((reason) => (
                      <button
                        key={reason.id}
                        type="button"
                        onClick={() => {
                          setSelectedReportReason(reason.id);
                          setReportError(null);
                        }}
                        className={`report-reason-button w-full text-left px-4 py-3 rounded-xl border transition font-semibold ${
                          selectedReportReason === reason.id
                            ? "report-reason-selected border-blue-500 bg-blue-600 text-white shadow-sm"
                            : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
                        }`}
                      >
                        {reason.label}
                      </button>
                    ))}
                  </div>

                  {selectedReportReason === "other" && (
                    <div className="mb-4">
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-1">
                        Other Details
                      </label>
                      <textarea
                        rows={4}
                        value={reportDetails}
                        onChange={(e) => {
                          setReportDetails(e.target.value);
                          setReportError(null);
                        }}
                        placeholder="Tell us what happened..."
                        className="mt-1.5 w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition-all resize-none"
                        maxLength={500}
                      />
                    </div>
                  )}

                  {reportError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3 mb-4">
                      {reportError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={closeReportModal}
                      className="report-cancel-button w-full py-3 rounded-xl border border-slate-200 text-slate-700 font-bold bg-slate-50 hover:bg-slate-100 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={submitReportParticipant}
                      disabled={reportSubmitting}
                      className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-70 disabled:cursor-not-allowed"
                      style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
                    >
                      {reportSubmitting ? "Submitting..." : "Submit Report"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

