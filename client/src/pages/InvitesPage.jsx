import React, { useCallback, useEffect, useState } from "react";
import { useGame } from "../context/GameContext";
import { useSocket } from "../context/SocketContext";
import LoadingSpinner from "../components/LoadingSpinner";
import { apiFetch, readJsonResponse } from "../utils/api";
import "../styles/InvitesPage.css";

function playerLabel(player) {
  return player?.name || player?.username || player?.email || "Player";
}

function formatInviteTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function InvitesPage({ onOpenRoom }) {
  const socket = useSocket();
  const { notify } = useGame();
  const [invitedEmail, setInvitedEmail] = useState("");
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [actingOn, setActingOn] = useState("");

  const loadInvites = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await readJsonResponse(await apiFetch("/api/invites"));
      setIncoming(data.incoming || []);
      setOutgoing(data.outgoing || []);
    } catch (error) {
      if (!silent) notify("error", error.message || "Unable to load invites.", 4000);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadInvites();
    const intervalId = window.setInterval(() => loadInvites({ silent: true }), 30000);
    return () => window.clearInterval(intervalId);
  }, [loadInvites]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleReceived = ({ invite }) => {
      notify("info", `${playerLabel(invite.createdBy)} invited you to play.`, 5000);
      loadInvites({ silent: true });
    };
    const handleUpdated = () => loadInvites({ silent: true });

    socket.on("invite:received", handleReceived);
    socket.on("invite:updated", handleUpdated);
    return () => {
      socket.off("invite:received", handleReceived);
      socket.off("invite:updated", handleUpdated);
    };
  }, [loadInvites, notify, socket]);

  const sendInvite = async (event) => {
    event.preventDefault();
    if (!invitedEmail.trim()) return;

    setSending(true);
    try {
      await readJsonResponse(await apiFetch("/api/invites", {
        method: "POST",
        body: JSON.stringify({ invitedEmail: invitedEmail.trim() }),
      }));
      setInvitedEmail("");
      notify("success", "Game invite sent.", 3000);
      await loadInvites({ silent: true });
    } catch (error) {
      notify("error", error.message || "Unable to send invite.", 4000);
    } finally {
      setSending(false);
    }
  };

  const updateInvite = async (invite, action) => {
    setActingOn(invite.id);
    try {
      const data = await readJsonResponse(await apiFetch(`/api/invites/${invite.id}/${action}`, {
        method: "POST",
      }));
      notify("success", `Invite ${action === "expire" ? "cancelled" : `${action}ed`}.`, 3000);
      await loadInvites({ silent: true });
      if (action === "accept") onOpenRoom(data.invite.roomId);
    } catch (error) {
      notify("error", error.message || `Unable to ${action} invite.`, 4000);
    } finally {
      setActingOn("");
    }
  };

  const renderInvite = (invite, direction) => {
    const player = direction === "incoming" ? invite.createdBy : invite.invitedPlayer;
    const pending = invite.status === "pending";

    return (
      <article className="invite-card" key={invite.id}>
        <div className="invite-card-main">
          <strong>{playerLabel(player)}</strong>
          <span>{player?.email}</span>
          <small>Room {invite.roomId} · {formatInviteTime(invite.createdAt)}</small>
        </div>
        <span className={`invite-status invite-status-${invite.status}`}>{invite.status}</span>
        <div className="invite-actions">
          {direction === "incoming" && pending && (
            <>
              <button className="btn btn-primary btn-sm" onClick={() => updateInvite(invite, "accept")} disabled={actingOn === invite.id}>
                Accept
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => updateInvite(invite, "reject")} disabled={actingOn === invite.id}>
                Reject
              </button>
            </>
          )}
          {direction === "outgoing" && pending && (
            <button className="btn btn-outline btn-sm" onClick={() => updateInvite(invite, "expire")} disabled={actingOn === invite.id}>
              Cancel
            </button>
          )}
          {(pending && direction === "outgoing") || invite.status === "accepted" ? (
            <button className="btn btn-secondary btn-sm" onClick={() => onOpenRoom(invite.roomId)}>
              Open Room
            </button>
          ) : null}
        </div>
      </article>
    );
  };

  return (
    <main className="invites-page">
      <section className="invites-shell">
        <header className="invites-heading">
          <div>
            <p>Play with friends</p>
            <h1>Game Invites</h1>
          </div>
          <form className="invite-compose" onSubmit={sendInvite}>
            <label htmlFor="invite-email">Opponent email</label>
            <div>
              <input
                id="invite-email"
                type="email"
                value={invitedEmail}
                onChange={(event) => setInvitedEmail(event.target.value)}
                placeholder="player@example.com"
                maxLength={320}
                required
              />
              <button className="btn btn-primary" type="submit" disabled={sending}>
                {sending ? <LoadingSpinner label="" inline size="sm" /> : "Send Invite"}
              </button>
            </div>
          </form>
        </header>

        {loading ? (
          <div className="invites-loading"><LoadingSpinner label="Loading invites" /></div>
        ) : (
          <div className="invite-columns">
            <section className="invite-panel">
              <div className="invite-panel-heading">
                <h2>Received</h2>
                <span>{incoming.filter((invite) => invite.status === "pending").length} pending</span>
              </div>
              <div className="invite-list">
                {incoming.length ? incoming.map((invite) => renderInvite(invite, "incoming")) : <p className="invite-empty">No received invites yet.</p>}
              </div>
            </section>

            <section className="invite-panel">
              <div className="invite-panel-heading">
                <h2>Sent</h2>
                <span>{outgoing.filter((invite) => invite.status === "pending").length} pending</span>
              </div>
              <div className="invite-list">
                {outgoing.length ? outgoing.map((invite) => renderInvite(invite, "outgoing")) : <p className="invite-empty">No sent invites yet.</p>}
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
