import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useProfileStore, type ProfileState } from "../store/profileStore";
import type { Profile } from "../types/api";

const ProfileSelectPage = () => {
  const navigate = useNavigate();
  const { profiles, selectedProfile, loading, error, uninitializeGame } = useProfileStore((state: ProfileState) => ({
    profiles: state.profiles,
    selectedProfile: state.selectedProfile,
    loading: state.loading,
    error: state.error,
    uninitializeGame: state.uninitializeGame,
  }));
  const fetchProfiles = useProfileStore((state: ProfileState) => state.fetchProfiles);
  const createProfile = useProfileStore((state: ProfileState) => state.createProfile);
  const selectProfile = useProfileStore((state: ProfileState) => state.selectProfile);
  const deleteProfile = useProfileStore((state: ProfileState) => state.deleteProfile);

  const [profileName, setProfileName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles().catch(() => null);
  }, [fetchProfiles]);

  const handleSelect = (profile: Profile) => {
    selectProfile(profile);
    navigate("/dashboard");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!profileName.trim()) {
      setFormError("Please enter a profile name");
      return;
    }
    try {
      const created = await createProfile(profileName.trim());
      setProfileName("");
      setFormError(null);
      handleSelect(created);
    } catch (err) {
      console.error(err);
      setFormError("Unable to create profile");
    }
  };

  return (
    <div className="container">
      <button
        type="button"
        className="btn"
        style={{ margin: "1rem auto", display: "block" }}
        onClick={() => uninitializeGame()}
      >
        ← Back to Welcome
      </button>
      <div className="card" style={{ maxWidth: 640, margin: "3rem auto" }}>
        <h1 style={{ marginBottom: "0.5rem" }}>Peace Cake</h1>
        <p style={{ color: "#64748b", marginBottom: "2rem" }}>
          Select or create your instructor profile to manage quizzes.
        </p>

        {error && (
          <div style={{ color: "#dc2626", marginBottom: "1rem" }}>Failed to load profiles.</div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
          {profiles.map((profile) => (
            <div key={profile.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: "flex-start" }}
                onClick={() => handleSelect(profile)}
              >
                {profile.name}
                {selectedProfile?.id === profile.id && <span style={{ marginLeft: "0.5rem" }}>• Selected</span>}
              </button>
              <button
                type="button"
                className="btn"
                style={{ padding: "0.5rem 0.75rem", background: "#fee2e2", color: "#dc2626" }}
                onClick={() => {
                  const confirmed = window.confirm(
                    "Are you sure you want to delete this profile and all its associated data?",
                  );
                  if (!confirmed) return;
                  deleteProfile(profile.id).catch((error) => console.error(error));
                }}
              >
                ×
              </button>
            </div>
          ))}
          {!profiles.length && !loading && <div>No profiles yet. Create one below.</div>}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <label style={{ fontWeight: 600 }}>Create New Level Profile</label>
          <input
            type="text"
            value={profileName}
            onChange={(event) => setProfileName(event.target.value)}
            placeholder="e.g., Level 7"
            style={{ padding: "0.8rem 1rem", borderRadius: "999px", border: "1px solid #cbd5f5" }}
          />
          {formError && <span style={{ color: "#dc2626" }}>{formError}</span>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Create & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSelectPage;
