import { StateCreator, create } from "zustand";

import apiClient from "../services/apiClient";
import type { Profile, ProfileDetail } from "../types/api";

interface ProfileState {
  profiles: Profile[];
  selectedProfile: Profile | null;
  profileDetail: ProfileDetail | null;
  loading: boolean;
  error: string | null;
  fetchProfiles: () => Promise<void>;
  createProfile: (name: string) => Promise<Profile>;
  selectProfile: (profile: Profile | null) => void;
  loadProfileDetail: (profileId: string) => Promise<ProfileDetail>;
}

const profileStore: StateCreator<ProfileState> = (set, get) => ({
  profiles: [],
  selectedProfile: null,
  profileDetail: null,
  loading: false,
  error: null,
  async fetchProfiles() {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.get<Profile[]>("/profiles");
      set({ profiles: data, loading: false });
    } catch (error) {
      console.error(error);
      set({ loading: false, error: "Failed to load profiles" });
    }
  },
  async createProfile(name: string) {
    const { data } = await apiClient.post<Profile>("/profiles", { name });
    set((state) => ({ profiles: [...state.profiles, data] }));
    set({ selectedProfile: data });
    return data;
  },
  selectProfile(profile: Profile | null) {
    set({ selectedProfile: profile, profileDetail: null });
  },
  async loadProfileDetail(profileId: string) {
    const { data } = await apiClient.get<ProfileDetail>(`/profiles/${profileId}`);
    if (get().selectedProfile?.id === profileId) {
      set({ profileDetail: data });
    }
    return data;
  },
});

export const useProfileStore = create<ProfileState>()(profileStore);

export type { ProfileState };
