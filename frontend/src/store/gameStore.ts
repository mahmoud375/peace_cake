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
  winningTeams: SessionTeam[];
  fetchConfig: () => Promise<void>;
  createSession: (payload: SessionCreatePayload) => Promise<SessionRead>;
  startQuestion: (sessionId: string, questionId: string) => Promise<SessionRead>;
  resolveQuestion: (
    sessionId: string,
    questionId: string,
    payload: QuestionResolutionPayload,
  ) => Promise<SessionRead>;
  setActiveTeam: (sessionId: string, teamIndex: number) => Promise<SessionRead>;
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
  winningTeams: [],
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
      set({ session: data, loading: false, gameState: "BOARD", winningTeams: [] });
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
  async setActiveTeam(sessionId: string, teamIndex: number) {
    set({ loading: true, error: null });
    try {
      const { data } = await apiClient.post<SessionRead>(
        `/sessions/${sessionId}/turn/${teamIndex}`,
      );
      set({ session: data, loading: false });
      return data;
    } catch (error) {
      console.error(error);
      set({ loading: false, error: "Unable to set active team" });
      throw error;
    }
  },
  endGameAndDetermineWinner() {
    const { session } = get();
    if (!session || !session.teams.length) {
      set({ gameState: "GAMEOVER", winningTeams: [] });
      return;
    }

    // Find the maximum score
    const maxScore = Math.max(...session.teams.map(team => team.score));

    // Find all teams with the maximum score
    const winners = session.teams.filter(team => team.score === maxScore);

    set({ gameState: "GAMEOVER", winningTeams: winners });
  },
  resetGame() {
    set({
      session: null,
      activeQuestionId: null,
      winningTeams: [],
      gameState: "SETUP",
      error: null,
    });
  },
});

export const useGameStore = create<GameState>()(gameStore);

export type { GameState };
