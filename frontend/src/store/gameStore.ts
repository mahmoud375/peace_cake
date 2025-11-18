import { StateCreator, create } from "zustand";

import apiClient from "../services/apiClient";
import type {
  ConfigResponse,
  QuestionResolutionPayload,
  SessionCreatePayload,
  SessionRead,
  SessionTeam,
} from "../types/api";

interface GameState {
  config: ConfigResponse | null;
  session: SessionRead | null;
  loading: boolean;
  error: string | null;
  activeQuestionId: string | null;
  gameState: "SETUP" | "BOARD" | "GAMEOVER";
  winningTeam: SessionTeam | null;
  fetchConfig: () => Promise<void>;
  createSession: (payload: SessionCreatePayload) => Promise<SessionRead>;
  startQuestion: (sessionId: string, questionId: string) => Promise<SessionRead>;
  resolveQuestion: (
    sessionId: string,
    questionId: string,
    payload: QuestionResolutionPayload,
  ) => Promise<SessionRead>;
  endGameAndDetermineWinner: () => void;
  resetGame: () => void;
}

const gameStore: StateCreator<GameState> = (set, get) => ({
  config: null,
  session: null,
  loading: false,
  error: null,
  activeQuestionId: null,
  gameState: "SETUP",
  winningTeam: null,
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
      set({ session: data, loading: false, gameState: "BOARD", winningTeam: null });
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

      // Auto-trigger game over if all questions are used
      const quizStore = await import('./quizStore').then(m => m.useQuizStore.getState());
      const selectedQuiz = quizStore.selectedQuiz;
      if (selectedQuiz && data.used_question_ids.length >= selectedQuiz.questions.length) {
        get().endGameAndDetermineWinner();
      }

      return data;
    } catch (error) {
      console.error(error);
      set({ loading: false, error: "Unable to resolve question" });
      throw error;
    }
  },
  endGameAndDetermineWinner() {
    const { session } = get();
    if (!session || !session.teams.length) {
      set({ gameState: "GAMEOVER", winningTeam: null });
      return;
    }
    const winningTeam = session.teams.reduce<SessionTeam>((best, team) =>
      team.score > best.score ? team : best,
      session.teams[0]);
    set({ gameState: "GAMEOVER", winningTeam });
  },
  resetGame() {
    set({
      session: null,
      activeQuestionId: null,
      winningTeam: null,
      gameState: "SETUP",
      error: null,
    });
  },
});

export const useGameStore = create<GameState>()(gameStore);

export type { GameState };
