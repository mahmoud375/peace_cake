import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useProfileStore, type ProfileState } from "../store/profileStore";
import type { Profile } from "../types/api";

const ProfileSelectPage = () => {
  const navigate = useNavigate();
  const { profiles, selectedProfile, loading, error } = useProfileStore((state: ProfileState) => ({
    profiles: state.profiles,
    selectedProfile: state.selectedProfile,
    loading: state.loading,
    error: state.error,
  }));
  const fetchProfiles = useProfileStore((state: ProfileState) => state.fetchProfiles);
  const createProfile = useProfileStore((state: ProfileState) => state.createProfile);
  const selectProfile = useProfileStore((state: ProfileState) => state.selectProfile);

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
            <button
              key={profile.id}
              type="button"
              className="btn btn-secondary"
              style={{ width: "100%", justifyContent: "flex-start" }}
              onClick={() => handleSelect(profile)}
            >
              {profile.name}
              {selectedProfile?.id === profile.id && <span style={{ marginLeft: "0.5rem" }}>• Selected</span>}
            </button>
          ))}
          {!profiles.length && !loading && <div>No profiles yet. Create one below.</div>}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <label style={{ fontWeight: 600 }}>Create new profile</label>
          <input
            type="text"
            value={profileName}
            onChange={(event) => setProfileName(event.target.value)}
            placeholder="e.g. Ms. Carter"
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
