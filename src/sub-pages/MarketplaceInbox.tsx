import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { supabase } from "../supabase-client";
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

  const activeConversationId = useMemo(() => {
    if (conversationId) return conversationId;
    return conversations[0]?.id || null;
  }, [conversationId, conversations]);

  const activeConversation = useMemo(() => {
    if (!activeConversationId) return null;
    return conversations.find((c) => c.id === activeConversationId) || null;
  }, [activeConversationId, conversations]);

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

  const loadConversations = async (userId: string) => {
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
  };

  const loadMessages = async (id: string) => {
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
  };

  const sendMessage = async () => {
    if (!activeConversationId || !currentUserId) return;
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
            <div className="p-4 border-b border-cyan-500/20 bg-[#111f3d]/70">
              <h3 className="text-lg font-black text-slate-100 truncate">
                {activeConversation
                  ? listingMap[activeConversation.listing_id]?.title || "Conversation"
                  : "Select a conversation"}
              </h3>
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

            <div className="border-t border-cyan-500/20 p-4 flex gap-2 bg-[#111f3d]/70">
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
                disabled={!activeConversation}
              />
              <button
                onClick={sendMessage}
                disabled={!activeConversation || sending || draft.trim().length === 0}
                className="px-5 py-3 rounded-2xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 shadow-sm"
                style={{ background: "linear-gradient(90deg,#00AAFF,#6B30FF)" }}
              >
                <Send size={16} />
                Send
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
