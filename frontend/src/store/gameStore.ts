import { StateCreator, create } from "zustand";

import apiClient from "../services/apiClient";
import type {
  ConfigResponse,
  QuestionResolutionPayload,
  SessionCreatePayload,
  SessionRead,
} from "../types/api";

interface GameState {
  config: ConfigResponse | null;
  session: SessionRead | null;
  loading: boolean;
  error: string | null;
  activeQuestionId: string | null;
  fetchConfig: () => Promise<void>;
  createSession: (payload: SessionCreatePayload) => Promise<SessionRead>;
  startQuestion: (sessionId: string, questionId: string) => Promise<SessionRead>;
  resolveQuestion: (
    sessionId: string,
    questionId: string,
    payload: QuestionResolutionPayload,
  ) => Promise<SessionRead>;
  resetSession: () => void;
}

const gameStore: StateCreator<GameState> = (set, get) => ({
  config: null,
  session: null,
  loading: false,
  error: null,
  activeQuestionId: null,
  async fetchConfig() {
    if (get().config) return;
    try {
      const { data } = await apiClient.get<ConfigResponse>("/config");
      set({ config: data });
    } catch (error) {
      console.error(error);
      set({ error: "Unable to load config" });
    }
  },
  async createSession(payload: SessionCreatePayload) {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.post<SessionRead>("/sessions", payload);
      set({ session: data, loading: false });
      return data;
    } catch (error) {
      console.error(error);
      set({ loading: false, error: "Unable to start session" });
      throw error;
    }
  },
  async startQuestion(sessionId: string, questionId: string) {
    set({ loading: true, error: null, activeQuestionId: questionId });
    try {
      const { data } = await apiClient.post<SessionRead>(
        `/sessions/${sessionId}/question/${questionId}/start`,
      );
      set({ session: data, loading: false });
      return data;
    } catch (error) {
      console.error(error);
      set({ loading: false, error: "Unable to start question" });
      throw error;
    }
  },
  async resolveQuestion(
    sessionId: string,
    questionId: string,
    payload: QuestionResolutionPayload,
  ) {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.post<SessionRead>(
        `/sessions/${sessionId}/question/${questionId}/resolve`,
        payload,
      );
      set({ session: data, loading: false, activeQuestionId: null });
      return data;
    } catch (error) {
      console.error(error);
      set({ loading: false, error: "Unable to resolve question" });
      throw error;
    }
  },
  resetSession() {
    set({ session: null, activeQuestionId: null });
  },
});

export const useGameStore = create<GameState>()(gameStore);

export type { GameState };
