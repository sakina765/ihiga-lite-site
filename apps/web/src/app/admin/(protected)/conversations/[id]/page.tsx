"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { AdminConversationDetailResponse, AdminMessageDetail } from "@ihiga-lite/shared";
import { flagMessage, getAdminConversationDetail, unflagMessage } from "../../../../../lib/admin-conversations-api";
import { AdminMessageBubble } from "../../../../../components/admin/conversations/AdminMessageBubble";

const LANGUAGE_LABELS: Record<string, string> = { en: "English", rw: "Kinyarwanda", fr: "French" };

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminConversationDetailPage() {
  const params = useParams<{ id: string }>();
  const conversationId = params.id;

  const [conversation, setConversation] = useState<AdminConversationDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setConversation(await getAdminConversationDetail(conversationId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversation");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggleFlag(message: AdminMessageDetail) {
    setTogglingId(message.id);
    try {
      const updated = message.flagged ? await unflagMessage(message.id) : await flagMessage(message.id);
      setConversation((prev) =>
        prev ? { ...prev, messages: prev.messages.map((m) => (m.id === updated.id ? updated : m)) } : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update flag");
    } finally {
      setTogglingId(null);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-ink-faint">Loading…</p>;
  }

  if (error && !conversation) {
    return <p className="text-sm text-clay">{error}</p>;
  }

  if (!conversation) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        {conversation.farmerId ? (
          <Link href={`/admin/farmers/${conversation.farmerId}`} className="text-sm font-medium text-ink-soft hover:text-ink">
            ← Back to farmer
          </Link>
        ) : (
          <span className="text-sm text-ink-faint">Farmer record unavailable</span>
        )}
      </div>

      {error && <p className="text-sm text-clay">{error}</p>}

      <div className="rounded-2xl border border-soil/10 bg-white p-6">
        <h1 className="text-lg font-semibold text-ink">Conversation</h1>
        <dl className="mt-3 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <dt className="text-xs font-medium text-ink-faint">Started</dt>
            <dd className="mt-0.5 text-ink">{formatDateTime(conversation.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-ink-faint">Language</dt>
            <dd className="mt-0.5 text-ink">
              {conversation.language ? LANGUAGE_LABELS[conversation.language] ?? conversation.language : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-ink-faint">Tracked crop</dt>
            <dd className="mt-0.5 text-ink">{conversation.cropName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-ink-faint">Planting date</dt>
            <dd className="mt-0.5 text-ink">{conversation.plantingDate ?? "—"}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-2xl border border-soil/10 bg-parchment p-6">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          {conversation.messages.length === 0 ? (
            <p className="text-sm text-ink-faint">No messages in this conversation.</p>
          ) : (
            conversation.messages.map((message) => (
              <AdminMessageBubble
                key={message.id}
                message={message}
                onToggleFlag={handleToggleFlag}
                isTogglingFlag={togglingId === message.id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
