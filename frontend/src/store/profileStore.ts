import { StateCreator, create } from "zustand";

import apiClient from "../services/apiClient";
import type { Profile, ProfileDetail } from "../types/api";

interface ProfileState {
  profiles: Profile[];
  selectedProfile: Profile | null;
  profileDetail: ProfileDetail | null;
  loading: boolean;
  error: string | null;
  isGameInitialized: boolean;
  fetchProfiles: () => Promise<void>;
  createProfile: (name: string) => Promise<Profile>;
  renameProfile: (profileId: string, newName: string) => Promise<void>;
  selectProfile: (profile: Profile | null) => void;
  loadProfileDetail: (profileId: string) => Promise<ProfileDetail>;
  deleteProfile: (profileId: string) => Promise<void>;
  initializeGame: () => void;
  uninitializeGame: () => void;
}

const profileStore: StateCreator<ProfileState> = (set, get) => ({
  profiles: [],
  selectedProfile: null,
  profileDetail: null,
  loading: false,
  error: null,
  isGameInitialized: false,
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
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.post<Profile>("/profiles", { name });
      set((state) => ({ profiles: [...state.profiles, data], loading: false }));
      set({ selectedProfile: data });
      return data;
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.status === 409
        ? "Profile name already exists"
        : "Failed to create profile";
      set({ loading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },
  async renameProfile(profileId: string, newName: string) {
    set({ loading: true, error: null });
    try {
      await apiClient.patch<Profile>(`/profiles/${profileId}`, { name: newName });
      set({ loading: false });
      await get().fetchProfiles();
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.status === 409
        ? "Profile name already exists"
        : "Failed to rename profile";
      set({ loading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
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
  async deleteProfile(profileId: string) {
    set({ loading: true, error: null });
    try {
      await apiClient.delete(`/profiles/${profileId}`);
      const { selectedProfile } = get();
      if (selectedProfile?.id === profileId) {
        set({ selectedProfile: null, profileDetail: null });
      }
      set({ loading: false });
      await get().fetchProfiles();
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.response?.status === 404
        ? "Profile not found"
        : "Failed to delete profile";
      set({ loading: false, error: errorMessage });
      throw new Error(errorMessage);
    }
  },
  initializeGame() {
    set({ isGameInitialized: true });
  },
  uninitializeGame() {
    set({ isGameInitialized: false, selectedProfile: null, profileDetail: null });
  },
});

export const useProfileStore = create<ProfileState>()(profileStore);

export type { ProfileState };
