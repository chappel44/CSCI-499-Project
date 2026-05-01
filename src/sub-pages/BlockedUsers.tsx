import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase-client";

type BlockedUser = {
  id: string;
  blocked_id: string;
  reason: string | null;
  created_at: string;
  username?: string | null;
};

export default function BlockedUsers() {
  const navigate = useNavigate();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [blockedUsersLoading, setBlockedUsersLoading] = useState(true);
  const [blockedUsersMessage, setBlockedUsersMessage] = useState<string | null>(
    null
  );
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const loadBlockedUsers = async (userId: string) => {
    setBlockedUsersLoading(true);
    setBlockedUsersMessage(null);

    const { data, error } = await supabase
      .from("marketplace_user_blocks")
      .select("id, blocked_id, reason, created_at")
      .eq("blocker_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      setBlockedUsersMessage("Could not load blocked users right now.");
      setBlockedUsersLoading(false);
      return;
    }

    const blocks = (data || []) as BlockedUser[];
    if (blocks.length === 0) {
      setBlockedUsers([]);
      setBlockedUsersLoading(false);
      return;
    }

    const blockedIds = blocks.map((row) => row.blocked_id);
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", blockedIds);

    const usernameMap = new Map<string, string>();
    (profilesData || []).forEach(
      (profile: { id: string; username: string | null }) => {
        if (profile.username) usernameMap.set(profile.id, profile.username);
      }
    );

    setBlockedUsers(
      blocks.map((row) => ({
        ...row,
        username: usernameMap.get(row.blocked_id) ?? null,
      }))
    );
    setBlockedUsersLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const userId = data.session?.user?.id;
      if (!userId) {
        navigate("/login");
        return;
      }

      loadBlockedUsers(userId);
    });
  }, [navigate]);

  const handleUnblockUser = async (blockId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUnblockingId(blockId);
    setBlockedUsersMessage(null);

    const { error } = await supabase
      .from("marketplace_user_blocks")
      .delete()
      .eq("id", blockId)
      .eq("blocker_id", user.id);

    if (error) {
      setBlockedUsersMessage("Could not unblock user. Please try again.");
      setUnblockingId(null);
      return;
    }

    setBlockedUsers((prev) => prev.filter((item) => item.id !== blockId));
    setBlockedUsersMessage("User unblocked.");
    setUnblockingId(null);
  };

  return (
    <div className="profile-page min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="profile-secondary-button inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
          Back to Profile
        </button>

        <div className="profile-card bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-8 py-8 flex flex-col">
            <h1 className="text-3xl font-black text-gray-900 mb-2">
              Blocked Users
            </h1>
            <p className="text-sm text-gray-400 mb-6">
              Manage sellers you blocked from Marketplace. You can unblock
              anytime.
            </p>

            {blockedUsersMessage && (
              <div className="blocked-users-message rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 px-4 py-3 mb-4">
                {blockedUsersMessage}
              </div>
            )}

            {blockedUsersLoading ? (
              <p className="text-sm text-gray-500">Loading blocked users...</p>
            ) : blockedUsers.length === 0 ? (
              <div className="blocked-users-empty rounded-xl border border-dashed border-gray-300 px-4 py-4 text-sm text-gray-500">
                You have not blocked anyone yet.
              </div>
            ) : (
              <div className="space-y-3">
                {blockedUsers.map((blockedUser) => (
                  <div
                    key={blockedUser.id}
                    className="blocked-user-card rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="blocked-user-name text-sm font-semibold text-gray-900">
                        {blockedUser.username
                          ? `@${blockedUser.username}`
                          : `User ${blockedUser.blocked_id.slice(0, 8)}`}
                      </p>
                      <p className="blocked-user-meta text-xs text-gray-500 mt-1">
                        Blocked on{" "}
                        {new Date(blockedUser.created_at).toLocaleDateString()}
                      </p>
                      {blockedUser.reason && (
                        <p className="blocked-user-meta text-xs text-gray-500 mt-1">
                          Reason: {blockedUser.reason}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnblockUser(blockedUser.id)}
                      disabled={unblockingId === blockedUser.id}
                      className="blocked-user-unblock-button rounded-xl px-4 py-2 text-sm font-semibold text-red-700 border border-red-200 bg-red-50 hover:bg-red-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {unblockingId === blockedUser.id
                        ? "Unblocking..."
                        : "Unblock"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
