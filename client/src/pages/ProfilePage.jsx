import React, { useEffect, useMemo, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useGame } from "../context/GameContext";
import LoadingSpinner from "../components/LoadingSpinner";
import SkeletonLoader from "../components/SkeletonLoader";
import "../styles/ProfilePage.css";

function formatDate(value) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getInitials(user) {
  const source = user?.name || user?.username || user?.email || "Player";
  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "P";
}

export default function ProfilePage() {
  const { user, updateProfile, uploadAvatar, requestEmailVerification } = useAuth();
  const { notify } = useGame();
  const avatarInputRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [form, setForm] = useState({
    name: "",
    username: "",
    country: "",
    bio: "",
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || "",
      username: user.username || "",
      country: user.country || "",
      bio: user.bio || "",
    });
  }, [user]);

  const stats = useMemo(() => ({
    rating: user?.rating || 1200,
    gamesPlayed: user?.stats?.gamesPlayed || 0,
    wins: user?.stats?.wins || 0,
    losses: user?.stats?.losses || 0,
    draws: user?.stats?.draws || 0,
  }), [user]);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(form);
      setEditing(false);
      notify("success", "Profile updated successfully.", 3000);
    } catch (error) {
      notify("error", error.message || "Unable to update profile.", 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      notify("error", "Please choose a JPG, PNG, WEBP, or GIF image.", 4000);
      return;
    }

    if (file.size > 1024 * 1024) {
      notify("error", "Avatar image must be 1MB or smaller.", 4000);
      return;
    }

    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await uploadAvatar(reader.result);
        notify("success", "Avatar uploaded successfully.", 3000);
      } catch (error) {
        notify("error", error.message || "Unable to upload avatar.", 4000);
      } finally {
        setUploadingAvatar(false);
      }
    };
    reader.onerror = () => {
      setUploadingAvatar(false);
      notify("error", "Unable to read that image.", 4000);
    };
    reader.readAsDataURL(file);
  };

  const handleSendVerification = async () => {
    setSendingVerification(true);
    try {
      await requestEmailVerification();
      notify("success", "Verification email sent.", 3000);
    } catch (error) {
      notify("error", error.message || "Unable to send verification email.", 4000);
    } finally {
      setSendingVerification(false);
    }
  };

  if (!user) {
    return <SkeletonLoader variant="profile" />;
  }

  return (
    <main className="profile-page">
      <section className="profile-shell">
        <div className="profile-hero-card">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : <span>{getInitials(user)}</span>}
            </div>
            <input
              ref={avatarInputRef}
              className="profile-avatar-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleAvatarSelected}
            />
            <button
              className="profile-avatar-upload"
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              aria-label="Upload avatar"
              title="Upload avatar"
            >
              {uploadingAvatar ? <LoadingSpinner label="" inline size="sm" /> : <Camera size={18} strokeWidth={2.2} />}
            </button>
            <div className="profile-rating">
              <span>{stats.rating}</span>
              <small>Rating</small>
            </div>
          </div>

          <div className="profile-identity">
            <p className="profile-kicker">Player Profile</p>
            <h1>{user.name || "Unnamed Player"}</h1>
            <p className="profile-username">@{user.username || "choose-username"}</p>
            <div className={`profile-verification ${user.emailVerified ? "verified" : "unverified"}`}>
              {user.emailVerified ? "Email Verified" : "Email Not Verified"}
            </div>
            <p className="profile-bio">{user.bio || "No bio yet. Add a short note about your chess style."}</p>
          </div>

          <div className="profile-actions">
            {!user.emailVerified && (
              <button className="btn btn-secondary" onClick={handleSendVerification} disabled={sendingVerification}>
                {sendingVerification ? <LoadingSpinner label="" inline size="sm" /> : "Send Verification Email"}
              </button>
            )}
            <button className="btn btn-outline" onClick={() => setEditing((value) => !value)}>
              {editing ? "Cancel" : "Edit Profile"}
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={!editing || saving}>
              {saving ? <LoadingSpinner label="" inline size="sm" /> : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="profile-grid">
          <section className="profile-panel profile-details-panel">
            <div className="panel-heading">
              <h2>Account</h2>
              <span>Joined {formatDate(user.createdAt)}</span>
            </div>

            <div className="profile-form-grid">
              <label>
                <span>Full Name</span>
                <input value={form.name} onChange={update("name")} disabled={!editing} maxLength={50} />
              </label>

              <label>
                <span>Username</span>
                <input value={form.username} onChange={update("username")} disabled={!editing} maxLength={30} />
              </label>

              <label>
                <span>Email</span>
                <input value={user.email || ""} disabled />
              </label>

              <label>
                <span>Email Verification Status</span>
                <input value={user.emailVerified ? "Email Verified" : "Email Not Verified"} disabled />
              </label>

              <label>
                <span>Country</span>
                <input value={form.country} onChange={update("country")} disabled={!editing} maxLength={50} />
              </label>

              <label className="wide">
                <span>Bio</span>
                <textarea value={form.bio} onChange={update("bio")} disabled={!editing} maxLength={500} rows={5} />
              </label>
            </div>
          </section>

          <section className="profile-panel">
            <div className="panel-heading">
              <h2>Chess Stats</h2>
              <span>Live record</span>
            </div>

            <div className="profile-stat-grid">
              <div className="profile-stat-card featured">
                <strong>{stats.rating}</strong>
                <span>Chess Rating</span>
              </div>
              <div className="profile-stat-card">
                <strong>{stats.gamesPlayed}</strong>
                <span>Games Played</span>
              </div>
              <div className="profile-stat-card win">
                <strong>{stats.wins}</strong>
                <span>Wins</span>
              </div>
              <div className="profile-stat-card loss">
                <strong>{stats.losses}</strong>
                <span>Losses</span>
              </div>
              <div className="profile-stat-card draw">
                <strong>{stats.draws}</strong>
                <span>Draws</span>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
